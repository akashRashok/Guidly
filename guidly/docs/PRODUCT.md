# Guidly - Product Documentation

## Overview

Guidly is a minimal, production-ready homework feedback tool designed to help students understand why their answers are wrong and help teachers quickly identify where students are confused. Unlike traditional homework systems that focus on grading efficiency, Guidly prioritizes learning clarity through misconception-based feedback.

## Product Philosophy

**Core Principle**: Focus on learning clarity, not grading efficiency.

Guidly succeeds by doing less and doing it well. The product is intentionally limited in scope to maintain focus on its core mission: making misconceptions visible and actionable.

## Key Features

### User Interface

**Teacher Pages:**
- Modern sidebar-based navigation layout
- Left sidebar with navigation, search, and settings
- Right activity sidebar showing recent student activity and completions
- Top header with user profile and notifications
- Card-based assignment display matching modern dashboard patterns
- Responsive design (sidebar collapses on mobile)

**Student Pages:**
- Simple, focused design without navigation clutter
- Clean question and feedback interface
- No distractions - focus on learning

### For Teachers

1. **Simple Assignment Creation**
   - Create topic-based homework assignments
   - Add questions manually or use predefined templates
   - View common misconceptions for selected topic during creation
   - One topic per assignment (maintains focus)
   - Automatic generation of shareable links and class codes
   - Modern sidebar-based interface for easy navigation

2. **Misconception Visibility**
   - See which misconceptions are most common
   - Get AI-generated teaching recommendations
   - Plain-language summaries (no complex dashboards)
   - View misconception descriptions in full (no truncation)
   - Know exactly what to re-teach
   - Activity sidebar showing recent student completions

3. **Student Tracking**
   - View completion status per student
   - See which students struggled with which concepts
   - Data scoped to individual assignments only
   - Recent activity feed in sidebar

### For Students

1. **Low-Friction Access**
   - No account creation required
   - Just enter name and class code
   - Access via simple homework link

2. **Targeted Feedback**
   - Feedback appears only when answers are incorrect
   - AI-generated explanations of why the answer is wrong
   - Intelligent mapping of wrong answers to specific misconceptions
   - AI-generated follow-up questions tailored to the misconception
   - Contextual follow-up questions that test understanding of the same concept

3. **Learning-Focused Experience**
   - No gamification or points
   - No pressure from retry loops
   - Focus on understanding, not performance

## Design Constraints (Non-Negotiable)

These constraints exist to keep the product focused and avoid platform complexity:

- ✅ Teacher login required
- ✅ No student accounts
- ✅ One homework link per assignment
- ✅ One topic per assignment
- ✅ One feedback loop per question
- ✅ Student identity exists only within an assignment
- ✅ No tracking across assignments
- ✅ No dashboards or analytics views
- ✅ No adaptive learning paths
- ✅ No gamification
- ✅ No multi-class or multi-school management

## AI Usage Principles

AI is used conservatively and only where it improves clarity. The system functions fully without AI using static fallbacks.

**AI May Be Used To:**
- Map incorrect answers to predefined misconception categories (deterministic-first, then AI)
- Generate clear, conservative explanations of misconceptions
- Create contextual follow-up questions tailored to specific misconceptions
- Summarize misconception patterns for teachers in plain language
- Suggest relevant misconceptions during assignment creation

**AI Must Not Be Used To:**
- Invent new pedagogy
- Adapt learning paths
- Personalize curriculum
- Replace teacher judgement
- Produce confident output when uncertainty is high
- Make decisions that affect student progress

**AI Architecture:**
- All AI calls are server-side only (no client exposure)
- Uses Ollama (local LLM) for privacy and control
- Deterministic pattern matching attempted first
- AI is a fallback, not a dependency
- Static templates used when AI unavailable
- Conservative generation parameters (low temperature, constrained prompts)
- 60-second timeout for model loading, graceful fallback on errors

If AI output reduces trust or clarity, simpler deterministic logic is used instead.

## Success Metrics

Success is measured by learning clarity and usefulness, not engagement volume:

