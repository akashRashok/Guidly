"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Question {
  id: string;
  questionText: string;
  order: number;
}

interface Assignment {
  id: string;
  title: string;
  topic: string;
  isClosed: boolean;
}

interface FeedbackData {
  explanation: string;
  followUpQuestion: string;
  followUpAnswer: string;
  misconceptionId: string | null;
}

type FlowState = 
  | "loading"
  | "entry"
  | "question"
  | "feedback"
  | "followup"
  | "complete"
  | "error"
  | "closed";

export default function HomeworkPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [error, setError] = useState("");
  
  // Entry state
  const [studentName, setStudentName] = useState("");
  const [classCode, setClassCode] = useState("");
  
  // Assignment data
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState("");
  
  // Question flow state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Feedback state
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  
  // Stats
  const [correctCount, setCorrectCount] = useState(0);

  // Load assignment on mount
  useEffect(() => {
    async function loadAssignment() {
      try {
        const response = await fetch(`/api/homework/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("This homework link is invalid or has expired.");
          } else {
            setError("Failed to load assignment.");
          }
          setFlowState("error");
          return;
        }

        const data = await response.json();
        
        if (data.isClosed) {
          setAssignment(data.assignment);
          setFlowState("closed");
          return;
        }

        setAssignment(data.assignment);
        setQuestions(data.questions);
        setFlowState("entry");
      } catch (err) {
        console.error("Error loading assignment:", err);
        setError("Failed to load assignment. Please try again.");
        setFlowState("error");
      }
    }

    loadAssignment();
  }, [slug]);

  // Handle student entry
  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/homework/${slug}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          classCode: classCode.trim().toUpperCase(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to start homework.");
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setFlowState("question");
    } catch (err) {
      console.error("Error starting homework:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle answer submission
  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answer.trim()) return;
    
    setIsSubmitting(true);
    setError("");

    try {
      const currentQuestion = questions[currentQuestionIndex];
      
      const response = await fetch(`/api/homework/${slug}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          answer: answer.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to submit answer.");
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();

      if (data.isCorrect) {
        setCorrectCount((c) => c + 1);
        moveToNextQuestion();
      } else {
        setFeedback(data.feedback);
        setFlowState("feedback");
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle follow-up submission
  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!followUpAnswer.trim()) return;
    
    setIsSubmitting(true);

    try {
      const currentQuestion = questions[currentQuestionIndex];
      
      const response = await fetch(`/api/homework/${slug}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          followUpAnswer: followUpAnswer.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to submit answer.");
        setIsSubmitting(false);
        return;
      }

      moveToNextQuestion();
    } catch (err) {
      console.error("Error submitting follow-up:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move to next question or complete
  const moveToNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex >= questions.length) {
      // Complete the session
      completeSession();
    } else {
      setCurrentQuestionIndex(nextIndex);
      setAnswer("");
      setFollowUpAnswer("");
      setFeedback(null);
      setFlowState("question");
    }
  };

  // Complete the session
  const completeSession = async () => {
    try {
      await fetch(`/api/homework/${slug}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch (err) {
      console.error("Error completing session:", err);
    }
    
    setFlowState("complete");
  };

  // Acknowledge feedback and move to follow-up
  const handleAcknowledgeFeedback = () => {
    setFlowState("followup");
  };

  // Render based on flow state
  if (flowState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 w-8 h-8" />
          <p className="text-slate-600">Loading homework...</p>
        </div>
      </div>
    );
  }

  if (flowState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Oops!</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (flowState === "closed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-amber-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Assignment Closed</h1>
          <p className="text-slate-600">
            This homework assignment has been closed by your teacher and is no longer accepting submissions.
          </p>
        </div>
      </div>
    );
  }

  if (flowState === "entry") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{assignment?.title}</h1>
            <p className="text-slate-600">Enter your details to begin</p>
          </div>

          <form onSubmit={handleEntry} className="bg-white rounded-2xl shadow-xl p-8">
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g., Sarah T"
                  required
                  className="input"
                  autoComplete="off"
                />
                <p className="text-xs text-slate-500 mt-1">
                  First name and last initial (e.g., Sarah T)
                </p>
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1">
                  Class Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="e.g., 7B2K"
                  required
                  maxLength={4}
                  className="input font-mono text-lg uppercase tracking-wider"
                  autoComplete="off"
                />
                <p className="text-xs text-slate-500 mt-1">
                  The 4-character code from your teacher
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !studentName.trim() || !classCode.trim()}
              className="w-full btn btn-primary py-3"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
                  Starting...
                </>
              ) : (
                "Start Homework"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (flowState === "question") {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{correctCount} correct so far</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <h2 className="text-2xl font-semibold text-slate-800 mb-8">
              {currentQuestion.questionText}
            </h2>

            <form onSubmit={handleAnswerSubmit}>
              <div className="mb-6">
                <label htmlFor="answer" className="block text-sm font-medium text-slate-700 mb-2">
                  Your Answer
                </label>
                <input
                  id="answer"
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="input text-lg"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !answer.trim()}
                className="w-full btn btn-primary py-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" />
                    Checking...
                  </>
                ) : (
                  "Submit Answer"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (flowState === "feedback" && feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Feedback Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Let&apos;s Think About This</h2>
            </div>

            <div className="bg-amber-50 rounded-lg p-4 mb-6">
              <p className="text-slate-700 leading-relaxed">{feedback.explanation}</p>
            </div>

            <button
              onClick={handleAcknowledgeFeedback}
              className="w-full btn btn-primary py-3"
            >
              I Understand — Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (flowState === "followup" && feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Follow-up Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Quick Check</h2>
            </div>

            <p className="text-lg text-slate-700 mb-6">{feedback.followUpQuestion}</p>

            <form onSubmit={handleFollowUpSubmit}>
              <div className="mb-6">
                <input
                  type="text"
                  value={followUpAnswer}
                  onChange={(e) => setFollowUpAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="input text-lg"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !followUpAnswer.trim()}
                className="w-full btn btn-primary py-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" />
                    Checking...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (flowState === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">All Done!</h1>
          <p className="text-slate-600 mb-6">
            Great work, {studentName}! You got {correctCount} out of {questions.length} questions correct on your first try.
          </p>
          <div className="text-sm text-slate-500">
            You can close this page now.
          </div>
        </div>
      </div>
    );
  }

  return null;
}


