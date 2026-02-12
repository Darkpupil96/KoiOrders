"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCreateOrder, apiGetItems, Item } from "@/lib/api";
import { loadDraftQty, saveDraftQty, clearDraftQty, saveOrderId, QtyMap } from "@/lib/storage";
function normalizeQty(n: number) {
  // 允许 2 位小数（你之前就是保留两位）
  // 同时避免浮点尾巴
  return Math.round(n * 100) / 100;
}
export default function HomePage() {
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [qty, setQty] = useState<QtyMap>(() => loadDraftQty());
  const [loading, setLoading] = useState(true);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiGetItems();
        setItems(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    saveDraftQty(qty);
  }, [qty]);

  const left = useMemo(() => items.filter(i => i.category === "Left"), [items]);
  const need = useMemo(() => items.filter(i => i.category === "Need"), [items]);

function inc(key: string) {
  setQty(prev => {
    const cur = Number(prev[key] ?? 0);
    return { ...prev, [key]: normalizeQty(cur + 1) };
  });
}

function dec(key: string) {
  setQty(prev => {
    const cur = Number(prev[key] ?? 0);
    return { ...prev, [key]: normalizeQty(Math.max(0, cur - 1)) };
  });
}

  function openEdit(key: string) {
    setEditingKey(key);
    setEditValue(String(qty[key] ?? 0));
  }

  function applyEdit() {
    if (!editingKey) return;
    const n = Number(editValue);
    if (Number.isNaN(n) || n < 0) return;

    const rounded = Math.round(n * 100) / 100; // 允许小数，保留两位
    setQty(prev => ({ ...prev, [editingKey]: rounded }));
    setEditingKey(null);
  }

  async function done() {
    if (!items.length) return;

    // 把所有 items（含 0）都发给后端，便于回填编辑
    const payload = items.map(i => ({
      itemKey: i.key,
      qty: qty[i.key] ?? 0,
    }));

    const { orderId } = await apiCreateOrder(payload);
    saveOrderId(orderId);
    router.push("/review");
  }

  function resetAll() {
    clearDraftQty();
    setQty({});
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">KOI Ordering MVP</h1>
        <button className="rounded-xl border px-4 py-2" onClick={resetAll}>
          Reset
        </button>
          <Link className="rounded-xl border px-4 py-2" href="/orders">History</Link>
      </header>

      {loading ? (
        <div className="text-gray-600">Loading items...</div>
      ) : (
        <>
          <Section title="Left" items={left} qty={qty} inc={inc} dec={dec} onEdit={openEdit} />
          <Section title="Need" items={need} qty={qty} inc={inc} dec={dec} onEdit={openEdit} />

          <button
            className="w-full rounded-xl bg-black text-white py-3 font-medium disabled:opacity-50"
            onClick={done}
            disabled={!items.length}
          >
            Done
          </button>
        </>
      )}

      {editingKey && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 space-y-3">
            <div className="text-lg font-semibold">Edit quantity</div>
            <input
              className="w-full border rounded-xl p-3"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              inputMode="decimal"
              autoFocus
            />
            <div className="flex gap-2">
              <button className="flex-1 rounded-xl border py-2" onClick={() => setEditingKey(null)}>
                Cancel
              </button>
              <button className="flex-1 rounded-xl bg-black text-white py-2" onClick={applyEdit}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Section(props: {
  title: string;
  items: Item[];
  qty: QtyMap;
  inc: (k: string) => void;
  dec: (k: string) => void;
  onEdit: (k: string) => void;
}) {
  const { title, items, qty, inc, dec, onEdit } = props;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="rounded-2xl border divide-y">
        {items.map(i => {
          const v = qty[i.key] ?? 0;

          return (
            <div key={i.key} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{i.label}</div>
                <div className="text-sm text-gray-500">{i.unit}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="h-9 w-9 rounded-xl border disabled:opacity-40"
                  onClick={() => dec(i.key)}
                  disabled={v === 0}
                >
                  -
                </button>

                <div className="w-14 text-center font-semibold">{v}</div>

                <button className="h-9 w-9 rounded-xl border" onClick={() => inc(i.key)}>
                  +
                </button>

                <button className="h-9 w-9 rounded-xl border" onClick={() => onEdit(i.key)}>
                  ✎
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

