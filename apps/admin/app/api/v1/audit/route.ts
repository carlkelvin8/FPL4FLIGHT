import { NextResponse } from "next/server";
import { AuditRepository } from "@/features/audit";

function getRepo(): AuditRepository {
  return new AuditRepository();
}

export async function GET() {
  try {
    const logs = await getRepo().list();
    return NextResponse.json({ data: logs }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await getRepo().delete(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
