"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  appointmentId: number;
  existingSymptoms: string;
  existingDiagnosis: string;
  existingNotes: string;
  existingVitals: string;
  existingFollowUp: string;
  /** API base for consultation saves. Defaults to staff endpoint. */
  apiPrefix?: string;
}

interface Vitals {
  bloodPressure: string;
  temperature: string;
  weight: string;
  pulse: string;
  oxygenSaturation: string;
}

export default function ConsultationForm({
  appointmentId,
  existingSymptoms,
  existingDiagnosis,
  existingNotes,
  existingVitals,
  existingFollowUp,
  apiPrefix = "/api/appointments",
}: Props) {
  const router = useRouter();

  let parsedVitals: Partial<Vitals> = {};
  if (existingVitals) {
    try { parsedVitals = JSON.parse(existingVitals); } catch { /* ignore */ }
  }

  const [symptoms, setSymptoms] = useState(existingSymptoms);
  const [diagnosis, setDiagnosis] = useState(existingDiagnosis);
  const [notes, setNotes] = useState(existingNotes);
  const [followUpDate, setFollowUpDate] = useState(existingFollowUp);
  const [vitals, setVitals] = useState<Vitals>({
    bloodPressure: (parsedVitals.bloodPressure as string) || "",
    temperature: (parsedVitals.temperature as string) || "",
    weight: (parsedVitals.weight as string) || "",
    pulse: (parsedVitals.pulse as string) || "",
    oxygenSaturation: (parsedVitals.oxygenSaturation as string) || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateVital(key: keyof Vitals, value: string) {
    setVitals((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Build vitals object — only include non-empty values
    const vitalsObj: Record<string, string | number> = {};
    if (vitals.bloodPressure) vitalsObj.bloodPressure = vitals.bloodPressure;
    if (vitals.temperature) vitalsObj.temperature = parseFloat(vitals.temperature);
    if (vitals.weight) vitalsObj.weight = parseFloat(vitals.weight);
    if (vitals.pulse) vitalsObj.pulse = parseInt(vitals.pulse);
    if (vitals.oxygenSaturation) vitalsObj.oxygenSaturation = parseFloat(vitals.oxygenSaturation);

    try {
      const res = await fetch(`${apiPrefix}/${appointmentId}/consultation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms,
          diagnosis,
          notes,
          vitals: Object.keys(vitalsObj).length > 0 ? vitalsObj : undefined,
          followUpDate: followUpDate || null,
        }),
      });
      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Failed to save");
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Doctor Consultation</h2>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">Consultation saved successfully!</div>}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Vitals */}
        <fieldset className="border rounded-lg p-4">
          <legend className="text-sm font-medium text-gray-700 px-1">Vitals</legend>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Blood Pressure</label>
              <input type="text" value={vitals.bloodPressure} onChange={(e) => updateVital("bloodPressure", e.target.value)} placeholder="120/80" className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Temp (°F)</label>
              <input type="number" step="0.1" value={vitals.temperature} onChange={(e) => updateVital("temperature", e.target.value)} placeholder="98.6" className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Weight (kg)</label>
              <input type="number" step="0.1" value={vitals.weight} onChange={(e) => updateVital("weight", e.target.value)} placeholder="70" className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Pulse (bpm)</label>
              <input type="number" value={vitals.pulse} onChange={(e) => updateVital("pulse", e.target.value)} placeholder="72" className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">SpO2 (%)</label>
              <input type="number" step="0.1" value={vitals.oxygenSaturation} onChange={(e) => updateVital("oxygenSaturation", e.target.value)} placeholder="98" className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        </fieldset>

        {/* Symptoms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
          <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={2} placeholder="Patient reported symptoms..." className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Diagnosis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
          <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} placeholder="Doctor's diagnosis..." className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Additional clinical notes..." className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Follow-up */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
          <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button type="submit" disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
            {saving ? "Saving..." : "Save Consultation"}
          </button>
        </div>
      </form>
    </div>
  );
}
