# Import Features Documentation

## Overview
The Dutch Vocabulary app now supports importing vocabulary from **Excel (XLSX/XLS)**, **CSV**, and **JSON** file formats with intelligent duplicate detection and handling.

## Supported File Formats

### 1. Excel Files (.xlsx, .xls)
**Required Columns:**
- Dutch Word / Dutch
- English Translation / English  
- Optional: Level, Categories, Functions, Grammar Note, Examples, Practice Sentences, Progress, Notes

**Example Structure:**
```
Dutch Word | English Translation | Level | Categories | Functions
-----------|-------------------|-------|------------|----------
Hallo      | Hello             | A1-A2 | Greetings | Phrase
```

### 2. CSV Files (.csv)
**Required Columns:**
- Dutch / Dutch (case-insensitive)
- English / English (case-insensitive)
- Optional: Level, Categories, Functions, Example (NL), Example (EN), Progress, Notes, Practice

**Handling:**
- Properly parses CSV lines with quoted values
- Handles multi-line cells with quotes
- Column name matching is flexible (Dutch/dutch, English/english, etc.)

**Example:**
```csv
Dutch,English,Level,Categories
"Alstublieft","Please","A1-A2","Common, Polite"
"aanbieding","offer / sale","A1-A2","general objects"
```

### 3. JSON Files (.json)
**Supported Structures:**

**Array Format:**
```json
[
  {
    "dutch": "Hallo",
    "english": "Hello",
    "level": "A1-A2",
    "categories": ["Greetings", "Common"],
    "functions": [],
    "example": {
      "nl": "Hallo, hoe gaat het?",
      "en": "Hello, how are you?"
    }
  }
]
```

**Object Format:**
```json
{
  "vocabulary": [
    {
      "dutch": "Hallo",
      "english": "Hello",
      ...
    }
  ]
}
```

## Duplicate Detection

The system uses **case-insensitive Dutch word matching** to detect and skip duplicates:

- When importing multiple files, duplicates across files are skipped
- When importing the same file twice, duplicates within the file are skipped
- The detection key is the Dutch word in lowercase
- Message shows: `Imported: X words, Skipped: Y (duplicates)`

## Import Methods

### 1. From Input Folder (Reload)
Click the **Reload** button to import all supported files from the `/input` directory:
- Automatically discovers all .xlsx, .xls, .csv, and .json files
- Consolidates all data with duplicate prevention
- Updates database with new entries

### 2. From File Upload
Click **Import** dropdown and select:
- **Import from Excel** (.xlsx, .xls files)
- **Import from CSV** (.csv files)  
- **Import from JSON** (.json files)

## API Endpoints

### GET /api/vocabulary
Lists all vocabulary files in the input directory and merges them:
- Supports: XLSX, XLS, CSV, JSON
- Returns merged vocabulary with duplicates removed
- Duplicate key: Dutch word (case-insensitive)

### POST /api/vocabulary-db
Imports word array to database:
- Checks for existing words (case-insensitive)
- Reports: `{ inserted: X, duplicates: Y, duplicateWords: [...] }`

## Processing Logic

### CSV Processing
```typescript
// Flexible header mapping
- Splits on commas outside quotes
- Removes surrounding quotes
- Maps headers case-insensitively
- Validates Dutch and English fields
```

### JSON Processing
```typescript
// Flexible structure support
- Accepts both Array and Object formats
- Handles nested categories/functions (arrays or comma-separated)
- Converts progress values: "mastered" → 100, "learning" → 50, "new" → 0
```

### Level Normalization
All level formats are normalized to standard format:
- Single levels (A1, A2, etc.) → Grouped levels (A1-A2, B1-B2, C1-C2)
- Spaced levels ("a1 a2") → Hyphenated (A1-A2)
- Invalid formats → Default to A1-A2

## Database Schema

Imported words are stored with:
- **id**: Unique identifier
- **dutch**: Dutch word (unique constraint)
- **english**: English translation
- **level**: CEFR level (A1, A2, B1, B2, C1, C2, A1-A2, B1-B2, C1-C2)
- **categories**: Array of categories
- **functions**: Array of word functions
- **example_nl**: Dutch example
- **example_en**: English example
- **progress**: Learning status (new, learning, mastered)
- **practice**: Array of practice sentences
- **notes**: Additional notes
- **created_at**, **updated_at**: Timestamps

## Import Workflow

```
1. User selects file (Excel, CSV, or JSON)
   ↓
2. Frontend parseExcelToVocabulary() detects format
   ↓
3. Format-specific parser processes file
   ↓
4. Duplicate detection (Dutch word case-insensitive)
   ↓
5. Data sent to /api/vocabulary-db
   ↓
6. Database insert with ON CONFLICT handling
   ↓
7. Results displayed: imported count + duplicates skipped
```

## Example: Importing CSV Backup

```bash
# Place the backup file in input folder
cp vocabulary_backup_2026-02-03_09-57-16.csv input/

# Then click Reload in app to import all files
# Or upload via file picker
```

## Troubleshooting

### "No supported files found"
- Ensure files are in `/input` directory
- Verify file extensions are: .xlsx, .xls, .csv, or .json

### "Duplicate words skipped"
- This is normal behavior - system prevents duplicate Dutch words
- Check if word was already in database

### "Parse error"
- Verify CSV has proper header row
- Ensure JSON is valid format
- Check Excel columns match expected names

## Future Enhancements

- Export to JSON format
- Batch import with progress indicator
- Import preview before confirming
- Conflict resolution for different values of same word
