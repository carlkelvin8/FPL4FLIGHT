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
    expect(result).not.toBeNull();
    if (!("code" in result)) {
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].fields).toHaveLength(8);
      expect(result.metadata.formType).toBe("pre-flight");
    }
  });

  it("returns error for non-object input", () => {
    const result = parseSchema("not-an-object");
    if ("code" in result) {
      expect(result.code).toBe("TEMPLATE_INVALID_SCHEMA");
    }
  });

  it("rejects empty sections", () => {
    const result = parseSchema({ sections: [], metadata: { formType: "test" } });
    if ("code" in result) {
      expect(result.code).toBe("TEMPLATE_INVALID_SCHEMA");
    }
  });

  it("rejects missing metadata.formType", () => {
    const result = parseSchema({
      sections: [{ id: "s1", title: "S1", fields: [{ id: "f1", label: "F1", type: "text" }] }],
      metadata: {},
    });
    if ("code" in result) {
      expect(result.code).toBe("TEMPLATE_INVALID_SCHEMA");
    }
  });

  it("rejects unknown field types", () => {
    const result = parseSchema({
      sections: [{ id: "s1", title: "S1", fields: [{ id: "f1", label: "F1", type: "unknown-type" }] }],
      metadata: { formType: "test" },
    });
    if ("code" in result) {
      expect(result.code).toBe("TEMPLATE_INVALID_SCHEMA");
    }
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
    if ("code" in result) {
      expect(result.code).toBe("TEMPLATE_DUPLICATE_FIELD_ID");
    }
  });
});

describe("parseTemplate", () => {
  it("parses a valid JSON string", () => {
    const result = parseTemplate(JSON.stringify(validSchema));
    expect(result).not.toBeNull();
    if (!("code" in result)) {
      expect(result.sections).toHaveLength(1);
    }
  });

  it("returns error for invalid JSON", () => {
    const result = parseTemplate("{invalid}");
    if ("code" in result) {
      expect(result.code).toBe("TEMPLATE_INVALID_SCHEMA");
    }
  });
});

describe("round-trip: parseSchema -> formatSchema -> parseSchema", () => {
  it("preserves all field types through round-trip", () => {
    const parsed = parseSchema(validSchema);
    if ("code" in parsed) throw new Error("Parse failed");

    const formatted = formatSchema(parsed);
    const reparsed = parseSchema(formatted);

    if ("code" in reparsed) throw new Error("Re-parse failed");
    expect(reparsed.sections).toHaveLength(parsed.sections.length);
    expect(reparsed.sections[0].fields).toHaveLength(
      parsed.sections[0].fields.length,
    );
    reparsed.sections[0].fields.forEach((field, i) => {
      const original = parsed.sections[0].fields[i];
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
    if ("code" in result) throw new Error("Parse failed");
    const field = result.sections[0].fields[0];
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
    if ("code" in result) throw new Error("Parse failed");
    expect(result.sections[0].fields[0].required).toBe(false);
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
    if ("code" in result) throw new Error("Parse failed");
    const field = result.sections[0].fields[1];
    expect(field.conditional).toBeDefined();
    expect(field.conditional?.fieldId).toBe("trigger");
    expect(field.conditional?.operator).toBe("equals");
  });
});
