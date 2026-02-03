# Dutch Vocabulary App - Data Flow & Architecture Diagrams

## Overview
Comprehensive architectural diagrams showing how data flows through the Dutch Vocabulary Learning Application, from infrastructure to user interaction.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DOCKER INFRASTRUCTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────┐         ┌────────────────────────────┐      │
│  │  dutch-vocab-app           │         │  dutch-vocab-postgres      │      │
│  │  (Next.js 15 Container)    │◄───────►│  (PostgreSQL 16 Alpine)    │      │
│  │                            │         │                            │      │
│  │  • Node 20 Alpine          │         │  • Port: 5432             │      │
│  │  • Port: 3000             │         │  • Volume: pg_data         │      │
│  │  • Optimized Build        │         │  • Init: init.sql          │      │
│  └────────────┬───────────────┘         └────────────────────────────┘      │
│               │                                                             │
└───────────────┼─────────────────────────────────────────────────────────────┘
                │
                ▼ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER ACCESS                                    │
│                                                                             │
│  Browser (localhost:3000) ──► Next.js Server ──► API Routes ──► PostgreSQL │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema & Initialization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│           DOCKER COMPOSE STARTUP SEQUENCE                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │  PostgreSQL Container  │
                 │  Starts First          │
                 └──────────┬─────────────┘
                            │
                            ▼
                 ┌────────────────────────┐
                 │  Execute init.sql      │
                 │  (if DB is empty)      │
                 └──────────┬─────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────────┐  ┌────────────────┐
│ CREATE TABLE │  │ CREATE INDEXES   │  │ SET DEFAULTS   │
│ vocabulary   │  │ - dutch (UNIQUE) │  │ - progress=new │
└──────────────┘  │ - level          │  │ - timestamps   │
                  └──────────────────┘  └────────────────┘
                            │
                            ▼
                 ┌────────────────────────┐
                 │   Health Check Pass    │
                 │   Ready for            │
                 │   Connections          │
                 └──────────┬─────────────┘
                            │
                            ▼
                 ┌────────────────────────┐
                 │  Next.js Container     │
                 │  Starts After DB       │
                 │  (depends_on: healthy) │
                 └────────────────────────┘

DATABASE SCHEMA:
┌────────────────────────────────────────────────────────────┐
│ vocabulary TABLE                                           │
├────────────────────────────────────────────────────────────┤
│ id               VARCHAR(255)  PRIMARY KEY                 │
│ dutch            VARCHAR(255)  NOT NULL UNIQUE             │
│ english          VARCHAR(255)  NOT NULL                    │
│ pos              VARCHAR(50)   (noun, verb, adj, etc.)     │
│ level            VARCHAR(10)   (A1-A2, B1-B2, C1-C2)       │
│ categories       TEXT[]        (array of tags)            │
│ functions        TEXT[]        (grammar notes)            │
│ example_nl       TEXT          (Dutch example)            │
│ example_en       TEXT          (English translation)      │
│ practice         TEXT[]        (user practice sentences)  │
│ contexts         TEXT[]        (usage contexts)           │
│ grammar_present  VARCHAR(255)  (present tense)            │
│ grammar_past     VARCHAR(255)  (past tense)               │
│ grammar_future   VARCHAR(255)  (future tense)             │
│ grammar_separable BOOLEAN      (separable verb?)          │
│ notes            TEXT          (additional notes)         │
│ progress         VARCHAR(20)   DEFAULT 'new'              │
│ last_reviewed    TIMESTAMP                                │
│ created_at       TIMESTAMP     DEFAULT NOW()              │
│ updated_at       TIMESTAMP     DEFAULT NOW()              │
└────────────────────────────────────────────────────────────┘
```

---

## 3. API Routes Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API LAYER                             │
│                    (app/api/*)                                   │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│ /api/vocabulary-db│  │ /api/save-state │  │ /api/contact     │
│                   │  │                 │  │                  │
│ GET    - List all │  │ POST - Save     │  │ POST - Contact   │
│ POST   - Import   │  │        & Backup │  │        form      │
│ PUT    - Update   │  │                 │  │                  │
│ DELETE - Remove   │  │                 │  │                  │
└─────────┬─────────┘  └────────┬────────┘  └──────────────────┘
          │                     │
          ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL Connection Pool                         │
│              (lib/db.ts - pg.Pool)                             │
│                                                                 │
│  • Max Connections: 20                                         │
│  • Idle Timeout: 30s                                           │
│  • Connection Timeout: 2s                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Complete Data Flow - GET Request

```
┌────────────┐
│  Browser   │  User opens app
│  Client    │
└─────┬──────┘
      │
      │ 1. Page Load
      ▼
