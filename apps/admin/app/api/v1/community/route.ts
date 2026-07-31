import { NextResponse } from "next/server";
import { getList, removeRow } from "@/lib/supabase/admin-data";

export async function GET() {
  try {
    const [channels, messages] = await Promise.all([
      getList("chat_channels", "*", "created_at"),
      getList("community_messages", "*", "created_at"),
    ]);
    return NextResponse.json({ channels, messages }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const table = searchParams.get("table");
    if (!id || !table) return NextResponse.json({ error: "id and table required" }, { status: 400 });
    if (table !== "chat_channels" && table !== "community_messages") {
      return NextResponse.json({ error: "invalid table" }, { status: 400 });
    }
    await removeRow(table, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
