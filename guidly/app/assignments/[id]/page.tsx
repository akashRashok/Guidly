import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db, assignments, questions, studentSessions, studentResponses, misconceptions } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { generateTeacherSummary } from "@/lib/ai";
import { AssignmentDetailClient } from "./AssignmentDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssignmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch assignment with ownership check
  const assignment = await db
    .select()
    .from(assignments)
    .where(
      and(
        eq(assignments.id, id),
        eq(assignments.teacherId, session.user.id)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!assignment) {
    notFound();
  }

  // Fetch questions
  const assignmentQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.assignmentId, id))
    .orderBy(questions.order);

  // Fetch student sessions
  const sessions = await db
    .select()
    .from(studentSessions)
    .where(eq(studentSessions.assignmentId, id))
    .orderBy(desc(studentSessions.startedAt));

  // Fetch all responses with misconception data
  const responses = await db
    .select({
      response: studentResponses,
      misconception: misconceptions,
      session: studentSessions,
    })
    .from(studentResponses)
    .innerJoin(studentSessions, eq(studentResponses.sessionId, studentSessions.id))
    .leftJoin(misconceptions, eq(studentResponses.misconceptionId, misconceptions.id))
    .where(eq(studentSessions.assignmentId, id));

  // Calculate misconception statistics
  const misconceptionStats = new Map<string, {
    category: string;
    description: string;
    count: number;
    examples: string[];
  }>();

  for (const r of responses) {
    if (!r.response.isCorrect && r.misconception) {
      const key = r.misconception.id;
      const existing = misconceptionStats.get(key);
      
      if (existing) {
        existing.count++;
        if (existing.examples.length < 3) {
          existing.examples.push(r.response.answer);
        }
      } else {
        misconceptionStats.set(key, {
          category: r.misconception.category,
          description: r.misconception.description,
          count: 1,
          examples: [r.response.answer],
        });
      }
    }
  }

  // Sort by count and get top misconceptions
  const topMisconceptions = Array.from(misconceptionStats.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Generate AI summary if there are misconceptions
  let aiSummary = "";
  if (topMisconceptions.length > 0) {
    aiSummary = await generateTeacherSummary(topMisconceptions);
  }

  // Calculate stats
  const totalStudents = sessions.length;
  const completedStudents = sessions.filter((s) => s.completedAt).length;
  const totalResponses = responses.length;
  const correctResponses = responses.filter((r) => r.response.isCorrect).length;
  const accuracy = totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0;

  // Transform data for client component
  const clientResponses = responses.map((r) => ({
    sessionId: r.session.id,
    isCorrect: r.response.isCorrect,
  }));

  return (
    <AssignmentDetailClient
      assignment={assignment}
      questions={assignmentQuestions}
      sessions={sessions}
      responses={clientResponses}
      topMisconceptions={topMisconceptions}
      aiSummary={aiSummary}
      stats={{
        totalStudents,
        completedStudents,
        totalResponses,
        correctResponses,
        accuracy,
      }}
      userEmail={session.user.email || ""}
      userName={session.user.name}
      userImage={session.user.image}
    />
  );
}
