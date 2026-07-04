import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the repository before importing the route handlers
const mockList = vi.fn();
const mockGetById = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockPublish = vi.fn();
const mockDeprecate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/features/form-builder/repository", () => ({
  FormTemplateRepository: vi.fn().mockImplementation(() => ({
    list: mockList,
    getById: mockGetById,
    create: mockCreate,
    update: mockUpdate,
    publish: mockPublish,
    deprecate: mockDeprecate,
    delete: mockDelete,
  })),
}));

const sampleTemplate = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  slug: "pre-flight",
  name: "Pre-Flight Checklist",
  description: "Standard pre-flight inspection form",
  version: 1,
  schema: {
    sections: [{ id: "s1", title: "Section 1", fields: [] }],
    metadata: { formType: "pre-flight", regulatoryBasis: null, estimatedMinutes: 10 },
  },
  isActive: false,
  deprecated: false,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-15"),
};

function createRequest(method: string, body?: unknown, searchParams?: Record<string, string>): Request {
  const url = new URL("http://localhost:3000/api/v1/forms");
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  return new Request(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : null,
  });
}

describe("GET /api/v1/forms", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns template list", async () => {
    mockList.mockResolvedValue([sampleTemplate]);
    const { GET } = await import("@/app/api/v1/forms/route");
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Pre-Flight Checklist");
  });

  it("returns 500 on error", async () => {
    mockList.mockRejectedValue(new Error("DB error"));
    const { GET } = await import("@/app/api/v1/forms/route");
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toBe("DB error");
  });
});

describe("POST /api/v1/forms", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a template with valid input", async () => {
    mockCreate.mockResolvedValue({ ...sampleTemplate, version: 1 });
    const { POST } = await import("@/app/api/v1/forms/route");
    const req = createRequest("POST", {
      slug: "pre-flight",
      name: "Pre-Flight Checklist",
      schema: {
        sections: [{ id: "s1", title: "S1", fields: [] }],
        metadata: { formType: "pre-flight", regulatoryBasis: null, estimatedMinutes: 10 },
      },
    });
    const response = await POST(req);
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.data.name).toBe("Pre-Flight Checklist");
  });

  it("rejects missing required fields", async () => {
    const { POST } = await import("@/app/api/v1/forms/route");
    const req = createRequest("POST", { name: "no slug" });
    const response = await POST(req);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("Missing required fields");
  });

  it("rejects non-object body", async () => {
    const { POST } = await import("@/app/api/v1/forms/route");
    const req = createRequest("POST", "invalid");
    const response = await POST(req);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("JSON object");
  });

  it("returns 500 on repository error", async () => {
    mockCreate.mockRejectedValue(new Error("Creation failed"));
    const { POST } = await import("@/app/api/v1/forms/route");
    const req = createRequest("POST", {
      slug: "test",
      name: "Test",
      schema: {
        sections: [{ id: "s1", title: "S1", fields: [] }],
        metadata: { formType: "test", regulatoryBasis: null, estimatedMinutes: 0 },
      },
    });
    const response = await POST(req);
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toBe("Creation failed");
  });
});

describe("PUT /api/v1/forms", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates a template", async () => {
    mockUpdate.mockResolvedValue({ ...sampleTemplate, version: 2, name: "Updated" });
    const { PUT } = await import("@/app/api/v1/forms/route");
    const req = createRequest("PUT", { id: sampleTemplate.id, name: "Updated" });
    const response = await PUT(req);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.name).toBe("Updated");
    expect(body.data.version).toBe(2);
  });

  it("rejects missing id", async () => {
    const { PUT } = await import("@/app/api/v1/forms/route");
    const req = createRequest("PUT", { name: "No ID" });
    const response = await PUT(req);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("id");
  });
});

describe("DELETE /api/v1/forms", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a template by id", async () => {
    mockDelete.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/v1/forms/route");
    const req = createRequest("DELETE", undefined, { id: sampleTemplate.id });
    const response = await DELETE(req);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("rejects missing id query param", async () => {
    const { DELETE } = await import("@/app/api/v1/forms/route");
    const req = createRequest("DELETE");
    const response = await DELETE(req);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("id");
  });
});
