"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiDelete, apiGetOrder, apiPreview, apiSubmit } from "@/lib/api";
import { clearOrderId, loadOrderId, saveDraftQty } from "@/lib/storage";

type Status = "draft" | "submitted" | "sent";

export default function ReviewPage() {
  const router = useRouter();

  const [status, setStatus] = useState<Status | null>(null);
  const [text, setText] = useState<string>("Loading...");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const orderId = loadOrderId();
    if (!orderId) {
      router.push("/");
      return;
    }

    (async () => {
      try {
        setErr("");

        // 1) 先拿 status
        const data = await apiGetOrder(orderId);
        setStatus(data.order.status);

        // 2) 再拿 preview
        const preview = await apiPreview(orderId);
        setText(preview.text);
      } catch (e: any) {
        setErr(e?.message || String(e));
        setText("Failed to load preview");
      }
    })();
  }, [router]);

  async function backToEdit() {
    const orderId = loadOrderId();
    if (!orderId) return;

    setBusy(true);
    try {
      const data = await apiGetOrder(orderId);

      // sent 不允许编辑
      if (data.order.status === "sent") return;

      // 把 order items 回填到 draft（让 / 页面自动显示）
      const map: Record<string, number> = {};
      for (const it of data.items) map[it.itemKey] = it.qty;

      saveDraftQty(map);
      router.push("/");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    const orderId = loadOrderId();
    if (!orderId) return;

    if (status === "sent") return; // sent 禁止 submit

    setBusy(true);
    try {
      await apiSubmit(orderId);
      router.push("/send");
    } catch (e: any) {
      setErr(e?.message || String(e));
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
      router.push("/orders"); // 删除历史后回 history
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  const isSent = status === "sent";

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Review</h1>
        {status && <span className="text-sm text-gray-600">Status: {status}</span>}
      </header>

      {err && <div className="text-red-600">{err}</div>}

      <pre className="rounded-2xl border p-4 whitespace-pre-wrap">{text}</pre>

      {/* sent：只能删除 */}
      {isSent ? (
        <div className="flex gap-2">
          <button className="flex-1 rounded-xl border py-3" onClick={() => router.push("/orders")} disabled={busy}>
            Back to History
          </button>
          <button className="flex-1 rounded-xl bg-black text-white py-3 disabled:opacity-50" onClick={del} disabled={busy}>
            Delete
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button className="flex-1 rounded-xl border py-3" onClick={backToEdit} disabled={busy}>
            Back (Edit)
          </button>
          <button className="flex-1 rounded-xl bg-black text-white py-3 disabled:opacity-50" onClick={submit} disabled={busy}>
            {busy ? "Working..." : "Submit"}
          </button>
          <button className="flex-1 rounded-xl bg-black text-white py-3 disabled:opacity-50" onClick={del} disabled={busy}>
            Delete
          </button>
        </div>
      )}
    </main>
  );
}


