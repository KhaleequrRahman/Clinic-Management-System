import Link from "next/link";
import { patientService } from "@/services/patientService";
import { doctorService } from "@/services/doctorService";
import { appointmentService } from "@/services/appointmentService";
import { billingService } from "@/services/billingService";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [patientStats, doctorStats, appointmentStats, revenueStats] =
    await Promise.all([
      patientService.getPatientStats(),
      doctorService.getDoctorStats(),
      appointmentService.getAppointmentStats(),
      billingService.getRevenueStats(),
    ]);

  const ps = patientStats.data!;
  const ds = doctorStats.data!;
  const as_ = appointmentStats.data!;
  const rs = revenueStats.data!;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Reports &amp; Analytics
      </h1>

      {/* Patient Reports */}
      <section className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Patient Reports
          </h2>
          <Link
            href="/patients"
            className="text-sm text-blue-600 hover:underline"
          >
            View Patients →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard label="Total Patients" value={ps.total} />
          <MetricCard label="Active Patients" value={ps.active} color="green" />
          <MetricCard label="Inactive Patients" value={ps.inactive} color="red" />
          <MetricCard
            label="Activation Rate"
            value={ps.total > 0 ? `${((ps.active / ps.total) * 100).toFixed(1)}%` : "—"}
          />
        </div>
      </section>

      {/* Doctor Reports */}
      <section className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Doctor Reports
          </h2>
          <Link
            href="/doctors"
            className="text-sm text-blue-600 hover:underline"
          >
            View Doctors →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetricCard label="Total Doctors" value={ds.total} />
          <MetricCard label="Active Doctors" value={ds.active} color="green" />
          <MetricCard label="Inactive Doctors" value={ds.inactive} color="red" />
        </div>
      </section>

      {/* Appointment Reports */}
      <section className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Appointment Reports
          </h2>
          <Link
            href="/appointments"
            className="text-sm text-blue-600 hover:underline"
          >
            View Appointments →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard label="Total" value={as_.total} />
          <MetricCard label="Today" value={as_.today} color="blue" />
          <MetricCard label="Scheduled" value={as_.scheduled} color="amber" />
          <MetricCard label="Completed" value={as_.completed} color="green" />
          <MetricCard label="Cancelled" value={as_.cancelled} color="red" />
          <MetricCard label="No-Show" value={as_.noShow} color="gray" />
        </div>
        {as_.total > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Appointment Breakdown
            </h3>
            <div className="flex h-6 rounded-full overflow-hidden">
              {as_.completed > 0 && (
                <div
                  className="bg-green-500"
                  style={{ width: `${(as_.completed / as_.total) * 100}%` }}
                  title={`Completed: ${as_.completed}`}
                />
              )}
              {as_.scheduled > 0 && (
                <div
                  className="bg-amber-400"
                  style={{ width: `${(as_.scheduled / as_.total) * 100}%` }}
                  title={`Scheduled: ${as_.scheduled}`}
                />
              )}
              {as_.cancelled > 0 && (
                <div
                  className="bg-red-400"
                  style={{ width: `${(as_.cancelled / as_.total) * 100}%` }}
                  title={`Cancelled: ${as_.cancelled}`}
                />
              )}
              {as_.noShow > 0 && (
                <div
                  className="bg-gray-400"
                  style={{ width: `${(as_.noShow / as_.total) * 100}%` }}
                  title={`No-Show: ${as_.noShow}`}
                />
              )}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
                Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" />
                Scheduled
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-red-400" />
                Cancelled
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-gray-400" />
                No-Show
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Financial Reports */}
      <section className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Financial Reports
          </h2>
          <Link
            href="/billing"
            className="text-sm text-blue-600 hover:underline"
          >
            View Billing →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <MetricCard
            label="Today's Revenue"
            value={`₹${rs.todayRevenue.toFixed(0)}`}
            color="green"
          />
          <MetricCard
            label="Monthly Revenue"
            value={`₹${rs.monthlyRevenue.toFixed(0)}`}
            color="blue"
          />
          <MetricCard
            label="Total Revenue"
            value={`₹${rs.totalRevenue.toFixed(0)}`}
          />
          <MetricCard label="Total Invoices" value={rs.totalInvoices} />
          <MetricCard
            label="Paid Invoices"
            value={rs.paidInvoices}
            color="green"
          />
          <MetricCard
            label="Pending Invoices"
            value={rs.pendingInvoices}
            color="amber"
          />
        </div>
      </section>

      {/* Summary */}
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Clinic Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryRow
            label="Completion Rate"
            value={
              as_.total > 0
                ? `${((as_.completed / as_.total) * 100).toFixed(1)}%`
                : "—"
            }
          />
          <SummaryRow
            label="Cancellation Rate"
            value={
              as_.total > 0
                ? `${((as_.cancelled / as_.total) * 100).toFixed(1)}%`
                : "—"
            }
          />
          <SummaryRow
            label="No-Show Rate"
            value={
              as_.total > 0
                ? `${((as_.noShow / as_.total) * 100).toFixed(1)}%`
                : "—"
            }
          />
          <SummaryRow
            label="Avg Revenue / Invoice"
            value={
              rs.paidInvoices > 0
                ? `₹${(rs.totalRevenue / rs.paidInvoices).toFixed(2)}`
                : "—"
            }
          />
        </div>
      </section>
    </AppShell>
  );
}

/* ─── Helpers ─── */

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: "green" | "blue" | "red" | "amber" | "gray";
}) {
  const textColor: Record<string, string> = {
    green: "text-green-600",
    blue: "text-blue-600",
    red: "text-red-600",
    amber: "text-amber-600",
    gray: "text-gray-500",
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ? textColor[color] : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
}
