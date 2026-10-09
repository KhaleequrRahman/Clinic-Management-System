import Link from "next/link";
import { notFound } from "next/navigation";
import { patientService } from "@/services/patientService";
import { appointmentService } from "@/services/appointmentService";
import { prescriptionService } from "@/services/prescriptionService";
import AppShell from "@/components/AppShell";
import PatientActions from "./PatientActions";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800", completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800", no_show: "bg-gray-100 text-gray-800",
};

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patientId = parseInt(id);
  if (isNaN(patientId)) notFound();

  const result = await patientService.getPatientById(patientId);
  if (!result.success || !result.data) notFound();
  const patient = result.data;

  // Fetch related data
  const [apptsResult, rxResult] = await Promise.all([
    appointmentService.getPatientAppointments(patientId),
    prescriptionService.getPatientPrescriptions(patientId),
  ]);
  const appointments = apptsResult.success ? apptsResult.data : [];
  const prescriptions = rxResult.success ? rxResult.data : [];

  return (
    <AppShell>
      <Link href="/patients" className="text-blue-600 hover:text-blue-700 text-sm">← Back to Patients</Link>

      <div className="bg-white rounded-xl shadow overflow-hidden mt-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-green-600 text-3xl font-bold">{patient.name.charAt(0).toUpperCase()}</div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">{patient.name}</h1>
              <p className="text-green-100">Patient ID: {patient.id}</p>
              <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${patient.isActive ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>{patient.isActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact</h3>
              <div><p className="text-xs text-gray-500">Mobile</p><p className="font-medium">{patient.mobile}</p></div>
              <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{patient.email || "-"}</p></div>
              <div><p className="text-xs text-gray-500">Emergency</p><p className="font-medium">{patient.emergencyContact || "-"}</p></div>
              <div><p className="text-xs text-gray-500">Address</p><p className="font-medium">{patient.address || "-"}</p></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal</h3>
              <div><p className="text-xs text-gray-500">Age</p><p className="font-medium">{patient.age ? `${patient.age} years` : "-"}</p></div>
              <div><p className="text-xs text-gray-500">Gender</p><p className="font-medium capitalize">{patient.gender || "-"}</p></div>
              <div><p className="text-xs text-gray-500">Blood Group</p><p className="font-medium">{patient.bloodGroup || "-"}</p></div>
              <div><p className="text-xs text-gray-500">Registered</p><p className="font-medium">{new Date(patient.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p></div>
            </div>
            <div className="sm:col-span-2 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Medical</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Medical History</p><p className="font-medium whitespace-pre-wrap">{patient.medicalHistory || "None recorded"}</p></div>
                <div><p className="text-xs text-gray-500">Allergies</p><p className="font-medium whitespace-pre-wrap">{patient.allergies || "None recorded"}</p></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t flex items-center gap-4">
            <Link href={`/patients/${patient.id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">Edit Patient</Link>
            <Link href={`/appointments/new`} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm">Book Appointment</Link>
            <PatientActions patientId={patient.id} isActive={patient.isActive} />
          </div>
        </div>
      </div>

      {/* Appointment History */}
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Appointment History ({appointments.length})</h2>
        </div>
        {appointments.length === 0 ? (
          <p className="text-sm text-gray-500">No appointments yet.</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((a) => (
              <Link key={a.id} href={`/appointments/${a.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-mono text-gray-600 w-24">{a.appointmentDate}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.doctorName}</p>
                    <p className="text-xs text-gray-500">{a.doctorSpecialization} • {a.appointmentTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.reason && <span className="text-xs text-gray-400 max-w-[120px] truncate hidden sm:block">{a.reason}</span>}
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[a.status] || ""}`}>{a.status.replace("_", " ")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Prescriptions */}
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Prescriptions ({prescriptions.length})</h2>
        {prescriptions.length === 0 ? (
          <p className="text-sm text-gray-500">No prescriptions yet.</p>
        ) : (
          <div className="space-y-2">
            {prescriptions.map((rx) => (
              <Link key={rx.id} href={`/prescriptions/${rx.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="text-sm font-medium text-gray-900">{rx.doctorName} — {rx.doctorSpecialization}</p>
                  <p className="text-xs text-gray-500">Visit: {rx.appointmentDate} • {rx.diagnosis ? rx.diagnosis.substring(0, 60) : "No diagnosis"}</p>
                </div>
                <span className="text-xs text-blue-600">View →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
