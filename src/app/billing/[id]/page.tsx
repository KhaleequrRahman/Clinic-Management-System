import Link from "next/link";
import { notFound } from "next/navigation";
import { billingService } from "@/services/billingService";
import AppShell from "@/components/AppShell";
import PaymentForm from "./PaymentForm";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  partially_paid: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoiceId = parseInt(id);
  if (isNaN(invoiceId)) notFound();

  const result = await billingService.getInvoiceById(invoiceId);
  if (!result.success || !result.data) notFound();

  const inv = result.data;
  const remaining = parseFloat(inv.total) - parseFloat(inv.amountPaid);
  const canPay = !["paid", "cancelled", "refunded"].includes(inv.status);

  return (
    <AppShell>
      <Link href="/billing" className="text-blue-600 hover:text-blue-700 text-sm">← Back to Billing</Link>

        <div className="bg-white rounded-xl shadow mt-4 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-xl font-bold">{inv.invoiceNumber}</h1>
              <p className="text-amber-100 text-sm mt-1">{new Date(inv.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${STATUS_COLORS[inv.status]}`}>{inv.status.replace("_", " ").toUpperCase()}</span>
          </div>

          <div className="p-6">
            {/* Patient + Doctor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
                <p className="font-medium text-gray-900">{inv.patientName}</p>
                <p className="text-sm text-gray-600">{inv.patientMobile}</p>
                {inv.patientEmail && <p className="text-sm text-gray-600">{inv.patientEmail}</p>}
                {inv.patientAddress && <p className="text-sm text-gray-600">{inv.patientAddress}</p>}
              </div>
              {inv.doctorName && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Doctor</h3>
                  <p className="font-medium text-gray-900">{inv.doctorName}</p>
                  <p className="text-sm text-gray-600">{inv.doctorSpecialization}</p>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inv.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">₹{item.unitPrice}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-6">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{inv.subtotal}</span></div>
                {parseFloat(inv.discount) > 0 && <div className="flex justify-between text-sm text-red-600"><span>Discount</span><span>-₹{inv.discount}</span></div>}
                {parseFloat(inv.tax) > 0 && <div className="flex justify-between text-sm"><span>Tax</span><span>₹{inv.tax}</span></div>}
                <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span>₹{inv.total}</span></div>
                <div className="flex justify-between text-sm text-green-600"><span>Paid</span><span>₹{inv.amountPaid}</span></div>
                {remaining > 0 && <div className="flex justify-between text-sm font-medium text-red-600"><span>Due</span><span>₹{remaining.toFixed(2)}</span></div>}
              </div>
            </div>

            {inv.notes && (
              <div className="mb-6"><h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Notes</h3><p className="text-sm text-gray-700">{inv.notes}</p></div>
            )}

            {/* Payment History */}
            {inv.payments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Payment History</h3>
                <div className="space-y-2">
                  {inv.payments.map((pay) => (
                    <div key={pay.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">₹{pay.amount} via <span className="uppercase">{pay.paymentMethod.replace("_", " ")}</span></p>
                        {pay.transactionId && <p className="text-xs text-gray-500">Txn: {pay.transactionId}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{pay.paidAt ? new Date(pay.paidAt).toLocaleString("en-IN") : "-"}</p>
                        <span className={`text-xs font-medium ${pay.status === "completed" ? "text-green-600" : "text-yellow-600"}`}>{pay.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Form */}
          {canPay && remaining > 0 && (
            <div className="border-t px-6 pb-6 pt-4">
              <PaymentForm invoiceId={inv.id} remaining={remaining} />
            </div>
          )}
        </div>
    </AppShell>
  );
}
