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

interface GeneratedQuestion {
  id: string;
  questionText: string;
  correctAnswer: string;
  confidence: "high" | "medium" | "low";
  selected: boolean;
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

  // Document upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showAISection, setShowAISection] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setUploadError("");
    setGeneratedQuestions([]);
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("topic", topic);

      const response = await fetch("/api/upload/extract-questions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to extract questions");
      }

      const { questions: extractedQuestions } = await response.json();

      const questionsWithSelection = extractedQuestions.map((q: any) => ({
        id: crypto.randomUUID(),
        ...q,
        selected: true, // Select all by default
      }));

      setGeneratedQuestions(questionsWithSelection);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to process document");
      setUploadedFile(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuestionSelection = (id: string) => {
    setGeneratedQuestions(generatedQuestions.map(q =>
      q.id === id ? { ...q, selected: !q.selected } : q
    ));
  };

  const addSelectedQuestions = () => {
    const selectedQs = generatedQuestions
      .filter(q => q.selected)
      .map(q => ({
        id: crypto.randomUUID(),
        questionText: q.questionText,
        correctAnswer: q.correctAnswer,
        questionType: "short_answer" as const,
      }));

    setQuestions([...questions, ...selectedQs]);

    // Unselect added questions but keep them in the list
    setGeneratedQuestions(generatedQuestions.map(q => ({
      ...q,
      selected: false
    })));
  };

  const removeGeneratedQuestion = (id: string) => {
    setGeneratedQuestions(generatedQuestions.filter(q => q.id !== id));
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
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          {/* <Link
            href="/dashboard"
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white bg-slate-50 rounded-xl transition-all shadow-sm border border-slate-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link> */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Assignment</h1>
            <p className="text-slate-500 mt-1 text-lg">Design a new learning activity for your students</p>
          </div>
          {/* Actions */}
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Create Assignment</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 pb-12">
        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Assignment Details */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-6">Assignment Details</h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Week 3 Fractions Practice"
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow"
                />
                <p className="mt-1.5 text-xs text-slate-500">A clear, descriptive name for this assignment</p>
              </div>

              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Topic <span className="text-red-500">*</span>
                </label>
                <select
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow bg-white"
                >
                  <option value="">Select a topic...</option>
                  {availableTopics.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-500">Choose the subject area for this assignment</p>
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

              {/* AI Document Upload Section */}
              {topic && (
                <div className="pt-5 border-t border-slate-200 mt-5">
                  <button
                    type="button"
                    onClick={() => setShowAISection(!showAISection)}
                    className="flex items-center gap-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors group"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform text-slate-400 group-hover:text-slate-600 ${showAISection ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>AI Question Generator</span>
                    <span className="ml-1.5 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">AI</span>
                  </button>

                  {showAISection && (
                    <div className="mt-4 p-5 bg-gradient-to-br from-purple-50/50 to-sky-50/50 rounded-lg border border-purple-100/60">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium text-slate-700">Upload Study Materials</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Upload a document (.txt, .docx) and AI will generate relevant questions
                          </p>
                        </div>
                        {uploadedFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFile(null);
                              setGeneratedQuestions([]);
                            }}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {!generatedQuestions.length && !isGenerating && (
                        <div className="border-2 border-dashed border-purple-200 hover:border-purple-300 rounded-lg p-8 text-center hover:bg-purple-50/30 transition-all cursor-pointer group">
                          <input
                            type="file"
                            accept=".txt,.docx"
                            onChange={handleFileUpload}
                            disabled={isGenerating}
                            className="hidden"
                            id="file-upload"
                          />
                          <label htmlFor="file-upload" className="cursor-pointer block">
                            <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-slate-700 mb-1">
                              Click to upload document
                            </p>
                            <p className="text-xs text-slate-500">
                              Supports .txt and .docx files
                            </p>
                          </label>
                        </div>
                      )}

                      {isGenerating && (
                        <div className="mt-4 p-6 bg-white/80 rounded-xl border border-sky-100 shadow-sm flex flex-col items-center justify-center gap-4 text-center">
                          <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-4 border-sky-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">Analyzing Document</h4>
                            <p className="text-xs text-slate-500 mt-1">Generating relevant questions for {topic}...</p>
                          </div>
                        </div>
                      )}

                      {uploadError && (
                        <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200 text-sm text-red-700">
                          {uploadError}
                        </div>
                      )}

                      {generatedQuestions.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-emerald-800 flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Generated {generatedQuestions.length} questions
                            </span>
                            <button
                              type="button"
                              onClick={addSelectedQuestions}
                              disabled={!generatedQuestions.some(q => q.selected)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                              Add Selected ({generatedQuestions.filter(q => q.selected).length})
                            </button>
                          </div>
                          <div className="space-y-3">
                            {generatedQuestions.map((q, i) => (
                              <div
                                key={q.id}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 ${q.selected
                                  ? "bg-white border-emerald-400 shadow-sm"
                                  : "bg-emerald-50/30 border-emerald-100 opacity-75 hover:opacity-100 hover:border-emerald-200"
                                  }`}
                              >
                                <div className="flex items-start gap-3 w-full">
                                  <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                                    <div className="relative flex items-center justify-center mt-0.5">
                                      <input
                                        type="checkbox"
                                        checked={q.selected}
                                        onChange={() => toggleQuestionSelection(q.id)}
                                        className="w-5 h-5 text-emerald-600 border-2 border-emerald-300 rounded focus:ring-emerald-500 cursor-pointer transition-all"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-2">
                                        <span className="text-xs font-black text-emerald-800/60 bg-emerald-100/50 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">#{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-slate-800 break-words leading-relaxed">{q.questionText}</p>
                                          <div className="mt-2 flex items-start gap-2 text-sm text-slate-600 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                                            <span className="font-bold text-emerald-700 text-xs uppercase tracking-wide mt-0.5">Answer:</span>
                                            <span className="leading-snug">{q.correctAnswer}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => removeGeneratedQuestion(q.id)}
                                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                                    title="Remove suggestion"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Questions */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-slate-900">Questions</h2>
              <div className="flex gap-2">
                {topic && questionTemplates[topic] && (
                  <button
                    type="button"
                    onClick={() => setShowTemplates(true)}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200 hover:bg-sky-100 transition-colors"
                  >
                    📝 Use Templates
                  </button>
                )}
              </div>
            </div>

            {/* Template Modal */}
            {showTemplates && topic && questionTemplates[topic] && (
              <div className="mb-6 p-5 bg-amber-50/50 rounded-xl border border-amber-200/60 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-amber-800">
                    Available templates for {topic}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTemplates(false)}
                    className="text-amber-600 hover:text-amber-700 p-1 rounded-full hover:bg-amber-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <ul className="text-sm text-amber-700 mb-4 space-y-2">
                  {questionTemplates[topic].map((t, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-amber-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      <span className="leading-relaxed">{t.question}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={addTemplateQuestions}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                >
                  Add All Templates
                </button>
              </div>
            )}

            {questions.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">No questions yet</h3>
                <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
                  Add questions manually or use the AI Question Generator to get started
                </p>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-sm transition-all shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add First Question
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-sky-300 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-3">
                        <span className="cursor-move text-slate-300 hover:text-slate-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </span>
                        <span className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 text-xs font-bold border border-slate-200">
                          {index + 1}
                        </span>
                        Question {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                        title="Delete Question"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Question Text</label>
                        <input
                          type="text"
                          value={question.questionText}
                          onChange={(e) =>
                            updateQuestion(question.id, "questionText", e.target.value)
                          }
                          placeholder="Type your question here..."
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Correct Answer</label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={question.correctAnswer}
                            onChange={(e) =>
                              updateQuestion(question.id, "correctAnswer", e.target.value)
                            }
                            placeholder="Type the correct answer..."
                            className="w-full pl-10 pr-3 py-2.5 bg-emerald-50/30 border border-emerald-200 rounded-lg text-emerald-900 placeholder-emerald-700/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-emerald-50/50 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addQuestion}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/50 transition-all font-bold flex items-center justify-center gap-2 group"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-sky-100 text-slate-400 group-hover:text-sky-500 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
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


        </div>
      </form>
    </TeacherLayout >
  );
}

