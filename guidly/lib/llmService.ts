/**
 * LLM Service - Ollama Integration
 * 
 * Encapsulates all LLM calls in a single service module.
 * Uses Ollama as the inference runtime with conservative generation parameters.
 * All methods include static fallbacks - AI is a fallback, not a dependency.
 */

// Configuration with sensible defaults
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";
const OLLAMA_ENABLED = process.env.OLLAMA_ENABLED !== "false";
// Increased timeout for first request (model loading can take 30+ seconds)
const OLLAMA_TIMEOUT_MS = 60000; // 60 seconds

// Types
export interface ExplanationRequest {
  question: string;
  correctAnswer: string;
  studentAnswer: string;
  topic: string;
  misconceptionCategory?: string;
  misconceptionDescription?: string;
}

export interface ExplanationResponse {
  explanation: string;
  followUpQuestion: string;
  followUpAnswer: string;
  confidence: "high" | "medium" | "low";
}

export interface MisconceptionMapRequest {
  question: string;
  correctAnswer: string;
  studentAnswer: string;
  topic: string;
  availableMisconceptions: Array<{
    id: string;
    category: string;
    description: string;
  }>;
}

export interface TeacherSummaryData {
  category: string;
  description: string;
  count: number;
  examples: string[];
}

interface OllamaResponse {
  response: string;
  done: boolean;
}

/**
 * Call Ollama API with conservative parameters
 */
