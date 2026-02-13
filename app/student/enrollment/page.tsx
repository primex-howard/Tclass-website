"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Period = { id: number; name: string; is_active: number };
type Course = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  units: number;
  tf: number;
  lec: number;
  lab: number;
  schedule: string | null;
  section: string | null;
  room: string | null;
  instructor: string | null;
};
type PreEnlisted = {
  id: number;
  status: "draft" | "pending" | "approved" | "rejected" | "dropped";
  remarks: string | null;
  course_id: number;
  code: string;
  title: string;
  units: number;
  tf: number;
  lec: number;
  lab: number;
  schedule: string | null;
  section: string | null;
};
type EnrolledSubject = {
  id: number;
  status: string;
  course_id: number;
  code: string;
  title: string;
  units: number;
  schedule: string | null;
  room: string | null;
  instructor: string | null;
  section: string | null;
};
export default function StudentEnrollmentPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodId, setPeriodId] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [preEnlisted, setPreEnlisted] = useState<PreEnlisted[]>([]);
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>([]);
  const [official, setOfficial] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<"not_enrolled" | "unofficial" | "official">("not_enrolled");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedPreId, setSelectedPreId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadBase = useCallback(async () => {
    const periodsRes = await apiFetch("/student/periods");
    const coursesRes = await apiFetch("/student/courses");

    const p = (periodsRes as { periods: Period[]; active_period_id: number | null }).periods ?? [];
    const active = (periodsRes as { active_period_id: number | null }).active_period_id;

    setPeriods(p);
    setCourses((coursesRes as { courses: Course[] }).courses ?? []);
    setPeriodId(String(active ?? p[0]?.id ?? ""));
  }, []);

  const loadPeriodData = useCallback(async (pid: string) => {
    if (!pid) return;
    const [preRes, enrolledRes] = await Promise.all([
      apiFetch(`/student/enrollments/pre-enlisted?period_id=${pid}`),
      apiFetch(`/student/enrollments/enrolled-subjects?period_id=${pid}`),
    ]);

    setPreEnlisted((preRes as { pre_enlisted: PreEnlisted[] }).pre_enlisted ?? []);
    setEnrolledSubjects((enrolledRes as { enrolled_subjects: EnrolledSubject[] }).enrolled_subjects ?? []);
    setOfficial(Boolean((enrolledRes as { official?: boolean }).official));
    setEnrollmentStatus(((enrolledRes as { enrollment_status?: "not_enrolled" | "unofficial" | "official" }).enrollment_status) ?? "not_enrolled");
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      await loadBase();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load enrollment module.");
    } finally {
      setLoading(false);
    }
  }, [loadBase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!periodId) return;
    loadPeriodData(periodId).catch((error) =>
      toast.error(error instanceof Error ? error.message : "Failed to load period data.")
    );
  }, [periodId, loadPeriodData]);

  const selectedPeriod = useMemo(
    () => periods.find((p) => String(p.id) === periodId),
    [periods, periodId]
  );

  const chosenCourses = new Set(preEnlisted.map((r) => r.course_id));
  const officiallyEnrolledCourseIds = new Set(enrolledSubjects.map((r) => r.course_id));
  const availableCourses = courses.filter((c) => !chosenCourses.has(c.id) && !officiallyEnrolledCourseIds.has(c.id));
  const totalPendingUnits = preEnlisted.reduce((sum, r) => sum + Number(r.units ?? 0), 0);
  const totalOfficialUnits = enrolledSubjects.reduce((sum, r) => sum + Number(r.units ?? 0), 0);

  const refreshRows = async () => {
    await loadPeriodData(periodId);
  };

  const addCourse = async (courseId: number) => {
    try {
      await apiFetch("/student/enrollments/add", {
        method: "POST",
        body: JSON.stringify({ course_id: courseId, period_id: Number(periodId) }),
      });
      toast.success("Subject added to pre-enlisted list.");
      await refreshRows();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add subject.");
    }
  };

  const handleAddSelected = async () => {
    if (!selectedCourseId) {
      if (availableCourses.length === 0) {
        toast.error("No available subjects to add.");
        return;
      }
      if (selectedPreId) {
        toast.error("Selected row is from Pre-Enlisted list. Use Delete to remove it.");
        return;
      }
      toast.error("Select a subject from Available Subjects first.");
      return;
    }
    await addCourse(Number(selectedCourseId));
    setSelectedCourseId("");
  };

  const handleAuto = async () => {
    try {
      const res = await apiFetch("/student/enrollments/auto", {
        method: "POST",
        body: JSON.stringify({ period_id: Number(periodId) }),
      });
      toast.success((res as { message?: string }).message ?? "Auto pre-enlist finished.");
      await refreshRows();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Auto pre-enlist failed.");
    }
  };

  const handleDelete = async () => {
    if (!selectedPreId) {
      toast.error("Select a pre-enlisted row to delete.");
      return;
    }
    try {
      await apiFetch(`/student/enrollments/${selectedPreId}`, { method: "DELETE" });
      toast.success("Pre-enlisted subject deleted.");
      setSelectedPreId("");
      await refreshRows();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  const handleDeleteAll = async () => {
    try {
      await apiFetch(`/student/enrollments?period_id=${periodId}`, { method: "DELETE" });
      toast.success("Draft pre-enlisted subjects cleared.");
      setSelectedPreId("");
      await refreshRows();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete all failed.");
    }
  };

  const handleAssess = async () => {
    try {
      await apiFetch("/student/enrollments/assess", {
        method: "POST",
        body: JSON.stringify({ period_id: Number(periodId) }),
      });
      toast.success("Enrollment assessed and submitted for approval.");
      await refreshRows();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Assessment failed.");
    }
  };

  const openFileView = () => {
    const rows = enrolledSubjects.map((row) => `<tr><td>${row.code}</td><td>${row.title}</td><td>${row.units}</td><td>${row.schedule ?? "-"}</td><td>${row.section ?? "-"}</td></tr>`).join("");
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`<html><head><title>Subject List</title></head><body><h2>Subject List (${enrollmentStatus.toUpperCase()})</h2><table border="1" cellspacing="0" cellpadding="8"><tr><th>Code</th><th>Subject</th><th>Units</th><th>Schedule</th><th>Section</th></tr>${rows || "<tr><td colspan='5'>No subjects</td></tr>"}</table></body></html>`);
    w.document.close();
  };

  const openCorView = () => {
    if (!official) {
      toast.error("COR is available only for officially enrolled students.");
      return;
    }
    openFileView();
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Enrollment</h1>
            <p className="text-slate-600">College pre-enlistment and enrolled subjects tracker.</p>
          </div>
          <Link href="/student">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Enrollment Worksheet</CardTitle>
              {official ? <Badge className="bg-green-600">COE</Badge> : <Badge variant="secondary">For Approval</Badge>}
            </div>
            <CardDescription>Period, pre-enlisted subjects, and assessed enrollment status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm font-medium text-slate-700">Period</p>
                <Select value={periodId} onValueChange={setPeriodId} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.id} value={String(period.id)}>
                        {period.name}{period.is_active ? " (Active)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-slate-600">
                <p>Selected: <span className="font-semibold text-slate-900">{selectedPeriod?.name ?? "-"}</span></p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Pre-Enlisted Subjects</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleDelete}>Delete</Button>
                      <Button size="sm" variant="destructive" onClick={handleDeleteAll}>Delete All</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-12 text-xs font-semibold text-slate-700 border-b pb-1">
                    <p className="col-span-3">Code</p>
                    <p className="col-span-6">Description</p>
                    <p className="col-span-3">Remark</p>
                  </div>
                  <div className="max-h-72 overflow-auto space-y-1">
                    {preEnlisted.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setSelectedPreId(String(row.id))}
                        className={`grid grid-cols-12 text-sm w-full text-left rounded px-2 py-1 ${selectedPreId === String(row.id) ? "bg-blue-100" : "hover:bg-slate-100"}`}
                      >
                        <span className="col-span-3">{row.code}</span>
                        <span className="col-span-6 truncate">{row.title}</span>
                        <span className="col-span-3">{row.status}</span>
                      </button>
                    ))}
                    {preEnlisted.length === 0 && <p className="text-sm text-slate-500 py-4">No pre-enlisted subjects.</p>}
                  </div>
                  <p className="text-xs text-slate-600">Total Units: <span className="font-semibold">{totalPendingUnits}</span></p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Available Subjects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-12 text-xs font-semibold text-slate-700 border-b pb-1">
                    <p className="col-span-2">Code</p>
                    <p className="col-span-4">Subject</p>
                    <p className="col-span-1">Units</p>
                    <p className="col-span-1">TF</p>
                    <p className="col-span-4">Schedule</p>
                  </div>
                  <div className="max-h-72 overflow-auto space-y-1">
                    {availableCourses.map((course) => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => setSelectedCourseId(String(course.id))}
                        className={`grid grid-cols-12 text-sm w-full text-left rounded px-2 py-1 ${selectedCourseId === String(course.id) ? "bg-blue-100" : "hover:bg-slate-100"}`}
                      >
                        <span className="col-span-2">{course.code}</span>
                        <span className="col-span-4 truncate">{course.title}</span>
                        <span className="col-span-1">{course.units}</span>
                        <span className="col-span-1">{course.tf}</span>
                        <span className="col-span-4 truncate">{course.schedule ?? "-"}</span>
                      </button>
                    ))}
                    {availableCourses.length === 0 && <p className="text-sm text-slate-500 py-4">No available subjects.</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={handleAuto}>Auto</Button>
                <Button size="sm" variant="outline" onClick={handleAddSelected} disabled={availableCourses.length === 0}>Select/Add</Button>
                <Button size="sm" onClick={handleAddSelected} disabled={availableCourses.length === 0}>Add</Button>
              </div>
              <Button onClick={handleAssess}>Assess</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Enrolled Subjects</CardTitle>
              <div className="flex items-center gap-2">
                {enrollmentStatus === "official" && <Badge className="bg-green-600">Student is OFFICIALLY Enrolled</Badge>}
                {enrollmentStatus === "unofficial" && <Badge className="bg-amber-600">Student is UNOFFICIALLY Enrolled</Badge>}
                <Button size="sm" variant="outline" onClick={openFileView}>File</Button>
                <Button size="sm" onClick={openCorView} disabled={!official}>COR</Button>
                <Button size="sm" variant="outline" onClick={() => loadPeriodData(periodId)}>Refresh</Button>
              </div>
            </div>
            <CardDescription>Approved subjects for the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 text-xs font-semibold text-slate-700 border-b pb-1">
              <p className="col-span-2">Class</p>
              <p className="col-span-4">Subject Description</p>
              <p className="col-span-1">Units</p>
              <p className="col-span-2">Schedule</p>
              <p className="col-span-1">Room</p>
              <p className="col-span-1">Instructor</p>
              <p className="col-span-1">Section</p>
            </div>
            <div className="max-h-72 overflow-auto space-y-1 mt-2">
              {enrolledSubjects.map((row) => (
                <div key={row.id} className="grid grid-cols-12 text-sm rounded px-2 py-1 hover:bg-slate-100">
                  <span className="col-span-2">{row.code}</span>
                  <span className="col-span-4 truncate">{row.title}</span>
                  <span className="col-span-1">{row.units}</span>
                  <span className="col-span-2 truncate">{row.schedule ?? "-"}</span>
                  <span className="col-span-1 truncate">{row.room ?? "-"}</span>
                  <span className="col-span-1 truncate">{row.instructor ?? "-"}</span>
                  <span className="col-span-1">{row.section ?? "-"}</span>
                </div>
              ))}
              {enrolledSubjects.length === 0 && <p className="text-sm text-slate-500 py-4">No officially enrolled subjects yet.</p>}
            </div>
            <div className="text-right pt-3 text-sm font-semibold text-slate-800">Total: {totalOfficialUnits} units</div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
