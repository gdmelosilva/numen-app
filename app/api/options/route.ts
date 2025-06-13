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
      .select("id, name: partner_desc")
      .eq("is_active", true);
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

  if (type === "project_status") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("project_status")
      .select("id, name");
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

    if (type === "ticket_status") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ticket_status")
      .select("id, name");
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

  if (type === "ticket_categories") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ticket_categories")
      .select("id, name");
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

    if (type === "ticket_modules") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ticket_modules")
      .select("id, name");
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

  if (type === "ticket_priorities") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ticket_priorities")
      .select("id, name");
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

  return NextResponse.json({ message: "OK" });
}
