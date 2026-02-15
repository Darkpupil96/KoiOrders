const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export type Item = {
  key: string;
  label: string;
  category: "Left" | "Need";
  unit: string;
  supplier_id: string;
  sort_order: number;
};

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

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("koi_token");
}

async function readErrorText(res: Response) {
  // 尽量读出后端返回的 json/text，方便定位问题
  const ct = res.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const j = await res.json();
      return JSON.stringify(j);
    }
    return await res.text();
  } catch {
    return "";
  }
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});

  // ✅ 自动带 token
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // ✅ 有 body 但没写 content-type 的情况下自动补
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  // ✅ 未登录 / 未过 PIN：统一跳登录
  if (typeof window !== "undefined" && (res.status === 401 || res.status === 403)) {
    window.location.href = "/login";
    // 仍返回 res，便于调用方在某些情况下自己处理
  }

  return res;
}

// ---------- Items ----------
export async function apiGetItems(): Promise<Item[]> {
  const res = await apiFetch("/api/items");
  if (!res.ok) {
    const text = await readErrorText(res);
    throw new Error(`Failed to load items: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.items as Item[];
}

// ---------- Orders ----------
export async function apiCreateOrder(items: { itemKey: string; qty: number }[]) {
  const res = await apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify({ items }),
  });

  if (!res.ok) {
    const text = await readErrorText(res);
    throw new Error(`Failed to create order: ${res.status} ${text}`);
  }

  return res.json() as Promise<{ orderId: number }>;
}

export async function apiPreview(orderId: number) {
  const res = await apiFetch(`/api/orders/${orderId}/preview`);
  if (!res.ok) {
    const text = await readErrorText(res);
    throw new Error(`Failed to generate preview: ${res.status} ${text}`);
  }
  return res.json() as Promise<{ text: string }>;
}

export async function apiSubmit(orderId: number) {
  const res = await apiFetch(`/api/orders/${orderId}/submit`, { method: "POST" });
  if (!res.ok) {
    const text = await readErrorText(res);
    throw new Error(`Failed to submit: ${res.status} ${text}`);
  }
  return res.json();
}

export async function apiSend(orderId: number, toEmail: string, message: string) {
  const res = await apiFetch(`/api/orders/${orderId}/send`, {
    method: "POST",
    body: JSON.stringify({ toEmail, message }),
  });

  if (!res.ok) {
    const text = await readErrorText(res);
    throw new Error(`Failed to send: ${res.status} ${text}`);
  }
  return res.json();
}

export async function apiDelete(orderId: number) {
  const res = await apiFetch(`/api/orders/${orderId}`, { method: "DELETE" });
  if (!res.ok) {
    const text = await readErrorText(res);
    throw new Error(`Failed to delete: ${res.status} ${text}`);
  }
  return res.json();
}

export async function apiListOrders(params?: { limit?: number; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);

  const path = `/api/orders${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await apiFetch(path);

  if (!res.ok) {
    const text = await readErrorText(res);
    throw new Error(`Failed to list orders: ${res.status} ${text}`);
  }

  return res.json() as Promise<{ orders: OrderSummary[] }>;
}

export async function apiGetOrder(orderId: number) {
  const res = await apiFetch(`/api/orders/${orderId}`);
  if (!res.ok) {
    const text = await readErrorText(res);
    throw new Error(`Failed to load order: ${res.status} ${text}`);
  }

  return res.json() as Promise<{
    order: { id: number; status: "draft" | "submitted" | "sent" };
    items: { itemKey: string; qty: number }[];
  }>;
}
