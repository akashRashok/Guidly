import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  
  // If authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <span className="text-xl font-semibold text-slate-800">Guidly</span>
        </div>
        <Link
          href="/login"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          Teacher Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-slate-800 mb-6 leading-tight">
            Help students understand{" "}
            <span className="text-emerald-600">why</span> they got it wrong
          </h1>
          <p className="text-xl text-slate-600 mb-10">
            A simple homework feedback tool that identifies misconceptions and helps 
            students learn from their mistakes. No complex dashboards, no gamification — 
            just clear, focused feedback.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-3 rounded-lg transition-colors text-lg"
            >
              Get Started as a Teacher
            </Link>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">1</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Create an assignment
            </h3>
            <p className="text-slate-600">
              Select a topic, add questions, and share a link with your students. 
              No complex setup required.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">2</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Students get targeted feedback
            </h3>
            <p className="text-slate-600">
              When a student answers incorrectly, they receive an explanation of their 
              misconception and a follow-up question.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">3</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              See what to re-teach
            </h3>
            <p className="text-slate-600">
              View a simple summary of the most common misconceptions so you know 
              exactly what to focus on in your next lesson.
            </p>
          </div>
        </div>

        {/* Key Points */}
        <div className="mt-24 bg-slate-800 rounded-2xl p-10 text-white">
          <h2 className="text-2xl font-semibold mb-8 text-center">
            Built for learning clarity, not metrics
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No student accounts or logins required</span>
            </div>
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>One topic per assignment — stay focused</span>
            </div>
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Feedback only when answers are incorrect</span>
            </div>
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No complex dashboards or analytics</span>
            </div>
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Student data scoped to single assignments</span>
            </div>
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>AI used conservatively for explanations</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-10 mt-10 border-t border-slate-200">
        <p className="text-center text-slate-500 text-sm">
          Guidly — Homework feedback that helps students learn
        </p>
      </footer>
    </div>
  );
}
