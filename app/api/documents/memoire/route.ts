export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { callClaude } from "@/lib/claude";
import { getUserFromRequest } from "@/lib/supabase-server";

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

    const prompt = `You are an expert in French public procurement bid writing.
Draft a Mémoire Technique for the following tender, using the company profile provided.
Structure it with these sections:
1. Compréhension du besoin
2. Méthodologie d'exécution
3. Moyens humains et techniques
4. Références similaires
5. Planning prévisionnel
6. Engagements qualité

Company profile: ${JSON.stringify({ name: company.name, sector: company.sector, region: company.region, description: company.description, employees: company.employees, revenue: company.revenue })}
Tender details: ${JSON.stringify({ title: tender.title, description: tender.description, contracting_authority: tender.contracting_authority, budget: tender.budget })}
Write in professional French. Output in markdown format. Be comprehensive and specific.`;

    const content = await callClaude(prompt);

    await supabaseAdmin.from("submissions").upsert({
      company_id: company.id,
      tender_id,
      memoire_content: content,
    }, { onConflict: "company_id,tender_id" });

    return NextResponse.json({ content });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
