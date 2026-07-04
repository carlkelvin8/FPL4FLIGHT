import { useQuery } from "@tanstack/react-query";
import { formTemplateRepository } from "../repositories/FormTemplateRepository";
import type { FormTemplate } from "@pilotforms/shared";

const TEMPLATES_KEY = ["form_templates"];

export function useTemplates() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: async () => {
      const result = await formTemplateRepository.findAll();
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  return {
    templates: data ?? ([] as FormTemplate[]),
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
