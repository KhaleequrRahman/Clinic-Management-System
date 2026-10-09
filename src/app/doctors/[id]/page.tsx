import Link from "next/link";
import { notFound } from "next/navigation";
import { doctorService } from "@/services/doctorService";
import { appointmentService } from "@/services/appointmentService";
import AppShell from "@/components/AppShell";
import DoctorActions from "./DoctorActions";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800", completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800", no_show: "bg-gray-100 text-gray-800",
};

export default async function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doctorId = parseInt(id);
  if (isNaN(doctorId)) notFound();

  const result = await doctorService.getDoctorById(doctorId);
  if (!result.success || !result.data) notFound();
  const doctor = result.data;

  const apptsResult = await appointmentService.getDoctorAppointments(doctorId);
  const appointments = apptsResult.success ? apptsResult.data : [];

  return (
    <AppShell>
      <Link href="/doctors" className="text-blue-600 hover:text-blue-700 text-sm">← Back to Doctors</Link>

      <div className="bg-white rounded-xl shadow overflow-hidden mt-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-blue-600 text-3xl font-bold">{doctor.name.charAt(0).toUpperCase()}</div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">{doctor.name}</h1>
              <p className="text-blue-100">{doctor.specialization}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${doctor.isActive ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>{doctor.isActive ? "Active" : "Inactive"}</span>
                {doctor.experience && <span className="text-blue-100">{doctor.experience} years experience</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact</h3>
              <div><p className="text-xs text-gray-500">Mobile</p><p className="font-medium">{doctor.mobile}</p></div>
              <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{doctor.email || "-"}</p></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional</h3>
              <div><p className="text-xs text-gray-500">Specialization</p><p className="font-medium">{doctor.specialization}</p></div>
              <div><p className="text-xs text-gray-500">Qualification</p><p className="font-medium">{doctor.qualification || "-"}</p></div>
              <div><p className="text-xs text-gray-500">Consultation Fee</p><p className="font-medium text-lg text-green-600">₹{doctor.fee}</p></div>
              <div><p className="text-xs text-gray-500">Registered</p><p className="font-medium">{new Date(doctor.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p></div>
            </div>
            {doctor.bio && (
              <div className="sm:col-span-2"><h3 className="text-lg font-semibold text-gray-900 border-b pb-2">About</h3><p className="text-gray-700 whitespace-pre-wrap mt-2">{doctor.bio}</p></div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t flex items-center gap-4">
            <Link href={`/doctors/${doctor.id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">Edit Doctor</Link>
            <DoctorActions doctorId={doctor.id} isActive={doctor.isActive} />
          </div>
        </div>
      </div>

      {/* Appointment History */}
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointments ({appointments.length})</h2>
        {appointments.length === 0 ? (
          <p className="text-sm text-gray-500">No appointments yet.</p>
        ) : (
          <div className="space-y-2">
            {appointments.slice(0, 20).map((a) => (
              <Link key={a.id} href={`/appointments/${a.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-mono text-gray-600 w-24">{a.appointmentDate}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.patientName}</p>
                    <p className="text-xs text-gray-500">{a.patientMobile} • {a.appointmentTime}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[a.status] || ""}`}>{a.status.replace("_", " ")}</span>
              </Link>
            ))}
            {appointments.length > 20 && <p className="text-xs text-gray-400 pt-2">Showing 20 of {appointments.length}</p>}
          </div>
        )}
      </div>
    </AppShell>
  );
}
