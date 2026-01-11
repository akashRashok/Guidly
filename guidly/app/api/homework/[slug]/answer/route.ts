import { NextRequest, NextResponse } from "next/server";
import { db, assignments, questions, studentSessions, studentResponses, misconceptions, questionMisconceptions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { checkAnswer } from "@/lib/utils";
import { generateExplanation, mapMisconception } from "@/lib/ai";
import type { Misconception } from "@/lib/db/schema";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Try to find a misconception by deterministic pattern matching first
 * This uses the questionMisconceptions table if patterns are defined
 */
async function findMisconceptionByPattern(
  questionId: string,
  answer: string
): Promise<{
  misconception: Misconception;
  staticExplanation?: string;
  staticFollowUp?: { question: string; answer: string };
} | null> {
  // Get all question-misconception mappings for this question
  const mappings = await db
    .select({
      mapping: questionMisconceptions,
      misconception: misconceptions,
    })
    .from(questionMisconceptions)
    .innerJoin(misconceptions, eq(questionMisconceptions.misconceptionId, misconceptions.id))
    .where(eq(questionMisconceptions.questionId, questionId));

  if (mappings.length === 0) {
    return null;
  }

  // Try to match the answer against patterns
  const normalizedAnswer = answer.trim().toLowerCase();
  
  for (const { mapping, misconception } of mappings) {
    try {
      // Try regex match first
      const pattern = new RegExp(mapping.wrongAnswerPattern, "i");
      if (pattern.test(normalizedAnswer)) {
        return {
          misconception,
          staticExplanation: mapping.explanation || undefined,
          staticFollowUp: mapping.followUpQuestion && mapping.followUpAnswer
            ? { question: mapping.followUpQuestion, answer: mapping.followUpAnswer }
            : undefined,
        };
      }
    } catch {
      // If regex fails, try exact match
      if (mapping.wrongAnswerPattern.toLowerCase() === normalizedAnswer) {
        return {
          misconception,
          staticExplanation: mapping.explanation || undefined,
          staticFollowUp: mapping.followUpQuestion && mapping.followUpAnswer
            ? { question: mapping.followUpQuestion, answer: mapping.followUpAnswer }
            : undefined,
        };
      }
    }
  }

  return null;
}

// POST /api/homework/[slug]/answer - Submit an answer
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { sessionId, questionId, answer } = body;

    // Validate input
    if (!sessionId || !questionId || !answer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify session exists and assignment is open
    const session = await db
      .select()
      .from(studentSessions)
      .where(eq(studentSessions.id, sessionId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get assignment
    const assignment = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, session.assignmentId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!assignment || assignment.isClosed) {
      return NextResponse.json({ error: "Assignment is closed" }, { status: 400 });
    }

    // Get question
    const question = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Check if answer is correct
    const isCorrect = checkAnswer(answer, question.correctAnswer);

    if (isCorrect) {
      // Save correct response
      await db.insert(studentResponses).values({
        id: nanoid(),
        sessionId,
        questionId,
        answer: answer.trim(),
        isCorrect: true,
        answeredAt: new Date(),
      });

      return NextResponse.json({ isCorrect: true });
    }

    // Answer is incorrect - find misconception using deterministic-first approach
    
    // Step 1: Try deterministic pattern matching first
    const patternMatch = await findMisconceptionByPattern(questionId, answer);
    
    let matchedMisconception: Misconception | undefined;
    let staticExplanation: string | undefined;
    let staticFollowUp: { question: string; answer: string } | undefined;

    if (patternMatch) {
      // Use the deterministically matched misconception
      matchedMisconception = patternMatch.misconception;
      staticExplanation = patternMatch.staticExplanation;
      staticFollowUp = patternMatch.staticFollowUp;
    } else {
      // Step 2: Get available misconceptions for this topic
      const topicMisconceptions = await db
        .select()
        .from(misconceptions)
        .where(eq(misconceptions.topic, assignment.topic));

      // Step 3: Try AI-powered misconception mapping if we have multiple options
      if (topicMisconceptions.length > 1) {
        const mappedId = await mapMisconception({
          question: question.questionText,
          correctAnswer: question.correctAnswer,
          studentAnswer: answer,
          topic: assignment.topic,
          availableMisconceptions: topicMisconceptions.map((m) => ({
            id: m.id,
            category: m.category,
            description: m.description,
          })),
        });

        if (mappedId) {
          matchedMisconception = topicMisconceptions.find((m) => m.id === mappedId);
        }
      }

      // Step 4: Fall back to first topic misconception
      if (!matchedMisconception && topicMisconceptions.length > 0) {
        matchedMisconception = topicMisconceptions[0];
      }

      // Step 5: Fall back to general misconceptions
      if (!matchedMisconception) {
        const generalMisconceptions = await db
          .select()
          .from(misconceptions)
          .where(eq(misconceptions.topic, "general"));
        
        matchedMisconception = generalMisconceptions[0];
      }
    }

    // Generate explanation using AI (or static fallback)
    // If we have a static explanation from pattern matching, use it preferentially
    let explanation;
    
    if (staticExplanation && staticFollowUp) {
      // Use entirely static response from pattern matching
      explanation = {
        explanation: staticExplanation,
        followUpQuestion: staticFollowUp.question,
        followUpAnswer: staticFollowUp.answer,
        confidence: "high" as const,
      };
    } else {
      // Use AI to generate or rephrase explanation
      explanation = await generateExplanation({
        question: question.questionText,
        correctAnswer: question.correctAnswer,
        studentAnswer: answer,
        topic: assignment.topic,
        misconceptionCategory: matchedMisconception?.category,
        misconceptionDescription: matchedMisconception?.description,
      });
    }

    // Save incorrect response
    await db.insert(studentResponses).values({
      id: nanoid(),
      sessionId,
      questionId,
      answer: answer.trim(),
      isCorrect: false,
      misconceptionId: matchedMisconception?.id || null,
      aiExplanation: explanation.explanation,
      answeredAt: new Date(),
    });

    return NextResponse.json({
      isCorrect: false,
      feedback: {
        explanation: explanation.explanation,
        followUpQuestion: explanation.followUpQuestion,
        followUpAnswer: explanation.followUpAnswer,
        misconceptionId: matchedMisconception?.id || null,
      },
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
