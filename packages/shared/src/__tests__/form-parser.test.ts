import { describe, it, expect } from "vitest";

import { parseSchema, parseTemplate } from "../form-schema/FormParser";
import { formatSchema } from "../form-schema/FormTemplateFormatter";

const validSchema = {
  sections: [
    {
      id: "section-1",
      title: "Pilot Information",
      fields: [
        {
          id: "pilot-name",
          label: "Pilot Name",
          type: "text",
          required: true,
          maxLength: 100,
        },
        {
          id: "flight-hours",
          label: "Total Flight Hours",
          type: "numeric",
          required: true,
          min: 0,
          max: 99999,
        },
        {
          id: "flight-date",
          label: "Flight Date",
          type: "date",
          required: true,
        },
        {
          id: "departure-time",
          label: "Departure Time",
          type: "time",
        },
        {
          id: "aircraft-type",
          label: "Aircraft Type",
          type: "dropdown",
          required: true,
          options: ["Cessna 172", "Piper PA-28", "Boeing 737"],
        },
        {
          id: "is-training",
          label: "Training Flight",
          type: "checkbox",
        },
        {
          id: "pilot-signature",
          label: "Pilot Signature",
          type: "signature",
          required: true,
        },
        {
          id: "damage-photos",
          label: "Damage Photos",
          type: "photo",
          maxPhotos: 5,
        },
      ],
    },
  ],
  metadata: {
    formType: "pre-flight",
    regulatoryBasis: "FAR 91.409",
    estimatedMinutes: 15,
  },
};

describe("parseSchema", () => {
  it("parses a valid schema", () => {
    const result = parseSchema(validSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sections).toHaveLength(1);
      expect(result.data.sections[0]!.fields).toHaveLength(8);
      expect(result.data.metadata.formType).toBe("pre-flight");
    }
  });

  it("returns error for non-object input", () => {
    const result = parseSchema("not-an-object");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("TEMPLATE_INVALID_SCHEMA");
    }
  });

  it("rejects empty sections", () => {
    const result = parseSchema({ sections: [], metadata: { formType: "test" } });
    expect(result.success).toBe(false);
  });

  it("rejects missing metadata.formType", () => {
    const result = parseSchema({
      sections: [{ id: "s1", title: "S1", fields: [{ id: "f1", label: "F1", type: "text" }] }],
      metadata: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown field types", () => {
    const result = parseSchema({
      sections: [{ id: "s1", title: "S1", fields: [{ id: "f1", label: "F1", type: "unknown-type" }] }],
      metadata: { formType: "test" },
    });
    expect(result.success).toBe(false);
  });

  it("detects duplicate field ids", () => {
    const schema = {
      sections: [
        {
          id: "s1",
          title: "S1",
          fields: [
            { id: "dup", label: "First", type: "text" },
            { id: "dup", label: "Second", type: "text" },
          ],
        },
      ],
      metadata: { formType: "test" },
    };
    const result = parseSchema(schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("TEMPLATE_DUPLICATE_FIELD_ID");
    }
  });
});

describe("parseTemplate", () => {
  it("parses a valid JSON string", () => {
    const result = parseTemplate(JSON.stringify(validSchema));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sections).toHaveLength(1);
    }
  });

  it("returns error for invalid JSON", () => {
    const result = parseTemplate("{invalid}");
    expect(result.success).toBe(false);
  });
});

describe("round-trip: parseSchema -> formatSchema -> parseSchema", () => {
  it("preserves all field types through round-trip", () => {
    const parsed = parseSchema(validSchema);
    if (!parsed.success) throw new Error("Parse failed");

    const formatted = formatSchema(parsed.data);
    const reparsed = parseSchema(formatted);

    if (!reparsed.success) throw new Error("Re-parse failed");
    expect(reparsed.data.sections).toHaveLength(parsed.data.sections.length);
    expect(reparsed.data.sections[0]!.fields).toHaveLength(
      parsed.data.sections[0]!.fields.length,
    );
    reparsed.data.sections[0]!.fields.forEach((field, i) => {
      const original = parsed.data.sections[0]!.fields[i]!;
      expect(field.id).toBe(original.id);
      expect(field.label).toBe(original.label);
      expect(field.type).toBe(original.type);
      expect(field.required).toBe(original.required);
    });
  });
});

describe("field-level validation", () => {
  it("uses default maxPhotos=10 for photo fields", () => {
    const schema = {
      sections: [
        {
          id: "s1",
          title: "S1",
          fields: [{ id: "photo", label: "Photo", type: "photo" }],
        },
      ],
      metadata: { formType: "test" },
    };
    const result = parseSchema(schema);
    if (!result.success) throw new Error("Parse failed");
    const field = result.data.sections[0]!.fields[0]!;
    if (field.type === "photo") {
      expect(field.maxPhotos).toBe(10);
    }
  });

  it("defaults required to false", () => {
    const schema = {
      sections: [
        {
          id: "s1",
          title: "S1",
          fields: [{ id: "f1", label: "F1", type: "text" }],
        },
      ],
      metadata: { formType: "test" },
    };
    const result = parseSchema(schema);
    if (!result.success) throw new Error("Parse failed");
    expect(result.data.sections[0]!.fields[0]!.required).toBe(false);
  });

  it("parses conditional rules", () => {
    const schema = {
      sections: [
        {
          id: "s1",
          title: "S1",
          fields: [
            { id: "trigger", label: "Trigger", type: "checkbox" },
            {
              id: "conditional-field",
              label: "Shows when checked",
              type: "text",
              conditional: { fieldId: "trigger", operator: "equals", value: true },
            },
          ],
        },
      ],
      metadata: { formType: "test" },
    };
    const result = parseSchema(schema);
    if (!result.success) throw new Error("Parse failed");
    const field = result.data.sections[0]!.fields[1]!;
    expect(field.conditional).toBeDefined();
    expect(field.conditional?.fieldId).toBe("trigger");
    expect(field.conditional?.operator).toBe("equals");
  });

  it("rejects conditional referencing non-existent field", () => {
    const schema = {
      sections: [
        {
          id: "s1",
          title: "S1",
          fields: [
            {
              id: "bad-ref",
              label: "Bad",
              type: "text",
              conditional: { fieldId: "nonexistent", operator: "equals", value: true },
            },
          ],
        },
      ],
      metadata: { formType: "test" },
    };
    const result = parseSchema(schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("TEMPLATE_INVALID_CROSS_FIELD_REFERENCE");
    }
  });

  it("rejects duplicate section ids", () => {
    const schema = {
      sections: [
        { id: "dup", title: "S1", fields: [{ id: "f1", label: "F1", type: "text" }] },
        { id: "dup", title: "S2", fields: [{ id: "f2", label: "F2", type: "text" }] },
      ],
      metadata: { formType: "test" },
    };
    const result = parseSchema(schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("TEMPLATE_DUPLICATE_SECTION_ID");
    }
  });
});
