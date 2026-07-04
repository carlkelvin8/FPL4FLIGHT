import { NextResponse } from "next/server";
import { FormTemplateRepository } from "@/features/form-builder/repository";

function getRepo(): FormTemplateRepository {
  return new FormTemplateRepository();
}

interface Context {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Context) {
  try {
    const template = await getRepo().getById(params.id);
    if (!template) {
      return NextResponse.json({ error: "Template not found." }, { status: 404 });
    }
    return NextResponse.json({ data: template }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Context) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }

    const { action } = body as Record<string, unknown>;

    switch (action) {
      case "publish": {
        const template = await getRepo().publish(params.id);
        return NextResponse.json({ data: template }, { status: 200 });
      }
      case "deprecate": {
        const template = await getRepo().deprecate(params.id);
        return NextResponse.json({ data: template }, { status: 200 });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action "${String(action)}". Supported: publish, deprecate.` },
          { status: 400 },
        );
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
