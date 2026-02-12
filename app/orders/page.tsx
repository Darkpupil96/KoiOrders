"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiListOrders, OrderSummary } from "@/lib/api";
import { saveOrderId } from "@/lib/storage";

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [status, setStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const { orders } = await apiListOrders({
        limit: 100,
        status: status === "all" ? undefined : status,
      });
      setOrders(orders);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const buckets = useMemo(() => {
    const m = { draft: 0, submitted: 0, sent: 0 };
    for (const o of orders) m[o.status] = (m[o.status] || 0) + 1;
    return m;
  }, [orders]);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Link className="rounded-xl border px-4 py-2" href="/">
          New Order
        </Link>
      </header>

      <div className="flex items-center gap-2">
        <select
          className="rounded-xl border px-3 py-2"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="all">All ({orders.length})</option>
          <option value="draft">Draft ({buckets.draft})</option>
          <option value="submitted">Submitted ({buckets.submitted})</option>
          <option value="sent">Sent ({buckets.sent})</option>
        </select>

        <button className="rounded-xl border px-4 py-2" onClick={load}>
          Refresh
        </button>
      </div>

      {loading && <div className="text-gray-600">Loading...</div>}
      {err && <div className="text-red-600">{err}</div>}

      <div className="rounded-2xl border divide-y">
        {orders.map(o => (
          <div key={o.id} className="p-4 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="font-semibold">
                Order #{o.id} <span className="text-sm text-gray-500">({o.status})</span>
              </div>
              <div className="text-sm text-gray-600">
                {fmtDate(o.created_at)} · lines: {o.nonZeroLines} · total qty: {o.totalQty}
              </div>
              {o.toEmail && <div className="text-sm text-gray-600">To: {o.toEmail}</div>}
            </div>

            <Link
              className="rounded-xl bg-black text-white px-4 py-2"
              href="/review"
              onClick={() => saveOrderId(o.id)}
            >
              Open
            </Link>
          </div>
        ))}
        {!loading && orders.length === 0 && (
          <div className="p-4 text-gray-600">No orders yet.</div>
        )}
      </div>
    </main>
  );
}
