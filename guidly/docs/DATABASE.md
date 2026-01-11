# Database Documentation

## Overview

Guidly uses SQLite as its database, managed through Drizzle ORM. The database is designed to be simple, focused, and aligned with the product's constraints: no cross-assignment tracking, no student profiles, and data scoped to individual assignments.

## Database Schema

### Core Tables

#### `users`
Stores teacher accounts only.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier (nanoid) |
| `email` | TEXT (UNIQUE) | Teacher email address |
| `name` | TEXT | Teacher name |
| `emailVerified` | INTEGER (timestamp) | Email verification timestamp |
| `image` | TEXT | Profile image URL (optional) |
| `createdAt` | INTEGER (timestamp) | Account creation timestamp |

**Relationships:**
- One-to-many with `assignments` (teacher owns assignments)

#### `assignments`
Stores homework assignments created by teachers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier (nanoid) |
| `teacherId` | TEXT (FK) | References `users.id` |
| `title` | TEXT | Assignment title |
| `topic` | TEXT | Topic category (fractions, algebra, etc.) |
| `linkSlug` | TEXT (UNIQUE) | URL-safe identifier for student access |
| `classCode` | TEXT | 4-character code for student entry |
| `isClosed` | INTEGER (boolean) | Whether assignment accepts new submissions |
| `createdAt` | INTEGER (timestamp) | Creation timestamp |

**Relationships:**
- Many-to-one with `users` (teacher)
- One-to-many with `questions`
- One-to-many with `studentSessions`

**Constraints:**
- One topic per assignment (enforced by application logic)
- `linkSlug` must be unique
- `classCode` is generated per assignment

#### `questions`
Stores questions for each assignment.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier (nanoid) |
| `assignmentId` | TEXT (FK) | References `assignments.id` |
| `questionText` | TEXT | The question text |
| `correctAnswer` | TEXT | The correct answer |
| `questionType` | TEXT | Type: "short_answer" or "multiple_choice" |
| `options` | TEXT | JSON array for multiple choice (optional) |
| `order` | INTEGER | Display order (1-based) |

**Relationships:**
- Many-to-one with `assignments`
- One-to-many with `studentResponses`

**Constraints:**
- Questions are ordered within an assignment
- Correct answer is required for answer checking

#### `misconceptions`
Predefined misconception categories (seeded data).

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier (nanoid) |
| `topic` | TEXT | Topic category (fractions, algebra, etc.) |
| `category` | TEXT | Misconception category name |
| `description` | TEXT | Plain-language description |
| `teachingSuggestion` | TEXT | Suggestion for teachers (optional) |

**Relationships:**
- One-to-many with `studentResponses` (via `misconceptionId`)

**Notes:**
- This table is seeded on first run
- Contains 20 predefined misconceptions across 8 topics
- Used to categorize student errors

#### `questionMisconceptions`
Maps wrong answer patterns to misconceptions (optional, for future use).

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier (nanoid) |
| `questionId` | TEXT (FK) | References `questions.id` |
| `misconceptionId` | TEXT (FK) | References `misconceptions.id` |
| `wrongAnswerPattern` | TEXT | Regex or exact match pattern |
| `explanation` | TEXT | Static explanation (optional) |
| `followUpQuestion` | TEXT | Follow-up question (optional) |
| `followUpAnswer` | TEXT | Follow-up answer (optional) |

**Relationships:**
- Many-to-one with `questions`
- Many-to-one with `misconceptions`

**Notes:**
- Currently not used in MVP
- Reserved for future deterministic misconception matching

#### `studentSessions`
Student identity per assignment (no cross-assignment tracking).

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier (nanoid) |
| `assignmentId` | TEXT (FK) | References `assignments.id` |
| `studentName` | TEXT | Student name (first name + last initial) |
| `classCode` | TEXT | Class code used to start session |
| `startedAt` | INTEGER (timestamp) | Session start timestamp |
| `completedAt` | INTEGER (timestamp) | Session completion timestamp (nullable) |

**Relationships:**
- Many-to-one with `assignments`
- One-to-many with `studentResponses`

**Constraints:**
- Student name is scoped to assignment only
- No unique constraint on student name (allows duplicates)
- `completedAt` is null until assignment is finished

**Data Lifecycle:**
- Created when student starts homework
- Updated when student completes
- Exists only within the assignment context

#### `studentResponses`
Stores student answers and feedback.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier (nanoid) |
| `sessionId` | TEXT (FK) | References `studentSessions.id` |
| `questionId` | TEXT (FK) | References `questions.id` |
| `answer` | TEXT | Student's answer |
| `isCorrect` | INTEGER (boolean) | Whether answer was correct |
| `misconceptionId` | TEXT (FK, nullable) | References `misconceptions.id` |
| `aiExplanation` | TEXT | AI-generated explanation (not stored permanently) |
| `followUpAnswer` | TEXT | Answer to follow-up question (nullable) |
| `followUpCorrect` | INTEGER (boolean, nullable) | Whether follow-up was correct |
| `answeredAt` | INTEGER (timestamp) | Answer submission timestamp |

**Relationships:**
- Many-to-one with `studentSessions`
- Many-to-one with `questions`
- Many-to-one with `misconceptions` (optional)

**Notes:**
- `aiExplanation` is generated on-the-fly, not permanently stored
- Follow-up data is stored for tracking but not used for grading
- All responses are stored, even incorrect ones

