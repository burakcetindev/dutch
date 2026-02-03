# Dutch Vocabulary App - System Architecture

## Overview
A full-stack Dutch language learning application built with Next.js 15, featuring glassmorphism UI design, intelligent vocabulary management with smart merging, and performance-optimized React components.

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.11 (App Router)
- **Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS 3.4.17
  - GPU-accelerated animations
  - Custom glassmorphism utilities
  - Dark mode support
- **UI Components**: Custom components with Shadcn/ui patterns
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useEffect, useMemo, useCallback)
- **Performance**: React.memo, optimized re-renders, will-change properties

### Backend
- **Database**: PostgreSQL 16 (Alpine Docker image)
- **Runtime**: Node.js 20 (Alpine)
- **Database Client**: pg (node-postgres) v8.11.3
- **Connection Management**: Connection pooling (max 20 connections)
- **File Processing**: csv-parse, CSV/JSON generation

### Infrastructure & Deployment
- **Containerization**: Docker & Docker Compose
- **Multi-stage Builds**: Optimized production images
- **Health Checks**: Database readiness verification
- **Volumes**: Persistent PostgreSQL data
- **Networking**: Internal Docker network + exposed ports

### Build & Development Tools
- **Package Manager**: npm
- **Bundler**: Next.js built-in (Turbopack in dev)
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with Next.js config
- **Code Quality**: Prettier (recommended)

## Project Structure

```
dutch/
├── app/                           # Next.js App Router
│   ├── page.tsx                  # Dashboard homepage with stats
│   ├── vocabulary/               
│   │   └── page.tsx              # Main vocabulary browser
│   ├── about/
│   │   └── page.tsx              # About page
│   ├── api/
│   │   ├── vocabulary-db/
│   │   │   └── route.ts          # CRUD operations with intelligent merging
│   │   ├── save-state/
│   │   │   └── route.ts          # Save & backup with timestamps
│   │   └── contact/
│   │       └── route.ts          # Contact form API
│   ├── layout.tsx                # Root layout with theme provider
│   └── globals.css               # Global styles + optimized animations
│
├── src/
│   └── components/
│       └── vocabulary/
│           ├── VocabularyCard.tsx    # Main card (React.memo optimized)
│           ├── AddWordModal.tsx      # Add new word modal
│           └── YouGlish.tsx          # YouTube pronunciation
│       ├── ThemeToggleButton.tsx    # Theme switcher
│       ├── ThemeProvider.tsx        # Theme context
│       └── HamburgerMenu.tsx        # Mobile navigation
│
├── components/
│   └── ui/                       # Reusable UI primitives (Shadcn pattern)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       └── select.tsx
│
├── lib/                          # Business logic & utilities
│   ├── db.ts                    # PostgreSQL connection pool setup
│   ├── vocabulary.ts            # Import/export logic (CSV/JSON)
│   ├── stats.ts                 # Statistics calculations
│   ├── levelMapper.ts           # CEFR level normalization
│   └── utils.ts                 # Helper functions (cn, etc.)
│
├── types/
│   └── vocabulary.ts            # TypeScript interfaces
│       - VocabularyWord         # Main word interface
│       - VocabularyStats        # Statistics interface
│       - CEFRLevel              # A1-A2, B1-B2, C1-C2
│       - ProgressStatus         # new, learning, mastered
│
├── infra/                        # Infrastructure & deployment
│   ├── docker-compose.yml       # Multi-container orchestration
│   │   - vocab: Next.js app
│   │   - db: PostgreSQL 16
│   ├── Dockerfile               # Multi-stage Next.js build
│   ├── init.sql                 # Database schema with indexes
│   └── .dockerignore            # Docker ignore patterns
│
├── scripts/                      # Automation scripts
│   ├── first-run.sh             # Initial setup (env, deps)
│   ├── build-and-start.sh       # Build images & start
│   ├── start.sh                 # Quick start (existing images)
│   ├── import-full-backup.js    # Import complete backup
│   ├── create-backup.js         # Generate timestamped backups
│   └── merge-categories.ts      # Category normalization utility
│
├── docs/                         # Comprehensive documentation
│   ├── ARCHITECTURE.md          # This file
│   ├── DATA-FLOW.md             # Complete data flow diagrams
│   ├── QUICK-START.md           # Getting started guide
│   └── images/                  # Screenshots
│       ├── day_mode.png
│       └── night_mode.png
│
├── __tests__/                    # Test suite
│   ├── api.integration.test.ts  # API integration tests
│   ├── vocabulary.test.ts       # Vocabulary logic tests
│   └── VocabularyCard.test.tsx  # Component tests
│
└── input/                        # Data backup storage (gitignored)
    └── vocabulary_backup_*.{csv,json}  # Timestamped backups
```

