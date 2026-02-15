"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "pin">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [preToken, setPreToken] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");

      // ✅ 如果不需要 PIN（admin）
      if (!data.requiresPin) {
        localStorage.setItem("koi_token", data.token);
        router.push("/");
        router.refresh();
        return;
      }

      // ✅ 需要 PIN（staff）
      setPreToken(data.token);
      setStep("pin");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyPin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/pin/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${preToken}`,
        },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "PIN failed");
localStorage.setItem("koi_token", data.token);
localStorage.setItem("koi_user", JSON.stringify(data.user));
      router.push("/");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "PIN failed");
    } finally {
      setLoading(false);
    }
  }

  return (
   <main className="min-h-screen flex items-start justify-center pt-24 p-6">
      <div className="w-full max-w-sm space-y-4 border rounded-xl p-6">
        <h1 className="text-xl font-semibold">KOI Orders</h1>

        {step === "login" ? (
          <form onSubmit={onLogin} className="space-y-3">
            <input
              className="w-full border rounded-lg p-2"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="w-full border rounded-lg p-2"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="w-full border rounded-lg p-2" disabled={loading}>
              {loading ? "..." : "Login"}
            </button>

            <p className="text-sm">
              No account?{" "}
              <a className="underline" href="/register">
                Register
              </a>
            </p>

            {err && <p className="text-sm text-red-600">{err}</p>}
          </form>
        ) : (
          <form onSubmit={onVerifyPin} className="space-y-3">
            <p className="text-sm">Enter 4-digit PIN</p>
            <input
              className="w-full border rounded-lg p-2 text-center tracking-[0.4em] text-lg"
              placeholder="••••"
              inputMode="numeric"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
            />

            <button
              className="w-full border rounded-lg p-2"
              disabled={loading || pin.length !== 4}
            >
              {loading ? "..." : "Verify PIN"}
            </button>

            {err && <p className="text-sm text-red-600">{err}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
