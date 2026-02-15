"use client";

import "./globals.css";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("koi_token");
    setIsLoggedIn(!!token);
  }, [pathname]);

  function logout() {
    localStorage.removeItem("koi_token");
    router.push("/login");
  }

  return (
    <html lang="en">
      <body>
        <header className="border-b px-6 py-4 flex items-center justify-between ">
          <Link href="/" className="font-semibold text-lg">
            KOI Orders
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link className="rounded-xl border px-4 py-2" href="/orders">
                  History
                </Link>

                <button
                  className="rounded-xl border px-4 py-2 text-red-600"
                  onClick={logout}
                >
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

        <main>{children}</main>
      </body>
    </html>
  );
}