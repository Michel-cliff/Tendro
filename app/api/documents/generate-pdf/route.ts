export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateDC1PDF, generateMemoirePDF } from "@/lib/pdf";
import { getUserFromRequest } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tender_id, dc1_fields, memoire_content } = await req.json();
    const { data: company } = await supabaseAdmin.from("companies").select("*").eq("user_id", user.id).single();
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // Fetch signature and logo as base64
    let signatureBase64: string | undefined;
    let logoBase64: string | undefined;

    if (company.signature_url) {
      try {
        const res = await fetch(company.signature_url);
        const buf = await res.arrayBuffer();
        signatureBase64 = `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
      } catch (_) {}
    }

    if (company.logo_url) {
      try {
        const res = await fetch(company.logo_url);
        const buf = await res.arrayBuffer();
        logoBase64 = `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
      } catch (_) {}
    }

    // Generate PDFs
    const dc1Buffer = generateDC1PDF({ ...dc1_fields, signatureBase64, logoBase64 });
    const memoireBuffer = generateMemoirePDF(memoire_content, logoBase64);

    // Upload to Supabase Storage
    const basePath = `${company.id}/${tender_id}`;

    const [dc1Upload, memoireUpload] = await Promise.all([
      supabaseAdmin.storage.from("generated-docs").upload(`${basePath}/dc1.pdf`, dc1Buffer, {
        contentType: "application/pdf",
        upsert: true,
      }),
      supabaseAdmin.storage.from("generated-docs").upload(`${basePath}/memoire.pdf`, memoireBuffer, {
        contentType: "application/pdf",
        upsert: true,
      }),
    ]);

    const dc1Url = supabaseAdmin.storage.from("generated-docs").getPublicUrl(`${basePath}/dc1.pdf`).data.publicUrl;
    const memoireUrl = supabaseAdmin.storage.from("generated-docs").getPublicUrl(`${basePath}/memoire.pdf`).data.publicUrl;

    // Save to submissions
    await supabaseAdmin.from("submissions").upsert({
      company_id: company.id,
      tender_id,
      dc1_content: dc1_fields,
      memoire_content,
      dc1_pdf_url: dc1Url,
      memoire_pdf_url: memoireUrl,
    }, { onConflict: "company_id,tender_id" });

    return NextResponse.json({ dc1: dc1Url, memoire: memoireUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