┌────────────────────────────────────────────────┐
│  app/page.tsx or app/vocabulary/page.tsx       │
│                                                │
│  useEffect(() => {                             │
│    fetch('/api/vocabulary-db')                 │
│  }, [])                                        │
└──────────────────┬─────────────────────────────┘
                   │
                   │ 2. HTTP GET Request
                   ▼
┌────────────────────────────────────────────────┐
│  app/api/vocabulary-db/route.ts                │
│                                                │
│  export async function GET() {                 │
│    const client = await pool.connect()         │
│    const result = await client.query(          │
│      'SELECT * FROM vocabulary                 │
│       ORDER BY created_at DESC'                │
│    )                                           │
│    return NextResponse.json({                  │
│      data: result.rows                         │
│    })                                          │
│  }                                             │
└──────────────────┬─────────────────────────────┘
                   │
                   │ 3. SQL Query
                   ▼
┌────────────────────────────────────────────────┐
│  PostgreSQL Database                           │
│                                                │
│  SELECT * FROM vocabulary                      │
│  ORDER BY created_at DESC                      │
│                                                │
│  Returns: VocabularyWord[]                     │
└──────────────────┬─────────────────────────────┘
                   │
                   │ 4. JSON Response
                   ▼
┌────────────────────────────────────────────────┐
│  Client Receives Data                          │
│                                                │
│  setVocabulary(data)                           │
│  setStats(calculateStats(data))                │
│                                                │
│  State Updated → UI Re-renders                 │
└────────────────────────────────────────────────┘
```

---

## 5. Import Flow with Intelligent Merge

```
┌────────────┐
│   User     │  Selects CSV/JSON file
└─────┬──────┘
      │
      │ 1. File Upload
      ▼
┌─────────────────────────────────────────────┐
│  app/page.tsx                               │
│                                             │
│  handleImport(file) {                       │
│    const words = parseFile(file)            │
│    POST /api/vocabulary-db                  │
│    body: { words: VocabularyWord[] }        │
│  }                                          │
└──────────────┬──────────────────────────────┘
               │
               │ 2. HTTP POST with word array
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  app/api/vocabulary-db/route.ts - POST Handler                   │
               │ 4. Response
               ▼
┌────────────────────────────────────────────┐
│  Client Alert                              │
│                                            │
│  "Imported 5 new words, updated 3 words,   │
│   skipped 2 words (no new data)"           │
│                                            │
│  Refresh vocabulary list                   │
└────────────────────────────────────────────┘
```

### Import Merge Logic Details

```
For each imported word:

┌─────────────────────────────────────┐
│ Check: LOWER(dutch) = LOWER(input)  │
└────────────┬────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
  EXISTS?        NEW WORD
      │             │
      │             └──► INSERT
      │
      ▼
