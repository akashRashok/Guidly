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
          temperature: 0.2,
          top_p: 0.9,
          num_predict: maxTokens,
        },
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("Ollama API error:", response.status, response.statusText);
      return null;
    }

    const data = (await response.json()) as OllamaResponse;
    return data.response?.trim() || null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Ollama request timed out");
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
    const aiPrompt = `You are helping a secondary school student understand why their answer is incorrect.

Question: ${request.question}
Correct answer: ${request.correctAnswer}
Student's wrong answer: ${request.studentAnswer}
Topic: ${request.topic}
Misconception: ${request.misconceptionDescription}

Provide:
1. A brief, clear explanation (2-3 sentences) of why the answer is wrong, referencing the misconception.
2. One simple follow-up question to check if they understand the correct concept.
3. The correct answer to the follow-up question.

Respond in this exact JSON format:
{
  "explanation": "Why the answer is wrong",
  "followUpQuestion": "A simpler question to check understanding",
  "followUpAnswer": "The correct answer to the follow-up"
}`;

    const aiResponse = await callOllama(aiPrompt, 300);
    
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
    const rephrasePrompt = `Given the following misconception description and student answer, rewrite the explanation in clear, neutral language suitable for a secondary school student.

Do not introduce new concepts.
Do not add teaching strategies.
Do not mention the model or AI.

Misconception description: ${request.misconceptionDescription}
Student answer: ${request.studentAnswer}
Correct answer: ${request.correctAnswer}

Respond with only the explanation text, no JSON or formatting.`;

    const rephrased = await callOllama(rephrasePrompt, 150);
    
    if (rephrased && rephrased.length > 20) {
      // Generate follow-up question separately
      const followUpPrompt = `Based on this question and misconception, create a simple follow-up question to check understanding.

Original question: ${request.question}
Correct answer: ${request.correctAnswer}
Misconception: ${request.misconceptionDescription}

Create ONE simpler question that tests the same concept. Keep it very simple.

Respond in this format:
Question: [your follow-up question]
Answer: [the correct answer]`;

      const followUpResponse = await callOllama(followUpPrompt, 100);
      
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
  const prompt = `You are helping a secondary school student understand why their answer is incorrect.

Question: ${request.question}
Correct answer: ${request.correctAnswer}
Student's answer: ${request.studentAnswer}
Topic: ${request.topic}

Provide a brief, clear explanation of why the answer is wrong. Keep it to 2-3 sentences. Be encouraging, not critical.

Then provide one simple follow-up question to check understanding.

Respond in this exact JSON format:
{
  "explanation": "Why the answer is wrong",
  "followUpQuestion": "A simpler question to check understanding",
  "followUpAnswer": "The correct answer to the follow-up"
}`;

  const response = await callOllama(prompt, 250);
  
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
      explanation: `Your answer "${request.studentAnswer}" isn't quite right. ${request.misconceptionDescription}. The correct answer is ${request.correctAnswer}.`,
      followUpQuestion: `Can you try a similar question? What would happen if you applied the correct approach?`,
      followUpAnswer: request.correctAnswer,
      confidence: "medium",
    };
  }

  return {
    explanation: `Your answer "${request.studentAnswer}" isn't correct. The right answer is ${request.correctAnswer}. Take a moment to think about the approach you used.`,
    followUpQuestion: `Let's try again: what is the correct answer to this question?`,
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

  const prompt = `Given the following list of misconception counts, produce a single-sentence summary describing the most common misunderstanding.

Do not suggest lesson plans.
Do not include advice.
Keep it factual and brief.

Data:
${misconceptionData.map((m) => `- ${m.category}: ${m.description} (${m.count} students)`).join("\n")}

Summary:`;

  const response = await callOllama(prompt, 100);
  
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

  const prompt = `Given a student's wrong answer, identify which misconception best explains their error.

Question: ${request.question}
Correct answer: ${request.correctAnswer}
Student's wrong answer: ${request.studentAnswer}
Topic: ${request.topic}

Available misconceptions:
${misconceptionList}

Return ONLY the misconception ID (the text in brackets like [abc123]) that best matches this error. If none match well, return "none".

Answer:`;

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

  const prompt = `For a ${topic} question, identify which of these common misconceptions might apply.

Question: ${questionText}

Common misconceptions for this topic:
${existingMisconceptions.map((m, i) => `${i + 1}. ${m.category}: ${m.description}`).join("\n")}

Return the numbers of the 1-3 most relevant misconceptions, separated by commas. Example: "1, 3"

Most relevant:`;

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
  const prompt = `Create a simpler follow-up question to check if a student understands their misconception.

Original question: ${originalQuestion}
Correct answer: ${correctAnswer}
Student's misconception: ${misconception}
Topic: ${topic}

Create ONE simpler question that tests the same concept. Keep it very simple.

Respond in this exact format:
Question: [your follow-up question]
Answer: [the correct answer]`;

  const response = await callOllama(prompt, 100);
  
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

