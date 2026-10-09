import Link from "next/link";
import { appointmentService } from "@/services/appointmentService";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; fromDate?: string; toDate?: string; doctorId?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const status = params.status || "";
  const fromDate = params.fromDate || "";
  const toDate = params.toDate || "";

  const result = await appointmentService.getAllAppointments({
    page, limit: 10,
    status: status || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const appts = result.data;
  const pagination = result.pagination;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <Link href="/appointments/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Book Appointment
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          <div><label className="block text-xs text-gray-500 mb-1">Status</label><select name="status" defaultValue={status} className="px-3 py-2 border rounded-lg text-sm"><option value="">All</option><option value="scheduled">Scheduled</option><option value="confirmed">Confirmed</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No Show</option></select></div>
          <div><label className="block text-xs text-gray-500 mb-1">From</label><input type="date" name="fromDate" defaultValue={fromDate} className="px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">To</label><input type="date" name="toDate" defaultValue={toDate} className="px-3 py-2 border rounded-lg text-sm" /></div>
          <button type="submit" className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm">Filter</button>
          <Link href="/appointments" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">Clear</Link>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden table-responsive">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date &amp; Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {appts.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No appointments found. <Link href="/appointments/new" className="text-blue-600 hover:underline">Book your first appointment</Link></td></tr>
            ) : appts.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">#{a.id}</td>
                <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{a.patientName}</div><div className="text-xs text-gray-500">{a.patientMobile}</div></td>
                <td className="px-6 py-4"><div className="text-sm text-gray-900">{a.doctorName}</div><div className="text-xs text-gray-500">{a.doctorSpecialization}</div></td>
                <td className="px-6 py-4"><div className="text-sm text-gray-900">{a.appointmentDate}</div><div className="text-xs text-gray-500">{a.appointmentTime}</div></td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-[160px] truncate">{a.reason || "-"}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[a.status] || ""}`}>{a.status.replace("_", " ")}</span></td>
                <td className="px-6 py-4 text-right"><Link href={`/appointments/${a.id}`} className="text-blue-600 hover:text-blue-900 text-sm font-medium">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-700">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</p>
          <div className="flex gap-2">
            {pagination.page > 1 && <Link href={`/appointments?page=${pagination.page - 1}${status ? `&status=${status}` : ""}${fromDate ? `&fromDate=${fromDate}` : ""}${toDate ? `&toDate=${toDate}` : ""}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Previous</Link>}
            {pagination.page < pagination.totalPages && <Link href={`/appointments?page=${pagination.page + 1}${status ? `&status=${status}` : ""}${fromDate ? `&fromDate=${fromDate}` : ""}${toDate ? `&toDate=${toDate}` : ""}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Next</Link>}
          </div>
        </div>
      )}
    </AppShell>
  );
}
