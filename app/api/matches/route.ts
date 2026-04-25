export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: company } = await supabaseAdmin.from("companies").select("id").eq("user_id", user.id).single();
    if (!company) return NextResponse.json([]);

    const { data } = await supabaseAdmin
      .from("matches")
      .select("*, tender:tenders(*)")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
