"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";

interface NotificationRow {
  id: number;
  patientId: number | null;
  appointmentId: number | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  patientName: string | null;
}

const TYPE_ICONS: Record<string, string> = {
  appointment_created: "📅",
  appointment_confirmed: "✅",
  appointment_cancelled: "❌",
  appointment_reminder: "⏰",
  prescription_ready: "💊",
  payment_received: "💰",
  general: "🔔",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  async function fetchNotifications() {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (filter === "unread") params.set("isRead", "false");
    if (filter === "read") params.set("isRead", "true");

    const res = await fetch(`/api/notifications?${params}`);
    const result = await res.json();
    if (result.success) setNotifications(result.data);
    setLoading(false);
  }

  async function handleMarkAsRead(id: number) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No notifications yet. They will appear when appointments are booked, prescriptions created, or payments received.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-4 px-6 py-4 transition ${
                  n.isRead ? "bg-white" : "bg-blue-50"
                } hover:bg-gray-50`}
              >
                <span className="text-2xl mt-0.5">
                  {TYPE_ICONS[n.type] || "🔔"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${n.isRead ? "text-gray-700" : "text-gray-900"}`}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString("en-IN")}
                    {n.patientName && ` • ${n.patientName}`}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap flex-shrink-0 mt-1"
                  >
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
