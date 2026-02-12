"use client";
// src/lib/storage.ts
export type QtyMap = Record<string, number>;

const KEYS = {
  DRAFT_QTY: "koi_draft_qty",
  ORDER_ID: "koi_order_id",
} as const;

function isBrowser() {
  return typeof window !== "undefined";
}

// Draft qty
export function loadDraftQty(): QtyMap {
  if (!isBrowser()) return {}; // SSR safety check 这里是为了防止在服务器端运行时访问 localStorage
  try {
    const raw = localStorage.getItem(KEYS.DRAFT_QTY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as QtyMap) : {};
  } catch {
    return {};
  }
}

export function saveDraftQty(qty: QtyMap) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.DRAFT_QTY, JSON.stringify(qty));
}

export function clearDraftQty() {
  if (!isBrowser()) return;
  localStorage.removeItem(KEYS.DRAFT_QTY);
}

// Order id
export function loadOrderId(): number | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(KEYS.ORDER_ID);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}

export function saveOrderId(orderId: number) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.ORDER_ID, String(orderId));
}

export function clearOrderId() {
  if (!isBrowser()) return;
  localStorage.removeItem(KEYS.ORDER_ID);
}
