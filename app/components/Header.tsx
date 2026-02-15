"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type User = {
  id: number;
  email: string;
  display_name: string | null;
  role: "admin" | "staff";
};

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function getInitialFromJwt(token: string | null) {
  if (!token) return "";
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return "";
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64));
    const email = String(json?.email || "");
    return email ? email[0].toUpperCase() : "";
  } catch {
    return "";
  }
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("koi_token");
    const userStr = localStorage.getItem("koi_user");

    setIsLoggedIn(!!token);
    setUser(safeJsonParse<User>(userStr));
  }, [pathname]);

  const initial = useMemo(() => {
    const fromUser =
      user?.display_name?.trim()?.[0]?.toUpperCase() ||
      user?.email?.trim()?.[0]?.toUpperCase() ||
      "";
    if (fromUser) return fromUser;

    const token = typeof window !== "undefined" ? localStorage.getItem("koi_token") : null;
    return getInitialFromJwt(token) || "U";
  }, [user]);

  function logout() {
    localStorage.removeItem("koi_token");
    localStorage.removeItem("koi_user");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b px-6 py-4 flex items-center justify-between">
      {/* 左侧 Logo */}
      <Link href="/" className="font-semibold text-lg">
        KOI Orders
      </Link>


      {/* 右侧按钮 */}
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <>
           <button
            onClick={() => router.push("/me")}
            className="w-10 h-10 rounded-full border flex items-center justify-center font-semibold hover:bg-gray-100 transition"
            aria-label="Open profile"
            title="Profile"
          >
            {initial}
          </button>
            <Link className="rounded-xl border px-4 py-2" href="/orders">
              History
            </Link>

            <button className="rounded-xl border px-4 py-2 text-red-600" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="rounded-xl border px-4 py-2" href="/login">
              Login
            </Link>
            <Link className="rounded-xl border px-4 py-2" href="/register">
              Register
            </Link>
          </>
        )}
      </div>
    
    </header>
  );
}
