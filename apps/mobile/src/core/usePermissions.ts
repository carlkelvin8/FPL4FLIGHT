/**
 * usePermissions Hook
 * 
 * Provides permission checking in any component.
 * Usage:
 *   const { can, role, isAdmin, limit } = usePermissions();
 *   if (can("form_builder")) { ... }
 *   if (limit.maxForms > forms.length) { ... }
 */

import { useMemo } from "react";
import { useAuthStore } from "@features/auth/stores/authStore";
import { useProfile } from "@features/forms/hooks/useProfile";
import { hasPermission, isAdmin as checkIsAdmin, ROLE_LIMITS, type Feature, type UserRole } from "@core/permissions";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const { profile } = useProfile();
  // Profile role from DB takes priority over auth store role
  const role: UserRole = (profile?.role as UserRole) ?? (user?.role as UserRole) ?? "pilot";

  const permissions = useMemo(() => ({
    /** Check if user can access a feature */
    can: (feature: Feature): boolean => hasPermission(role, feature),

    /** Current user role */
    role,

    /** Is admin? */
    isAdmin: checkIsAdmin(role),

    /** Role-based limits */
    limit: ROLE_LIMITS[role],

    /** Check if feature is locked (for showing upgrade prompts) */
    isLocked: (feature: Feature): boolean => !hasPermission(role, feature),
  }), [role]);

  return permissions;
}
