import * as XLSX from "xlsx";
import { VocabularyWord, ExcelRow, CEFRLevel, ProgressStatus } from "@/types/vocabulary";

/**
 * Parse Excel file and convert to VocabularyWord array
 */
export function parseExcelToVocabulary(file: File): Promise<VocabularyWord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

        const vocabulary: VocabularyWord[] = jsonData.map((row, index) => {
          const dutch = row['Dutch Word'] || row.Dutch || row.dutch || "";
          const english = row['English Translation'] || row.English || row.english || "";
          const grammarNote = row['Grammar Note'] || row['Part of Speech'] || row.pos || row.POS || "";
          const presentTense = row['Present Tense'] || row.PresentTense || "";
          const pastTense = row['Past Tense'] || row.PastTense || "";
          const futureTense = row['Future Tense'] || row.FutureTense || "";
          const exampleNL = row['Example Sentence (Dutch)'] || row['Example (NL)'] || row.example_nl || "";
          const exampleEN = row['Example Sentence (English)'] || row['Example (EN)'] || row.example_en || "";
          const practiceSentences = row['Practice Sentences'] || row.Practice || "";

          return {
            id: dutch.toLowerCase().replace(/\s+/g, "-") || `word-${index}`,
            dutch,
            english,
            pos: grammarNote,
            level: (row.Level || row.level || "A1") as CEFRLevel,
            categories: parseCommaSeparated(
              row.Categories || row.categories || row.Category || ""
            ),
            functions: parseCommaSeparated(row.Functions || row.functions || ""),
            contexts: parseCommaSeparated(row.Contexts || row.contexts || ""),
            grammar: {
              present: presentTense,
              past: pastTense,
              future: futureTense,
            },
            example: {
              nl: exampleNL,
              en: exampleEN,
            },
            practice: parseCommaSeparated(practiceSentences),
            progress: (row.Progress || row.progress || "new") as ProgressStatus,
            notes: row.Notes || row.notes || "",
            createdAt: new Date().toISOString(),
          };
        });

        resolve(vocabulary);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
        if (file.name.endsWith('.json')) {
          reader.readAsText(file);
        } else if (file.name.endsWith('.csv')) {
          reader.readAsText(file);
        } else {
          reader.readAsBinaryString(file);
        }
      };
      
      reader.onload = (e) => {
        if (file.name.endsWith('.json')) {
          const jsonText = e.target?.result as string;
          const jsonData = JSON.parse(jsonText);
          const words = Array.isArray(jsonData) ? jsonData : jsonData.vocabulary || [];
          const vocabulary = parseJsonToVocabulary(words);
          resolve(vocabulary);
        } else if (file.name.endsWith('.csv')) {
          const csvText = e.target?.result as string;
          const vocabulary = parseCsvToVocabulary(csvText);
          resolve(vocabulary);
        } else {
          // Excel files
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
          const vocabulary = parseExcelRowsToVocabulary(jsonData);
          resolve(vocabulary);
        }
  });
}

/**
 * Convert VocabularyWord array to Excel file and trigger download
 */
