# Dutch Vocabulary App - Data Flow Documentation

## Overview
This document explains how data moves through the Dutch Vocabulary Learning Application, from database initialization to user interaction and backup.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE LAYER                        │
│                                                                     |
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │
│  │ Docker       │────▶│ PostgreSQL   │────▶│ Init Schema  │         │
│  │ Compose      │     │ Container    │     │ (init.sql)   │         │
│  └──────────────┘     └──────────────┘     └──────┬───────┘         │
│                                                     │               │
│                                             ┌───────▼────────┐      │
│                                             │ vocabulary     │      │
│                                             │ table          │      │
│                                             └────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVER LAYER (Next.js API)                       │
│                                                                     │
│  ┌──────────────────┐                                               │
│  │GET /api/         │  1. Query PostgreSQL via connection pool      │
│  │vocabulary-db     │  2. Map database rows to VocabularyWord       │
│  │                  │  3. Return JSON array                         │
│  └──────┬───────────┘                                               │
│         │                                                           │
│  ┌──────▼───────────┐                                               │
│  │POST /api/        │  1. Insert new words (check duplicates)       │
│  │vocabulary-db     │  2. Return inserted count                     │
│  └──────────────────┘                                               │
│         │                                                           │
│  ┌──────▼───────────┐                                               │
│  │PUT /api/         │  1. Update word by ID                         │
│  │vocabulary-db     │  2. Support partial updates                   │
│  │                  │  3. Return updated word                       │
│  └──────────────────┘                                               │
│         │                                                           │
│  ┌──────▼───────────┐                                               │
│  │DELETE /api/      │  1. Delete word by ID                         │
│  │vocabulary-db     │  2. Return success status                     │
│  └──────────────────┘                                               │
│         │                                                           │
│  ┌──────▼───────────┐                                               │
│  │POST /api/        │  1. Sync all vocabulary to DB                 │
│  │save-state        │  2. Insert new + update existing              │
│  │                  │  3. Create CSV/JSON backups with timestamp    │
│  │                  │  4. Return saved count + backup files         │
│  └──────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼ HTTP Response (JSON)
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React/Next.js)                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │                  Dashboard (app/page.tsx)                │       │
│  │                                                          │       │
│  │  useEffect → Fetch /api/vocabulary-db                    │       │
│  │                    ▼                                     │       │
│  │            ┌────────────────┐                            │       │
│  │            │  Vocabulary    │                            │       │
│  │            │  State Array   │                            │       │
│  │            └───────┬────────┘                            │       │
│  │                    │                                     |       │
│  │         ┌──────────┼──────────┐                          │       │
│  │         ▼          ▼          ▼                          │       │
│  │    ┌────────┐ ┌────────┐ ┌────────┐                      │       │
│  │    │Stats   │ │Add Word│ │ Save   │                      │       │
│  │    │Display │ │ Modal  │ │ State  │                      │       │
│  │    └────────┘ └────────┘ └────────┘                      │       │
│  └──────────────────────────────────────────────────────────┘       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │          Vocabulary Browser (app/vocabulary/page.tsx)   │        │
│  │                                                         │        │
│  │  useEffect → Fetch /api/vocabulary-db                   │        │
│  │         ▼                                               │        │
│  │    ┌────────────┐                                       │        │
│  │    │  Filters   │→ filterVocabulary()                   │        │
│  │    │  & Sorts   │   (useMemo - optimized)               │        │
│  │    └─────┬──────┘                                       │        │
│  │          ▼                                              │        │
│  │   ┌──────────────┐                                      │        │
│  │   │ VocabularyCard│ (optimized animations)              │        │
│  │   │  Components   │                                     │        │
│  │   └──────┬────────┘                                     │        │
│  │          │                                              │        │
│  │    ┌─────┴──────┬──────────┬──────────┐                 │        │
│  │    ▼            ▼          ▼          ▼                 │        │
│  │ Progress   Practice    Edit      Delete                 │        │
│  │  Update      Add      (inline)   (confirm)              │        │
│  │    │            │          │          │                 │        │
│  │    └────────────┴──────────┴──────────┘                 │        │
│  │                 ▼                                       │        │
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
