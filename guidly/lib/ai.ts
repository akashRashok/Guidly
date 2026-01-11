/**
 * AI Module - Backward Compatibility Layer
 * 
 * This module re-exports functions from llmService.ts for backward compatibility.
 * All AI calls now use Ollama instead of OpenAI.
 * 
 * The system functions fully with AI disabled - static fallbacks are used.
 */

// Re-export all types and functions from llmService
export type {
  ExplanationRequest,
  ExplanationResponse,
  MisconceptionMapRequest,
  TeacherSummaryData,
} from "./llmService";

export {
  generateExplanation,
  generateTeacherSummary,
  mapMisconception,
  suggestMisconceptions,
  generateFollowUpQuestion,
  isOllamaAvailable,
} from "./llmService";