┌──────────────────────────────────────────────┐
│  MERGE LOGIC                                 │
│                                              │
│  1. Example Comparison:                      │
│     if (newLength > existingLength) {        │
│       • Replace example with longer one      │
│       • Move old example to practice array   │
│     }                                        │
│                                              │
│  2. Practice Sentences:                      │
│     allPractice = [                          │
│       ...existing.practice,                  │
│       ...oldExample (if replaced),           │
│       ...new.practice                        │
│     ]                                        │
│                                              │
│  3. Normalize Practice:                      │
│     • Parse JSON: {"nl":"X","en":"Y"}        │
│       → "X (Y)"                              │
│     • Remove empty strings                   │
│     • Trim whitespace                        │
│     • Deduplicate (case-insensitive)         │
│                                              │
│  4. Other Fields (Additive Only):            │
│     • Only add if current field is empty     │
│     • Never overwrite existing data          │
│                                              │
│  5. Decision:                                │
│     if (anyChanges) → UPDATE                 │
│     else → SKIP                              │
└──────────────────────────────────────────────┘
```

---

## 6. CRUD Operations Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      CREATE (Add New Word)                       │
└──────────────────────────────────────────────────────────────────┘

User clicks "Add Word" → AddWordModal opens
    │
    ▼
User fills form:
  • Dutch word (required)
  • English translation (required)
  • Level (A1-A2, B1-B2, C1-C2)
  • Categories
  • Example sentences
    │
    ▼
Form submission → POST /api/vocabulary-db
    │
    ▼
API validates & inserts:
  INSERT INTO vocabulary (...)
  VALUES (...)
    │
    ▼
Success → Modal closes → Refresh list → Show toast

┌──────────────────────────────────────────────────────────────────┐
│                      READ (View Vocabulary)                      │
└──────────────────────────────────────────────────────────────────┘

Page load → useEffect
    │
    ▼
GET /api/vocabulary-db
    │
    ▼
SELECT * FROM vocabulary ORDER BY created_at DESC
    │
    ▼
Client receives array → Apply filters → Render cards

┌──────────────────────────────────────────────────────────────────┐
│                      UPDATE (Edit/Progress)                      │
└──────────────────────────────────────────────────────────────────┘

Two update paths:

PATH 1: Inline Edit
  Click gear icon → Edit button → Edit mode
    │
    ▼
  Modify fields → Click save
    │
    ▼
  PUT /api/vocabulary-db
  body: { id, dutch, english, example }
    │
    ▼
  UPDATE vocabulary SET ... WHERE id = $1
    │
    ▼
  Success → Toast "✨ word modified" → Refresh

PATH 2: Progress Change
  Click progress button (new/learning/mastered)
    │
    ▼
  onProgressChange(id, newProgress)
    │
    ▼
  PUT /api/vocabulary-db
  body: { id, progress: newProgress }
    │
    ▼
  UPDATE vocabulary SET progress = $1 WHERE id = $2
    │
    ▼
  Success → Visual update (color change)

┌──────────────────────────────────────────────────────────────────┐
│                      DELETE (Remove Word)                        │
└──────────────────────────────────────────────────────────────────┘

Click gear → Delete button → Confirm dialog
    │
    ▼
User confirms
    │
    ▼
DELETE /api/vocabulary-db?id={wordId}
    │
    ▼
DELETE FROM vocabulary WHERE id = $1
    │
    ▼
Success → Toast "🗑️ word deleted" → Remove from list
```

---

## 7. Save State & Backup Flow

```
┌────────────┐
│   User     │  Clicks "Save State"
└─────┬──────┘
      │
      ▼
┌──────────────────────────────────────────────┐
│  app/page.tsx                                │
│                                              │
│  handleSaveState() {                         │
│    POST /api/save-state                      │
│    body: { vocabulary: currentState }        │
│  }                                           │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  app/api/save-state/route.ts                         │
│                                                      │
│  1. Upsert all words to database:                   │
│     for each word:                                   │
│       INSERT ... ON CONFLICT (dutch)                 │
│       DO UPDATE SET ...                              │
│                                                      │
│  2. Generate backups:                                │
│     timestamp = 2026-02-03_14-30-00                  │
│                                                      │
│     CSV: vocabulary_backup_{timestamp}.csv           │
│     • Export all fields as CSV                       │
│     • Arrays as JSON strings                         │
│                                                      │
│     JSON: vocabulary_backup_{timestamp}.json         │
│     • Full object export                             │
│     • Preserves all data types                       │
│                                                      │
│  3. Verify backups created                           │
│                                                      │
│  4. Optional: Delete old backups (keep last 5)       │
│                                                      │
│  Return: {                                           │
│    saved: count,                                     │
│    backupFiles: [csv, json]                          │
│  }                                                   │
└──────────────┬───────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────┐
│  Client Alert                              │
│                                            │
│  "✅ Successfully saved 630 words!"        │
│  "📦 Backup files created:"                │
│  "  • vocabulary_backup_2026-02...csv"     │
│  "  • vocabulary_backup_2026-02...json"    │
└────────────────────────────────────────────┘

Backup Storage:
/input/
  ├── vocabulary_backup_2026-02-03_14-30-00.csv
  └── vocabulary_backup_2026-02-03_14-30-00.json
```

