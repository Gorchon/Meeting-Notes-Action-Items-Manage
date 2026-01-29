# AI Meeting Notes & Action Items Manager

A web application for managing meeting notes with AI-powered summaries, decision extraction, and action item tracking.

## Features

- Create and manage meetings
- Store raw meeting notes or transcripts
- AI-powered generation of:
  - Structured summaries
  - Decision extraction
  - Action item identification
- Edit and track action items over time
- Token-aware AI calls with caching

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma ORM** with SQLite
- **Anthropic Claude API**

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd spProject
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your-api-key-here
   ```

4. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Meeting

1. Navigate to the Meetings page
2. Click "New Meeting"
3. Fill in the meeting details (title, date, participants)
4. Click "Create Meeting"

### Adding Notes

1. Click on a meeting from the list
2. Enter or paste meeting notes in the left panel
3. Click "Save" to save your notes

### Generating AI Outputs

1. Save your meeting notes first
2. Switch to the desired tab (Summary, Decisions, or Actions)
3. Click "Generate" to create AI-powered content
4. AI outputs are cached based on note content - regenerating with unchanged notes will return cached results

### Managing Action Items

- View all action items from the "Action Items" page
- Toggle status between "Open" and "Done"
- Filter by status (All, Open, Done)
- Click on a meeting title to view the full meeting context

## Project Structure

```
spProject/
├── app/
│   ├── api/                    # API routes
│   │   ├── meetings/          # Meeting CRUD + AI endpoints
│   │   └── action-items/      # Action item endpoints
│   ├── meetings/              # Meetings pages
│   │   ├── [id]/             # Meeting detail page
│   │   └── page.tsx          # Meetings list
│   ├── action-items/          # Action items dashboard
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/                # Reusable components (TODO)
├── lib/
│   ├── prisma.ts             # Prisma client
│   └── ai.ts                 # AI utilities
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
└── public/                   # Static assets
```

## Database Schema

### Meeting
- Stores meeting metadata and raw notes

### AIOutput
- Caches AI-generated content
- Tracks token usage
- Links to meeting via hash of raw notes

### ActionItem
- Tracks action items from meetings
- Supports owner, due date, and status

## AI Implementation

- All AI calls are **explicitly user-triggered** via buttons
- Outputs are **cached** using SHA-256 hash of raw notes
- Token usage is **logged and displayed** for every AI call
- Uses **Claude 3.5 Sonnet** model via Anthropic API

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio to view database

### Database Migrations

After modifying `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name <migration-name>
```

## Notes

- No authentication is implemented (single-user demo)
- No external integrations
- Text input only (no file uploads)
- Designed for clarity and demo purposes

## License

MIT
