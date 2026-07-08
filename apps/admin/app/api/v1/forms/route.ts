import { NextResponse } from "next/server";

import { FormTemplateRepository, type CreateTemplateInput, type UpdateTemplateInput } from "@/features/form-builder/repository";

function getRepo(): FormTemplateRepository {
  return new FormTemplateRepository();
}

export async function GET() {
  try {
    const templates = await getRepo().list();
    return NextResponse.json({ data: templates }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    if (typeof input.slug !== "string" || typeof input.name !== "string" || typeof input.schema !== "object") {
      return NextResponse.json(
        { error: "Missing required fields: slug (string), name (string), schema (object)." },
        { status: 400 },
      );
    }

    const template = await getRepo().create(input as unknown as CreateTemplateInput);
    return NextResponse.json({ data: template }, { status: 201 });
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

    const template = await getRepo().update(input.id, input as unknown as UpdateTemplateInput);
    return NextResponse.json({ data: template }, { status: 200 });
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
