import { NextResponse } from "next/server";
import { getList, getById, removeRow } from "@/lib/supabase/admin-data";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const record = await getById("pilot_profiles", id);
      return NextResponse.json(record ?? { error: "Not found" }, { status: record ? 200 : 404 });
    }
    const data = await getList("pilot_profiles", "*,profiles(full_name)", "created_at");
    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await removeRow("pilot_profiles", id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
