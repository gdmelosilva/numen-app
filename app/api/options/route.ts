// Minimal valid Next.js route module
import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "partners") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("partner")
      .select("id, name: partner_desc");
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

  return NextResponse.json({ message: "OK" });
}
