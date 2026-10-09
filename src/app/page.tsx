import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("cms_session");
  if (session?.value) redirect("/dashboard");

  const features = [
    { icon: "👥", title: "Patient Management", desc: "Register, search, and manage patient records." },
    { icon: "🩺", title: "Doctor Management", desc: "Manage doctors, specializations, and fees." },
    { icon: "📅", title: "Appointments", desc: "Book with live slot picker and double-booking prevention." },
    { icon: "💊", title: "Prescriptions", desc: "Digital prescriptions with medicine details." },
    { icon: "💰", title: "Billing & Payments", desc: "Invoices and multi-method payments." },
    { icon: "📈", title: "Reports", desc: "Revenue and appointment analytics." },
    { icon: "🔔", title: "Notifications", desc: "Auto-triggered in-app notifications." },
    { icon: "🔒", title: "Security", desc: "JWT auth, roles, and audit logging." },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Clinic CMS</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="rounded-lg bg-blue-600 px-3 py-2 sm:px-5 sm:py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:pt-20 sm:pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Complete Clinic Management
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600 leading-relaxed px-2">
            A production-ready system for patients, doctors, appointments, prescriptions, billing, and more.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3 px-4 sm:px-0">
            <Link href="/login" className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition text-center">
              Staff Login
            </Link>
            <Link href="/signup" className="rounded-lg bg-green-600 px-6 py-3 text-white font-medium hover:bg-green-700 transition text-center">
              Patient Sign Up
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 sm:mt-20 grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 px-1">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl bg-white p-4 sm:p-6 shadow-md hover:shadow-lg transition">
              <span className="text-2xl sm:text-3xl">{f.icon}</span>
              <h3 className="mt-2 sm:mt-3 text-sm sm:text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/60 mt-12">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 text-center">
          <p className="text-xs sm:text-sm text-gray-500">Clinic Management System v1.0</p>
          <p className="text-xs text-gray-400 mt-1">Staff: admin@clinic.com / admin123</p>
        </div>
      </footer>
    </main>
  );
}
