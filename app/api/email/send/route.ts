export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/gmail";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tender_id, to, subject, body } = await req.json();
    const [{ data: company }, { data: submission }] = await Promise.all([
      supabaseAdmin.from("companies").select("*").eq("user_id", user.id).single(),
      supabaseAdmin.from("submissions").select("*").eq("tender_id", tender_id).single(),
    ]);

    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const attachments: { filename: string; content: Buffer; mimeType: string }[] = [];

    // Fetch PDF attachments from Supabase Storage
    if (submission?.dc1_pdf_url) {
      try {
        const res = await fetch(submission.dc1_pdf_url);
        const buf = Buffer.from(await res.arrayBuffer());
        attachments.push({ filename: "DC1.pdf", content: buf, mimeType: "application/pdf" });
      } catch (_) {}
    }

    if (submission?.memoire_pdf_url) {
      try {
        const res = await fetch(submission.memoire_pdf_url);
        const buf = Buffer.from(await res.arrayBuffer());
        attachments.push({ filename: "Memoire_Technique.pdf", content: buf, mimeType: "application/pdf" });
      } catch (_) {}
    }

    await sendEmail({ to, subject, body, attachments });

    // Update submission + match status
    await Promise.all([
      supabaseAdmin.from("submissions").upsert({
        company_id: company.id,
        tender_id,
        email_subject: subject,
        email_body: body,
        sent_at: new Date().toISOString(),
      }, { onConflict: "company_id,tender_id" }),
      supabaseAdmin.from("matches")
        .update({ status: "submitted" })
        .eq("company_id", company.id)
        .eq("tender_id", tender_id),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