---

## 8. Component Architecture & Performance

```
┌──────────────────────────────────────────────────────────────┐
│  app/vocabulary/page.tsx (Main Vocabulary Browser)           │
│                                                              │
│  Optimizations:                                              │
│  • useMemo for filtered/sorted vocabulary                    │
│  • useCallback for event handlers                            │
│  • Debounced search input                                    │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ Props
                 ▼
┌──────────────────────────────────────────────────────────────┐
│  VocabularyCard Component (React.memo)                       │
│                                                              │
│  Optimizations:                                              │
│  • memo() - prevents unnecessary re-renders                  │
│  • useCallback() - stable function references                │
│  • useMemo() - expensive calculations (getProgressColor)     │
│                                                              │
│  Animations (GPU-accelerated):                               │
│  • transform: scale() - click feedback                       │
│  • will-change: transform - GPU optimization                 │
│  • transition-all duration-300 - smooth transitions          │
│  • animate-blob - background animations (6 blobs)            │
│  • animate-glow-pulse - active state highlighting            │
│                                                              │
│  State Management:                                           │
│  • isExpanded (local) - card expansion                       │
│  • isEditing (local) - inline editing mode                   │
│  • showActionMenu (local) - gear menu visibility             │
│  • editedWord (local) - temporary edit state                 │
│  • newPractice (local) - new practice input                  │
└──────────────────────────────────────────────────────────────┘

Performance Flow:

User Action
    ↓
Event Handler (useCallback)
    ↓
State Update (minimal)
    ↓
React.memo checks props
    ↓
Re-render only if props changed
    ↓
GPU-accelerated animations (transform, opacity)
    ↓
Smooth 60fps experience
```

---

## 9. Export Flow

```
User clicks "Export CSV" or "Export JSON"
    │
    ▼
┌─────────────────────────────────────────────┐
│  Client-side export (no API call)           │
│                                             │
│  CSV Export:                                │
│    1. Convert vocabulary to CSV rows        │
│    2. Generate CSV string                   │
│    3. Create Blob                           │
│    4. Trigger download                      │
│       filename: vocabulary_{date}.csv       │
│                                             │
│  JSON Export:                               │
│    1. JSON.stringify(vocabulary)            │
│    2. Create Blob                           │
│    3. Trigger download                      │
│       filename: vocabulary_{date}.json      │
└─────────────────────────────────────────────┘
    │
    ▼
Browser downloads file to ~/Downloads/
```

---

## 10. Theme & UI Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Theme System (Tailwind Dark Mode)                          │
└──────────────────────────────────────────────────────────────┘

ThemeToggleButton (Client Component)
    │
    ▼
Clicks toggle
    │
    ▼
Toggle localStorage('theme')
    │
    ├─► 'light' → Remove .dark class
    └─► 'dark' → Add .dark class to <html>
    │
    ▼
