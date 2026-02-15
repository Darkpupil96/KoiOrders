"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

type User = {
  id: number;
  email: string;
  display_name: string | null;
  role: "admin" | "staff";
};

function getToken() {
  return localStorage.getItem("koi_token");
}

export default function MePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [newDisplayName, setNewDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [pin, setPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setUser(data.user);
        setNewDisplayName(data.user.display_name || "");
        setNewEmail(data.user.email);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function updateDisplayName() {
    try {
      setMsg("");
      setErr("");

      const res = await fetch(`${API_BASE}/api/auth/me/display-name`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ displayName: newDisplayName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg("Username updated");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function updateEmail() {
    try {
      setMsg("");
      setErr("");

      const res = await fetch(`${API_BASE}/api/auth/me/email`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ newEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg("Email updated");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function updatePassword() {
    try {
      setMsg("");
      setErr("");

      const res = await fetch(`${API_BASE}/api/auth/me/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg("Password updated");
      setOldPassword("");
      setNewPassword("");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function setPinHandler() {
    try {
      setMsg("");
      setErr("");

      const res = await fetch(`${API_BASE}/api/auth/pin/set`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg("PIN set successfully");
      setPin("");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function changePinHandler() {
    try {
      setMsg("");
      setErr("");

      const res = await fetch(`${API_BASE}/api/auth/pin/change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ oldPin, newPin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg("PIN changed successfully");
      setOldPin("");
      setNewPin("");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6 text-red-600">Failed to load user</div>;

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      {msg && <div className="text-green-600">{msg}</div>}
      {err && <div className="text-red-600">{err}</div>}

      <div className="space-y-2 border p-4 rounded-xl">
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Role:</strong> {user.role}</p>
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
            />
            <input
              className="w-full border p-2 rounded"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="New PIN"
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