async function callOllama(prompt: string, maxTokens: number = 200): Promise<string | null> {
  if (!OLLAMA_ENABLED) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        options: {
          temperature: 0.5,          // Increased from 0.2 for faster inference
          top_p: 0.9,
          num_predict: maxTokens,
          num_ctx: 2048,             // Reduced context window for speed
        },
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Ollama API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as OllamaResponse;
    const responseText = data.response?.trim();

    if (!responseText) {
      console.warn("Ollama returned empty response");
      return null;
    }

    return responseText;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Ollama request timed out after ${OLLAMA_TIMEOUT_MS}ms`);
    } else {
      console.error("Ollama request failed:", error);
    }
    return null;
  }
}

/**
 * Parse JSON from LLM response, handling common formatting issues
 */
function parseJsonResponse<T>(response: string): T | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate a misconception explanation for a student
 * Uses conservative prompting - does not invent pedagogy
 */
export async function generateExplanation(
  request: ExplanationRequest
): Promise<ExplanationResponse> {
  // Try static fallback first if we have a misconception description
  if (request.misconceptionDescription) {
    const staticResponse = getStaticFallback(request);

    // Use AI to generate both explanation and follow-up question
    const aiPrompt = `You are helping a secondary school student understand their mistake and how to solve it correctly.

Question: ${request.question}
Correct answer: ${request.correctAnswer}
Student's wrong answer: ${request.studentAnswer}
Topic: ${request.topic}
Misconception: ${request.misconceptionDescription}

In 1-2 sentences (under 50 words), explain:
1. What they did wrong (the misconception)
2. How to solve it correctly (the right approach)

Be encouraging and instructional.

Respond in this exact JSON format:
{
  "explanation": "What went wrong + how to solve it correctly (1-2 sentences, under 50 words)",
  "followUpQuestion": "A simpler question to check understanding",
  "followUpAnswer": "The correct answer to the follow-up"
}`;

    const aiResponse = await callOllama(aiPrompt, 500);

    if (aiResponse) {
      const parsed = parseJsonResponse<{
        explanation: string;
        followUpQuestion: string;
        followUpAnswer: string;
      }>(aiResponse);

      if (parsed?.explanation && parsed?.followUpQuestion && parsed?.followUpAnswer) {
        return {
          explanation: parsed.explanation,
          followUpQuestion: parsed.followUpQuestion,
          followUpAnswer: parsed.followUpAnswer,
          confidence: "medium",
        };
      }
    }

    // If AI fails, try just rephrasing the explanation
    const rephrasePrompt = `In 1-2 simple sentences for a secondary school student, explain what went wrong and how to solve it correctly. Keep it under 50 words.

Misconception: ${request.misconceptionDescription}
Student answer: ${request.studentAnswer}
Correct answer: ${request.correctAnswer}

Write ONLY the explanation (what's wrong + how to fix it), no JSON or extra text.`;

    const rephrased = await callOllama(rephrasePrompt, 200);

    if (rephrased && rephrased.length > 20) {
      // Generate follow-up question separately
      const followUpPrompt = `Create ONE simple follow-up question.

Original question: ${request.question}
Correct answer: ${request.correctAnswer}
Misconception: ${request.misconceptionDescription}

Format:
Question: [simpler question]
Answer: [correct answer]`;

      const followUpResponse = await callOllama(followUpPrompt, 200);

      if (followUpResponse) {
        const questionMatch = followUpResponse.match(/Question:\s*(.+?)(?:\n|Answer:)/i);
        const answerMatch = followUpResponse.match(/Answer:\s*(.+?)(?:\n|$)/i);

        if (questionMatch && answerMatch) {
          return {
            explanation: rephrased,
            followUpQuestion: questionMatch[1].trim(),
            followUpAnswer: answerMatch[1].trim(),
            confidence: "medium",
          };
        }
      }

      // If follow-up generation fails, use rephrased explanation with static follow-up
      return {
        ...staticResponse,
        explanation: rephrased,
        confidence: "medium",
      };
    }

    return staticResponse;
  }

  // No static misconception available - try AI
  const prompt = `Help a secondary school student understand their mistake and how to solve it correctly.

Question: ${request.question}
Correct answer: ${request.correctAnswer}
Student's answer: ${request.studentAnswer}
Topic: ${request.topic}

In 1-2 sentences (under 50 words), explain:
1. What they did wrong
2. How to solve it correctly (the right method/approach)

Be encouraging and instructional.

Respond in this exact JSON format:
{
  "explanation": "What went wrong + how to solve it correctly (1-2 sentences, under 50 words)",
  "followUpQuestion": "A simpler question to check understanding",
  "followUpAnswer": "The correct answer to the follow-up"
}`;

  const response = await callOllama(prompt, 500);

  if (response) {
    const parsed = parseJsonResponse<{
      explanation: string;
      followUpQuestion: string;
      followUpAnswer: string;
    }>(response);

    if (parsed?.explanation && parsed?.followUpQuestion && parsed?.followUpAnswer) {
      return {
        explanation: parsed.explanation,
        followUpQuestion: parsed.followUpQuestion,
        followUpAnswer: parsed.followUpAnswer,
        confidence: "medium",
      };
    }
  }

  // Fall back to generic response
  return getStaticFallback(request);
}

/**
 * Static fallback explanations when AI is unavailable or uncertain
 */
function getStaticFallback(request: ExplanationRequest): ExplanationResponse {
  if (request.misconceptionDescription) {
    return {
      explanation: `Your answer "${request.studentAnswer}" isn't correct because ${request.misconceptionDescription.toLowerCase()}. To solve this correctly, you need to use the right approach, which gives us ${request.correctAnswer}.`,
      followUpQuestion: `Can you try a similar question using the correct method?`,
      followUpAnswer: request.correctAnswer,
      confidence: "medium",
    };
  }

  return {
    explanation: `Your answer "${request.studentAnswer}" isn't correct. The right answer is ${request.correctAnswer}. To solve this, you need to apply the correct method for ${request.topic}.`,
    followUpQuestion: `Let's try again using the correct approach: what is the answer?`,
    followUpAnswer: request.correctAnswer,
    confidence: "low",
  };
}

/**
 * Generate a teacher summary of misconceptions
 * Uses conservative prompting - does not suggest lesson plans
 */
