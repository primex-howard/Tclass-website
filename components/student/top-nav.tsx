"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, GraduationCap, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function StudentTopNav() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "tclass_token=; path=/; max-age=0; samesite=lax";
    document.cookie = "tclass_role=; path=/; max-age=0; samesite=lax";
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link href="/student" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-lg shadow-md">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">TClass</span>
              <span className="text-xs rounded-full bg-amber-100 px-2 py-0.5 text-slate-700 border border-amber-200">Student Portal</span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-sm">
              <Link href="/student" className="nav-chip nav-chip-active">Dashboard</Link>

              <div className="relative group">
                <button className="nav-chip inline-flex items-center gap-1">
                  Transactions <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <div className="absolute left-0 top-full hidden group-hover:block bg-white/98 backdrop-blur-md text-slate-900 min-w-[320px] shadow-xl border border-slate-200 rounded-xl overflow-hidden">
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">Change Password</button>
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">Student Profile</button>
                  <div className="border-t border-slate-200 my-1" />
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">Pre-enlistment</button>
                  <Link className="block w-full text-left px-4 py-2 hover:bg-blue-50 font-semibold text-blue-700" href="/student/enrollment">Enrollment</Link>
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">Add / Cross-Enroll / Drop Subject</button>
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">Assessment</button>
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">Amount Due</button>
                </div>
              </div>

              <div className="relative group">
                <button className="nav-chip inline-flex items-center gap-1">
                  Reports <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <div className="absolute left-0 top-full hidden group-hover:block bg-white/98 backdrop-blur-md text-slate-900 min-w-[420px] shadow-xl border border-slate-200 rounded-xl overflow-hidden">
                  <Link className="block w-full text-left px-4 py-2 hover:bg-blue-50 font-semibold text-blue-700" href="/student/reports/enrolled-subjects">Enrolled Subjects</Link>
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">Class Absences</button>
                  <div className="border-t border-slate-200 my-1" />
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">Term Grades (Match Curriculum)</button>
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">Final Grades (Match Curriculum)</button>
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">General Weighted Average (Match Curriculum)</button>
                  <div className="border-t border-slate-200 my-1" />
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">Term Grades (Ignore Curriculum)</button>
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">Final Grades (Ignore Curriculum)</button>
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">General Weighted Average (Ignore Curriculum)</button>
                  <div className="border-t border-slate-200 my-1" />
                  <Link className="block w-full text-left px-4 py-2 hover:bg-blue-50 font-semibold text-blue-700" href="/student/reports/curriculum-evaluation">Curriculum Evaluation</Link>
                </div>
              </div>

              <div className="relative group">
                <button className="nav-chip inline-flex items-center gap-1">
                  Help <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <div className="absolute left-0 top-full hidden group-hover:block bg-white/98 backdrop-blur-md text-slate-900 min-w-[180px] shadow-xl border border-slate-200 rounded-xl overflow-hidden">
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">Support</button>
                  <button type="button" className="block w-full text-left px-4 py-2 hover:bg-slate-100">About</button>
                </div>
              </div>

              <button onClick={handleLogout} className="nav-chip">
                Logout
              </button>
            </nav>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-9 w-60 rounded-full border-slate-200 bg-slate-50/90 focus-visible:bg-white" placeholder="Search courses & assignments..." />
            </div>
            <button className="relative rounded-full p-2 hover:bg-slate-100 transition-colors">
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 pulse-ring" />
            </button>
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-700">ST</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
