import { NextResponse } from "next/server";
import { SubscriptionRepository, type UpdateSubscriptionInput } from "@/features/subscriptions";

function getRepo(): SubscriptionRepository {
  return new SubscriptionRepository();
}

export async function GET() {
  try {
    const subscriptions = await getRepo().list();
    return NextResponse.json({ data: subscriptions }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    if (typeof input.id !== "string") {
      return NextResponse.json({ error: "Missing required field: id (string)." }, { status: 400 });
    }

    const sub = await getRepo().update(input.id, input as UpdateSubscriptionInput);
    return NextResponse.json({ data: sub }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Query parameter 'id' is required." }, { status: 400 });
    }

    await getRepo().delete(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
