Name: Guidly

Homework Misconception Feedback Tool
1. Problem Statement

Homework is widely used to reinforce learning, but most homework systems focus on marking answers as right or wrong rather than helping students understand why an answer is wrong. As a result, students often repeat the same mistakes without correcting the underlying misconception.

Teachers face a parallel issue. After reviewing homework, they can see which questions were answered incorrectly, but not the conceptual reasons behind those errors. This makes it difficult to decide what to re-teach, often leading to guesswork or overly broad revision.

Existing tools optimise for grading efficiency and analytics, not learning clarity. This product addresses that gap by providing clear, misconception-level feedback to students and concise summaries to teachers, without changing how homework is assigned or completed.

2. Target Users
2.1 Classroom Teachers (Secondary School)

Goals

Quickly identify where students are confused

Decide what to focus on in the next lesson

Improve learning outcomes without extra admin work

Frustrations

Seeing many incorrect answers without understanding why

Lack of time to diagnose misconceptions

Overly complex tools and dashboards

Success Looks Like

A clear summary of common misconceptions

Confidence in what to re-teach

Minimal disruption to existing workflow

2.2 Secondary School Students (Years 7–10)

Goals

Understand why their answer is wrong

Avoid repeating the same mistake

Feel more confident about core concepts

Frustrations

Getting “wrong” without explanation

Feeling stuck even after feedback

Memorising steps instead of understanding ideas

Success Looks Like

Recognising their misconception

Correctly answering a follow-up question

Feeling clearer before the next class

3. Product Scope and Constraints (Non-Negotiable)

This product is intentionally limited in scope.

Teacher login is required

No student accounts

One homework link per assignment

One topic per assignment

One feedback loop per question

Student identity exists only within an assignment

No long-term student tracking across assignments

No dashboards or analytics views

No adaptive learning paths

No gamification

No multi-class or multi-school management

These constraints exist to keep the product focused on learning clarity and to avoid turning it into a platform or learning management system.

4. Authentication and Identity Model
4.1 Teacher Authentication

Teachers must sign up and sign in

Authentication uses a low-friction method such as:

Email magic link, or

Google SSO

All assignments and results are owned by the authenticated teacher

Teacher accounts exist solely to:

Create assignments

View results

Maintain ownership of data

4.2 Student Identification (Option A)

Students do not create accounts

When opening a homework link, students must enter:

First name + last initial (or teacher-defined naming convention)

A short class code generated with the assignment

Student names are stored only within the context of that assignment

Student names must never appear in URLs

This approach balances low friction with enough structure for teachers to see who completed the homework.

5. Core User Flows
5.1 Teacher Flow

Teacher signs in

Teacher creates a homework assignment by:

Selecting a single topic

Adding or selecting a small set of questions

Generating an assignment link and class code

Teacher shares the link and class code with students

After students complete the assignment, the teacher views a single results page

Teacher Results Page Includes

Top incorrect answer patterns

One plain-language sentence describing each misconception

One suggestion for what to revisit in class

A list of student names with completion status

There are no charts, graphs, filters, exports, or historical views.

5.2 Student Flow

Student opens the homework link

Student enters their name and the class code

Student answers questions one by one

Feedback appears only when an answer is incorrect

Incorrect Answer Feedback

Explanation of why the answer is wrong

Identification of the underlying misconception

One follow-up question to test corrected understanding

After the follow-up question, the student proceeds to the next question.
There is no retry loop beyond this.

6. AI Usage Principles

AI is used conservatively and only where it improves clarity.

AI May Be Used To

Map incorrect answers to a predefined set of misconception categories

Generate clear, conservative explanations of misconceptions

Summarise misconception patterns for teachers in plain language

AI Must Not Be Used To

Invent new pedagogy

Adapt learning paths

Personalise curriculum

Replace teacher judgement

Produce confident output when uncertainty is high

If AI output reduces trust or clarity, simpler deterministic logic must be used instead.

7. Success Metrics

Success is measured by learning clarity and usefulness, not engagement volume.

Student-Level Signals

Reduction in repeated misconceptions within the same assignment

Correct answers to follow-up questions

Student self-reported clarity after feedback

Teacher-Level Signals

Teacher confidence in knowing what to re-teach

Reduced time spent diagnosing errors

Qualitative feedback on usefulness of summaries

Metrics such as time-on-task, engagement scores, or AI accuracy percentages are explicitly out of scope.

8. Non-Goals

This product does not aim to:

Reinvent homework

Replace classroom teaching

Provide adaptive learning pathways

Act as a learning management system

Compete with tutoring platforms

Maintaining these non-goals protects product focus and credibility.

9. Risks and Tradeoffs
Risk: Incorrect Misconception Mapping

Mitigation

Use a small, predefined set of known misconceptions

Fall back to generic explanations when confidence is low

Risk: Student Name Spoofing

Mitigation

Acceptable for MVP

Teacher can identify duplicates or suspicious entries

Risk: Overconfidence in Automated Feedback

Mitigation

Keep explanations short and cautious

Avoid authoritative or absolute language

Risk: Oversimplification

Mitigation

Prioritise clarity over completeness

Accept partial understanding as progress

10. MVP Definition

The MVP must be buildable within 2–3 weeks by a small team.

MVP Includes

Teacher authentication

Assignment creation with link and class code

Student name entry per assignment

Feedback loop for incorrect answers

Teacher results summary page

Explicitly Deferred

Student accounts

Longitudinal tracking

Multi-topic assignments

Visual analytics

Class or school management

The MVP is successful if a small number of teachers and students can use it meaningfully in a real classroom context.

Final Note

This product succeeds by doing less and doing it well.
Any future expansion must earn its place by improving learning clarity, not by adding complexity.