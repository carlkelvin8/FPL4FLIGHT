import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetById = vi.fn();
const mockPublish = vi.fn();
const mockDeprecate = vi.fn();

vi.mock("@/features/form-builder/repository", () => ({
  FormTemplateRepository: vi.fn().mockImplementation(() => ({
    getById: mockGetById,
    publish: mockPublish,
    deprecate: mockDeprecate,
  })),
}));

const sampleTemplate = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  slug: "pre-flight",
  name: "Pre-Flight Checklist",
  description: null,
  version: 1,
  schema: {
    sections: [],
    metadata: { formType: "pre-flight", regulatoryBasis: null, estimatedMinutes: 10 },
  },
  isActive: false,
  deprecated: false,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-15"),
};

function createRequest(method: string, body?: unknown): Request {
  const url = "http://localhost:3000/api/v1/forms/some-id";
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  return new Request(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : null,
  });
}

const context = { params: { id: "550e8400-e29b-41d4-a716-446655440000" } };

describe("GET /api/v1/forms/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a template by id", async () => {
    mockGetById.mockResolvedValue(sampleTemplate);
    const { GET } = await import("@/app/api/v1/forms/[id]/route");
    const response = await GET(createRequest("GET"), context);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.id).toBe(sampleTemplate.id);
  });

  it("returns 404 when not found", async () => {
    mockGetById.mockResolvedValue(null);
    const { GET } = await import("@/app/api/v1/forms/[id]/route");
    const response = await GET(createRequest("GET"), context);
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.error).toBe("Template not found.");
  });
});

describe("PATCH /api/v1/forms/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("publishes a template", async () => {
    mockPublish.mockResolvedValue({ ...sampleTemplate, isActive: true });
    const { PATCH } = await import("@/app/api/v1/forms/[id]/route");
    const response = await PATCH(createRequest("PATCH", { action: "publish" }), context);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.isActive).toBe(true);
  });

  it("deprecates a template", async () => {
    mockDeprecate.mockResolvedValue({ ...sampleTemplate, deprecated: true, isActive: false });
    const { PATCH } = await import("@/app/api/v1/forms/[id]/route");
    const response = await PATCH(createRequest("PATCH", { action: "deprecate" }), context);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.deprecated).toBe(true);
  });

  it("rejects unknown action", async () => {
    const { PATCH } = await import("@/app/api/v1/forms/[id]/route");
    const response = await PATCH(createRequest("PATCH", { action: "unknown" }), context);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("Unknown action");
  });

  it("rejects non-object body", async () => {
    const { PATCH } = await import("@/app/api/v1/forms/[id]/route");
    const response = await PATCH(createRequest("PATCH", "invalid"), context);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("JSON object");
  });
});
