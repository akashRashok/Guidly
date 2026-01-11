"use client";

import Link from "next/link";
import { TeacherLayout } from "@/components/layouts";
import { formatDate, getHomeworkLink } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  topic: string;
  linkSlug: string;
  classCode: string;
  isClosed: boolean;
  createdAt: Date;
}

interface DashboardClientProps {
  assignments: Assignment[];
  userEmail: string;
  userName?: string | null;
  userImage?: string | null;
}

export function DashboardClient({ assignments, userEmail, userName, userImage }: DashboardClientProps) {
  const handleLogout = async () => {
    // Trigger server-side logout
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/signout";
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <TeacherLayout
      userEmail={userEmail}
      userName={userName}
      userImage={userImage}
      onLogout={handleLogout}
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Assignments</h1>
            <p className="text-slate-500 mt-1">Manage and monitor your homework assignments</p>
          </div>
          <Link
            href="/assignments/new"
            className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Assignment
          </Link>
        </div>

        {/* Tabs - matching ui2.png style */}
        <div className="flex items-center gap-6 mt-6 border-b border-slate-200">
          <button className="pb-3 text-sm font-medium text-sky-600 border-b-2 border-sky-500">
            Active
          </button>
          <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700">
            Closed
          </button>
          <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700">
            All
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3 pb-3">
            <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Sort
            </button>
            <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add filter
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">No assignments yet</h2>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Create your first assignment to start collecting feedback on student misconceptions.
          </p>
          <Link
            href="/assignments/new"
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Assignment
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {assignments.map((assignment) => (
            <Link
              key={assignment.id}
              href={`/assignments/${assignment.id}`}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all group"
            >
              {/* Card Header - User/Assignment info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                    assignment.isClosed 
                      ? "bg-gradient-to-br from-amber-400 to-orange-500" 
                      : "bg-gradient-to-br from-sky-400 to-blue-500"
                  }`}>
                    {assignment.topic.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{assignment.topic}</p>
                    <p className="text-xs text-slate-500">Code: {assignment.classCode}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              {/* Card Title */}
              <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-sky-700 transition-colors">
                {assignment.title}
              </h3>

              {/* Card Description */}
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                Homework link: {getHomeworkLink(assignment.linkSlug)}
              </p>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(assignment.createdAt)}
                </div>

                <div className="flex items-center gap-4">
                  {assignment.isClosed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Closed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  )}
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </TeacherLayout>
  );
}

