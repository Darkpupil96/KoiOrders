"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiDelete, apiSend } from "@/lib/api";
import { clearDraftQty, clearOrderId, loadOrderId } from "@/lib/storage";

export default function SendPage() {
  const router = useRouter();

  const [toEmail, setToEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const orderId = loadOrderId();
    if (!orderId) router.push("/");
  }, [router]);

  async function send() {
    const orderId = loadOrderId();
    if (!orderId) return;

    setBusy(true);
    setStatus("Sending...");
    try {
      await apiSend(orderId, toEmail.trim(), message);
      setStatus("Sent ✅");
    } catch (e: any) {
      setStatus(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    const orderId = loadOrderId();
    if (!orderId) return;

    setBusy(true);
    try {
      await apiDelete(orderId);
      clearOrderId();
      clearDraftQty();
      router.push("/");
    } catch (e: any) {
      setStatus(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Send Order</h1>

      <div className="rounded-2xl border p-4 space-y-3">
        <div className="space-y-1">
          <div className="text-sm text-gray-600">To Email</div>
          <input
            className="w-full border rounded-xl p-3"
            value={toEmail}
            onChange={e => setToEmail(e.target.value)}
            placeholder="supplier@example.com"
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm text-gray-600">Message (optional)</div>
          <textarea
            className="w-full border rounded-xl p-3 min-h-[120px]"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>
      </div>

      {status && <div className="text-sm text-gray-700">{status}</div>}

      <div className="flex gap-2">
        <button className="flex-1 rounded-xl border py-3" onClick={() => router.push("/review")} disabled={busy}>
          Back
        </button>
        <button
          className="flex-1 rounded-xl bg-black text-white py-3 disabled:opacity-50"
          onClick={send}
          disabled={busy || !toEmail.trim()}
        >
          {busy ? "Working..." : "Send"}
        </button>
      </div>

      <button className="w-full rounded-xl border py-3 disabled:opacity-50" onClick={del} disabled={busy}>
        Delete this order
      </button>
    </main>
  );
}
