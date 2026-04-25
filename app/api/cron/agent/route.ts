export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { callClaude, parseClaudeJSON } from "@/lib/claude";
import { fetchPublicTenders, fetchBoampTenders } from "@/lib/datagouvfr";
import { fetchUnreadEmails } from "@/lib/gmail";

export async function POST(req: NextRequest) {
  // Protect cron endpoint
  const cronSecret = req.headers.get("x-cron-secret");
  const isVercelCron = req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  const isManual = cronSecret === process.env.CRON_SECRET;

  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const companyId: string | undefined = body.company_id;

    let query = supabaseAdmin.from("cron_config").select("*, company:companies(*)").eq("active", true);
    if (companyId) query = query.eq("company_id", companyId) as any;

    const { data: configs } = await query;
    if (!configs || configs.length === 0) {
      return NextResponse.json({ message: "No active configs" });
    }

    const results = [];

    for (const config of configs) {
      const company = (config as any).company;
      if (!company) continue;

      const keywords: string[] = config.keywords ?? [];
      const sector: string = config.sectors?.[0] ?? company.sector ?? "";
      const region: string = config.regions?.[0] ?? company.region ?? "";

      // Stream 1: Online tender discovery
      const [datagouvTenders, boampTenders] = await Promise.all([
        fetchPublicTenders(keywords, region),
        fetchBoampTenders(sector, region),
      ]);
      const allTenders = [...datagouvTenders, ...boampTenders];

      let onlineMatches = 0;
      if (allTenders.length > 0) {
        const scoringPrompt = `You are a public procurement expert. Given this company profile and a list of tenders,
score each tender from 0 to 100 based on fit with the company's sector, region, capacity, and keywords.
Return a JSON array with fields: tender_id, score, reasoning.
Company profile: ${JSON.stringify({ name: company.name, sector: company.sector, region: company.region, description: company.description, keywords })}
Tenders: ${JSON.stringify(allTenders.slice(0, 10))}
Return only valid JSON array, no preamble.`;

        try {
          const scored = await callClaude(scoringPrompt);
          const scores = parseClaudeJSON<{ tender_id: string; score: number; reasoning: string }[]>(scored);

          for (let i = 0; i < Math.min(scores.length, allTenders.length); i++) {
            const raw = allTenders[i];
            const s = scores[i] ?? { score: 0, reasoning: "" };
            if (s.score < 30) continue;

            const { data: tender } = await supabaseAdmin.from("tenders").insert({
              source: "online",
              title: raw.title,
              description: raw.description,
              sector,
              region,
              raw_data: raw,
            }).select().single();

            if (tender) {
              await supabaseAdmin.from("matches").insert({
                company_id: company.id,
                tender_id: tender.id,
                score: s.score,
                reasoning: s.reasoning,
                source: "online",
                status: "new",
              });
              onlineMatches++;
            }
          }
        } catch (_) {
          // Claude scoring failed — insert with default score
        }
      }

      // Stream 2: Gmail email discovery
      let emailMatches = 0;
      try {
        const emails = await fetchUnreadEmails(10);
        for (const email of emails) {
          const classifyPrompt = `You are a public procurement expert. Analyze this email and determine:
1. Is this a public tender opportunity? (true/false)
2. If true, extract: title, contracting_authority, authority_email, deadline (ISO string or null), budget (number or null), sector, region, description
Return only valid JSON with fields: is_tender (boolean), tender_data (object or null). No preamble.
Email content: ${email.subject}\n${email.body.substring(0, 2000)}`;

          try {
            const res = await callClaude(classifyPrompt);
            const parsed = parseClaudeJSON<{ is_tender: boolean; tender_data: any }>(res);

            if (parsed.is_tender && parsed.tender_data) {
              const td = parsed.tender_data;
              const { data: tender } = await supabaseAdmin.from("tenders").insert({
                source: "email",
                title: td.title ?? email.subject,
                description: td.description ?? "",
                contracting_authority: td.contracting_authority ?? "",
                authority_email: td.authority_email ?? email.from,
                deadline: td.deadline ?? null,
                budget: td.budget ?? null,
                sector: td.sector ?? sector,
                region: td.region ?? region,
              }).select().single();

              if (tender) {
                const scorePrompt = `Score this tender from 0-100 for fit. Company: ${JSON.stringify({ sector: company.sector, region: company.region, keywords })}. Tender: ${JSON.stringify(td)}. Return JSON: {"score": number, "reasoning": string}`;
                const scoreRes = await callClaude(scorePrompt);
                const scoreData = parseClaudeJSON<{ score: number; reasoning: string }>(scoreRes);

                await supabaseAdmin.from("matches").insert({
                  company_id: company.id,
                  tender_id: tender.id,
                  score: scoreData.score ?? 50,
                  reasoning: scoreData.reasoning ?? "",
                  source: "email",
                  status: "new",
                });
                emailMatches++;
              }
            }
          } catch (_) {}
        }
      } catch (_) {
        // Gmail not configured — skip
      }

      // Update last_run
      await supabaseAdmin.from("cron_config").update({ last_run: new Date().toISOString() }).eq("id", config.id);
      results.push({ company_id: company.id, online: onlineMatches, email: emailMatches });
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Vercel cron hits GET
  req.headers.set("authorization", `Bearer ${process.env.CRON_SECRET}`);
  return POST(req);
}
