const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export type Item = {
  key: string;
  label: string;
  category: "Left" | "Need";
  unit: string;
  supplier_id: string;
  sort_order: number;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("koi_token");
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store" });

  if (typeof window !== "undefined" && (res.status === 401 || res.status === 403)) {
    // 没登录 or 没过 PIN
    window.location.href = "/login";
  }

  return res;
}
export async function apiGetItems() {
  const res = await apiFetch("/api/items");
  if (!res.ok) throw new Error("Failed to load items");
  const data = await res.json();
  return data.items;
}

export async function apiCreateOrder(items: { itemKey: string; qty: number }[]) {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error("Failed to create order");
  return res.json() as Promise<{ orderId: number }>;
}

export async function apiPreview(orderId: number) {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/preview`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to generate preview");
  return res.json() as Promise<{ text: string }>;
}

export async function apiSubmit(orderId: number) {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/submit`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to submit");
  return res.json();
}

export async function apiSend(orderId: number, toEmail: string, message: string) {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toEmail, message }),
  });
  if (!res.ok) throw new Error("Failed to send");
  return res.json();
}

export async function apiDelete(orderId: number) {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}

export type OrderSummary = {
  id: number;
  status: "draft" | "submitted" | "sent";
  toEmail: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
  totalQty: number;
  nonZeroLines: number;
};

export async function apiListOrders(params?: { limit?: number; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);

  const url = `${API_BASE}/api/orders${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to list orders");
  return res.json() as Promise<{ orders: OrderSummary[] }>;
}

export async function apiGetOrder(orderId: number) {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load order");
  return res.json() as Promise<{
    order: { id: number; status: "draft" | "submitted" | "sent" };
    items: { itemKey: string; qty: number }[];
  }>;
}
