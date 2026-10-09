"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";

interface PatientOption { id: number; name: string; mobile: string }
interface LineItem { description: string; quantity: number; unitPrice: number }

export default function NewInvoicePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientId, setPatientId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "Consultation Fee", quantity: 1, unitPrice: 500 },
  ]);

  // Search patients
  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/patients/search?q=${encodeURIComponent(patientSearch)}&limit=8`)
        .then((r) => r.json())
        .then((res) => { if (res.success) setPatients(res.data); });
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  const subtotal = items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
  const total = subtotal - parseFloat(discount || "0") + parseFloat(tax || "0");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) { setError("Please select a patient"); return; }
    if (items.length === 0) { setError("At least one line item is required"); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          discount: parseFloat(discount || "0"),
          tax: parseFloat(tax || "0"),
          notes,
          items,
        }),
      });
      const result = await res.json();
      if (!result.success) { setError(result.error); return; }
      window.location.href = "/billing";
    } catch { setError("Unexpected error"); } finally { setLoading(false); }
  }

  return (
    <AppShell>
      <Link href="/billing" className="text-blue-600 hover:text-blue-700 text-sm">← Back to Billing</Link>

        <div className="bg-white rounded-xl shadow p-6 mt-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Invoice</h1>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient <span className="text-red-500">*</span></label>
              {patientId ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-medium text-green-800">{patients.find((p) => p.id === parseInt(patientId))?.name || `Patient #${patientId}`}</span>
                  <button type="button" onClick={() => { setPatientId(""); setPatientSearch(""); }} className="text-sm text-red-600 hover:underline">Change</button>
                </div>
              ) : (
                <>
                  <input type="text" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Search patient..." className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {patients.length > 0 && (
                    <ul className="mt-1 border rounded-lg bg-white shadow max-h-48 overflow-auto">
                      {patients.map((p) => (
                        <li key={p.id} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm" onClick={() => { setPatientId(String(p.id)); setPatientSearch(p.name); }}>
                          <span className="font-medium">{p.name}</span> <span className="text-gray-500">({p.mobile})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Line Items</label>
                <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline">+ Add Item</button>
              </div>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Description</label>}
                      <input type="text" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="Description" className="w-full px-3 py-2 border rounded text-sm" required />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Qty</label>}
                      <input type="number" value={item.quantity} min={1} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border rounded text-sm" />
                    </div>
                    <div className="col-span-3">
                      {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Unit Price (₹)</label>}
                      <input type="number" value={item.unitPrice} min={0} step="0.01" onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded text-sm" />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">₹{(item.quantity * item.unitPrice).toFixed(2)}</span>
                      {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm items-center gap-4">
                <span>Discount</span>
                <input type="number" value={discount} min={0} step="0.01" onChange={(e) => setDiscount(e.target.value)} className="w-28 px-2 py-1 border rounded text-sm text-right" />
              </div>
              <div className="flex justify-between text-sm items-center gap-4">
                <span>Tax</span>
                <input type="number" value={tax} min={0} step="0.01" onChange={(e) => setTax(e.target.value)} className="w-28 px-2 py-1 border rounded text-sm text-right" />
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-4 py-2 border rounded-lg text-sm" placeholder="Optional notes..." />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href="/billing" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Cancel</Link>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">{loading ? "Creating..." : "Create Invoice"}</button>
            </div>
          </form>
        </div>
    </AppShell>
  );
}