export function exportVocabularyToExcel(
  vocabulary: VocabularyWord[],
  filename: string = "dutch-vocabulary.xlsx"
): void {
  const data = vocabulary.map((word) => ({
    Dutch: word.dutch,
    English: word.english,
    "Grammar Note": word.pos,
    "Present Tense": word.grammar?.present || "",
    "Past Tense": word.grammar?.past || "",
    "Future Tense": word.grammar?.future || "",
    "Example Sentence (Dutch)": word.example?.nl || "",
    "Example Sentence (English)": word.example?.en || "",
    "Practice Sentences": word.practice?.join(" | ") || "",
    Level: word.level,
    Categories: word.categories.join(", "),
    Progress: word.progress,
    Notes: word.notes || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Vocabulary");

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(data[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => String(row[key as keyof typeof row] || "").length)
    );
    return { wch: Math.min(maxLength + 2, maxWidth) };
  });
  worksheet["!cols"] = colWidths;

  XLSX.writeFile(workbook, filename);
}

/**
 * Helper to parse comma-separated values
 */
function parseCommaSeparated(value: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Load vocabulary from local storage
 */
export function loadVocabularyFromStorage(): VocabularyWord[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem("dutch-vocabulary");
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading vocabulary from storage:", error);
    return [];
  }
}

/**
 * Save vocabulary to local storage
 */
export function saveVocabularyToStorage(vocabulary: VocabularyWord[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("dutch-vocabulary", JSON.stringify(vocabulary));
  } catch (error) {
    console.error("Error saving vocabulary to storage:", error);
  }
}

/**
 * Update progress status for a word
 */
export function updateWordProgress(
  vocabulary: VocabularyWord[],
  wordId: string,
  progress: ProgressStatus
): VocabularyWord[] {
  return vocabulary.map((word) =>
    word.id === wordId
      ? { ...word, progress, lastReviewed: new Date().toISOString() }
      : word
  );
}

function parseExcelRowsToVocabulary(jsonData: ExcelRow[]): VocabularyWord[] {
  const vocabulary: VocabularyWord[] = [];
  const processedDutch = new Set<string>();

  return jsonData.map((row, index) => {
    const dutch = row['Dutch Word'] || row.Dutch || row.dutch || "";
    const english = row['English Translation'] || row.English || row.english || "";
    
    // Skip duplicates
    if (!dutch || !english || processedDutch.has(dutch.toLowerCase())) {
      return null as any;
    }
    processedDutch.add(dutch.toLowerCase());

    const grammarNote = row['Grammar Note'] || row['Part of Speech'] || row.pos || row.POS || "";
    const presentTense = row['Present Tense'] || row.PresentTense || "";
    const pastTense = row['Past Tense'] || row.PastTense || "";
    const futureTense = row['Future Tense'] || row.FutureTense || "";
    const exampleNL = row['Example Sentence (Dutch)'] || row['Example (NL)'] || row.example_nl || "";
    const exampleEN = row['Example Sentence (English)'] || row['Example (EN)'] || row.example_en || "";
    const practiceSentences = row['Practice Sentences'] || row.Practice || "";

    return {
      id: dutch.toLowerCase().replace(/\s+/g, "-") || `word-${index}`,
      dutch,
      english,
      pos: grammarNote,
      level: parseLevelString((row.Level || row.level || "A1") as string) as CEFRLevel,
      categories: parseCommaSeparated(
        row.Categories || row.categories || row.Category || ""
      ),
      functions: parseCommaSeparated(row.Functions || row.functions || ""),
      contexts: parseCommaSeparated(row.Contexts || row.contexts || ""),
      grammar: {
        present: presentTense,
        past: pastTense,
        future: futureTense,
      },
      example: {
        nl: exampleNL,
        en: exampleEN,
      },
      practice: parseCommaSeparated(practiceSentences),
      progress: (row.Progress || row.progress || "new") as ProgressStatus,
      notes: row.Notes || row.notes || "",
      createdAt: new Date().toISOString(),
    };
  }).filter(w => w !== null);
}

function parseCsvToVocabulary(csvContent: string): VocabularyWord[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const vocabulary: VocabularyWord[] = [];
  const processedDutch = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      const dutch = row['Dutch']?.trim() || row['dutch']?.trim() || "";
      const english = row['English']?.trim() || row['english']?.trim() || "";

      if (!dutch || !english || processedDutch.has(dutch.toLowerCase())) continue;
      processedDutch.add(dutch.toLowerCase());

      const word: VocabularyWord = {
        id: `${dutch}-${i}`,
        dutch,
        english,
        pos: row['Functions'] || row['functions'] || "",
        level: parseLevelString(row['Level'] || row['level'] || "A1-A2") as CEFRLevel,
        categories: parseCommaSeparated(row['Categories'] || row['categories'] || ""),
        functions: parseCommaSeparated(row['Functions'] || row['functions'] || ""),
        contexts: [],
        example: {
          nl: row['Example (NL)'] || row['Example NL'] || row['example_nl'] || "",
          en: row['Example (EN)'] || row['Example EN'] || row['example_en'] || "",
        },
        progress: (row['Progress'] || row['progress'] || "new") as ProgressStatus,
        practice: parseCommaSeparated(row['Practice'] || row['practice'] || ""),
        notes: row['Notes'] || row['notes'] || "",
        createdAt: new Date().toISOString(),
      };

      vocabulary.push(word);
    } catch (error) {
      console.error(`Error processing CSV line ${i}:`, error);
      continue;
    }
  }

  return vocabulary;
}

function parseJsonToVocabulary(jsonData: any[]): VocabularyWord[] {
  const vocabulary: VocabularyWord[] = [];
  const processedDutch = new Set<string>();

  jsonData.forEach((item, index) => {
    try {
      const dutch = item.dutch?.trim() || item.Dutch?.trim() || "";
      const english = item.english?.trim() || item.English?.trim() || "";

      if (!dutch || !english || processedDutch.has(dutch.toLowerCase())) return;
      processedDutch.add(dutch.toLowerCase());

      const categories = Array.isArray(item.categories) ? item.categories : parseCommaSeparated(item.categories || "");
      const functions = Array.isArray(item.functions) ? item.functions : parseCommaSeparated(item.functions || "");
      const practice = Array.isArray(item.practice) ? item.practice : parseCommaSeparated(item.practice || "");

      const word: VocabularyWord = {
        id: item.id || `${dutch}-${index}`,
        dutch,
        english,
        pos: item.pos || item.POS || "",
        level: parseLevelString(item.level || item.Level || "A1-A2") as CEFRLevel,
        categories: categories.length > 0 ? categories : [],
        functions,
        contexts: Array.isArray(item.contexts) ? item.contexts : [],
        example: {
          nl: item.example?.nl || item.exampleNL || item.example_nl || "",
          en: item.example?.en || item.exampleEN || item.example_en || "",
        },
        progress: (item.progress || "new") as ProgressStatus,
        practice,
        notes: item.notes || "",
        createdAt: item.createdAt || new Date().toISOString(),
      };

      vocabulary.push(word);
    } catch (error) {
      console.error(`Error processing JSON item ${index}:`, error);
    }
  });

  return vocabulary;
}

function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

function parseLevelString(levelStr: string): string {
  if (!levelStr || levelStr.trim() === '') return 'A1-A2';
  
  const level = levelStr.trim().toUpperCase();
  
  // Handle grouped levels like "a1 a2" or "b1 b2"
  if (level.includes(' ')) {
    const parts = level.split(' ').map(p => p.trim()).filter(p => p);
    if (parts.length === 2) {
      const [first, second] = parts;
      if (first[0] === second[0]) {
        return `${first}-${second}`;
      }
    }
  }
  
  // Already in correct format
  if (level.match(/^[ABC][12](-[ABC][12])?$/)) {
    return level;
  }
  
  return 'A1-A2';
}
