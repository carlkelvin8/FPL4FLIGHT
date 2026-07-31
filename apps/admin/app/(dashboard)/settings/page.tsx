"use client";

import { useEffect, useRef, useState } from "react";

type Tab = "profile" | "security";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-runway-900">Settings</h1>
        <p className="mt-1 text-sm text-runway-500">Manage your profile, avatar, and security settings.</p>
      </div>

      <div className="border-b border-runway-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "border-b-2 border-brand-600 text-brand-600"
                : "border-b-2 border-transparent text-runway-500 hover:text-runway-700"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "security"
                ? "border-b-2 border-brand-600 text-brand-600"
                : "border-b-2 border-transparent text-runway-500 hover:text-runway-700"
            }`}
          >
            Security
          </button>
        </nav>
      </div>

      {activeTab === "profile" && <ProfileSection />}
      {activeTab === "security" && <SecuritySection />}
    </section>
  );
}

function ProfileSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/v1/users");
        const json = await res.json();
        const userList: any[] = json.data ?? [];
        const currentUser = userList.find((u: any) => u.role === "admin") ?? userList[0];
        if (currentUser) {
          setUserId(currentUser.id);
          setName(currentUser.full_name ?? "");
          setEmail(currentUser.email ?? "");
          setAvatarUrl(currentUser.avatar_url ?? null);
        }
      } catch {}
    };
    load();
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/v1/profile/avatar", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setAvatarUrl(json.data.avatar_url);
      setMessage({ type: "success", text: "Avatar updated." });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Upload failed" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    setUploading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/profile/avatar", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
      setAvatarUrl(null);
      setMessage({ type: "success", text: "Avatar removed." });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Delete failed" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, full_name: name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setMessage({ type: "success", text: "Profile updated." });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-runway-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-runway-900">Profile Picture</h2>
      <p className="mt-1 text-xs text-runway-500">Upload a photo to personalize your account.</p>

      <div className="mt-5 flex items-center gap-6">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-runway-200">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-bold text-white">
              {(name || "A").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50">
            {uploading ? "Uploading..." : "Choose Photo"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          {avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              disabled={uploading}
              className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="mt-6 space-y-4 border-t border-runway-100 pt-6">
        <h2 className="text-sm font-semibold text-runway-900">Profile Information</h2>
        <div>
          <label className="block text-sm font-medium text-runway-700">Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full max-w-md rounded-lg border border-runway-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-runway-700">Email</label>
          <input
            value={email}
            readOnly
            className="mt-1 w-full max-w-md rounded-lg border border-runway-200 bg-runway-50 px-3 py-2 text-sm text-runway-500"
          />
          <p className="mt-1 text-xs text-runway-400">Email cannot be changed here.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleChangePassword() {
    setMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "All fields are required." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setChanging(true);
    try {
      const res = await fetch("/api/v1/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to change password");
      setMessage({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to change password" });
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-runway-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-runway-900">Change Password</h2>
        <p className="mt-1 text-xs text-runway-500">Update your password to keep your account secure.</p>

        {message && (
          <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </div>
        )}

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-runway-700">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full max-w-md rounded-lg border border-runway-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-runway-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full max-w-md rounded-lg border border-runway-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-runway-700">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full max-w-md rounded-lg border border-runway-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={changing}
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {changing ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
