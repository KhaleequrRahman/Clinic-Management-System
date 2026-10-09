"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  appointmentId: number;
  currentStatus: string;
  /** API base for status updates. Defaults to staff endpoint; doctor portal passes /api/doctor/appointments */
  apiPrefix?: string;
}

const TRANSITIONS: Record<string, { label: string; value: string; color: string }[]> = {
  scheduled: [
    { label: "Confirm", value: "confirmed", color: "bg-blue-600 hover:bg-blue-700 text-white" },
    { label: "No Show", value: "no_show", color: "bg-gray-600 hover:bg-gray-700 text-white" },
    { label: "Cancel", value: "cancelled", color: "bg-red-100 text-red-700 hover:bg-red-200" },
  ],
  confirmed: [
    { label: "Start Consultation", value: "in_progress", color: "bg-indigo-600 hover:bg-indigo-700 text-white" },
    { label: "No Show", value: "no_show", color: "bg-gray-600 hover:bg-gray-700 text-white" },
    { label: "Cancel", value: "cancelled", color: "bg-red-100 text-red-700 hover:bg-red-200" },
  ],
  in_progress: [
    { label: "Complete Appointment", value: "completed", color: "bg-green-600 hover:bg-green-700 text-white" },
    { label: "Cancel", value: "cancelled", color: "bg-red-100 text-red-700 hover:bg-red-200" },
  ],
};

export default function AppointmentStatusActions({ appointmentId, currentStatus, apiPrefix = "/api/appointments" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const actions = TRANSITIONS[currentStatus];
  if (!actions || actions.length === 0) return null;

  async function handleStatusChange(newStatus: string) {
    const confirmMessages: Record<string, string> = {
      cancelled: "Are you sure you want to cancel this appointment?",
      no_show: "Mark patient as no-show?",
      completed: "Mark this appointment as completed?",
    };

    if (confirmMessages[newStatus] && !confirm(confirmMessages[newStatus])) return;

    setLoading(newStatus);
    try {
      const res = await fetch(`${apiPrefix}/${appointmentId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to update status");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="border-t pt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Actions</h3>
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <button
            key={action.value}
            onClick={() => handleStatusChange(action.value)}
            disabled={loading !== null}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${action.color}`}
          >
            {loading === action.value ? "Processing..." : action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
