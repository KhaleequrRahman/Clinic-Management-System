"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/portal", label: "My Dashboard", icon: "🏠" },
  { href: "/portal/appointments", label: "My Appointments", icon: "📅" },
  { href: "/portal/book", label: "Book Appointment", icon: "➕" },
  { href: "/portal/prescriptions", label: "My Prescriptions", icon: "💊" },
  { href: "/portal/profile", label: "My Profile", icon: "👤" },
];

interface UserInfo { userId: number; name: string; email: string; role: string; patientId?: number }

export default function PatientPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((res) => { if (res.success) setUser(res.data); }).catch(() => {});
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const sidebarContent = (
    <>
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <span className="text-base">{item.icon}</span>{item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {user && (
        <div className="border-t border-gray-100 p-4 safe-bottom">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm font-bold">{user.name.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{user.name}</p><p className="text-xs text-gray-500">Patient</p></div>
          </div>
          <button onClick={handleLogout} className="w-full text-left px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition">Sign Out</button>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-200 hidden lg:flex lg:flex-col">
        <Link href="/portal" className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <span className="text-lg font-bold text-gray-900">Patient Portal</span>
        </Link>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-lg font-bold text-gray-900">Patient Portal</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Mobile header */}
      <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100" aria-label="Open menu">
              <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="font-bold text-gray-900">Patient Portal</span>
          </div>
          {user && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm font-bold">{user.name.charAt(0).toUpperCase()}</div>
          )}
        </div>
      </header>

      <main className="lg:ml-56">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
