export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import { callClaude, parseClaudeJSON } from "@/lib/claude";
import { fetchBoampTenders, type RawTender } from "@/lib/datagouvfr";
import { fetchUnreadEmails } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const isVercelCron =
    req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  if (!isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runAgent(null);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the JWT by creating a client with the token as the auth header.
  // This calls Supabase's /auth/v1/user endpoint — no service role key needed.
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: { user }, error: authError } = await userClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  return runAgent(body.company_id ?? null);
}

// ── Core agent ────────────────────────────────────────────────────────────────

async function runAgent(companyId: string | null) {
  try {
    let query = supabaseAdmin
      .from("cron_config")
      .select("*, company:companies(*)")
      .eq("active", true);
    if (companyId) query = query.eq("company_id", companyId) as typeof query;

    const { data: configs, error: cfgError } = await query;
    if (cfgError) {
      return NextResponse.json({ error: cfgError.message }, { status: 500 });
    }
    if (!configs || configs.length === 0) {
      return NextResponse.json({ message: "No active configs found. Complete onboarding first." });
    }

    const results = [];

    for (const config of configs) {
      const company = (config as any).company;
      if (!company) {
        results.push({ error: "company not found for config " + config.id });
        continue;
      }

      const keywords: string[] = config.keywords ?? [];
      const sector: string = config.sectors?.[0] ?? company.sector ?? "";
      const region: string = config.regions?.[0] ?? company.region ?? "";

      const companyProfile = {
        name: company.name,
        sector: company.sector,
        region: company.region,
        description: company.description,
        keywords,
      };

      // ── Stream 1: BOAMP tender discovery ──────────────────────────────────
      let onlineMatches = 0;
      const onlineErrors: string[] = [];

      let tenders: RawTender[] = [];
      try {
        tenders = await fetchBoampTenders(keywords, sector, region);
      } catch (e: any) {
        onlineErrors.push(`fetch: ${e.message}`);
      }

      if (tenders.length > 0) {
        // Deduplicate: skip tenders already in DB (matched by raw_data->>'id')
        const ids = tenders.map((t) => t.id);
        const { data: existing } = await supabaseAdmin
          .from("tenders")
          .select("id, raw_data")
          .in("raw_data->>id", ids);

        const existingIds = new Set(
          (existing ?? []).map((r: any) => r.raw_data?.id as string),
        );
        const fresh = tenders.filter((t) => !existingIds.has(t.id));

        if (fresh.length > 0) {
          const scored = await scoreTenders(fresh, companyProfile, onlineErrors);

          for (const { tender: raw, score, reasoning } of scored) {
            if (score < 30) continue;

            const { data: inserted, error: insErr } = await supabaseAdmin
              .from("tenders")
              .insert({
                source: "online",
                title: raw.title,
                description: raw.description,
                contracting_authority: raw.contracting_authority,
                deadline: raw.deadline,
                budget: raw.budget,
                sector,
                region: raw.region || region,
                raw_data: {
                  id: raw.id,
                  url: raw.url,
                  createdAt: raw.createdAt,
                },
              })
              .select()
              .single();

            if (insErr) {
              onlineErrors.push(`insert tender: ${insErr.message}`);
              continue;
            }

            if (inserted) {
              const { error: matchErr } = await supabaseAdmin
                .from("matches")
                .insert({
                  company_id: company.id,
                  tender_id: inserted.id,
                  score,
                  reasoning,
                  source: "online",
                  status: "new",
                });

              if (matchErr) {
                onlineErrors.push(`insert match: ${matchErr.message}`);
              } else {
                onlineMatches++;
              }
            }
          }
        }
      }

      // ── Stream 2: Gmail email discovery ───────────────────────────────────
      let emailMatches = 0;
      const emailErrors: string[] = [];

      try {
        const emails = await fetchUnreadEmails(10);

        for (const email of emails) {
          const classifyPrompt = `You are a public procurement expert. Analyze this email and determine:
1. Is this a public tender opportunity? (true/false)
2. If yes, extract structured fields.

Return ONLY valid JSON (no preamble):
{
  "is_tender": boolean,
  "tender_data": {
    "title": string,
    "contracting_authority": string,
    "authority_email": string | null,
    "deadline": "YYYY-MM-DD" | null,
    "budget": number | null,
    "sector": string,
    "region": string,
    "description": string
  } | null
}

Email subject: ${email.subject}
Email body (first 2000 chars):
${email.body.substring(0, 2000)}`;

          try {
            const res = await callClaude(classifyPrompt);
            const parsed = parseClaudeJSON<{
              is_tender: boolean;
              tender_data: any;
            }>(res);

            if (parsed.is_tender && parsed.tender_data) {
              const td = parsed.tender_data;

              const { data: inserted, error: insErr } = await supabaseAdmin
                .from("tenders")
                .insert({
                  source: "email",
                  title: td.title ?? email.subject,
                  description: td.description ?? "",
                  contracting_authority: td.contracting_authority ?? "",
                  authority_email: td.authority_email ?? email.from,
                  deadline: td.deadline ?? null,
                  budget: td.budget ?? null,
                  sector: td.sector ?? sector,
                  region: td.region ?? region,
                })
                .select()
                .single();

              if (insErr) {
                emailErrors.push(`insert tender: ${insErr.message}`);
                continue;
              }

              if (inserted) {
                const scorePrompt = `Score this tender 0-100 for fit with this company.
Company: ${JSON.stringify(companyProfile)}
Tender: ${JSON.stringify(td)}
Return ONLY valid JSON: {"score": number, "reasoning": string}`;

                const scoreRes = await callClaude(scorePrompt);
                const scoreData = parseClaudeJSON<{
                  score: number;
                  reasoning: string;
                }>(scoreRes);

                const { error: matchErr } = await supabaseAdmin
                  .from("matches")
                  .insert({
                    company_id: company.id,
                    tender_id: inserted.id,
                    score: scoreData.score ?? 50,
                    reasoning: scoreData.reasoning ?? "",
                    source: "email",
                    status: "new",
                  });

                if (matchErr) {
                  emailErrors.push(`insert match: ${matchErr.message}`);
                } else {
                  emailMatches++;
                }
              }
            }
          } catch (e: any) {
            emailErrors.push(`classify email "${email.subject}": ${e.message}`);
          }
        }
      } catch (_e) {
        // Gmail not configured — skip silently
      }

      await supabaseAdmin
        .from("cron_config")
        .update({ last_run: new Date().toISOString() })
        .eq("id", config.id);

      results.push({
        company_id: company.id,
        company_name: company.name,
        tenders_fetched: tenders.length,
        online_matches: onlineMatches,
        email_matches: emailMatches,
        errors: [...onlineErrors, ...emailErrors],
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("[Agent] Fatal error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Scoring helper ────────────────────────────────────────────────────────────

type ScoredTender = { tender: RawTender; score: number; reasoning: string };

async function scoreTenders(
  tenders: RawTender[],
  company: object,
  errors: string[],
): Promise<ScoredTender[]> {
  const input = tenders.map((t, i) => ({
    index: i,
    title: t.title,
    description: t.description,
    authority: t.contracting_authority,
    region: t.region,
    deadline: t.deadline,
    budget: t.budget,
  }));

  const prompt = `You are a public procurement expert for French SMEs.

Company profile:
${JSON.stringify(company, null, 2)}

Score each of the following ${tenders.length} French public tender notice(s) from 0 to 100 based on how well they match the company's sector, region, keywords, and capacity.

Tenders to score:
${JSON.stringify(input, null, 2)}

Return ONLY a JSON array (no explanation, no preamble):
[
  { "index": 0, "score": 85, "reasoning": "One sentence explaining the fit." },
  ...
]
Every tender must appear in the output with its original "index".`;

  try {
    const raw = await callClaude(prompt);
    const scores = parseClaudeJSON<
      { index: number; score: number; reasoning: string }[]
    >(raw);

    // Build a map by index for O(1) lookup
    const scoreMap = new Map(scores.map((s) => [s.index, s]));

    return tenders.map((tender, i) => {
      const s = scoreMap.get(i) ?? { score: 0, reasoning: "" };
      return { tender, score: s.score, reasoning: s.reasoning };
    });
  } catch (e: any) {
    errors.push(`scoring: ${e.message}`);
    // Fall back: return all tenders with score 0 so they're skipped
    return tenders.map((tender) => ({ tender, score: 0, reasoning: "" }));
  }
}
