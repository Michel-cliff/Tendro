export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { callClaude, parseClaudeJSON } from "@/lib/claude";
import { getUserFromRequest } from "@/lib/supabase-server";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tender_id } = await req.json();
    const [{ data: tender }, { data: company }] = await Promise.all([
      supabaseAdmin.from("tenders").select("*").eq("id", tender_id).single(),
      supabaseAdmin.from("companies").select("*").eq("user_id", user.id).single(),
    ]);

    if (!tender || !company) return NextResponse.json({ error: "Data not found" }, { status: 404 });

    const prompt = `You are filling a DC1 administrative form for a French public tender.
Map the company profile to the DC1 structure and return JSON with these exact fields:
- objetMarche: the tender's purpose/title
- denominationSociale: company legal name
- siret: SIRET number
- adresse: full address
- nomRepresentant: legal representative name
- qualiteRepresentant: representative's title/role
- date: today's date in French format (dd/MM/yyyy)

Company profile: ${JSON.stringify(company)}
Tender: ${JSON.stringify({ title: tender.title, description: tender.description })}
Today's date: ${format(new Date(), "dd/MM/yyyy")}
Return only valid JSON with those 7 fields. No preamble.`;

    const response = await callClaude(prompt);
    const dc1Fields = parseClaudeJSON(response);

    // Save to submission draft
    await supabaseAdmin.from("submissions").upsert({
      company_id: company.id,
      tender_id,
      dc1_content: dc1Fields,
    }, { onConflict: "company_id,tender_id" });

    return NextResponse.json(dc1Fields);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
