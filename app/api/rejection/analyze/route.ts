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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const tenderId = formData.get("tender_id") as string;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const [{ data: tender }, { data: company }] = await Promise.all([
      supabaseAdmin.from("tenders").select("*").eq("id", tenderId).single(),
      supabaseAdmin.from("companies").select("*").eq("user_id", user.id).single(),
    ]);

    if (!tender || !company) return NextResponse.json({ error: "Data not found" }, { status: 404 });

    // Upload rejection doc to storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `${company.id}/${tenderId}/rejection.pdf`;
    await supabaseAdmin.storage.from("rejection-docs").upload(storagePath, fileBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });
    const { data: urlData } = supabaseAdmin.storage.from("rejection-docs").getPublicUrl(storagePath);

    // Extract text from PDF (basic approach)
    let rejectionText = "";
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(fileBuffer);
      rejectionText = parsed.text.substring(0, 4000);
    } catch (_) {
      rejectionText = "PDF text extraction failed. Please analyze based on typical rejection criteria.";
    }

    const prompt = `You are a public procurement expert. Analyze this rejection scoring sheet and provide:
1. score_breakdown: JSON object where keys are criteria names and values are {score: number, max: number}
2. estimated_winner_score: estimated total score of the winner (number)
3. key_weaknesses: array of top 3 strings describing reasons for rejection
4. improvement_plan: array of 3-5 strings with concrete, actionable improvements for next bid

Rejection document content: ${rejectionText}
Company profile: ${JSON.stringify({ sector: company.sector, employees: company.employees, revenue: company.revenue })}
Tender details: ${JSON.stringify({ title: tender.title, sector: tender.sector, budget: tender.budget })}
Return only valid JSON with those 4 fields. No preamble.`;

    const response = await callClaude(prompt);
    const analysis = parseClaudeJSON<{
      score_breakdown: Record<string, { score: number; max: number }>;
      estimated_winner_score: number;
      key_weaknesses: string[];
      improvement_plan: string[];
    }>(response);

    // Save to rejections table
    await supabaseAdmin.from("rejections").upsert({
      company_id: company.id,
      tender_id: tenderId,
      rejection_doc_url: urlData.publicUrl,
      score_breakdown: analysis.score_breakdown,
      improvement_plan: analysis.improvement_plan,
    });

    // Update match status
    await supabaseAdmin.from("matches")
      .update({ status: "rejected" })
      .eq("company_id", company.id)
      .eq("tender_id", tenderId);

    return NextResponse.json(analysis);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
