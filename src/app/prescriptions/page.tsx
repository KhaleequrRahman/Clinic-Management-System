import Link from "next/link";
import { prescriptionService } from "@/services/prescriptionService";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function PrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");

  const result = await prescriptionService.getAllPrescriptions({ page, limit: 10 });
  const list = result.data;
  const pagination = result.pagination;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Prescriptions</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden table-responsive">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No prescriptions found. Prescriptions are created from completed appointments.</td></tr>
              ) : (
                list.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">#{p.id}</td>
                    <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{p.patientName}</div><div className="text-xs text-gray-500">{p.patientMobile}</div></td>
                    <td className="px-6 py-4"><div className="text-sm text-gray-900">{p.doctorName}</div><div className="text-xs text-gray-500">{p.doctorSpecialization}</div></td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">{p.diagnosis || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.appointmentDate}</td>
                    <td className="px-6 py-4 text-right"><Link href={`/prescriptions/${p.id}`} className="text-blue-600 hover:text-blue-900 text-sm font-medium">View</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-700">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              {pagination.page > 1 && <Link href={`/prescriptions?page=${pagination.page - 1}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Previous</Link>}
              {pagination.page < pagination.totalPages && <Link href={`/prescriptions?page=${pagination.page + 1}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Next</Link>}
            </div>
          </div>
        )}
    </AppShell>
  );
}
