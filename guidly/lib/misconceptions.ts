import { nanoid } from "nanoid";
import type { NewMisconception } from "./db/schema";

// Predefined misconceptions organized by topic
// These are curated, conservative, and cover common secondary school subjects

export const predefinedMisconceptions: NewMisconception[] = [
  // Mathematics - Fractions
  {
    id: nanoid(),
    topic: "fractions",
    category: "Adding fractions",
    description: "Adding numerators and denominators separately instead of finding a common denominator",
    teachingSuggestion: "Review the concept of equivalent fractions and why common denominators are needed for addition",
  },
  {
    id: nanoid(),
    topic: "fractions",
    category: "Comparing fractions",
    description: "Assuming larger denominators mean larger fractions",
    teachingSuggestion: "Use visual models like fraction bars to compare fractions with different denominators",
  },
  {
    id: nanoid(),
    topic: "fractions",
    category: "Multiplying fractions",
    description: "Trying to find common denominators when multiplying fractions",
    teachingSuggestion: "Demonstrate that multiplication of fractions is simply numerator times numerator over denominator times denominator",
  },

  // Mathematics - Algebra
  {
    id: nanoid(),
    topic: "algebra",
    category: "Variable understanding",
    description: "Treating variables as labels rather than unknown quantities",
    teachingSuggestion: "Use substitution exercises to reinforce that variables represent numbers",
  },
  {
    id: nanoid(),
    topic: "algebra",
    category: "Equation solving",
    description: "Performing operations on one side of the equation without balancing",
    teachingSuggestion: "Use a balance scale analogy to visualize maintaining equality",
  },
  {
    id: nanoid(),
    topic: "algebra",
    category: "Order of operations",
    description: "Performing operations left to right without considering BIDMAS/PEMDAS",
    teachingSuggestion: "Practice order of operations with clear step-by-step worked examples",
  },
  {
    id: nanoid(),
    topic: "algebra",
    category: "Negative numbers",
    description: "Confusing rules for adding and multiplying negative numbers",
    teachingSuggestion: "Use number lines and real-world contexts like temperature or debt",
  },

  // Mathematics - Percentages
  {
    id: nanoid(),
    topic: "percentages",
    category: "Percentage calculation",
    description: "Adding percentages directly without converting to the same base",
    teachingSuggestion: "Emphasize that percentages must be of the same whole to be added",
  },
  {
    id: nanoid(),
    topic: "percentages",
    category: "Percentage increase/decrease",
    description: "Subtracting the percentage value from the original number instead of calculating the actual decrease",
    teachingSuggestion: "Practice finding the percentage of a number first, then applying the change",
  },

  // Science - Forces
  {
    id: nanoid(),
    topic: "forces",
    category: "Newton's laws",
    description: "Believing that constant motion requires constant force",
    teachingSuggestion: "Demonstrate Newton's first law with friction-reduced examples",
  },
  {
    id: nanoid(),
    topic: "forces",
    category: "Action-reaction pairs",
    description: "Thinking action-reaction forces act on the same object",
    teachingSuggestion: "Use clear diagrams showing forces on different objects in an interaction",
  },

  // Science - Energy
  {
    id: nanoid(),
    topic: "energy",
    category: "Energy conservation",
    description: "Believing energy is used up rather than transferred",
    teachingSuggestion: "Trace energy through a system showing all transformations",
  },
  {
    id: nanoid(),
    topic: "energy",
    category: "Heat and temperature",
    description: "Confusing heat (energy transfer) with temperature (measure of kinetic energy)",
    teachingSuggestion: "Use examples of large cold objects vs small hot objects transferring heat",
  },

  // Science - Electricity
  {
    id: nanoid(),
    topic: "electricity",
    category: "Current flow",
    description: "Thinking current is used up as it flows through a circuit",
    teachingSuggestion: "Use the water pipe analogy to show current conservation",
  },
  {
    id: nanoid(),
    topic: "electricity",
    category: "Series vs parallel",
    description: "Confusing how current and voltage behave in series vs parallel circuits",
    teachingSuggestion: "Build both circuit types and measure current/voltage at different points",
  },

  // English - Grammar
  {
    id: nanoid(),
    topic: "grammar",
    category: "Subject-verb agreement",
    description: "Using singular verbs with plural subjects or vice versa",
    teachingSuggestion: "Practice identifying the subject and matching verb form",
  },
  {
    id: nanoid(),
    topic: "grammar",
    category: "Tense consistency",
    description: "Shifting tenses within a paragraph without reason",
    teachingSuggestion: "Review texts and identify/correct unnecessary tense shifts",
  },

  // Generic fallback
  {
    id: nanoid(),
    topic: "general",
    category: "Procedural error",
    description: "Applied incorrect procedure or formula to solve the problem",
    teachingSuggestion: "Review the correct procedure step by step",
  },
  {
    id: nanoid(),
    topic: "general",
    category: "Conceptual misunderstanding",
    description: "Misunderstood the underlying concept being tested",
    teachingSuggestion: "Revisit the foundational concept with examples",
  },
  {
    id: nanoid(),
    topic: "general",
    category: "Calculation error",
    description: "Made an arithmetic or computational mistake",
    teachingSuggestion: "Encourage checking work and using estimation to verify answers",
  },
];

