import { nanoid } from "nanoid";

/**
 * Generate a URL-safe random string for assignment links
 * @returns A 7-character alphanumeric string
 */
export function generateLinkSlug(): string {
  return nanoid(7).toLowerCase();
}

/**
 * Generate a short class code for students to enter
 * @returns A 4-character uppercase alphanumeric string
 */
export function generateClassCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing characters
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Normalize a student answer for comparison
 * - Trims whitespace
 * - Converts to lowercase
 * - Removes extra spaces
 */
export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Check if a student answer matches the correct answer
 * Handles common variations in formatting
 */
export function checkAnswer(studentAnswer: string, correctAnswer: string): boolean {
  const normalizedStudent = normalizeAnswer(studentAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);
  
  // Direct match
  if (normalizedStudent === normalizedCorrect) {
    return true;
  }
  
  // Handle fraction equivalents (basic cases)
  if (correctAnswer.includes("/")) {
    // Try to normalize fractions
    const studentFraction = parseFraction(normalizedStudent);
    const correctFraction = parseFraction(normalizedCorrect);
    
    if (studentFraction && correctFraction) {
      return Math.abs(studentFraction - correctFraction) < 0.0001;
    }
  }
  
  // Handle numeric answers with different formatting
  const studentNum = parseFloat(normalizedStudent.replace(/[£$%,]/g, ""));
  const correctNum = parseFloat(normalizedCorrect.replace(/[£$%,]/g, ""));
  
  if (!isNaN(studentNum) && !isNaN(correctNum)) {
    return Math.abs(studentNum - correctNum) < 0.0001;
  }
  
  return false;
}

/**
 * Parse a fraction string to a decimal
 */
function parseFraction(str: string): number | null {
  // Handle mixed numbers like "1 1/2"
  const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den !== 0) {
      return whole + num / den;
    }
  }
  
  // Handle simple fractions like "3/4"
  const fractionMatch = str.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    if (den !== 0) {
      return num / den;
    }
  }
  
  // Try parsing as decimal
  const decimal = parseFloat(str);
  if (!isNaN(decimal)) {
    return decimal;
  }
  
  return null;
}

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Get the base URL for the application
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  return "http://localhost:3000";
}

/**
 * Create a shareable homework link
 */
export function getHomeworkLink(linkSlug: string): string {
  return `${getBaseUrl()}/homework/${linkSlug}`;
}

