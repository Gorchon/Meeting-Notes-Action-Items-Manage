# CLAUDE.md
## Project Initialization Instructions

You are initializing a new software project based strictly on the instructions in this file.

---

## Project Name
AI Meeting Notes & Action Items Manager

---

## Project Goal
Build a web application that allows users to:
- Create meetings
- Store raw meeting notes or transcripts
- Use AI to generate:
  - a structured summary
  - decisions made
  - actionable follow-up items
- Edit and track action items over time

AI features must be **explicitly user-triggered**, cached, and token-aware.

---

## Tech Stack (Required)
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite (local development)
- Anthropic Claude API (server-side only)

---

## Architecture Requirements

### Frontend
- Pages:
  - `/meetings` – list and create meetings
  - `/meetings/[id]` – meeting detail view
  - `/action-items` – global action items dashboard
- Meeting detail page layout:
  - Left panel: raw meeting notes editor
  - Right panel: tabbed AI output
    - Summary
    - Decisions
    - Action Items
- Each AI action must have:
  - independent loading state
  - error handling
  - token usage display
- AI-generated content must be editable by the user

---

### Backend
Use Next.js App Router API routes.

Required endpoints:
- `GET /api/meetings`
- `POST /api/meetings`
- `GET /api/meetings/[id]`
- `PATCH /api/meetings/[id]`

- `POST /api/meetings/[id]/ai/summary`
- `POST /api/meetings/[id]/ai/decisions`
- `POST /api/meetings/[id]/ai/actions`

- `GET /api/action-items`
- `PATCH /api/action-items/[id]`

---

## Data Models (Prisma)

### Meeting
- id
- title
- date
- participants (string)
- rawNotes (text)
- createdAt
- updatedAt

### AIOutput
- id
- meetingId
- type (summary | decisions | actions)
- content (text or JSON)
- rawNotesHash
- promptTokens
- completionTokens
- model
- createdAt

### ActionItem
- id
- meetingId
- description
- owner
- dueDate
- status (open | done)
- createdAt
- updatedAt

---

## AI Usage Rules

- AI calls must be initiated only via explicit user actions (buttons)
- Never auto-run AI on save
- Cache AI outputs using a hash of `rawNotes`
- Reuse cached output if notes have not changed
- Enforce token limits per request
- Log token usage for every AI call

---

## Prompting Constraints

When generating AI calls:
- Send only the raw meeting notes (no UI data)
- Require deterministic structured outputs
- Prefer JSON outputs where possible
- No explanations in AI responses unless explicitly requested

---

## Development Constraints

- No authentication required
- No external integrations
- No file uploads (text input only)
- Focus on clarity, correctness, and demo-readiness

---

## Output Expectations

When initializing this project:
1. Create the directory structure
2. Scaffold the Next.js app
3. Add Prisma schema
4. Create placeholder API routes
5. Create placeholder pages and components
6. Do NOT add unnecessary libraries
7. Leave TODO comments where implementation is expected

---

## Important
Do not invent features outside this document.
Do not over-engineer.
Prefer explicitness over abstraction.
