/**
 * Multi-Tenancy: Organization Management
 * 
 * Handles creating orgs, inviting members, shared fleet access,
 * and org-level permissions.
 */

import { ok, err, type Result } from "@pilotforms/shared";
import { supabase } from "@core/network";

export type OrgRole = "admin" | "manager" | "pilot" | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  plan: string;
  maxMembers: number;
  createdAt: Date;
}

export interface OrgMember {
  id: string;
  userId: string;
  orgId: string;
  role: OrgRole;
  joinedAt: Date;
  userName?: string;
  userEmail?: string;
}

export interface OrgInvite {
  id: string;
  orgId: string;
  email: string;
  role: OrgRole;
  createdAt: Date;
  accepted: boolean;
}

// ─── Organization CRUD ──────────────────────────────────────

/** Create a new organization */
export async function createOrganization(name: string): Promise<Result<Organization>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("UNAUTHORIZED", "Not authenticated.");

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const { data, error } = await supabase.from("organizations").insert({
      name: name.trim(),
      slug,
      created_by: user.id,
    }).select("*").single();

    if (error) return err("DB_ERROR", error.message);

    // Add creator as admin member
    await supabase.from("org_members").insert({
      org_id: data.id,
      user_id: user.id,
      role: "admin",
    });

    return ok({
      id: data.id,
      name: data.name,
      slug: data.slug,
      logoUrl: data.logo_url,
      plan: data.plan,
      maxMembers: data.max_members,
      createdAt: new Date(data.created_at),
    });
  } catch (e) { return err("NETWORK_ERROR", "Failed to create organization."); }
}

/** Get user's organizations */
export async function getMyOrganizations(): Promise<Result<Organization[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("UNAUTHORIZED", "Not authenticated.");

    const { data, error } = await supabase
      .from("org_members")
      .select("org_id, organizations(*)")
      .eq("user_id", user.id);

    if (error) return ok([]);

    const orgs: Organization[] = (data ?? []).map((row: any) => ({
      id: row.organizations.id,
      name: row.organizations.name,
      slug: row.organizations.slug,
      logoUrl: row.organizations.logo_url,
      plan: row.organizations.plan,
      maxMembers: row.organizations.max_members,
      createdAt: new Date(row.organizations.created_at),
    }));

    return ok(orgs);
  } catch { return ok([]); }
}

// ─── Member Management ──────────────────────────────────────

/** Get members of an organization */
export async function getOrgMembers(orgId: string): Promise<Result<OrgMember[]>> {
  try {
    const { data, error } = await supabase
      .from("org_members")
      .select("*, profiles:user_id(full_name)")
      .eq("org_id", orgId);

    if (error) return ok([]);

    return ok((data ?? []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      orgId: row.org_id,
      role: row.role as OrgRole,
      joinedAt: new Date(row.joined_at),
      userName: row.profiles?.full_name ?? undefined,
    })));
  } catch { return ok([]); }
}

/** Invite a member by email */
export async function inviteMember(orgId: string, email: string, role: OrgRole = "pilot"): Promise<Result<void>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("UNAUTHORIZED", "Not authenticated.");

    const { error } = await supabase.from("org_invites").insert({
      org_id: orgId,
      email: email.trim().toLowerCase(),
      role,
      invited_by: user.id,
    });

    if (error) return err("DB_ERROR", error.message);
    return ok(undefined);
  } catch { return err("NETWORK_ERROR", "Failed to send invite."); }
}

/** Remove a member from organization */
export async function removeMember(orgId: string, userId: string): Promise<Result<void>> {
  try {
    const { error } = await supabase.from("org_members").delete().eq("org_id", orgId).eq("user_id", userId);
    if (error) return err("DB_ERROR", error.message);
    return ok(undefined);
  } catch { return err("NETWORK_ERROR", "Failed to remove member."); }
}

/** Change a member's role */
export async function changeMemberRole(orgId: string, userId: string, newRole: OrgRole): Promise<Result<void>> {
  try {
    const { error } = await supabase.from("org_members").update({ role: newRole }).eq("org_id", orgId).eq("user_id", userId);
    if (error) return err("DB_ERROR", error.message);
    return ok(undefined);
  } catch { return err("NETWORK_ERROR", "Failed to update role."); }
}

// ─── Fleet Management ───────────────────────────────────────

/** Get shared aircraft for an organization */
export async function getOrgAircraft(orgId: string): Promise<Result<any[]>> {
  try {
    const { data, error } = await supabase.from("aircraft").select("*").eq("org_id", orgId);
    if (error) return ok([]);
    return ok(data ?? []);
  } catch { return ok([]); }
}

/** Assign aircraft to an organization */
export async function assignAircraftToOrg(aircraftId: string, orgId: string): Promise<Result<void>> {
  try {
    const { error } = await supabase.from("aircraft").update({ org_id: orgId }).eq("id", aircraftId);
    if (error) return err("DB_ERROR", error.message);
    return ok(undefined);
  } catch { return err("NETWORK_ERROR", "Failed to assign aircraft."); }
}

/** Get shared flights for an organization */
export async function getOrgFlights(orgId: string): Promise<Result<any[]>> {
  try {
    const { data, error } = await supabase.from("flights").select("*").eq("org_id", orgId);
    if (error) return ok([]);
    return ok(data ?? []);
  } catch { return ok([]); }
}

// ─── Org Role Checks ────────────────────────────────────────

/** Check if current user is admin of an org */
export async function isOrgAdmin(orgId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from("org_members").select("role").eq("org_id", orgId).eq("user_id", user.id).single();
    return data?.role === "admin";
  } catch { return false; }
}

/** Check if current user is member of an org */
export async function isOrgMember(orgId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from("org_members").select("id").eq("org_id", orgId).eq("user_id", user.id).maybeSingle();
    return !!data;
  } catch { return false; }
}
