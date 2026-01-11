"use client";

import Link from "next/link";
import { TeacherLayout } from "@/components/layouts";
import { formatDate, getHomeworkLink } from "@/lib/utils";
import { CloseAssignmentButton } from "./CloseAssignmentButton";
import { CopyLinkButton } from "./CopyLinkButton";

interface Assignment {
  id: string;
  title: string;
  topic: string;
  linkSlug: string;
  classCode: string;
  isClosed: boolean;
  createdAt: Date;
}

interface Question {
  id: string;
  questionText: string;
  correctAnswer: string;
  order: number;
}

interface StudentSession {
  id: string;
  studentName: string;
  startedAt: Date;
  completedAt: Date | null;
}

interface MisconceptionStat {
  category: string;
  description: string;
  count: number;
  examples: string[];
}

interface StudentResponseData {
  sessionId: string;
  isCorrect: boolean;
}

interface AssignmentDetailClientProps {
  assignment: Assignment;
  questions: Question[];
  sessions: StudentSession[];
  responses: StudentResponseData[];
  topMisconceptions: MisconceptionStat[];
  aiSummary: string;
  stats: {
    totalStudents: number;
    completedStudents: number;
    totalResponses: number;
    correctResponses: number;
    accuracy: number;
  };
  userEmail: string;
  userName?: string | null;
  userImage?: string | null;
}

export function AssignmentDetailClient({
  assignment,
  questions,
  sessions,
  responses,
  topMisconceptions,
  aiSummary,
  stats,
  userEmail,
  userName,
  userImage,
}: AssignmentDetailClientProps) {
  const handleLogout = async () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/signout";
    document.body.appendChild(form);
    form.submit();
  };

  const homeworkLink = getHomeworkLink(assignment.linkSlug);

  // Build activities from sessions for the sidebar
  const activities = sessions.slice(0, 5).map((s) => ({
    id: s.id,
    type: s.completedAt ? "completion" as const : "comment" as const,
    studentName: s.studentName,
    message: s.completedAt ? "completed the assignment" : "started the assignment",
    time: formatDate(s.startedAt),
    assignmentTitle: assignment.title,
  }));

  const recentStudents = sessions.slice(0, 5).map((s) => ({
    id: s.id,
    name: s.studentName.split(" ")[0],
    initial: s.studentName.charAt(0).toUpperCase(),
  }));

  return (
    <TeacherLayout
      userEmail={userEmail}
      userName={userName}
      userImage={userImage}
      onLogout={handleLogout}
      activities={activities}
      recentStudents={recentStudents}
    >
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/dashboard"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">{assignment.title}</h1>
            <p className="text-slate-500 mt-0.5">{assignment.topic}</p>
          </div>
          {assignment.isClosed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Closed
            </span>
          ) : (
            <CloseAssignmentButton assignmentId={assignment.id} />
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Share Section */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Share with Students</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Homework Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={homeworkLink}
                  readOnly
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700"
                />
                <CopyLinkButton text={homeworkLink} label="Copy" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Class Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assignment.classCode}
                  readOnly
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono text-slate-700"
                />
                <CopyLinkButton text={assignment.classCode} label="Copy" />
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Students need both the link and class code to start.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="text-3xl font-bold text-slate-800">{stats.totalStudents}</div>
            <div className="text-sm text-slate-500 mt-1">Students Started</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="text-3xl font-bold text-emerald-600">{stats.completedStudents}</div>
            <div className="text-sm text-slate-500 mt-1">Completed</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="text-3xl font-bold text-slate-800">{questions.length}</div>
            <div className="text-sm text-slate-500 mt-1">Questions</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="text-3xl font-bold text-sky-600">{stats.accuracy}%</div>
            <div className="text-sm text-slate-500 mt-1">Accuracy</div>
          </div>
        </div>

        {/* AI Summary */}
        {aiSummary && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
            <h2 className="text-lg font-semibold text-emerald-800 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Teaching Recommendation
            </h2>
            <p className="text-emerald-700">{aiSummary}</p>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Misconceptions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Common Misconceptions</h2>
            {topMisconceptions.length > 0 ? (
              <div className="space-y-3">
                {topMisconceptions.map((m, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-semibold text-sm">{m.count}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-800 text-sm mb-1">{m.category}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed break-words">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-6">No misconceptions identified yet.</p>
            )}
          </div>

          {/* Student List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Students ({sessions.length})
            </h2>
            
            {sessions.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">
                No students have started yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {sessions.map((s) => {
                  const studentResponses = responses.filter((r) => r.sessionId === s.id);
                  const correct = studentResponses.filter((r) => r.isCorrect).length;
                  const total = studentResponses.length;
                  
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {s.studentName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-800 text-sm">{s.studentName}</span>
                          {total > 0 && (
                            <span className="text-xs text-slate-500 ml-2">
                              {correct}/{total} correct
                            </span>
                          )}
                        </div>
                      </div>
                      {s.completedAt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Done
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Questions</h2>
          <div className="space-y-3">
            {questions.map((q, index) => (
              <div key={q.id} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 bg-sky-100 rounded-lg flex items-center justify-center text-sm font-semibold text-sky-700">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-800">{q.questionText}</p>
                    <p className="text-sm text-slate-500 mt-1.5">
                      Answer: <span className="font-medium text-emerald-600">{q.correctAnswer}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-400 pb-4">
          Created {formatDate(assignment.createdAt)}
        </div>
      </div>
    </TeacherLayout>
  );
}