### NextAuth Tables

These tables are managed by NextAuth.js for authentication:

#### `accounts`
OAuth account links for users.

#### `sessions`
JWT session tokens (sessionToken is primary key).

#### `verificationTokens`
Email verification tokens for magic links.

## Data Relationships

```
users (teachers)
  └── assignments (1:N)
        ├── questions (1:N)
        │     └── studentResponses (1:N)
        └── studentSessions (1:N)
              └── studentResponses (1:N)
                    └── misconceptions (N:1, optional)
```

## Key Design Decisions

### 1. No Student Profiles
- Students don't have accounts
- Student identity exists only in `studentSessions` table
- No cross-assignment tracking

### 2. Assignment Scoping
- All student data is linked to a specific assignment
- When assignment is closed, no new sessions can be created
- Data becomes read-only after closure

### 3. Misconception Matching
- Currently uses topic-based matching (simplified for MVP)
- Future: Can use `questionMisconceptions` table for pattern matching
- AI generates explanations when no static explanation exists

### 4. Answer Checking
- Flexible matching (normalizes whitespace, case, formatting)
- Handles fractions, decimals, percentages
- Falls back to exact match if normalization fails

### 5. Data Isolation
- Teachers can only see their own assignments
- All queries filtered by `teacherId`
- No cross-teacher data access

## Database Operations

### Seeding

Run `npm run db:seed` to populate `misconceptions` table with predefined data.

**Seeded Data:**
- 20 misconceptions across 8 topics
- Covers common secondary school subjects
- Includes general fallback misconceptions

### Migrations

Drizzle handles schema changes through `drizzle-kit`.

**Commands:**
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate migration files
- `npm run db:studio` - Open Drizzle Studio (GUI)

### Backup & Recovery

**Backup:**
- SQLite database file: `guidly.db`
- Simple file copy is sufficient for backup
- No special backup procedures needed

**Recovery:**
- Restore `guidly.db` file
- Run `npm run db:seed` if misconceptions are missing
- No migration scripts needed (schema is simple)

## Query Patterns

### Common Queries

**Get teacher's assignments:**
```typescript
db.select()
  .from(assignments)
  .where(eq(assignments.teacherId, teacherId))
  .orderBy(desc(assignments.createdAt))
```

**Get assignment with questions:**
```typescript
const assignment = await db.select()
  .from(assignments)
  .where(eq(assignments.id, assignmentId))
  .limit(1);

const questions = await db.select()
  .from(questions)
  .where(eq(questions.assignmentId, assignmentId))
  .orderBy(questions.order);
```

**Get student responses with misconceptions:**
```typescript
db.select({
  response: studentResponses,
  misconception: misconceptions,
})
  .from(studentResponses)
  .innerJoin(studentSessions, eq(studentResponses.sessionId, studentSessions.id))
  .leftJoin(misconceptions, eq(studentResponses.misconceptionId, misconceptions.id))
  .where(eq(studentSessions.assignmentId, assignmentId))
```

**Calculate misconception statistics:**
```typescript
// Group by misconception, count occurrences
// Filter by isCorrect = false
// Sort by count descending
// Limit to top 5
```

## Performance Considerations

### Indexes

**Automatic Indexes:**
- Primary keys are automatically indexed
- Foreign keys should be indexed (Drizzle handles this)

**Recommended Indexes:**
- `assignments.teacherId` (frequent filtering)
- `questions.assignmentId` (frequent joins)
- `studentSessions.assignmentId` (frequent filtering)
- `studentResponses.sessionId` (frequent joins)
- `studentResponses.questionId` (frequent joins)

### Query Optimization

1. **Limit Results**: Always use `.limit()` for lists
2. **Select Specific Columns**: Use `.select()` with specific columns when possible
3. **Filter Early**: Apply `where()` clauses before joins
4. **Use Transactions**: For multi-step operations

### Scalability

**Current Design:**
- SQLite is suitable for single-instance deployment
- Handles thousands of assignments and responses
- No connection pooling needed

**Future Considerations:**
- If scaling beyond SQLite limits, migrate to PostgreSQL
- Schema is designed to be easily portable
- Drizzle ORM supports multiple databases

## Data Privacy & Security

### Access Control

- All queries filtered by `teacherId` at application level
- No direct database access for students
- API routes enforce authentication

### Data Retention

- No automatic deletion
- Teachers can close assignments (read-only)
- Manual deletion possible if needed

### Student Data

- Student names stored as plain text (acceptable for MVP)
- No PII beyond name and responses
- Data scoped to assignments only
- No cross-assignment correlation

## Maintenance

### Regular Tasks

1. **Monitor Database Size**: SQLite files can grow large
2. **Backup Regularly**: Copy `guidly.db` file
3. **Check Indexes**: Ensure foreign keys are indexed
4. **Review Queries**: Monitor slow queries if issues arise

### Troubleshooting

**Database Locked:**
- Only one process can write at a time
- Ensure only one instance of the app is running

**Corruption:**
- SQLite is very reliable
- If corruption occurs, restore from backup
- Run `PRAGMA integrity_check;` to verify

**Performance Issues:**
- Check for missing indexes
- Review query patterns
- Consider database size limits

---

**Note**: This database design prioritizes simplicity and clarity over complex features. It aligns with the product's philosophy of doing less and doing it well.


