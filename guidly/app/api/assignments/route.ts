import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, assignments, questions } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateLinkSlug, generateClassCode } from "@/lib/utils";

// GET /api/assignments - List all assignments for the authenticated teacher
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherAssignments = await db
      .select()
      .from(assignments)
      .where(eq(assignments.teacherId, session.user.id))
      .orderBy(desc(assignments.createdAt));

    return NextResponse.json({ assignments: teacherAssignments });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

// POST /api/assignments - Create a new assignment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, topic, questions: questionList } = body;

    // Validate input
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    if (!Array.isArray(questionList) || questionList.length === 0) {
      return NextResponse.json(
        { error: "At least one question is required" },
        { status: 400 }
      );
    }

    // Validate each question
    for (const q of questionList) {
      if (!q.questionText || !q.correctAnswer) {
        return NextResponse.json(
          { error: "Each question must have text and a correct answer" },
          { status: 400 }
        );
      }
    }

    // Create assignment
    const assignmentId = nanoid();
    const linkSlug = generateLinkSlug();
    const classCode = generateClassCode();

    await db.insert(assignments).values({
      id: assignmentId,
      teacherId: session.user.id,
      title: title.trim(),
      topic,
      linkSlug,
      classCode,
      isClosed: false,
      createdAt: new Date(),
    });

    // Create questions
    const questionValues = questionList.map((q: {
      questionText: string;
      correctAnswer: string;
      questionType?: string;
      order: number;
    }) => ({
      id: nanoid(),
      assignmentId,
      questionText: q.questionText.trim(),
      correctAnswer: q.correctAnswer.trim(),
      questionType: q.questionType || "short_answer",
      order: q.order,
    }));

    await db.insert(questions).values(questionValues);

    return NextResponse.json({
      assignmentId,
      linkSlug,
      classCode,
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}