**Student-Level Signals:**
- Reduction in repeated misconceptions within the same assignment
- Correct answers to follow-up questions
- Student self-reported clarity after feedback

**Teacher-Level Signals:**
- Teacher confidence in knowing what to re-teach
- Reduced time spent diagnosing errors
- Qualitative feedback on usefulness of summaries

Metrics such as time-on-task, engagement scores, or AI accuracy percentages are explicitly out of scope.

## Non-Goals

This product does not aim to:
- Reinvent homework
- Replace classroom teaching
- Provide adaptive learning pathways
- Act as a learning management system
- Compete with tutoring platforms
- Build student profiles
- Optimize engagement metrics

## Target Users

### Primary: Secondary School Teachers (Years 7-10)

**Goals:**
- Quickly identify where students are confused
- Decide what to focus on in the next lesson
- Improve learning outcomes without extra admin work

**Frustrations:**
- Seeing many incorrect answers without understanding why
- Lack of time to diagnose misconceptions
- Overly complex tools and dashboards

**Success Looks Like:**
- A clear summary of common misconceptions
- Confidence in what to re-teach
- Minimal disruption to existing workflow

### Secondary: Secondary School Students (Years 7-10)

**Goals:**
- Understand why their answer is wrong
- Avoid repeating the same mistake
- Feel more confident about core concepts

**Frustrations:**
- Getting "wrong" without explanation
- Feeling stuck even after feedback
- Memorizing steps instead of understanding ideas

**Success Looks Like:**
- Recognizing their misconception
- Correctly answering a follow-up question
- Feeling clearer before the next class

## Data Lifecycle

**Student Data Scoping:**
- Student data exists only within a single assignment
- No cross-assignment tracking
- No persistent student profiles
- When an assignment is closed, data becomes read-only

**Teacher Data:**
- All assignments owned by authenticated teacher
- Teachers can only see their own assignments and results
- No sharing or collaboration features

## Technical Architecture

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite with Drizzle ORM
- **Authentication**: NextAuth.js v5 (JWT sessions)
- **AI**: Ollama (local LLM - mistral, llama3, qwen2.5) with static fallbacks
- **Styling**: Tailwind CSS
- **Runtime**: Node.js (API routes), Edge (middleware)
- **UI**: Modern sidebar-based layout for teacher pages, simple focused design for students

**AI Integration:**
- Ollama HTTP API integration (`/api/generate`)
- Conservative parameters: temperature ≤ 0.2, top_p ≤ 0.9
- Deterministic-first misconception matching
- Pattern-based matching before AI fallback
- Graceful degradation when AI unavailable

## Security & Privacy

- All API routes are server-side only
- No client-side LLM calls
- All AI processing happens locally (Ollama) - no data sent to external services
- Student names never appear in URLs
- Data isolation between teachers
- Assignment closure prevents new submissions
- Conservative AI usage with fallbacks
- System fully functional without AI (privacy-first design)

## Future Considerations

Any future expansion must earn its place by improving learning clarity, not by adding complexity. Potential areas (if they improve clarity):

- More sophisticated misconception matching
- Better question templates
- Improved explanation quality
- Enhanced teacher summaries

Explicitly deferred:
- Student accounts
- Multi-topic assignments
- Longitudinal tracking
- Visual analytics
- Class or school management

## Support & Maintenance

Guidly is designed to be:
- **Boring by design**: Reliable, predictable, trustworthy
- **Minimal maintenance**: Simple architecture, few dependencies
- **Self-contained**: No external services required (Ollama is optional)
- **Production-ready**: Built for real classroom use
- **Privacy-first**: Local AI processing, no external API dependencies

**AI Requirements (Optional):**
- Ollama must be installed and running locally
- Recommended models: mistral (default), llama3:8b, or qwen2.5:7b
- System works fully without AI using static templates
- First AI request may take 30+ seconds (model loading), subsequent requests are fast (~100ms)

---

**Remember**: This product succeeds by doing less and doing it well. Any feature that doesn't directly improve misconception clarity is out of scope.

