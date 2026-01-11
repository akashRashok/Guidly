import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, misconceptions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { suggestMisconceptions } from "@/lib/ai";

/**
 * POST /api/misconceptions/suggest
 * Suggest relevant misconceptions for a question based on topic
 * Uses AI to identify which misconceptions are most likely to apply
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { topic, questionText } = body;

    if (!topic || !questionText) {
      return NextResponse.json(
        { error: "Topic and question text are required" },
        { status: 400 }
      );
    }

    // Get existing misconceptions for this topic
    const topicMisconceptions = await db
      .select()
      .from(misconceptions)
      .where(eq(misconceptions.topic, topic));

    // Also get general misconceptions as fallback
    const generalMisconceptions = await db
      .select()
      .from(misconceptions)
      .where(eq(misconceptions.topic, "general"));

    const allMisconceptions = [...topicMisconceptions, ...generalMisconceptions];

    if (allMisconceptions.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Use AI to suggest the most relevant misconceptions
    const suggestions = await suggestMisconceptions(
      topic,
      questionText,
      allMisconceptions.map((m) => ({
        category: m.category,
        description: m.description,
      }))
    );

    return NextResponse.json({
      suggestions: suggestions.map((s) => ({
        category: s.category,
        description: s.description,
      })),
    });
  } catch (error) {
    console.error("Error suggesting misconceptions:", error);
    return NextResponse.json(
      { error: "Failed to suggest misconceptions" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/misconceptions/suggest?topic=xxx
 * Get all misconceptions for a topic (without AI suggestion)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic");

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    // Get misconceptions for this topic
    const topicMisconceptions = await db
      .select()
      .from(misconceptions)
      .where(eq(misconceptions.topic, topic));

    return NextResponse.json({
      misconceptions: topicMisconceptions.map((m) => ({
        id: m.id,
        category: m.category,
        description: m.description,
        teachingSuggestion: m.teachingSuggestion,
      })),
    });
  } catch (error) {
    console.error("Error fetching misconceptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch misconceptions" },
      { status: 500 }
    );
  }
}

