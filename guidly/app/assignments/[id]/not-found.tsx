import Link from "next/link";

export default function AssignmentNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-3">Assignment Not Found</h1>
        <p className="text-slate-600 mb-8">
          This assignment doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <Link
          href="/dashboard"
          className="btn btn-primary px-6 py-3"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

