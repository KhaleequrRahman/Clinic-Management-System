"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import PatientPortalShell from "@/components/PatientPortalShell";

interface DoctorOption { id: number; name: string; specialization: string; fee: string }

export default function BookAppointmentPage() {
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/doctors?limit=100&isActive=true").then((r) => r.json()).then((res) => {
      if (res.success) setDoctors(res.data);
    });
  }, []);

  useEffect(() => {
    if (!doctorId || !appointmentDate) { setSlots([]); return; }
    setSlotsLoading(true); setAppointmentTime("");
    fetch(`/api/appointments/slots?doctorId=${doctorId}&date=${appointmentDate}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setSlots(res.data); else setSlots([]); })
      .finally(() => setSlotsLoading(false));
  }, [doctorId, appointmentDate]);

  const selectedDoctor = doctors.find((d) => d.id === parseInt(doctorId));
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!doctorId || !appointmentDate || !appointmentTime) { setError("Please select doctor, date, and time"); return; }
    setLoading(true); setError(null);

    try {
      const res = await fetch("/api/portal/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, appointmentDate, appointmentTime, reason }),
      });
      const result = await res.json();
      if (!result.success) { setError(result.error); return; }
      setSuccess(true);
    } catch { setError("Unexpected error"); } finally { setLoading(false); }
  }

  if (success) {
    return (
      <PatientPortalShell>
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked!</h1>
          <p className="text-gray-600 mb-1">Doctor: {selectedDoctor?.name} ({selectedDoctor?.specialization})</p>
          <p className="text-gray-600 mb-1">Date: {appointmentDate} at {appointmentTime}</p>
          <p className="text-gray-600 mb-6">Fee: ₹{selectedDoctor?.fee}</p>
          <div className="flex justify-center gap-4">
            <Link href="/portal/appointments" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">View My Appointments</Link>
            <button onClick={() => { setSuccess(false); setDoctorId(""); setAppointmentDate(""); setAppointmentTime(""); setReason(""); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">Book Another</button>
          </div>
        </div>
      </PatientPortalShell>
    );
  }

  return (
    <PatientPortalShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Book an Appointment</h1>

      <div className="bg-white rounded-xl shadow p-6">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Doctor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doctors.map((d) => (
                <button key={d.id} type="button" onClick={() => setDoctorId(String(d.id))}
                  className={`p-4 rounded-lg border-2 text-left transition ${doctorId === String(d.id) ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <p className="font-medium text-gray-900">{d.name}</p>
                  <p className="text-sm text-gray-500">{d.specialization}</p>
                  <p className="text-sm font-medium text-green-600 mt-1">₹{d.fee}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date <span className="text-red-500">*</span></label>
            <input type="date" value={appointmentDate} min={today} onChange={(e) => setAppointmentDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          </div>

          {/* Time Slots */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Time <span className="text-red-500">*</span></label>
            {!doctorId || !appointmentDate ? (
              <p className="text-sm text-gray-400">Select doctor and date first</p>
            ) : slotsLoading ? (
              <p className="text-sm text-gray-400">Loading available slots...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-red-500">No available slots for this date. Try another date.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {slots.map((slot) => (
                  <button key={slot} type="button" onClick={() => setAppointmentTime(slot)}
                    className={`px-3 py-2.5 text-sm rounded-lg border-2 transition font-medium ${appointmentTime === slot ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-200 hover:border-green-400"}`}>
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fee display */}
          {selectedDoctor && appointmentTime && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>{selectedDoctor.name}</strong> ({selectedDoctor.specialization}) on <strong>{appointmentDate}</strong> at <strong>{appointmentTime}</strong>
              </p>
              <p className="text-lg font-bold text-green-700 mt-1">Consultation Fee: ₹{selectedDoctor.fee}</p>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Fever, headache, routine checkup..." />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href="/portal" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Cancel</Link>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium">
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </PatientPortalShell>
  );
}
