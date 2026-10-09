"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import PatientPortalShell from "@/components/PatientPortalShell";

export default function MyPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/prescriptions").then((r) => r.json()).then((res) => {
      if (res.success) setPrescriptions(res.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <PatientPortalShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Prescriptions</h1>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <p className="text-gray-500">No prescriptions yet. They will appear here after your doctor consultations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <Link key={rx.id as number} href={`/prescriptions/${rx.id}`} className="block bg-white rounded-xl shadow p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{rx.doctorName as string}</p>
                  <p className="text-sm text-gray-500">{rx.doctorSpecialization as string} • Visit: {rx.appointmentDate as string}</p>
                  {typeof rx.diagnosis === "string" && <p className="text-sm text-gray-600 mt-1">{rx.diagnosis.substring(0, 80)}</p>}
                </div>
                <span className="text-blue-600 text-sm font-medium">View →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PatientPortalShell>
  );
}
