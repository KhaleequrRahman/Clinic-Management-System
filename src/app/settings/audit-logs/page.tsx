"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";

interface AuditRow {
  id: number;
  userId: number | null;
  action: string;
  tableName: string;
  recordId: number | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-purple-100 text-purple-800",
  LOGOUT: "bg-gray-100 text-gray-800",
  STATUS_CHANGE: "bg-amber-100 text-amber-800",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  async function fetchLogs() {
    setLoading(true);
    const res = await fetch(`/api/audit-logs?page=${page}&limit=30`);
    const result = await res.json();
    if (result.success) {
      setLogs(result.data);
      setTotalPages(result.pagination.totalPages);
    }
    setLoading(false);
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Logs</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No audit logs yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {new Date(log.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {log.userName || "System"}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{log.tableName}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">#{log.recordId || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-700">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <button onClick={() => setPage(page - 1)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Previous</button>
            )}
            {page < totalPages && (
              <button onClick={() => setPage(page + 1)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Next</button>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
