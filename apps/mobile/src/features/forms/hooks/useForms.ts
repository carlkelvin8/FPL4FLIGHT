import type { CreateFormDto, UpdateFormDto } from "@pilotforms/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/stores/authStore";
import { formRepository } from "../repositories/FormRepository";

const FORMS_KEY = ["forms"];

export function useForms() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: FORMS_KEY,
    queryFn: async () => {
      if (!userId) throw new Error("Not authenticated");
      const result = await formRepository.findByUser(userId, {});
      if (!result.success) throw new Error(result.error.message);
      return result.data.items;
    },
    enabled: !!userId,
  });

  const createForm = useMutation({
    mutationFn: (dto: CreateFormDto) => formRepository.create(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FORMS_KEY }),
  });

  const updateForm = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFormDto }) => formRepository.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FORMS_KEY }),
  });

  const deleteForm = useMutation({
    mutationFn: (id: string) => formRepository.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FORMS_KEY }),
  });

  return {
    forms: data ?? [],
    isLoading,
    isRefetching,
    error: error?.message ?? null,
    createForm: createForm.mutateAsync,
    updateForm: updateForm.mutateAsync,
    deleteForm: deleteForm.mutateAsync,
    refetch,
  };
}