## System Components

### 1. Docker Infrastructure

```
┌──────────────────────────────────────────────┐
│  Docker Compose (infra/docker-compose.yml)   │
├──────────────────────────────────────────────┤
│                                              │
│  Service: vocab (dutch-vocab-app)            │
│  ├─ Image: dutch-vocab-vocab                 │
│  ├─ Build: Multi-stage Dockerfile            │
│  ├─ Port: 3000:3000                          │
│  ├─ Depends: db (healthcheck)                │
│  └─ Environment: DATABASE_URL, etc.          │
│                                              │
│  Service: db (dutch-vocab-postgres)          │
│  ├─ Image: postgres:16-alpine                │
│  ├─ Port: 5432:5432                          │
│  ├─ Volume: vocab_pg_data                    │
│  ├─ Init: /docker-entrypoint-initdb.d/       │
│  └─ Health: pg_isready check                 │
└──────────────────────────────────────────────┘
```

### 2. Database Layer

**PostgreSQL 16** with optimized schema:

```sql
CREATE TABLE vocabulary (
  -- Primary identifiers
  id               VARCHAR(255)  PRIMARY KEY,
  dutch            VARCHAR(255)  NOT NULL UNIQUE,
  english          VARCHAR(255)  NOT NULL,
  
  -- Classification
  pos              VARCHAR(50),               -- Part of speech
  level            VARCHAR(10),               -- CEFR level
  
  -- Metadata arrays
  categories       TEXT[],                    -- Topical tags
  functions        TEXT[],                    -- Grammar functions
  contexts         TEXT[],                    -- Usage contexts
  
  -- Examples & practice
  example_nl       TEXT,                      -- Dutch example
  example_en       TEXT,                      -- English translation
  practice         TEXT[],                    -- User practice sentences
  
  -- Grammar details
  grammar_present  VARCHAR(255),              -- Present tense
  grammar_past     VARCHAR(255),              -- Past tense
  grammar_future   VARCHAR(255),              -- Future tense
  grammar_separable BOOLEAN,                  -- Separable verb flag
  
  -- Notes & tracking
  notes            TEXT,                      -- Additional notes
  progress         VARCHAR(20)   DEFAULT 'new',
  last_reviewed    TIMESTAMP,
  created_at       TIMESTAMP     DEFAULT NOW(),
  updated_at       TIMESTAMP     DEFAULT NOW()
);

-- Performance indexes
CREATE UNIQUE INDEX idx_dutch_lower ON vocabulary(LOWER(dutch));
CREATE INDEX idx_level ON vocabulary(level);
CREATE INDEX idx_progress ON vocabulary(progress);
CREATE INDEX idx_created_at ON vocabulary(created_at DESC);
```

**Connection Pool Configuration:**
```typescript
const pool = new Pool({
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle after 30s
  connectionTimeoutMillis: 2000,  // Fail fast
})
```## Core Components

### 1. Dashboard (`app/page.tsx`)
**Purpose**: Main entry point showing statistics and navigation

**Features**:
- Auto-loads vocabulary from API on mount
- Real-time statistics (total, by progress, by level, by category)
- File upload functionality
- Export to Excel
- Beautiful glassmorphism design with animated gradient background

**State Management**:
- `vocabulary`: Array of VocabularyWord objects
- `stats`: Computed statistics using useMemo
- Auto-saves to localStorage on changes

### 2. Vocabulary Browser (`app/vocabulary/page.tsx`)
**Purpose**: Browse, filter, sort, and manage vocabulary

**Features**:
- Multi-dimensional filtering (search, category, level, progress, function)
- 4 sort methods (alphabetical, category, progress, level)
- Ascending/descending toggle
- Real-time search
- URL query parameter support for sharing filters
- Expandable word cards with all data

