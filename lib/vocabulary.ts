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
    reader.readAsBinaryString(file);
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
