"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  invoiceId: number;
  remaining: number;
}

export default function PaymentForm({ invoiceId, remaining }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod,
          transactionId: transactionId || undefined,
          notes: notes || undefined,
        }),
      });
      const result = await res.json();
      if (!result.success) { setError(result.error); return; }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Record Payment</h3>
      {error && <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {success && <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-700 rounded text-sm">Payment recorded successfully!</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Amount (₹)</label>
          <input type="number" value={amount} min={0.01} max={remaining} step="0.01" onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="online">Online</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Txn ID (optional)</label>
          <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Transaction ID" className="w-full px-3 py-2 border rounded text-sm" />
        </div>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50">
          {loading ? "Processing..." : "Record Payment"}
        </button>
      </form>
    </div>
  );
}
