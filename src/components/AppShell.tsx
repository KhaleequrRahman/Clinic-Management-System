"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/patients", label: "Patients", icon: "👥" },
  { href: "/doctors", label: "Doctors", icon: "🩺" },
  { href: "/appointments", label: "Appointments", icon: "📅" },
  { href: "/prescriptions", label: "Prescriptions", icon: "💊" },
  { href: "/billing", label: "Billing", icon: "💰" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/reports", label: "Reports", icon: "📈" },
];

interface UserInfo { userId: number; name: string; email: string; role: string }

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((res) => { if (res.success) setUser(res.data); }).catch(() => {});
    fetch("/api/notifications/unread-count").then((r) => r.json()).then((res) => { if (res.success) setUnreadCount(res.data); }).catch(() => {});
  }, []);

  // Close mobile menu on navigate
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function NavLink({ item }: { item: (typeof NAV_ITEMS)[number] }) {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link href={item.href} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
        <span className="text-base">{item.icon}</span>
        <span className="flex-1">{item.label}</span>
        {item.label === "Notifications" && unreadCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </Link>
    );
  }

  const sidebarContent = (
    <>
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => (<li key={item.href}><NavLink item={item} /></li>))}
        </ul>
        {user?.role === "admin" && (
          <div className="px-3 mt-4 pt-4 border-t border-gray-100">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase mb-2">Admin</p>
            <Link href="/settings/users" className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${pathname === "/settings/users" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <span className="text-base">👤</span> User Management
            </Link>
            <Link href="/settings/audit-logs" className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${pathname === "/settings/audit-logs" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <span className="text-base">📋</span> Audit Logs
            </Link>
          </div>
        )}
      </nav>
      {user && (
        <div className="border-t border-gray-100 p-4 safe-bottom">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">{user.name.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{user.name}</p><p className="text-xs text-gray-500 capitalize">{user.role}</p></div>
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
        <Link href="/" className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <span className="text-lg font-bold text-gray-900">Clinic CMS</span>
        </Link>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <span className="text-lg font-bold text-gray-900">Clinic CMS</span>
              </Link>
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
            <Link href="/" className="font-bold text-gray-900">Clinic CMS</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100">
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </Link>
            {user && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">{user.name.charAt(0).toUpperCase()}</div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="lg:ml-56">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
