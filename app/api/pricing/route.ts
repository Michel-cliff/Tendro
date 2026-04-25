export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { callClaude, parseClaudeJSON } from "@/lib/claude";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tender_id, labor, materials, overhead, margin } = await req.json();

    const { data: tender } = await supabaseAdmin.from("tenders").select("*").eq("id", tender_id).single();
    if (!tender) return NextResponse.json({ error: "Tender not found" }, { status: 404 });

    // Fetch historical awarded prices from data.gouv.fr
    let historicalPrices: number[] = [];
    try {
      const q = encodeURIComponent(`${tender.sector ?? ""} ${tender.region ?? ""}`);
      const res = await fetch(`https://www.data.gouv.fr/api/1/datasets/?tag=marches-publics&q=${q}&page_size=5`);
      if (res.ok) {
        const data = await res.json();
        historicalPrices = (data.data ?? [])
          .filter((d: any) => d.extras?.["prix-unitaire"])
          .map((d: any) => parseFloat(d.extras["prix-unitaire"]))
          .filter((p: number) => !isNaN(p));
      }
    } catch (_) {}

    const costs = { labor, materials, overhead, margin };
    const total = labor + materials + overhead;
    const floorEstimate = total * (1 + margin / 100);

    const prompt = `You are a financial advisor for public procurement. Given this company's cost structure and historical awarded prices for similar contracts, calculate:
1. floor_price: minimum viable price (costs + minimum margin)
2. market_price: average historical winning price for similar contracts
3. recommended_price: optimal competitive bid price
4. confidence: confidence score 0-100
5. reasoning: 2-sentence explanation

Cost structure: ${JSON.stringify({ ...costs, total_cost: total, floor_estimate: floorEstimate })}
Historical contract prices (€): ${historicalPrices.length > 0 ? JSON.stringify(historicalPrices) : "No data available, estimate from sector norms"}
Tender details: ${JSON.stringify({ title: tender.title, budget: tender.budget, sector: tender.sector, region: tender.region })}
Return only valid JSON with those 5 fields. No preamble.`;

    const response = await callClaude(prompt);
    const result = parseClaudeJSON(response);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
