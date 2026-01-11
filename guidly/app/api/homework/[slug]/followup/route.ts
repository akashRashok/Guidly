import { NextRequest, NextResponse } from "next/server";
import { db, studentSessions, studentResponses } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { checkAnswer } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// POST /api/homework/[slug]/followup - Submit follow-up answer
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { sessionId, questionId, followUpAnswer } = body;

    // Validate input
    if (!sessionId || !questionId || !followUpAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify session exists
    const session = await db
      .select()
      .from(studentSessions)
      .where(eq(studentSessions.id, sessionId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Find the most recent response for this question
    const response = await db
      .select()
      .from(studentResponses)
      .where(
        and(
          eq(studentResponses.sessionId, sessionId),
          eq(studentResponses.questionId, questionId)
        )
      )
      .orderBy(desc(studentResponses.answeredAt))
      .limit(1)
      .then((rows) => rows[0]);

    if (!response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    // For MVP, we just mark that they answered the follow-up
    // A more complete implementation would validate the follow-up answer
    await db
      .update(studentResponses)
      .set({
        followUpAnswer: followUpAnswer.trim(),
        followUpCorrect: true, // Simplified for MVP - assume they learned from feedback
      })
      .where(eq(studentResponses.id, response.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting follow-up:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}

