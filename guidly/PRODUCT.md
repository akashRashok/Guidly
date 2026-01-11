# Guidly - Product Overview

## What is Guidly?

Guidly is a minimal homework feedback tool that helps students understand **why** their answers are wrong and helps teachers quickly see **where** students are confused. Unlike traditional homework systems focused on grading efficiency, Guidly prioritizes learning clarity through misconception-based feedback.

## The Problem We Solve

### For Students
- Getting "wrong" without understanding why
- Repeating the same mistakes
- Feeling stuck even after feedback
- Memorizing steps instead of understanding concepts

### For Teachers
- Seeing incorrect answers without understanding the reasons
- Lack of time to diagnose misconceptions
- Guessing what to re-teach
- Overly complex tools that add admin burden

## Our Solution

**Simple, focused feedback that makes misconceptions visible.**

- Students get targeted explanations when answers are wrong
- Teachers see clear summaries of common misconceptions
- No complex dashboards, no gamification, no student accounts
- One topic per assignment, one feedback loop per question

## Core Features

### Teacher Features

✅ **Assignment Creation**
- Create topic-based homework
- Add questions manually or use templates
- Automatic link and class code generation

✅ **Misconception Visibility**
- See which misconceptions are most common
- Get AI-generated teaching recommendations
- Plain-language summaries

✅ **Student Tracking**
- View completion status
- See which students struggled with which concepts
- Data scoped to individual assignments

### Student Features

✅ **Low-Friction Access**
- No account creation
- Just enter name and class code
- Access via simple homework link

✅ **Targeted Feedback**
- Feedback only when answers are incorrect
- Clear explanations of why answers are wrong
- Identification of underlying misconceptions
- Follow-up questions to test understanding

## What Makes Guidly Different

### 1. Focused on Learning, Not Grading
We optimize for understanding, not efficiency. Every feature exists to improve learning clarity.

### 2. Conservative AI Usage
AI is used sparingly and only when it improves clarity. We always have static fallbacks.

### 3. Minimal by Design
No dashboards, no analytics, no gamification. Just the essentials for misconception feedback.

### 4. Trust-First Approach
We prioritize trust and clarity over impressive features. Boring by design.

### 5. Data Isolation
Student data exists only within assignments. No cross-assignment tracking, no student profiles.

## Design Principles

### Constraints (Non-Negotiable)

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

These constraints keep the product focused and avoid platform complexity.

### Success Metrics

**Student-Level:**
- Reduction in repeated misconceptions
- Correct answers to follow-up questions
- Improved clarity after feedback

**Teacher-Level:**
- Confidence in knowing what to re-teach
- Reduced time diagnosing errors
- Useful summaries for lesson planning

**Explicitly Out of Scope:**
- Time-on-task metrics
- Engagement scores
- AI accuracy percentages
- Platform growth metrics

## Technical Overview

### Architecture

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite with Drizzle ORM
- **Authentication**: NextAuth.js v5
- **AI**: Ollama (local LLM - mistral, llama3, qwen2.5) with static fallbacks
- **Styling**: Tailwind CSS

### Key Technical Decisions

1. **SQLite**: Simple, self-contained, no connection pooling needed
2. **Server-Side Only**: All AI calls are server-side, no client exposure
3. **Edge Runtime**: Middleware uses Edge runtime for performance
4. **JWT Sessions**: Stateless authentication, no database lookups per request
5. **Conservative AI**: Always has static fallbacks, never fails silently

## User Flows

### Teacher Flow

1. Sign in with email (magic link or Google)
2. Create assignment: select topic, add questions
3. Share link and class code with students
4. View results: see misconceptions and teaching recommendations
5. Close assignment when done

### Student Flow

1. Open homework link
2. Enter name and class code
3. Answer questions one by one
4. Receive feedback if answer is incorrect
5. Answer follow-up question
6. Complete all questions
7. See completion summary

## Data Model

### Core Entities

- **Users**: Teachers only
- **Assignments**: Homework assignments with topics
- **Questions**: Questions within assignments
- **Misconceptions**: Predefined misconception categories
- **Student Sessions**: Student identity per assignment
- **Student Responses**: Answers and feedback

### Data Lifecycle

- Student data exists only within assignments
- No cross-assignment tracking
- When assignment closes, data becomes read-only
- No persistent student profiles

## Security & Privacy

- All API routes are server-side only
- No client-side LLM calls
- Student names never appear in URLs
- Data isolation between teachers
- Assignment closure prevents new submissions
- Conservative AI usage with fallbacks

## Deployment

### Requirements

- Node.js 18+
- SQLite database file
- Ollama (optional - for AI features)
- Environment variables for:
  - NextAuth configuration
  - Ollama configuration (optional)
  - Email server (optional, for production)
  - Google OAuth (optional)

### Setup Steps

1. Install dependencies: `npm install`
2. Set up environment variables
3. Push database schema: `npm run db:push`
4. Seed misconceptions: `npm run db:seed`
5. Build: `npm run build`
6. Start: `npm start`

See `README.md` for detailed setup instructions.

## Roadmap

### Current (MVP)

✅ Teacher authentication
✅ Assignment creation
✅ Student submission flow
✅ Misconception-based feedback
✅ Teacher results summary

### Explicitly Deferred

- Student accounts
- Multi-topic assignments
- Longitudinal tracking
- Visual analytics
- Class or school management
- Adaptive learning paths
- Gamification

### Future Considerations

Any future features must:
- Improve learning clarity
- Not add unnecessary complexity
- Earn their place through value

Potential areas (if they improve clarity):
- More sophisticated misconception matching
- Better question templates
- Improved explanation quality
- Enhanced teacher summaries

## Support

### Documentation

- **Product Overview**: This file
- **How to Use**: `docs/HOW_TO_USE.md`
- **Database**: `docs/DATABASE.md`
- **Setup**: `README.md`

### Philosophy

Guidly succeeds by doing less and doing it well. Any feature that doesn't directly improve misconception clarity is out of scope.

## License

MIT

---

**Remember**: This product is designed to be boring, reliable, and trustworthy. We prioritize learning clarity over technical impressiveness.

