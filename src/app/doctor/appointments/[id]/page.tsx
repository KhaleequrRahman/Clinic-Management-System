"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import DoctorShell from "@/components/DoctorShell";
import AppointmentStatusActions from "@/app/appointments/[id]/AppointmentStatusActions";
import ConsultationForm from "@/app/appointments/[id]/ConsultationForm";
import PrescriptionForm from "@/app/appointments/[id]/PrescriptionForm";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  in_progress: "bg-indigo-100 text-indigo-800 border-indigo-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  no_show: "bg-gray-100 text-gray-800 border-gray-300",
};

interface Appt {
  id: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason?: string | null;
  symptoms?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  vitals?: string | null;
  followUpDate?: string | null;
  patientName: string;
  patientMobile: string;
  patientAge?: number | null;
  patientGender?: string | null;
  patientBloodGroup?: string | null;
  doctorName: string;
  doctorSpecialization: string;
}

export default function DoctorAppointmentDetail() {
  const params = useParams();
  const appointmentId = params.id as string;
  const [appt, setAppt] = useState<Appt | null>(null);
  const [hasRx, setHasRx] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/doctor/appointments/${appointmentId}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) { setError(res.error || "Not found"); return; }
        setAppt(res.data);
        setHasRx(!!res.prescription);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  useEffect(load, [load]);

  if (loading) return <DoctorShell><div className="py-12 text-center text-gray-500">Loading...</div></DoctorShell>;
  if (error || !appt) return <DoctorShell><div className="py-12 text-center"><p className="text-red-500 mb-4">{error || "Appointment not found"}</p><Link href="/doctor/appointments" className="text-indigo-600 hover:underline">Back</Link></div></DoctorShell>;

  let vitalsObj: Record<string, string | number> | null = null;
  if (appt.vitals) { try { vitalsObj = JSON.parse(appt.vitals); } catch { /* ignore */ } }

  const showConsultation = ["confirmed", "in_progress"].includes(appt.status);
  const canPrescribe = ["in_progress", "completed"].includes(appt.status);
  const apiPrefix = "/api/doctor/appointments";

  return (
    <DoctorShell>
      <Link href="/doctor/appointments" className="text-indigo-600 hover:text-indigo-700 text-sm">← My Appointments</Link>

      <div className="bg-white rounded-xl shadow overflow-hidden mt-4">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-xl font-bold">Appointment #{appt.id}</h1>
              <p className="text-indigo-100 text-sm mt-1">{appt.appointmentDate} at {appt.appointmentTime}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${STATUS_COLORS[appt.status]}`}>
              {appt.status.replace("_", " ").toUpperCase()}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase">Patient</h3>
              <p className="font-medium text-gray-900">{appt.patientName}</p>
              <p className="text-sm text-gray-600">{appt.patientMobile}</p>
              <p className="text-sm text-gray-600">{appt.patientAge ? `${appt.patientAge} yrs` : ""} {appt.patientGender ? `• ${appt.patientGender}` : ""} {appt.patientBloodGroup ? `• ${appt.patientBloodGroup}` : ""}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase">Doctor</h3>
              <p className="font-medium text-gray-900">{appt.doctorName}</p>
              <p className="text-sm text-gray-600">{appt.doctorSpecialization}</p>
            </div>
            {appt.reason && (
              <div className="sm:col-span-2 space-y-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Reason</h3>
                <p className="text-gray-900">{appt.reason}</p>
              </div>
            )}
          </div>

          {(appt.symptoms || appt.diagnosis || appt.notes || vitalsObj) && (
            <div className="space-y-3 mb-6 p-4 bg-indigo-50 rounded-lg">
              <h3 className="text-sm font-semibold text-indigo-900 uppercase">Consultation Record</h3>
              {appt.symptoms && <div><p className="text-xs text-gray-500">Symptoms</p><p className="font-medium whitespace-pre-wrap">{appt.symptoms}</p></div>}
              {appt.diagnosis && <div><p className="text-xs text-gray-500">Diagnosis</p><p className="font-medium whitespace-pre-wrap">{appt.diagnosis}</p></div>}
              {appt.notes && <div><p className="text-xs text-gray-500">Notes</p><p className="font-medium whitespace-pre-wrap">{appt.notes}</p></div>}
              {appt.followUpDate && <div><p className="text-xs text-gray-500">Follow-up</p><p className="font-medium">{appt.followUpDate}</p></div>}
              {vitalsObj && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Vitals</p>
                  <div className="flex flex-wrap gap-2">
                    {vitalsObj.bloodPressure && <span className="bg-white px-2 py-1 rounded text-xs">BP: {vitalsObj.bloodPressure}</span>}
                    {vitalsObj.temperature && <span className="bg-white px-2 py-1 rounded text-xs">Temp: {vitalsObj.temperature}°F</span>}
                    {vitalsObj.weight && <span className="bg-white px-2 py-1 rounded text-xs">Weight: {vitalsObj.weight} kg</span>}
                    {vitalsObj.pulse && <span className="bg-white px-2 py-1 rounded text-xs">Pulse: {vitalsObj.pulse} bpm</span>}
                    {vitalsObj.oxygenSaturation && <span className="bg-white px-2 py-1 rounded text-xs">SpO2: {vitalsObj.oxygenSaturation}%</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          <AppointmentStatusActions appointmentId={appt.id} currentStatus={appt.status} apiPrefix={apiPrefix} />
        </div>
      </div>

      {showConsultation && (
        <div className="mt-6">
          <ConsultationForm
            appointmentId={appt.id}
            existingSymptoms={appt.symptoms || ""}
            existingDiagnosis={appt.diagnosis || ""}
            existingNotes={appt.notes || ""}
            existingVitals={appt.vitals || ""}
            existingFollowUp={appt.followUpDate || ""}
            apiPrefix={apiPrefix}
          />
        </div>
      )}

      {hasRx ? (
        <div className="mt-6 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-900">Prescription</h2>
          <p className="text-sm text-green-600 mt-2">✓ Prescription created for this appointment.</p>
        </div>
      ) : canPrescribe ? (
        <div className="mt-6">
          <PrescriptionForm
            appointmentId={appt.id}
            submitUrl={`${apiPrefix}/${appt.id}/prescription`}
            successHref={`/doctor/appointments/${appt.id}`}
          />
        </div>
      ) : null}
    </DoctorShell>
  );
}