**Filters**:
```typescript
{
  category: string,  // Filter by semantic category
  level: string,     // Filter by CEFR level (A1-C2)
  progress: string,  // Filter by learning status
  function: string,  // Filter by part of speech
  search: string     // Text search across all fields
}
```

**Sorting**:
- Alphabetical: By Dutch word
- Category: Groups by primary category
- Progress: New → Learning → Mastered
- Level: A1 → A2 → B1 → B2 → C1 → C2

### 3. VocabularyCard Component
**Purpose**: Display and interact with individual words

**States**:
- **Collapsed**: Shows Dutch, English, grammar, example, categories
- **Expanded**: Reveals ALL data including:
  - Verb conjugations (present/past/future)
  - Practice sentences (user-added)
  - Contexts and full metadata
  - Creation/review dates

**Interactive Features**:
- Click to expand/collapse
- Progress status buttons (New/Learning/Mastered)
- Add/remove custom practice sentences
- Visual feedback with gradient borders matching progress

**Design**:
- Glassmorphism effect (`backdrop-filter: blur(12px)`)
- Gradient borders that change with progress state
- Smooth animations (expand/collapse, hover effects)
- Responsive grid layout

### 4. Auto-Categorization Engine (`lib/categorization.ts`)
**Purpose**: Intelligently categorize words without manual tagging

**Algorithm**:
1. Checks if word already has categories
2. Searches 200+ keywords across 15 category groups
3. Matches against both Dutch word and English translation
4. Returns array of matching categories
5. Falls back to "general" if no matches

**Categories** (15 groups):
- Food & Dining
- Work & Career
- Travel & Transportation
- Home & Housing
- Health & Medical
- Education & School
- Shopping & Money
- Time & Calendar
- Social & Communication
- Weather & Nature
- Numbers & Counting
- Emotions & Feelings
- Government & Official
- Clothing & Appearance
- Technology & Internet

**Keyword Matching**:
- Case-insensitive
- Supports partial matches
- Bilingual (works with Dutch and English)

## Data Model

### VocabularyWord Interface
```typescript
interface VocabularyWord {
  id: string;                    // Unique ID (slug of Dutch word)
  dutch: string;                 // Dutch word/phrase
  english: string;               // English translation
  pos: string;                   // Part of speech / Grammar note
  level: CEFRLevel;              // A1, A2, B1, B2, C1, C2
  categories: string[];          // Semantic categories
  functions?: string[];          // Grammatical functions
  contexts?: string[];           // Usage contexts
  grammar?: {
    present?: string;            // Present tense conjugation
    past?: string;               // Past tense conjugation
    future?: string;             // Future tense conjugation
    separable?: boolean;         // For separable verbs
  };
  example?: {
    nl: string;                  // Dutch example sentence
    en: string;                  // English translation of example
  };
  practice?: string[];           // User-added practice sentences
  progress: ProgressStatus;      // "new" | "learning" | "mastered"
  notes?: string;                // Additional notes
  createdAt?: string;            // ISO timestamp
  lastReviewed?: string;         // ISO timestamp of last review
}
```

## API Routes

### GET /api/vocabulary
**Purpose**: Server-side file loading from input/ folder

**Process**:
1. Reads all `.xlsx` and `.xls` files from `input/` directory
2. Parses each file using xlsx library
3. Handles multiple column name formats
4. Deduplicates by Dutch word (case-insensitive)
5. Auto-categorizes words without categories
6. Returns JSON array of VocabularyWord objects

**Response**:
```json
{
  "vocabulary": [
    {
      "id": "huis",
      "dutch": "huis",
      "english": "house",
      "pos": "noun, het",
      "level": "A1",
      "categories": ["home-housing"],
      "grammar": {
        "present": "-",
        "past": "-",
        "future": "-"
      },
      "example": {
        "nl": "Ik woon in een groot huis.",
        "en": "I live in a big house."
      },
      "practice": [],
      "progress": "new",
      "createdAt": "2026-02-01T13:30:00.000Z"
    }
  ]
}
```

**Error Handling**:
- Returns 404 if input/ folder not found
- Returns 404 if no Excel files found
- Logs individual file errors but continues processing

## Storage Architecture

### Client-Side (localStorage)
**Key**: `dutch-vocabulary`

