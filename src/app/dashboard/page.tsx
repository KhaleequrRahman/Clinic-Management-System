import Link from "next/link";
import { patientService } from "@/services/patientService";
import { doctorService } from "@/services/doctorService";
import { appointmentService } from "@/services/appointmentService";
import { billingService } from "@/services/billingService";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [patientStats, doctorStats, appointmentStats, todayAppts, revenueStats] =
    await Promise.all([
      patientService.getPatientStats(),
      doctorService.getDoctorStats(),
      appointmentService.getAppointmentStats(),
      appointmentService.getTodayAppointments(),
      billingService.getRevenueStats(),
    ]);

  const todayAppointments = todayAppts.data || [];
  const revenue = revenueStats.data!;

  const statusColor: Record<string, string> = {
    scheduled: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    in_progress: "bg-indigo-100 text-indigo-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-gray-100 text-gray-800",
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Row 1 – Core counts */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Patients"
          value={patientStats.data?.total || 0}
          sub={`${patientStats.data?.active || 0} active`}
          color="green"
        />
        <StatCard
          title="Total Doctors"
          value={doctorStats.data?.total || 0}
          sub={`${doctorStats.data?.active || 0} active`}
          color="blue"
        />
        <StatCard
          title="Today's Appointments"
          value={appointmentStats.data?.today || 0}
          sub={`${appointmentStats.data?.scheduled || 0} pending`}
          color="purple"
        />
        <StatCard
          title="Total Appointments"
          value={appointmentStats.data?.total || 0}
          sub={`${appointmentStats.data?.completed || 0} completed`}
          color="amber"
        />
      </div>

      {/* Row 2 – Revenue */}
      <div className="grid gap-5 sm:grid-cols-3 mb-6">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Today&apos;s Revenue</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            ₹{revenue.todayRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Monthly Revenue</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            ₹{revenue.monthlyRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            ₹{revenue.totalRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {revenue.totalInvoices} invoices • {revenue.paidInvoices} paid •{" "}
            {revenue.pendingInvoices} pending
          </p>
        </div>
      </div>

      {/* Row 3 – Quick Actions + Today */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/patients/new"
              className="flex items-center gap-2 justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              + Add Patient
            </Link>
            <Link
              href="/doctors/new"
              className="flex items-center gap-2 justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              + Add Doctor
            </Link>
            <Link
              href="/appointments/new"
              className="flex items-center gap-2 justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
            >
              + Book Appointment
            </Link>
            <Link
              href="/billing/new"
              className="flex items-center gap-2 justify-center px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium"
            >
              + Create Invoice
            </Link>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Today&apos;s Schedule
            </h2>
            <Link
              href="/appointments"
              className="text-sm text-blue-600 hover:underline"
            >
              View All →
            </Link>
          </div>
          {todayAppointments.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              No appointments scheduled for today.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {todayAppointments.map((a) => (
                <Link
                  key={a.id}
                  href={`/appointments/${a.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-medium text-gray-900 w-14">
                      {a.appointmentTime}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {a.patientName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {a.doctorName} • {a.doctorSpecialization}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      statusColor[a.status] || "bg-gray-100"
                    }`}
                  >
                    {a.status.replace("_", " ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* ─── Helper ─── */
function StatCard({
  title,
  value,
  sub,
  color,
}: {
  title: string;
  value: number;
  sub: string;
  color: "green" | "blue" | "purple" | "amber";
}) {
  const ring: Record<string, string> = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full ${ring[color]}`}
        >
          <span className="text-lg font-bold">{value}</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-500">{sub}</p>
    </div>
  );
}
