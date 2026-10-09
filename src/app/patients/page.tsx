import Link from "next/link";
import { patientService } from "@/services/patientService";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; isActive?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const isActive = params.isActive === "false" ? false : params.isActive === "true" ? true : undefined;

  const result = await patientService.getAllPatients({ page, limit: 10, search: search || undefined, isActive });
  const patients = result.data;
  const pagination = result.pagination;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <Link href="/patients/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Patient
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form method="GET" className="flex flex-wrap gap-3">
          <input type="text" name="search" placeholder="Search by name, mobile..." defaultValue={search} className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select name="isActive" defaultValue={isActive === undefined ? "" : isActive.toString()} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm">Filter</button>
          <Link href="/patients" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">Clear</Link>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden table-responsive">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {patients.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No patients found. <Link href="/patients/new" className="text-blue-600 hover:underline">Add your first patient</Link></td></tr>
            ) : patients.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600 font-medium text-sm">{p.name.charAt(0).toUpperCase()}</div>
                    <div className="ml-3"><div className="text-sm font-medium text-gray-900">{p.name}</div><div className="text-xs text-gray-500">ID: {p.id}</div></div>
                  </div>
                </td>
                <td className="px-6 py-4"><div className="text-sm text-gray-900">{p.mobile}</div><div className="text-xs text-gray-500">{p.email || "-"}</div></td>
                <td className="px-6 py-4"><div className="text-sm text-gray-900">{p.age ? `${p.age} yrs` : "-"} • {p.gender || "-"}</div><div className="text-xs text-gray-500">Blood: {p.bloodGroup || "-"}</div></td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${p.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{p.isActive ? "Active" : "Inactive"}</span></td>
                <td className="px-6 py-4 text-right text-sm"><Link href={`/patients/${p.id}`} className="text-blue-600 hover:text-blue-900 mr-3">View</Link><Link href={`/patients/${p.id}/edit`} className="text-indigo-600 hover:text-indigo-900">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-700">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</p>
          <div className="flex gap-2">
            {pagination.page > 1 && <Link href={`/patients?page=${pagination.page - 1}${search ? `&search=${search}` : ""}${isActive !== undefined ? `&isActive=${isActive}` : ""}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Previous</Link>}
            {pagination.page < pagination.totalPages && <Link href={`/patients?page=${pagination.page + 1}${search ? `&search=${search}` : ""}${isActive !== undefined ? `&isActive=${isActive}` : ""}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Next</Link>}
          </div>
        </div>
      )}
    </AppShell>
  );
}
