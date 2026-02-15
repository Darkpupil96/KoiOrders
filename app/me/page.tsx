"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

type User = {
  id: number;
  email: string;
  display_name: string | null;
  role: "admin" | "staff";
};

type ToastState = {
  open: boolean;
  text: string;
  type: "success" | "error" | "info";
};

function getToken() {
  return localStorage.getItem("koi_token");
}

function CenterToast({ toast }: { toast: ToastState }) {
  if (!toast.open) return null;

  const base =
    "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] " +
    "px-5 py-3 rounded-2xl shadow-lg border text-sm font-medium " +
    "backdrop-blur bg-white/90";

  const variant =
    toast.type === "success"
      ? "border-green-200 text-green-700"
      : toast.type === "error"
      ? "border-red-200 text-red-700"
      : "border-gray-200 text-gray-700";

  return (
    <div className={base + " " + variant} role="status" aria-live="polite">
      {toast.text}
    </div>
  );
}

export default function MePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<ToastState>({
    open: false,
    text: "",
    type: "info",
  });

  const [newDisplayName, setNewDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [pin, setPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");

  function showToast(type: ToastState["type"], text: string) {
    // Close then open to reset timer even if same message repeats
    setToast({ open: false, text: "", type: "info" });
    requestAnimationFrame(() => setToast({ open: true, type, text }));
  }

  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast((s) => ({ ...s, open: false })), 1000);
    return () => clearTimeout(t);
  }, [toast.open]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load user");

        setUser(data.user);
        setNewDisplayName(data.user.display_name || "");
        setNewEmail(data.user.email);
      } catch (e: any) {
        showToast("error", e?.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function updateDisplayName() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me/display-name`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ displayName: newDisplayName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      showToast("success", "Username updated");
    } catch (e: any) {
      showToast("error", e?.message || "Update failed");
    }
  }

  async function updateEmail() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me/email`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ newEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      showToast("success", "Email updated");
      setPassword("");
    } catch (e: any) {
      showToast("error", e?.message || "Update failed");
    }
  }

  async function updatePassword() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      showToast("success", "Password updated");
      setOldPassword("");
      setNewPassword("");
    } catch (e: any) {
      showToast("error", e?.message || "Update failed");
    }
  }

  async function setPinHandler() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/pin/set`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ pin: String(pin) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Set PIN failed");

      showToast("success", "PIN set successfully");
      setPin("");
    } catch (e: any) {
      showToast("error", e?.message || "Set PIN failed");
    }
  }

  async function changePinHandler() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/pin/change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ oldPin: String(oldPin), newPin: String(newPin) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Change PIN failed");

      showToast("success", "PIN changed successfully");
      setOldPin("");
      setNewPin("");
    } catch (e: any) {
      showToast("error", e?.message || "Change PIN failed");
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6 text-red-600">Failed to load user</div>;

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <CenterToast toast={toast} />

      <h1 className="text-2xl font-semibold">Profile</h1>

      <div className="space-y-2 border p-4 rounded-xl">
        <p>
          <strong>User ID:</strong> {user.id}
        </p>
        <p>
          <strong>Role:</strong> {user.role}
        </p>
      </div>

      <div className="border p-4 rounded-xl space-y-3">
        <h2 className="font-semibold">Username</h2>
        <input
          className="w-full border p-2 rounded"
          value={newDisplayName}
          onChange={(e) => setNewDisplayName(e.target.value)}
        />
        <button onClick={updateDisplayName} className="border px-4 py-2 rounded">
          Update Username
        </button>
      </div>

      <div className="border p-4 rounded-xl space-y-3">
        <h2 className="font-semibold">Email</h2>
        <input
          className="w-full border p-2 rounded"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          type="password"
          placeholder="Confirm password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={updateEmail} className="border px-4 py-2 rounded">
          Update Email
        </button>
      </div>

      <div className="border p-4 rounded-xl space-y-3">
        <h2 className="font-semibold">Password</h2>
        <input
          className="w-full border p-2 rounded"
          type="password"
          placeholder="Old password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button onClick={updatePassword} className="border px-4 py-2 rounded">
          Update Password
        </button>
      </div>

      {user.role === "admin" && (
        <>
          <div className="border p-4 rounded-xl space-y-3">
            <h2 className="font-semibold">Set PIN</h2>
            <input
              className="w-full border p-2 rounded"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="4-digit PIN"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
            />
            <button onClick={setPinHandler} className="border px-4 py-2 rounded">
              Set PIN
            </button>
          </div>

          <div className="border p-4 rounded-xl space-y-3">
            <h2 className="font-semibold">Change PIN</h2>
            <input
              className="w-full border p-2 rounded"
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value)}
              placeholder="Old PIN"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
            />
            <input
              className="w-full border p-2 rounded"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="New PIN"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
            />
            <button onClick={changePinHandler} className="border px-4 py-2 rounded">
              Change PIN
            </button>
          </div>
        </>
      )}
    </main>
  );
}
