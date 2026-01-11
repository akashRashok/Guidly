"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TeacherLayout } from "@/components/layouts";
import { availableTopics, questionTemplates } from "@/lib/misconceptions";

interface QuestionInput {
  id: string;
  questionText: string;
  correctAnswer: string;
  questionType: string;
}

interface MisconceptionSuggestion {
  category: string;
  description: string;
}

interface NewAssignmentClientProps {
  userEmail: string;
  userName?: string | null;
  userImage?: string | null;
}

export function NewAssignmentClient({ userEmail, userName, userImage }: NewAssignmentClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Misconception suggestion state
  const [topicMisconceptions, setTopicMisconceptions] = useState<MisconceptionSuggestion[]>([]);
  const [showMisconceptions, setShowMisconceptions] = useState(false);
  const [loadingMisconceptions, setLoadingMisconceptions] = useState(false);

  // Load misconceptions when topic changes
  useEffect(() => {
    if (topic) {
      const fetchMisconceptions = async () => {
        setLoadingMisconceptions(true);
        try {
          const response = await fetch(`/api/misconceptions/suggest?topic=${encodeURIComponent(topic)}`);
          if (response.ok) {
            const data = await response.json();
            setTopicMisconceptions(data.misconceptions || []);
          }
        } catch (err) {
          console.error("Failed to load misconceptions:", err);
        } finally {
          setLoadingMisconceptions(false);
        }
      };
      fetchMisconceptions();
    } else {
      setTopicMisconceptions([]);
    }
  }, [topic]);

  const handleLogout = async () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/signout";
    document.body.appendChild(form);
    form.submit();
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        questionText: "",
        correctAnswer: "",
        questionType: "short_answer",
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof QuestionInput, value: string) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const addTemplateQuestions = () => {
    if (!topic || !questionTemplates[topic]) return;

    const templates = questionTemplates[topic];
    const newQuestions = templates.map((t) => ({
      id: crypto.randomUUID(),
      questionText: t.question,
      correctAnswer: t.correctAnswer,
      questionType: t.type,
    }));

    setQuestions([...questions, ...newQuestions]);
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter an assignment title");
      return;
    }

    if (!topic) {
      setError("Please select a topic");
      return;
    }

    if (questions.length === 0) {
      setError("Please add at least one question");
      return;
    }

    const invalidQuestions = questions.filter(
      (q) => !q.questionText.trim() || !q.correctAnswer.trim()
    );

    if (invalidQuestions.length > 0) {
      setError("Please fill in all question fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          topic,
          questions: questions.map((q, index) => ({
            questionText: q.questionText.trim(),
            correctAnswer: q.correctAnswer.trim(),
            questionType: q.questionType,
            order: index + 1,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create assignment");
      }

      const { assignmentId } = await response.json();
      router.push(`/assignments/${assignmentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TeacherLayout
      userEmail={userEmail}
      userName={userName}
      userImage={userImage}
      onLogout={handleLogout}
      showActivitySidebar={false}
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
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Create New Assignment</h1>
            <p className="text-slate-500 mt-0.5">Set up a new homework assignment for your students</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Assignment Details */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Assignment Details</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Week 3 Fractions Practice"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
              />
            </div>

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-2">
                Topic
              </label>
              <select
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
              >
                <option value="">Select a topic...</option>
                {availableTopics.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Misconception suggestions */}
            {topic && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowMisconceptions(!showMisconceptions)}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                >
                  <svg 
                    className={`w-4 h-4 transition-transform ${showMisconceptions ? "rotate-90" : ""}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium">Common misconceptions for {topic}</span>
                  {loadingMisconceptions && (
                    <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  )}
                </button>

                {showMisconceptions && topicMisconceptions.length > 0 && (
                  <div className="mt-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-xs text-amber-700 mb-3 font-medium">
                      Students often struggle with these concepts. Consider addressing them in your questions:
                    </p>
                    <div className="space-y-2">
                      {topicMisconceptions.map((m, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 text-xs font-medium flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-amber-800">{m.category}:</span>{" "}
                            <span className="text-amber-700 break-words leading-relaxed">{m.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showMisconceptions && topicMisconceptions.length === 0 && !loadingMisconceptions && (
                  <p className="mt-3 text-sm text-slate-500">
                    No predefined misconceptions for this topic yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Questions</h2>
            <div className="flex gap-2">
              {topic && questionTemplates[topic] && (
                <button
                  type="button"
                  onClick={() => setShowTemplates(true)}
                  className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  Use Templates
                </button>
              )}
            </div>
          </div>

          {/* Template Modal */}
          {showTemplates && topic && questionTemplates[topic] && (
            <div className="mb-6 p-4 bg-sky-50 rounded-xl border border-sky-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-sky-800">
                  Available templates for {topic}
                </span>
                <button
                  type="button"
                  onClick={() => setShowTemplates(false)}
                  className="text-sky-600 hover:text-sky-700 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ul className="text-sm text-sky-700 mb-3 space-y-1.5">
                {questionTemplates[topic].map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-sky-400 mt-0.5">•</span>
                    {t.question}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={addTemplateQuestions}
                className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Add All Templates
              </button>
            </div>
          )}

          {questions.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="mb-4 text-sm">No questions added yet</p>
              <button
                type="button"
                onClick={addQuestion}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Add First Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                      <span className="w-6 h-6 bg-sky-100 rounded-lg flex items-center justify-center text-sky-700 text-xs">
                        {index + 1}
                      </span>
                      Question {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-500 hover:text-red-600 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1.5">
                        Question
                      </label>
                      <input
                        type="text"
                        value={question.questionText}
                        onChange={(e) =>
                          updateQuestion(question.id, "questionText", e.target.value)
                        }
                        placeholder="Enter your question..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1.5">
                        Correct Answer
                      </label>
                      <input
                        type="text"
                        value={question.correctAnswer}
                        onChange={(e) =>
                          updateQuestion(question.id, "correctAnswer", e.target.value)
                        }
                        placeholder="Enter the correct answer..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addQuestion}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-sky-400 hover:text-sky-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Another Question
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              "Create Assignment"
            )}
          </button>
        </div>
      </form>
    </TeacherLayout>
  );
}

