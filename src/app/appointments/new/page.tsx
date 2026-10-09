"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";

interface PatientOption { id: number; name: string; mobile: string }
interface DoctorOption { id: number; name: string; specialization: string; fee: string }

export default function NewAppointmentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/doctors?limit=100&isActive=true").then((r) => r.json()).then((res) => { if (res.success) setDoctors(res.data); });
  }, []);

  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/patients/search?q=${encodeURIComponent(patientSearch)}&limit=8`).then((r) => r.json()).then((res) => { if (res.success) setPatients(res.data); });
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  useEffect(() => {
    if (!doctorId || !appointmentDate) { setSlots([]); return; }
    setSlotsLoading(true); setAppointmentTime("");
    fetch(`/api/appointments/slots?doctorId=${doctorId}&date=${appointmentDate}`).then((r) => r.json()).then((res) => { if (res.success) setSlots(res.data); else setSlots([]); }).finally(() => setSlotsLoading(false));
  }, [doctorId, appointmentDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || !doctorId || !appointmentDate || !appointmentTime) { setError("Please fill all required fields"); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId, doctorId, appointmentDate, appointmentTime, reason, notes }) });
      const result = await res.json();
      if (!result.success) { setError(result.error); return; }
      window.location.href = "/appointments";
    } catch { setError("Unexpected error"); } finally { setLoading(false); }
  }

  const selectedDoctor = doctors.find((d) => d.id === parseInt(doctorId));
  const today = new Date().toISOString().split("T")[0];

  return (
    <AppShell>
      <Link href="/appointments" className="text-blue-600 hover:text-blue-700 text-sm">← Back to Appointments</Link>
      <div className="bg-white rounded-xl shadow p-6 mt-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Book Appointment</h1>
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient <span className="text-red-500">*</span></label>
            {patientId ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm font-medium text-green-800">{patients.find((p) => p.id === parseInt(patientId))?.name || `Patient #${patientId}`}</span>
                <button type="button" onClick={() => { setPatientId(""); setPatientSearch(""); }} className="text-sm text-red-600 hover:underline">Change</button>
              </div>
            ) : (
              <>
                <input type="text" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Type patient name or mobile..." className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {patients.length > 0 && (
                  <ul className="mt-1 border rounded-lg bg-white shadow max-h-48 overflow-auto">
                    {patients.map((p) => (<li key={p.id} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm" onClick={() => { setPatientId(String(p.id)); setPatientSearch(p.name); }}><span className="font-medium">{p.name}</span> <span className="text-gray-500">({p.mobile})</span></li>))}
                  </ul>
                )}
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor <span className="text-red-500">*</span></label>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
              <option value="">Select a doctor</option>
              {doctors.map((d) => (<option key={d.id} value={d.id}>{d.name} — {d.specialization} (₹{d.fee})</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
            <input type="date" value={appointmentDate} min={today} onChange={(e) => setAppointmentDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
            {!doctorId || !appointmentDate ? <p className="text-sm text-gray-400">Select doctor and date first</p> : slotsLoading ? <p className="text-sm text-gray-400">Loading slots...</p> : slots.length === 0 ? <p className="text-sm text-red-500">No available slots</p> : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {slots.map((slot) => (<button key={slot} type="button" onClick={() => setAppointmentTime(slot)} className={`px-3 py-2 text-sm rounded-lg border transition ${appointmentTime === slot ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"}`}>{slot}</button>))}
              </div>
            )}
          </div>
          {selectedDoctor && <div className="p-3 bg-blue-50 rounded-lg text-sm"><span className="font-medium text-blue-800">Consultation Fee:</span> <span className="text-blue-900 font-bold">₹{selectedDoctor.fee}</span></div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full px-4 py-2 border rounded-lg" placeholder="Fever, checkup..." /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-4 py-2 border rounded-lg" /></div>
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href="/appointments" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Cancel</Link>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">{loading ? "Booking..." : "Book Appointment"}</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