export async function generateTeacherSummary(
  misconceptionData: TeacherSummaryData[]
): Promise<string> {
  if (misconceptionData.length === 0) {
    return "No misconceptions identified in this assignment. Students performed well overall.";
  }

  const prompt = `Summarize the most common misconception in ONE sentence. Be factual and brief.

Data:
${misconceptionData.map((m) => `- ${m.category}: ${m.description} (${m.count} students)`).join("\n")}

Summary (one sentence):`;

  const response = await callOllama(prompt, 150);

  if (response && response.length > 10 && response.length < 500) {
    // Clean up the response - remove any leading/trailing quotes or formatting
    return response.replace(/^["']|["']$/g, "").trim();
  }

  return generateStaticSummary(misconceptionData);
}

/**
 * Static fallback for teacher summary
 */
function generateStaticSummary(
  misconceptionData: TeacherSummaryData[]
): string {
  if (misconceptionData.length === 0) {
    return "No misconceptions identified in this assignment. Students performed well overall.";
  }

  const top = misconceptionData[0];
  return `The most common issue was "${top.category}" (${top.count} students). Consider revisiting ${top.description.toLowerCase()} in your next lesson.`;
}

/**
 * Map a wrong answer to a specific misconception
 * Uses deterministic-first approach - AI is fallback
 */
export async function mapMisconception(
  request: MisconceptionMapRequest
): Promise<string | null> {
  if (request.availableMisconceptions.length === 0) {
    return null;
  }

  // Build a simple prompt for misconception matching
  const misconceptionList = request.availableMisconceptions
    .map((m, i) => `${i + 1}. [${m.id}] ${m.category}: ${m.description}`)
    .join("\n");

  const prompt = `Match the student's error to a misconception.

Question: ${request.question}
Correct answer: ${request.correctAnswer}
Student's wrong answer: ${request.studentAnswer}

Misconceptions:
${misconceptionList}

Return ONLY the ID in brackets (e.g., [abc123]) or "none".`;

  const response = await callOllama(prompt, 50);

  if (response) {
    // Extract ID from response
    const idMatch = response.match(/\[([^\]]+)\]/);
    if (idMatch) {
      const matchedId = idMatch[1];
      // Verify the ID exists in our list
      if (request.availableMisconceptions.some((m) => m.id === matchedId)) {
        return matchedId;
      }
    }

    // Try to match by number
    const numMatch = response.match(/^(\d+)/);
    if (numMatch) {
      const index = parseInt(numMatch[1], 10) - 1;
      if (index >= 0 && index < request.availableMisconceptions.length) {
        return request.availableMisconceptions[index].id;
      }
    }
  }

  // Fall back to first misconception for the topic
  return null;
}

/**
 * Suggest relevant misconceptions for a topic during assignment setup
 */
export async function suggestMisconceptions(
  topic: string,
  questionText: string,
  existingMisconceptions: Array<{ category: string; description: string }>
): Promise<Array<{ category: string; description: string }>> {
  if (existingMisconceptions.length === 0) {
    return [];
  }

  const prompt = `Which misconceptions apply to this ${topic} question?

Question: ${questionText}

Misconceptions:
${existingMisconceptions.map((m, i) => `${i + 1}. ${m.category}: ${m.description}`).join("\n")}

Return 1-3 numbers (e.g., "1, 3"):`;

  const response = await callOllama(prompt, 30);

  if (response) {
    const numbers = response.match(/\d+/g);
    if (numbers) {
      const suggestions: Array<{ category: string; description: string }> = [];
      for (const num of numbers.slice(0, 3)) {
        const index = parseInt(num, 10) - 1;
        if (index >= 0 && index < existingMisconceptions.length) {
          suggestions.push(existingMisconceptions[index]);
        }
      }
      if (suggestions.length > 0) {
        return suggestions;
      }
    }
  }

  // Fall back to returning top 2 misconceptions
  return existingMisconceptions.slice(0, 2);
}

/**
 * Generate a constrained follow-up question
 */
export async function generateFollowUpQuestion(
  originalQuestion: string,
  correctAnswer: string,
  misconception: string,
  topic: string
): Promise<{ question: string; answer: string } | null> {
  const prompt = `Create ONE simple follow-up question.

Original: ${originalQuestion}
Correct answer: ${correctAnswer}
Misconception: ${misconception}

Format:
Question: [simpler question]
Answer: [correct answer]`;

  const response = await callOllama(prompt, 200);

  if (response) {
    const questionMatch = response.match(/Question:\s*(.+?)(?:\n|Answer:)/i);
    const answerMatch = response.match(/Answer:\s*(.+?)(?:\n|$)/i);

    if (questionMatch && answerMatch) {
      return {
        question: questionMatch[1].trim(),
        answer: answerMatch[1].trim(),
      };
    }
  }

  // Return null - caller should use static follow-up
  return null;
}

/**
 * Check if Ollama service is available
 */
export async function isOllamaAvailable(): Promise<boolean> {
  if (!OLLAMA_ENABLED) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${OLLAMA_API_URL}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate questions from document text
 * Used for document upload feature
 */
export async function generateQuestionsFromText(
  text: string,
  topic: string,
  numQuestions: number = 5
): Promise<Array<{
  questionText: string;
  correctAnswer: string;
  confidence: "high" | "medium" | "low";
}>> {
  // Limit text to 4000 characters to fit in context window
  const truncatedText = text.slice(0, 4000);

  const prompt = `You are helping a teacher create homework questions from a document.

DOCUMENT EXCERPT:
"""
${truncatedText}
"""

TOPIC: ${topic}

Generate ${numQuestions} questions based on this document. Each question should:
- Test understanding of key concepts from the document
- Be appropriate for secondary school students
- Have a clear, concise correct answer
- Be directly answerable from the document content

Respond ONLY with a valid JSON array. Do not wrap in markdown code blocks. Do not add any text before or after the JSON.

Expected format:
[
  {
    "questionText": "Question 1?",
    "correctAnswer": "Answer 1",
    "confidence": "high"
  }
]

Generate exactly ${numQuestions} questions now:`;

  const response = await callOllama(prompt, 1000);

  if (response) {
    try {
      // Clean up response: remove markdown code blocks and find array
      let cleanResponse = response.trim();

      // Remove markdown code blocks if present
      if (cleanResponse.includes("```")) {
        cleanResponse = cleanResponse.replace(/```json/g, "").replace(/```/g, "");
      }

      // Find the JSON array substring
      const startIndex = cleanResponse.indexOf("[");
      const endIndex = cleanResponse.lastIndexOf("]");

      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleanResponse = cleanResponse.slice(startIndex, endIndex + 1);
      } else {
        console.warn("Could not find JSON array in response");
        console.debug("Raw response:", response);
        return [];
      }

      // Parse JSON
      const parsed = JSON.parse(cleanResponse) as Array<{
        questionText: string;
        correctAnswer: string;
        confidence?: "high" | "medium" | "low";
      }>;

      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate and return questions
        const validQuestions = parsed
          .filter(q => q.questionText && q.correctAnswer)
          .slice(0, numQuestions)
          .map(q => ({
            questionText: q.questionText,
            correctAnswer: q.correctAnswer,
            confidence: (q.confidence || "medium") as "high" | "medium" | "low",
          }));

        if (validQuestions.length > 0) {
          return validQuestions;
        } else {
          console.warn("Parsed questions were invalid (missing text or answer)");
        }
      } else {
        console.warn("AI response was not a JSON array");
      }
    } catch (error) {
      console.error("Failed to parse AI response for questions:", error);
      console.debug("Raw AI response:", response);
    }
  } else {
    console.warn("Ollama returned null response for question generation");
  }

  // Fallback: return empty array
  return [];
}

