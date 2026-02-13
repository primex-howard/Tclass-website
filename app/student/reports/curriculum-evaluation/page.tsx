"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type EvalRow = {
  id: number;
  code: string;
  title: string;
  units: number;
  year_level: number;
  semester: number;
  grade: number | null;
  result_status: "passed" | "failed" | "incomplete" | null;
};

export default function CurriculumEvaluationPage() {
  const [rows, setRows] = useState<EvalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/student/curriculum-evaluation");
        setRows((res as { evaluation: EvalRow[] }).evaluation ?? []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load curriculum evaluation.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Curriculum Evaluation</h1>
            <p className="text-slate-600">Progress by year/semester based on passed subjects.</p>
          </div>
          <Link href="/student/enrollment">
            <Button variant="outline">Back to Enrollment</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Evaluation List</CardTitle>
            <CardDescription>Subjects, units, grades, and remarks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 text-xs font-semibold text-slate-700 border-b pb-1">
              <p className="col-span-2">Code</p>
              <p className="col-span-4">Name</p>
              <p className="col-span-1">Units</p>
              <p className="col-span-1">Yr</p>
              <p className="col-span-1">Sem</p>
              <p className="col-span-1">Grade</p>
              <p className="col-span-2">Remark</p>
            </div>
            <div className="max-h-[70vh] overflow-auto space-y-1 mt-2">
              {loading && <p className="text-sm text-slate-500 py-4">Loading...</p>}
              {!loading && rows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 text-sm rounded px-2 py-1 hover:bg-slate-100">
                  <span className="col-span-2">{row.code}</span>
                  <span className="col-span-4 truncate">{row.title}</span>
                  <span className="col-span-1">{row.units}</span>
                  <span className="col-span-1">{row.year_level}</span>
                  <span className="col-span-1">{row.semester}</span>
                  <span className="col-span-1">{row.grade ?? "-"}</span>
                  <span className="col-span-2">{row.result_status ?? "Pending"}</span>
                </div>
              ))}
              {!loading && rows.length === 0 && <p className="text-sm text-slate-500 py-4">No curriculum data found.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
