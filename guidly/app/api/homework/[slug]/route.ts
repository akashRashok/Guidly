import { NextRequest, NextResponse } from "next/server";
import { db, assignments, questions } from "@/lib/db";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/homework/[slug] - Get assignment info for students
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Find assignment by link slug
    const assignment = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        topic: assignments.topic,
        classCode: assignments.classCode,
        isClosed: assignments.isClosed,
      })
      .from(assignments)
      .where(eq(assignments.linkSlug, slug))
      .limit(1)
      .then((rows) => rows[0]);

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.isClosed) {
      return NextResponse.json({
        isClosed: true,
        assignment: {
          title: assignment.title,
        },
      });
    }

    // Get questions (without answers)
    const assignmentQuestions = await db
      .select({
        id: questions.id,
        questionText: questions.questionText,
        questionType: questions.questionType,
        order: questions.order,
      })
      .from(questions)
      .where(eq(questions.assignmentId, assignment.id))
      .orderBy(questions.order);

    return NextResponse.json({
      isClosed: false,
      assignment: {
        id: assignment.id,
        title: assignment.title,
        topic: assignment.topic,
      },
      questions: assignmentQuestions,
    });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Failed to load assignment" },
      { status: 500 }
    );
  }
}

