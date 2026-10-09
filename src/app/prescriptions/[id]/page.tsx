import Link from "next/link";
import { notFound } from "next/navigation";
import { prescriptionService } from "@/services/prescriptionService";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prescriptionId = parseInt(id);
  if (isNaN(prescriptionId)) notFound();

  const result = await prescriptionService.getPrescriptionById(prescriptionId);
  if (!result.success || !result.data) notFound();

  const rx = result.data;

  return (
    <AppShell>
        <Link href="/prescriptions" className="text-blue-600 hover:text-blue-700 text-sm">← Back to Prescriptions</Link>

        {/* Prescription Card — printable style */}
        <div className="bg-white rounded-xl shadow mt-4 overflow-hidden" id="prescription-print">
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-5 text-white flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Prescription #{rx.id}</h1>
              <p className="text-teal-100 text-sm mt-1">Visit: {rx.appointmentDate}</p>
            </div>
            <div className="text-right text-sm text-teal-100">
              <p>Issued: {new Date(rx.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>

          <div className="p-6">
            {/* Patient & Doctor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Patient</h3>
                <p className="font-medium text-gray-900">{rx.patientName}</p>
                <p className="text-sm text-gray-600">{rx.patientAge ? `${rx.patientAge} yrs` : ""} {rx.patientGender ? `• ${rx.patientGender}` : ""}</p>
                <p className="text-sm text-gray-600">{rx.patientMobile}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Doctor</h3>
                <p className="font-medium text-gray-900">{rx.doctorName}</p>
                <p className="text-sm text-gray-600">{rx.doctorSpecialization}</p>
              </div>
            </div>

            {/* Diagnosis */}
            {rx.diagnosis && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Diagnosis</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{rx.diagnosis}</p>
              </div>
            )}

            {/* Medicines Table */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Medicines</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rx.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.medicineName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.dosage || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.frequency || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.duration || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.instructions || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes & Follow-up */}
            {rx.notes && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{rx.notes}</p>
              </div>
            )}
            {rx.followUpInstructions && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Follow-up Instructions</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{rx.followUpInstructions}</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t flex gap-4">
              <Link href={`/appointments/${rx.appointmentId}`} className="text-sm text-blue-600 hover:underline">View Appointment →</Link>
              <Link href={`/patients/${rx.patientId}`} className="text-sm text-blue-600 hover:underline">View Patient →</Link>
            </div>
          </div>
        </div>
    </AppShell>
  );
}