**Purpose**:
- Persist vocabulary across sessions
- Store progress tracking
- Save user-added practice sentences
- Enable offline functionality

**Operations**:
- `loadVocabularyFromStorage()`: Reads from localStorage
- `saveVocabularyToStorage()`: Writes to localStorage
- `updateWordProgress()`: Updates progress and saves

**Data Sync**:
1. On app load: Fetch from API → Merge with localStorage → Save
2. On progress change: Update in memory → Save to localStorage
3. On export: Read from localStorage → Generate Excel

### Server-Side (File System)
**Location**: `/input/` folder

**Files**:
- `merged-vocabulary.csv`: Primary data source (CSV format)
- `merged-vocabulary.xlsx`: Excel backup

**Column Format**:
```
Dutch | English | Grammar Note | Present Tense | Past Tense | Future Tense | 
Example Sentence (Dutch) | Example Sentence (English) | Practice Sentences |
Level | Categories | Progress | Notes
```

## Styling System

### Glassmorphism Design
**Core CSS** (in `app/globals.css`):

```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}

.glass-card {
  @apply rounded-3xl transition-transform duration-300;
}

.glass-card:hover {
  transform: translateY(-4px);
}
```

**Color Palette**:
- Primary Gradient: Purple (#9333ea) → Pink (#ec4899)
- Progress Colors:
  - New: Red (#ef4444) → Pink (#ec4899)
  - Learning: Yellow (#eab308) → Orange (#f97316)
  - Mastered: Green (#22c55e) → Emerald (#10b981)

### Animations
**Background Blobs**:
```css
@keyframes blob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -50px) scale(1.1); }
  50% { transform: translate(-20px, 20px) scale(0.9); }
  75% { transform: translate(50px, 50px) scale(1.05); }
}
```

**Transitions**:
- Card hover: `transform` 300ms
- Expand/collapse: `fade-in slide-in-from-top-2` 300ms
- Progress buttons: `scale` 300ms with gradient background

## Build Configuration

### Next.js Config (`next.config.mjs`)
```javascript
const nextConfig = {
  // Server-side rendering enabled
  // API routes with Node.js runtime
  // Static optimization where possible
}
```

### TypeScript Config (`tsconfig.json`)
- Strict mode enabled
- Path aliases: `@/*` → root directory
- JSX: react-jsx
- Target: ES2017

### Tailwind Config (`tailwind.config.ts`)
```typescript
{
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        blob: "blob 20s infinite"
      }
    }
  }
}
```

## Performance Optimizations

1. **Memoization**: `useMemo` for filtering/sorting expensive operations
2. **Code Splitting**: Automatic by Next.js App Router
3. **Static Generation**: Homepage pre-rendered where possible
4. **Lazy Loading**: Components loaded on-demand
5. **Debounced Search**: Prevents excessive re-renders
6. **LocalStorage Caching**: Reduces API calls

## Security Considerations

1. **No External APIs**: All data processing happens locally
2. **Client-Side Storage**: No server-side user data storage
3. **File System Access**: Limited to `input/` folder (server-side only)
4. **XSS Prevention**: React automatically escapes JSX
5. **Type Safety**: TypeScript prevents many runtime errors

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Development
```bash
npm run dev
```

### Static Export (Optional)
Not recommended due to API routes dependency

## Future Enhancement Points

1. **Database Integration**: PostgreSQL or MongoDB for multi-user support
2. **Authentication**: User accounts with progress sync
3. **Spaced Repetition**: Algorithm-based review scheduling
4. **Audio Pronunciation**: Integration with TTS or audio files
5. **Quiz Mode**: Interactive learning exercises
6. **PWA**: Offline-first Progressive Web App
7. **Mobile Apps**: React Native for iOS/Android
8. **YouGlish Integration**: Real-world usage examples via API

## Dependencies

**Production**:
- next: ^15.5.11
- react: ^18
- react-dom: ^18
- typescript: ^5.7.2
- tailwindcss: ^3.4.17
- xlsx: ^0.18.5
- lucide-react: (icons)

**Development**:
- @types/node
- @types/react
- @types/react-dom
- postcss
- autoprefixer

---

**Last Updated**: February 1, 2026
**Architecture Version**: 2.0
**Maintained By**: Burak Cetin