// Available topics for assignment creation
export const availableTopics = [
  { value: "fractions", label: "Fractions" },
  { value: "algebra", label: "Algebra" },
  { value: "percentages", label: "Percentages" },
  { value: "forces", label: "Forces (Physics)" },
  { value: "energy", label: "Energy (Physics)" },
  { value: "electricity", label: "Electricity (Physics)" },
  { value: "grammar", label: "Grammar (English)" },
  { value: "general", label: "General" },
];

// Question templates by topic
export const questionTemplates: Record<string, { question: string; correctAnswer: string; type: string }[]> = {
  fractions: [
    { question: "What is 1/4 + 1/2?", correctAnswer: "3/4", type: "short_answer" },
    { question: "What is 2/3 × 3/4?", correctAnswer: "1/2", type: "short_answer" },
    { question: "Which is larger: 3/5 or 2/3?", correctAnswer: "2/3", type: "short_answer" },
  ],
  algebra: [
    { question: "Solve for x: 2x + 5 = 11", correctAnswer: "3", type: "short_answer" },
    { question: "Simplify: 3(x + 2) - x", correctAnswer: "2x + 6", type: "short_answer" },
    { question: "What is the value of 3² + 4²?", correctAnswer: "25", type: "short_answer" },
  ],
  percentages: [
    { question: "What is 25% of 80?", correctAnswer: "20", type: "short_answer" },
    { question: "A price increases from £50 to £60. What is the percentage increase?", correctAnswer: "20%", type: "short_answer" },
    { question: "What is 120% of 50?", correctAnswer: "60", type: "short_answer" },
  ],
  forces: [
    { question: "If an object is moving at constant velocity, what is the net force acting on it?", correctAnswer: "0", type: "short_answer" },
    { question: "What unit is force measured in?", correctAnswer: "Newtons", type: "short_answer" },
  ],
  energy: [
    { question: "What type of energy does a moving car have?", correctAnswer: "kinetic", type: "short_answer" },
    { question: "Energy cannot be created or destroyed, only ___", correctAnswer: "transferred", type: "short_answer" },
  ],
  electricity: [
    { question: "What unit is electrical current measured in?", correctAnswer: "Amps", type: "short_answer" },
    { question: "In a series circuit, is current the same or different at all points?", correctAnswer: "same", type: "short_answer" },
  ],
  grammar: [
    { question: "Choose the correct verb: The group of students (is/are) ready.", correctAnswer: "is", type: "short_answer" },
    { question: "Choose the correct verb: She (has/have) been waiting.", correctAnswer: "has", type: "short_answer" },
  ],
};

