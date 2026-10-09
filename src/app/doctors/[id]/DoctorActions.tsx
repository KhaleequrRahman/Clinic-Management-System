"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DoctorActionsProps {
  doctorId: number;
  isActive: boolean;
}

export default function DoctorActions({ doctorId, isActive }: DoctorActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDeactivate() {
    if (!confirm("Are you sure you want to deactivate this doctor?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/doctors/${doctorId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to deactivate doctor");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleReactivate() {
    if (!confirm("Are you sure you want to reactivate this doctor?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/doctors/${doctorId}/reactivate`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to reactivate doctor");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (isActive) {
    return (
      <button
        onClick={handleDeactivate}
        disabled={loading}
        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
      >
        {loading ? "Processing..." : "Deactivate Doctor"}
      </button>
    );
  }

  return (
    <button
      onClick={handleReactivate}
      disabled={loading}
      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition disabled:opacity-50"
    >
      {loading ? "Processing..." : "Reactivate Doctor"}
    </button>
  );
}
