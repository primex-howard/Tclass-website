"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Period = { id: number; name: string; is_active: number };
type Enrollment = {
  id: number;
  status: "draft" | "unofficial" | "official" | "rejected" | "dropped";
  remarks: string | null;
  requested_at: string | null;
  assessed_at: string | null;
  student_name: string;
  student_email: string;
  course_code: string;
  course_title: string;
  units: number;
  schedule: string | null;
  section: string | null;
  period_id: number | null;
  period_name: string | null;
};

export default function AdminEnrollmentsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>("unofficial");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  const activePeriodId = useMemo(
    () => periods.find((p) => p.is_active)?.id,
    [periods]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (statusFilter !== "all") qs.set("status", statusFilter);
      if (periodFilter !== "all") qs.set("period_id", periodFilter);

      const res = await apiFetch(`/admin/enrollments${qs.size ? `?${qs.toString()}` : ""}`);
      const payload = res as { periods: Period[]; enrollments: Enrollment[] };
      setPeriods(payload.periods ?? []);
      setRows(payload.enrollments ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load enrollment requests.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, periodFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const decide = async (id: number, status: "official" | "rejected") => {
    try {
      await apiFetch(`/admin/enrollments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, remarks: remarks[id] || null }),
      });
      toast.success(`Enrollment ${status}.`);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update enrollment.");
    }
  };

  const activatePeriod = async (periodId: number) => {
    try {
      await apiFetch(`/admin/enrollment-periods/${periodId}/activate`, { method: "PATCH" });
      toast.success("Active enrollment period updated.");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to activate period.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Enrollment Management</h1>
            <p className="text-slate-600">Manage period activation, review assessed subjects, and finalize approvals.</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
            <CardDescription>Filter requests and set active enrollment period.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-3">
            <div>
              <p className="text-sm mb-1 text-slate-600">Status</p>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="unofficial">Unofficial</SelectItem>
                  <SelectItem value="official">Official</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm mb-1 text-slate-600">Period</p>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}{p.is_active ? " (Active)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm mb-1 text-slate-600">Activate Period</p>
              <Select
                value={activePeriodId ? String(activePeriodId) : ""}
                onValueChange={(value) => activatePeriod(Number(value))}
              >
                <SelectTrigger><SelectValue placeholder="Choose active period" /></SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment Requests</CardTitle>
            <CardDescription>Rows in `pending` should be approved/rejected after verification.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-500">Loading requests...</p>
            ) : rows.length === 0 ? (
              <p className="text-slate-500">No enrollment requests found.</p>
            ) : (
              <div className="space-y-4">
                {rows.map((row) => (
                  <div key={row.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{row.course_code} - {row.course_title}</p>
                        <p className="text-sm text-slate-700">
                          {row.student_name} ({row.student_email}) · {row.period_name ?? "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Units: {row.units} · Section: {row.section ?? "-"} · Schedule: {row.schedule ?? "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Assessed: {row.assessed_at ? new Date(row.assessed_at).toLocaleString() : "-"}
                        </p>
                        {row.remarks && <p className="text-xs text-amber-700">Remarks: {row.remarks}</p>}
                      </div>
                      <Badge>{row.status}</Badge>
                    </div>

                    {row.status === "unofficial" && (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Optional remarks"
                          value={remarks[row.id] ?? ""}
                          onChange={(e) => setRemarks((prev) => ({ ...prev, [row.id]: e.target.value }))}
                        />
                        <Button onClick={() => decide(row.id, "official")}>Approve</Button>
                        <Button variant="destructive" onClick={() => decide(row.id, "rejected")}>Reject</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
