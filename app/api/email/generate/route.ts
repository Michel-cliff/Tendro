export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { callClaude, parseClaudeJSON } from "@/lib/claude";
import { getUserFromRequest } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tender_id } = await req.json();
    const [{ data: tender }, { data: company }, { data: submission }] = await Promise.all([
      supabaseAdmin.from("tenders").select("*").eq("id", tender_id).single(),
      supabaseAdmin.from("companies").select("*").eq("user_id", user.id).single(),
      supabaseAdmin.from("submissions").select("*").eq("tender_id", tender_id).single(),
    ]);

    if (!tender || !company) return NextResponse.json({ error: "Data not found" }, { status: 404 });

    const prompt = `Write a professional bid submission email in French for a public tender.
Company: ${company.name}
Tender: ${tender.title}
Contracting authority: ${tender.contracting_authority ?? "Madame, Monsieur"}
Bid price: ${submission?.bid_price ? `${submission.bid_price}€` : "à préciser"}
Attachments: DC1, Mémoire Technique

Write a formal, concise email. Include: reference to the tender, confirmation of attached documents, availability for questions, professional closing.
Output JSON with fields: subject, body. No preamble.`;

    const response = await callClaude(prompt);
    const result = parseClaudeJSON<{ subject: string; body: string }>(response);

    // Save to submission
    if (company && tender) {
      await supabaseAdmin.from("submissions").upsert({
        company_id: company.id,
        tender_id,
        email_subject: result.subject,
        email_body: result.body,
      }, { onConflict: "company_id,tender_id" });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
