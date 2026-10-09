"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  appointmentId: number;
  /** POST endpoint. Defaults to staff /api/prescriptions; doctor portal passes /api/doctor/appointments/:id/prescription */
  submitUrl?: string;
  /** Where the success link points */
  successHref?: string;
}

interface MedicineItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export default function PrescriptionForm({
  appointmentId,
  submitUrl = "/api/prescriptions",
  successHref = `/appointments/${appointmentId}`,
}: Props) {
  const router = useRouter();
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpInstructions, setFollowUpInstructions] = useState("");
  const [items, setItems] = useState<MedicineItem[]>([
    { medicineName: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function addItem() {
    setItems([...items, { medicineName: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  }

  function removeItem(idx: number) {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof MedicineItem, value: string) {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, diagnosis, notes, followUpInstructions, items }),
      });
      const result = await res.json();
      if (!result.success) { setError(result.error); return; }
      setSuccess(true);
      router.refresh();
    } catch { setError("Unexpected error"); } finally { setLoading(false); }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Create Prescription</h2>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">Prescription created successfully! <a href={successHref} className="underline">Refresh to view</a></div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
          <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} className="w-full px-4 py-2 border rounded-lg text-sm" placeholder="Diagnosis..." />
        </div>

        {/* Medicine Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Medicines <span className="text-red-500">*</span></label>
            <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline">+ Add Medicine</button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Medicine Name *</label>
                    <input type="text" value={item.medicineName} onChange={(e) => updateItem(idx, "medicineName", e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm" required placeholder="e.g. Paracetamol" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Dosage</label>
                    <input type="text" value={item.dosage} onChange={(e) => updateItem(idx, "dosage", e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm" placeholder="e.g. 500mg" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                    <input type="text" value={item.frequency} onChange={(e) => updateItem(idx, "frequency", e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm" placeholder="e.g. 1-0-1" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Duration</label>
                    <input type="text" value={item.duration} onChange={(e) => updateItem(idx, "duration", e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm" placeholder="e.g. 5 days" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Instructions</label>
                    <input type="text" value={item.instructions} onChange={(e) => updateItem(idx, "instructions", e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm" placeholder="e.g. After food" />
                  </div>
                </div>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="text-xs text-red-500 hover:underline">Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-4 py-2 border rounded-lg text-sm" placeholder="Additional notes..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Instructions</label>
          <textarea value={followUpInstructions} onChange={(e) => setFollowUpInstructions(e.target.value)} rows={2} className="w-full px-4 py-2 border rounded-lg text-sm" placeholder="Follow-up instructions for the patient..." />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button type="submit" disabled={loading || success} className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 text-sm">
            {loading ? "Creating..." : "Create Prescription"}
          </button>
        </div>
      </form>
    </div>
  );
}
