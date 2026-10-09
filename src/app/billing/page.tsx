import Link from "next/link";
import { billingService } from "@/services/billingService";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  partially_paid: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const status = params.status || "";

  const [result, statsResult] = await Promise.all([
    billingService.getAllInvoices({ page, limit: 10, status: status || undefined }),
    billingService.getRevenueStats(),
  ]);

  const list = result.data;
  const pagination = result.pagination;
  const stats = statsResult.data!;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing &amp; Invoices</h1>
          <Link href="/billing/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Create Invoice
          </Link>
        </div>

        {/* Revenue Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-gray-500">Today&apos;s Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-1">₹{stats.todayRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-gray-500">Monthly Revenue</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">₹{stats.monthlyRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form method="GET" className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select name="status" defaultValue={status} className="px-3 py-2 border rounded-lg text-sm">
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button type="submit" className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm">Filter</button>
            <Link href="/billing" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">Clear</Link>
          </form>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden table-responsive">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No invoices found. <Link href="/billing/new" className="text-blue-600 hover:underline">Create your first invoice</Link></td></tr>
              ) : (
                list.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4"><div className="text-sm text-gray-900">{inv.patientName}</div><div className="text-xs text-gray-500">{inv.patientMobile}</div></td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{inv.total}</td>
                    <td className="px-6 py-4 text-sm text-green-600">₹{inv.amountPaid}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[inv.status] || ""}`}>{inv.status.replace("_", " ")}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-6 py-4 text-right"><Link href={`/billing/${inv.id}`} className="text-blue-600 hover:text-blue-900 text-sm font-medium">View</Link></td>
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
              {pagination.page > 1 && <Link href={`/billing?page=${pagination.page - 1}${status ? `&status=${status}` : ""}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Previous</Link>}
              {pagination.page < pagination.totalPages && <Link href={`/billing?page=${pagination.page + 1}${status ? `&status=${status}` : ""}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Next</Link>}
            </div>
          </div>
        )}
    </AppShell>
  );
}