CSS Variables Update:
    │
    ├─► Light Mode:
    │   • Pastel gradients (purple → pink → yellow)
    │   • Glass: rgba(255, 255, 255, 0.7)
    │   • Shadows: subtle, colorful
    │
    └─► Dark Mode:
        • Deep blacks (gradient: #0a0a0a → #1a1625)
        • Glass: rgba(30, 30, 30, 0.7)
        • Enhanced glow effects

Animations (Both Modes):
  • Background blobs (6 total, staggered delays)
  • Card hover: translateY(-4px) + shadow increase
  • Button active: scale(0.9)
  • Progress glow: pulse animation (2s infinite)
  • Smooth transitions: all 300ms ease-out
```

---

## 11. Error Handling & Toast Flow

```
API Call Initiated
    │
    ▼
try {
  const response = await fetch(...)
  
  if (!response.ok) {
    throw new Error(...)
  }
  
  const data = await response.json()
  
  // Success path
  ┌─────────────────────────────┐
  │ showToast('success')        │
  │ • Green background          │
  │ • ✅ Check icon             │
  │ • Auto-dismiss (3s)         │
  └─────────────────────────────┘
  
} catch (error) {
  
  // Error path
  ┌─────────────────────────────┐
  │ showToast('error')          │
  │ • Red background            │
  │ • ❌ X icon                 │
  │ • Longer duration (5s)      │
  │ • Error message displayed   │
  └─────────────────────────────┘
  
  // Rollback optimistic updates
  setState(previousState)
}

Toast Examples:
• ✨ "mogen" is modified in the library
• 🗑️ "zijn" is deleted from the library
• ✅ Successfully saved 630 words!
• ❌ Failed to save: Network error
```

---

## 12. Performance Optimization Summary

```
┌──────────────────────────────────────────────────────────────┐
│  OPTIMIZATION STRATEGY                                       │
└──────────────────────────────────────────────────────────────┘

1. React Level:
   ├─ React.memo() on VocabularyCard
   ├─ useCallback() for stable function refs
   ├─ useMemo() for expensive calculations
   └─ Key prop optimization for lists

2. CSS/Animation Level:
   ├─ will-change: transform (GPU acceleration)
   ├─ transform instead of top/left (GPU)
   ├─ opacity animations (GPU)
   └─ Reduced animation-delay spread (smoother)

3. Database Level:
   ├─ Indexes on dutch (UNIQUE), level
   ├─ Connection pooling (max: 20)
   ├─ Prepared statements (SQL injection prevention)
   └─ Efficient queries (SELECT only needed fields)

4. Network Level:
   ├─ Client-side exports (no server roundtrip)
   ├─ Debounced search (reduce API calls)
   ├─ Optimistic UI updates
   └─ Batch operations (import/save-state)

5. Build Level:
   ├─ Next.js production build optimization
   ├─ Tree shaking
   ├─ Code splitting (automatic with App Router)
   └─ Static generation where possible

Result: Smooth 60fps, fast interactions, optimized bundle
```

---

## Summary

This architecture provides:
- ✅ **Data Integrity**: PostgreSQL with constraints
- ✅ **Smart Merging**: Intelligent import logic
- ✅ **Performance**: Optimized React & CSS
- ✅ **UX**: Smooth animations, instant feedback
- ✅ **Reliability**: Error handling, backups
- ✅ **Scalability**: Connection pooling, efficient queries

All data flows are designed for safety, speed, and user experience.

│  For each word:                                                  │
│    1. Check duplicate (LOWER(dutch) = LOWER($1))                 │
│    2. If exists:                                                 │
│       ├─ Compare example lengths                                │
│       ├─ If new longer → replace & move old to practice          │
│       ├─ Merge practice arrays:                                 │
│       │  • Parse JSON strings: {"nl":"X"} → "X (Y)"             │
│       │  • Deduplicate (case-insensitive)                       │
│       │  • Clean formatting                                     │
│       ├─ Add missing fields (pos, notes, grammar)               │
│       └─ UPDATE if any changes                                  │
│    3. If new → INSERT                                           │
│                                                                  │
│  Return: {                                                       │
│    inserted: 5,                                                  │
│    updated: 3,                                                   │
│    skipped: 2,                                                   │
│    insertedWords: ["nieuw", ...],                                │
│    updatedWords: ["mogen", ...]                                  │
│  }                                                               │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 3. Database Operations
               ▼
┌────────────────────────────────────────────┐
│  PostgreSQL Transactions                   │
│                                            │
│  BEGIN;                                    │
│    INSERT ... ON CONFLICT DO NOTHING       │
│    UPDATE ... WHERE id = $1                │
│  COMMIT;                                   │
└──────────────┬─────────────────────────────┘
               │
               │ 4. Response
               ▼
┌────────────────────────────────────────────┐
│  Client Alert
│  │        PUT /api/vocabulary-db                           │        │
│  │        (immediate DB update + toast notification)       │        │
│  └─────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STORAGE & BACKUP LAYER                           │
│                                                                     │
│  ┌────────────────────┐                                             │
│  │  PostgreSQL DB     │  Primary storage (persistent)               │
│  │  vocabulary table  │  605 words with all metadata                │
│  └────────────────────┘                                             │
│           │                                                         │
│           ▼ (on save-state)                                         │
│  ┌────────────────────┐                                             │
│  │ input/ folder      │  Backup files with timestamp                │
│  │ ├─ backup_YYYY-MM- │  - CSV format (Excel compatible)            │
│  │ │  DD_HH-MM-SS.csv │  - JSON format (full structure)             │
│  │ └─ backup_...json  │                                             │
│  └────────────────────┘                                             │
└─────────────────────────────────────────────────────────────────────┘
```

## Detailed Data Flows

### 1. Initial File Import Flow

**Step 1: Merge Multiple Excel Files**
```
Input Files (4 original) → merge-vocabulary.js
  ├─ Read each .xlsx/.xls file
  ├─ Parse with xlsx library
  ├─ Extract columns:
  │   ├─ Dutch Word
  │   ├─ English Translation
  │   ├─ Grammar Note
  │   ├─ Present/Past/Future Tense
  │   ├─ Example Sentences (NL/EN)
  │   ├─ Practice Sentences
  │   ├─ Level, Categories, Progress, Notes
  │   └─ Handle column name variations
  ├─ Deduplicate by Dutch word (case-insensitive)
  ├─ Sort alphabetically
  └─ Output:
      ├─ merged-vocabulary.csv
      └─ merged-vocabulary.xlsx (backup)

Result: 467 unique words (from 526 total, 59 duplicates removed)
```

**Step 2: Server-Side API Loading**
```
GET /api/vocabulary (route.ts)
  ├─ fs.readdirSync('input/') → Find .xlsx, .xls, .csv, .json files
  ├─ For each file:
  │   ├─ Detect format (.xlsx, .xls, .csv, .json)
  │   ├─ Parse accordingly:
  │   │   ├─ Excel: XLSX.read(buffer) → sheet_to_json()
  │   │   ├─ CSV: Custom parser with quote handling
  │   │   └─ JSON: JSON.parse() with flexible field mapping
  │   └─ Parse each row/object:
  │       ├─ Handle column/field name variations (case-insensitive)
  │       ├─ Extract grammar data
  │       ├─ Parse comma-separated or array values
  │       ├─ Deduplicate by Dutch word (case-insensitive)
  │       └─ Create VocabularyWord object
  ├─ Auto-categorize words without categories
  └─ Return JSON response with all merged vocabulary
```

**Step 3: Client-Side Loading**
```javascript
// app/page.tsx - Dashboard
useEffect(() => {
  const loadVocabulary = async () => {
    // 1. Fetch from API
    const response = await fetch('/api/vocabulary');
    const data = await response.json();
    
    // 2. Merge with localStorage (preserves user progress)
    const stored = loadVocabularyFromStorage();
    const merged = mergeVocabulary(data.vocabulary, stored);
    
    // 3. Update state
    setVocabulary(merged);
    
    // 4. Save to localStorage
    saveVocabularyToStorage(merged);
  };
  
  loadVocabulary();
}, []);
```

### 2. Filtering & Sorting Flow

```
User Input (Filters)
  │
  ├─ Search Text: "huis"
  ├─ Category: "home-housing"
  ├─ Level: "A1"
  └─ Progress: "new"
  │
  ▼
filterVocabulary(vocabulary, filters)
  ├─ Filter by search (Dutch, English, examples)
  │   └─ word.dutch.includes(search) || word.english.includes(search)
  ├─ Filter by category
  │   └─ word.categories.includes(filter.category)
  ├─ Filter by level
  │   └─ word.level === filter.level
  └─ Filter by progress
      └─ word.progress === filter.progress
  │
  ▼
Filtered Array (e.g., 50 words)
  │
  ▼
Sort by sortBy & sortOrder
  ├─ Alphabetical: word.dutch.localeCompare()
  ├─ Category: word.categories[0].localeCompare()
  ├─ Progress: progressOrder[word.progress]
  └─ Level: word.level.localeCompare()
  │
  ▼
Sorted & Filtered Result
  │
  ▼
Render VocabularyCard components
```

### 3. Progress Tracking Flow

```
User Clicks Progress Button (e.g., "Learning")
  │
  ▼
VocabularyCard.onProgressChange(wordId, "learning")
  │
  ▼
handleProgressChange() in page.tsx
  │
  ├─ updateWordProgress(vocabulary, wordId, "learning")
  │   └─ Maps through array
  │       └─ If word.id matches:
  │           ├─ Update progress: "learning"
  │           └─ Update lastReviewed: new Date().toISOString()
  │
  ▼
setVocabulary(updated) → Update React state
  │
  ▼
saveVocabularyToStorage(updated)
  └─ localStorage.setItem("dutch-vocabulary", JSON.stringify(updated))
```

### 4. Practice Sentence Flow

```
User Types Practice Sentence
  │
  ▼
Input Field in VocabularyCard (expanded state)
  │
  ▼
Click "Add" button → handleAddPractice()
  │
  ▼
onPracticeAdd(wordId, sentence)
  │
  ▼
handlePracticeAdd() in page.tsx
  │
  ├─ Map through vocabulary array
  │   └─ If word.id matches:
  │       └─ Return { ...word, practice: [...word.practice, sentence] }
  │
  ▼
setVocabulary(updated) → Update React state
  │
  ▼
saveVocabularyToStorage(updated) → Persist to localStorage
  │
  ▼
Re-render VocabularyCard with new practice sentence
```

### 5. File Upload Flow

```
User Selects Excel File (Dashboard)
  │
  ▼
handleFileUpload(event)
  │
  ├─ Get file from event.target.files[0]
  │
  ▼
parseExcelToVocabulary(file) (lib/vocabulary.ts)
  │
  ├─ FileReader.readAsBinaryString()
  │   │
  │   ▼
  │ XLSX.read(data, { type: "binary" })
  │   │
  │   ▼
  │ XLSX.utils.sheet_to_json(worksheet)
  │   │
  │   ▼
  │ Map each row to VocabularyWord:
  │   ├─ Extract Dutch, English
  │   ├─ Parse grammar fields
  │   ├─ Handle column variations
  │   ├─ Create unique ID (slug)
  │   └─ Set defaults (progress: "new", etc.)
  │
  ▼
Merge with existing vocabulary
  ├─ Deduplicate by word.id
  └─ Preserve existing progress/practice
  │
  ▼
setVocabulary(merged) → Update state
  │
  ▼
saveVocabularyToStorage(merged) → Persist
```

### 6. Export Flow

```
User Clicks "Export Vocabulary"
  │
  ▼
exportVocabularyToExcel(vocabulary, filename)
  │
  ├─ Map vocabulary to Excel format:
  │   └─ For each word:
  │       ├─ Dutch: word.dutch
  │       ├─ English: word.english
  │       ├─ Grammar Note: word.pos
  │       ├─ Present/Past/Future: word.grammar.*
  │       ├─ Examples: word.example.nl, word.example.en
  │       ├─ Practice: word.practice.join(" | ")
  │       ├─ Level, Categories, Progress, Notes
  │       └─ Create row object
  │
  ▼
XLSX.utils.json_to_sheet(data)
  │
  ▼
XLSX.utils.book_new() → Create workbook
  │
  ▼
XLSX.utils.book_append_sheet(workbook, worksheet, "Vocabulary")
  │
  ▼
Auto-size columns (calculate max width)
  │
  ▼
XLSX.writeFile(workbook, filename)
  └─ Browser downloads file
```

### 7. Auto-Categorization Flow

```
Word without categories
  │
  ▼
autoCategorize(dutch, english) (lib/categorization.ts)
  │
  ├─ Create lowercase versions of input
  │
  ├─ For each category group (15 total):
  │   │
  │   ├─ Get keywords array (e.g., Food & Dining)
  │   │   └─ ["food", "eat", "drink", "eten", "voedsel"...]
  │   │
  │   ├─ Check if any keyword matches:
  │   │   ├─ dutch.includes(keyword) OR
  │   │   └─ english.includes(keyword)
  │   │
  │   └─ If match found:
  │       └─ Add category to result array
  │
  ├─ Return array of matched categories
  │
  └─ If no matches:
      └─ Return ["general"]

Example:
  autoCategorize("brood", "bread")
    → Keywords: ["bread", "brood", "bakkerij"]
    → Matches: "brood" in keywords
    → Returns: ["food-dining"]
```

## State Management

### Client-Side State Tree

```javascript
// Dashboard (app/page.tsx)
const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
const stats = useMemo(() => calculateStats(vocabulary), [vocabulary]);

// Vocabulary Browser (app/vocabulary/page.tsx)
const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
const [filters, setFilters] = useState({
  category: "all",
  level: "all",
  progress: "all",
  function: "all",
  search: ""
});
const [sortBy, setSortBy] = useState<SortBy>("alphabetical");
const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

const filteredAndSortedWords = useMemo(() => {
  // Expensive operation cached
  return filterVocabulary(vocabulary, filters).sort(...)
}, [vocabulary, filters, sortBy, sortOrder]);

// VocabularyCard Component
const [isExpanded, setIsExpanded] = useState(false);
const [newPractice, setNewPractice] = useState("");
```

### LocalStorage Schema

```json
{
  "key": "dutch-vocabulary",
  "value": [
    {
      "id": "huis",
      "dutch": "huis",
      "english": "house",
      "pos": "noun, het",
      "level": "A1",
      "categories": ["home-housing"],
      "functions": [],
      "contexts": [],
      "grammar": {
        "present": "-",
        "past": "-",
        "future": "-"
      },
      "example": {
        "nl": "Ik woon in een groot huis.",
        "en": "I live in a big house."
      },
      "practice": [
        "Dit huis is erg mooi.",
        "Mijn huis heeft een tuin."
      ],
      "progress": "learning",
      "notes": "",
      "createdAt": "2026-02-01T10:00:00.000Z",
      "lastReviewed": "2026-02-01T13:30:00.000Z"
    }
  ]
}
```

## Data Synchronization Strategy

### Load Priority
1. **API First**: Fresh data from files
2. **Merge with LocalStorage**: Preserve user progress/practice
3. **Save Merged Result**: Update localStorage

### Merge Logic
```javascript
function mergeVocabulary(apiData, storedData) {
  const storedMap = new Map(storedData.map(w => [w.id, w]));
  
  return apiData.map(word => {
    const stored = storedMap.get(word.id);
    if (stored) {
      // Preserve user data
      return {
        ...word,
        progress: stored.progress,
        practice: stored.practice,
        lastReviewed: stored.lastReviewed
      };
    }
    return word;
  });
}
```

### Conflict Resolution
- **Progress**: localStorage wins (user's current state)
- **Practice**: localStorage wins (user-generated)
- **Categories**: API wins (latest auto-categorization)
- **Examples**: API wins (source of truth)
- **Grammar**: API wins (source of truth)

## Performance Considerations

### Optimization Points

1. **Memoization**
   - Filter/sort operations are expensive
   - `useMemo` caches results until dependencies change
   - Only re-computes when vocabulary, filters, or sort changes

2. **Debouncing Search**
   - Search input doesn't trigger immediate re-render
   - Wait for user to stop typing
   - Reduces unnecessary filtering operations

3. **Lazy Loading**
   - VocabularyCard components render on-demand
   - Collapsed state shows minimal data
   - Expanded state loaded only when clicked

4. **LocalStorage Batching**
   - Don't save on every keystroke
   - Save only on meaningful changes (progress, practice add/remove)
   - Prevents excessive localStorage writes

5. **API Caching**
   - API data cached in localStorage
   - Subsequent loads use cached data
   - Reload button forces fresh fetch

## Error Handling

### API Route Errors
```typescript
try {
  const data = await parseExcelFile(filePath);
} catch (error) {
  console.error(`Error processing ${file}:`, error);
  // Continue with other files
}
```

### Storage Errors
```typescript
try {
  localStorage.setItem("dutch-vocabulary", JSON.stringify(data));
} catch (error) {
  console.error("Error saving to storage:", error);
  // Show user notification
}
```

### Parse Errors
```typescript
try {
  const vocabulary = parseExcelToVocabulary(file);
} catch (error) {
  alert("Failed to parse file. Please check format.");
  reject(error);
}
```

## Data Validation

### Input Validation
- Dutch word: Required, non-empty string
- English: Required, non-empty string
- Level: Must be valid CEFR level (A1-C2)
- Progress: Must be "new" | "learning" | "mastered"
- ID: Generated from Dutch word (lowercase slug)

### Deduplication
- Primary key: word.id (lowercase slug of Dutch word)
- Case-insensitive matching
- Latest entry wins in merge conflicts

---

**Last Updated**: February 1, 2026
**Data Flow Version**: 2.0
**Maintained By**: Burak Cetin
