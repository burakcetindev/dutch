import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { VocabularyWord, CEFRLevel, ProgressStatus } from "@/types/vocabulary";
import { autoCategorize } from "@/lib/categorization";

// Force this route to run server-side only
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const inputDir = path.join(process.cwd(), "input");

    // Check if input directory exists
    if (!fs.existsSync(inputDir)) {
      console.error("Input directory not found:", inputDir);
      return NextResponse.json(
        { error: "Input directory not found", path: inputDir },
        { status: 404 }
      );
    }

    // Get all Excel files from input directory
    const files = fs
      .readdirSync(inputDir)
      .filter(
        (file) =>
          file.endsWith(".xlsx") || file.endsWith(".xls")
      );

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No Excel files found in input directory" },
        { status: 404 }
      );
    }

    // Parse all Excel files
    const allVocabulary: VocabularyWord[] = [];
    const processedIds = new Set<string>();

    for (const file of files) {
      try {
        const filePath = path.join(inputDir, file);
        
        // Read file as buffer
        const buffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      jsonData.forEach((row, index) => {
        const dutch = row['Dutch Word'] || row.Dutch || row.dutch || "";
        const english = row['English Translation'] || row.English || row.english || "";
        const grammarNote = row['Grammar Note'] || row['Part of Speech'] || row.pos || row.POS || "";
        const presentTense = row['Present Tense'] || row.PresentTense || "";
        const pastTense = row['Past Tense'] || row.PastTense || "";
        const futureTense = row['Future Tense'] || row.FutureTense || "";
        const exampleNL = row['Example Sentence (Dutch)'] || row['Example (NL)'] || row.example_nl || "";
        const exampleEN = row['Example Sentence (English)'] || row['Example (EN)'] || row.example_en || "";
        const practiceSentences = row['Practice Sentences'] || row.Practice || "";

        if (!dutch || !english) return; // Skip empty rows

        const id = dutch.toLowerCase().replace(/\s+/g, "-");

        // Skip duplicates
        if (processedIds.has(id)) return;
        processedIds.add(id);

        // Parse categories from Excel, or auto-categorize if none provided
        const excelCategories = parseCommaSeparated(
          row.Categories || row.categories || row.Category || ""
        );
        const categories = excelCategories.length > 0 
          ? excelCategories 
          : autoCategorize(dutch, english);

        const word: VocabularyWord = {
          id,
          dutch,
          english,
          pos: grammarNote,
          level: (row.Level || row.level || "A1") as CEFRLevel,
          categories,
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

        allVocabulary.push(word);
      });
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError);
        // Continue with other files
      }
    }

    return NextResponse.json({
      vocabulary: allVocabulary,
      filesProcessed: files.length,
      totalWords: allVocabulary.length,
    });
  } catch (error) {
    console.error("Error loading vocabulary:", error);
    return NextResponse.json(
      { error: "Failed to load vocabulary files" },
      { status: 500 }
    );
  }
}

function parseCommaSeparated(value: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
