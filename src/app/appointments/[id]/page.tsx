import Link from "next/link";
import { notFound } from "next/navigation";
import { appointmentService } from "@/services/appointmentService";
import { prescriptionService } from "@/services/prescriptionService";
import AppShell from "@/components/AppShell";
import AppointmentStatusActions from "./AppointmentStatusActions";
import ConsultationForm from "./ConsultationForm";
import PrescriptionForm from "./PrescriptionForm";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  in_progress: "bg-indigo-100 text-indigo-800 border-indigo-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  no_show: "bg-gray-100 text-gray-800 border-gray-300",
};

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apptId = parseInt(id);
  if (isNaN(apptId)) notFound();

  const result = await appointmentService.getAppointmentById(apptId);
  if (!result.success || !result.data) notFound();

  const a = result.data;

  let vitalsObj: Record<string, string | number> | null = null;
  if (a.vitals) {
    try { vitalsObj = JSON.parse(a.vitals); } catch { /* ignore */ }
  }

  const showConsultation = ["confirmed", "in_progress"].includes(a.status);
  const canPrescribe = ["in_progress", "completed"].includes(a.status);

  // Fetch existing prescription for this appointment
  let existingPrescription: { id: number } | null = null;
  try {
    const rxResult = await prescriptionService.getPrescriptionByAppointment(a.id);
    if (rxResult.success && rxResult.data) existingPrescription = { id: rxResult.data.id };
  } catch { /* no prescription yet */ }

  return (
    <AppShell>
      <Link href="/appointments" className="text-blue-600 hover:text-blue-700 text-sm">← Back to Appointments</Link>

        {/* Header card */}
        <div className="bg-white rounded-xl shadow overflow-hidden mt-4">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h1 className="text-xl font-bold">Appointment #{a.id}</h1>
                <p className="text-purple-100 mt-1">{a.appointmentDate} at {a.appointmentTime}</p>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${STATUS_COLORS[a.status]}`}>
                {a.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Patient Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Patient</h3>
              <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{a.patientName}</p></div>
              <div><p className="text-xs text-gray-500">Mobile</p><p className="font-medium">{a.patientMobile}</p></div>
              <div><p className="text-xs text-gray-500">Age / Gender</p><p className="font-medium">{a.patientAge ?? "-"} • {a.patientGender ?? "-"}</p></div>
              <div><p className="text-xs text-gray-500">Blood Group</p><p className="font-medium">{a.patientBloodGroup ?? "-"}</p></div>
              <Link href={`/patients/${a.patientId}`} className="inline-block text-sm text-blue-600 hover:underline mt-1">View Patient →</Link>
            </div>

            {/* Doctor Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Doctor</h3>
              <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{a.doctorName}</p></div>
              <div><p className="text-xs text-gray-500">Specialization</p><p className="font-medium">{a.doctorSpecialization}</p></div>
              <div><p className="text-xs text-gray-500">Fee</p><p className="font-medium text-green-600">₹{a.doctorFee}</p></div>
              <div><p className="text-xs text-gray-500">Mobile</p><p className="font-medium">{a.doctorMobile}</p></div>
              <Link href={`/doctors/${a.doctorId}`} className="inline-block text-sm text-blue-600 hover:underline mt-1">View Doctor →</Link>
            </div>

            {/* Reason & Notes */}
            <div className="sm:col-span-2 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Visit Details</h3>
              <div><p className="text-xs text-gray-500">Reason</p><p className="font-medium">{a.reason || "-"}</p></div>
            </div>

            {/* Consultation data (if exists) */}
            {(a.symptoms || a.diagnosis || a.notes || vitalsObj) && (
              <div className="sm:col-span-2 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Consultation</h3>
                {a.symptoms && <div><p className="text-xs text-gray-500">Symptoms</p><p className="font-medium whitespace-pre-wrap">{a.symptoms}</p></div>}
                {a.diagnosis && <div><p className="text-xs text-gray-500">Diagnosis</p><p className="font-medium whitespace-pre-wrap">{a.diagnosis}</p></div>}
                {a.notes && <div><p className="text-xs text-gray-500">Notes</p><p className="font-medium whitespace-pre-wrap">{a.notes}</p></div>}
                {a.followUpDate && <div><p className="text-xs text-gray-500">Follow-up Date</p><p className="font-medium">{a.followUpDate}</p></div>}
                {vitalsObj && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Vitals</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {vitalsObj.bloodPressure && <div className="bg-gray-50 p-2 rounded text-center"><p className="text-xs text-gray-500">BP</p><p className="font-medium text-sm">{vitalsObj.bloodPressure}</p></div>}
                      {vitalsObj.temperature && <div className="bg-gray-50 p-2 rounded text-center"><p className="text-xs text-gray-500">Temp</p><p className="font-medium text-sm">{vitalsObj.temperature}°F</p></div>}
                      {vitalsObj.weight && <div className="bg-gray-50 p-2 rounded text-center"><p className="text-xs text-gray-500">Weight</p><p className="font-medium text-sm">{vitalsObj.weight} kg</p></div>}
                      {vitalsObj.pulse && <div className="bg-gray-50 p-2 rounded text-center"><p className="text-xs text-gray-500">Pulse</p><p className="font-medium text-sm">{vitalsObj.pulse} bpm</p></div>}
                      {vitalsObj.oxygenSaturation && <div className="bg-gray-50 p-2 rounded text-center"><p className="text-xs text-gray-500">SpO2</p><p className="font-medium text-sm">{vitalsObj.oxygenSaturation}%</p></div>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Actions */}
          <div className="px-6 pb-6">
            <AppointmentStatusActions appointmentId={a.id} currentStatus={a.status} />
          </div>
        </div>

        {/* Consultation Form — Phase 6 */}
        {showConsultation && (
          <div className="mt-6">
            <ConsultationForm
              appointmentId={a.id}
              existingSymptoms={a.symptoms || ""}
              existingDiagnosis={a.diagnosis || ""}
              existingNotes={a.notes || ""}
              existingVitals={a.vitals || ""}
              existingFollowUp={a.followUpDate || ""}
            />
          </div>
        )}

        {/* Prescription Section */}
        {existingPrescription ? (
          <div className="mt-6 bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Prescription</h2>
              <Link href={`/prescriptions/${existingPrescription.id}`} className="text-blue-600 hover:underline text-sm font-medium">
                View Prescription →
              </Link>
            </div>
            <p className="text-sm text-green-600 mt-2">✓ Prescription has been created for this appointment.</p>
          </div>
        ) : canPrescribe ? (
          <div className="mt-6">
            <PrescriptionForm appointmentId={a.id} />
          </div>
        ) : null}
    </AppShell>
  );
}
