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

    // Get all supported file types from input directory
    const files = fs
      .readdirSync(inputDir)
      .filter(
        (file) =>
          file.endsWith(".xlsx") || file.endsWith(".xls") || 
          file.endsWith(".csv") || file.endsWith(".json")
      );

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No supported files found in input directory (xlsx, xls, csv, json)" },
        { status: 404 }
      );
    }

    // Parse all files
    const allVocabulary: VocabularyWord[] = [];
    const processedDutch = new Set<string>(); // Use Dutch word as key to avoid duplicates

    for (const file of files) {
      try {
        const filePath = path.join(inputDir, file);
        
        if (file.endsWith('.json')) {
          const jsonContent = fs.readFileSync(filePath, 'utf-8');
          const jsonData = JSON.parse(jsonContent);
          const words = Array.isArray(jsonData) ? jsonData : jsonData.vocabulary || [];
          processJsonVocabulary(words, allVocabulary, processedDutch);
        } else if (file.endsWith('.csv')) {
          const csvContent = fs.readFileSync(filePath, 'utf-8');
          processCsvVocabulary(csvContent, allVocabulary, processedDutch);
        } else {
          // Excel files (xlsx, xls)
          const buffer = fs.readFileSync(filePath);
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
          processExcelVocabulary(jsonData, allVocabulary, processedDutch);
        }
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

function processCsvVocabulary(csvContent: string, allVocabulary: VocabularyWord[], processedDutch: Set<string>) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return;

  const headers = parseCSVLine(lines[0]);
  const headerMap = new Map<string, number>();
  
  // Create flexible header mapping
  headers.forEach((header, index) => {
    headerMap.set(header.toLowerCase(), index);
  });

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      const dutch = row['Dutch']?.trim() || row['dutch']?.trim() || "";
      const english = row['English']?.trim() || row['english']?.trim() || "";

      if (!dutch || !english) continue;

      // Skip duplicates
      if (processedDutch.has(dutch.toLowerCase())) continue;
      processedDutch.add(dutch.toLowerCase());

      const level = parseLevelString(row['Level'] || row['level'] || "A1-A2");
      const categories = parseCommaSeparated(row['Categories'] || row['categories'] || "");
      const functions = parseCommaSeparated(row['Functions'] || row['functions'] || "");

      const word: VocabularyWord = {
        id: `${dutch}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dutch,
        english,
        pos: row['Functions'] || row['functions'] || "",
        level: level as CEFRLevel,
        categories: categories.length > 0 ? categories : autoCategorize(dutch, english),
        functions,
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

      allVocabulary.push(word);
    } catch (error) {
      console.error(`Error processing CSV line ${i}:`, error);
      continue;
    }
  }
}

function processJsonVocabulary(jsonData: any[], allVocabulary: VocabularyWord[], processedDutch: Set<string>) {
  jsonData.forEach((item, index) => {
    try {
      const dutch = item.dutch?.trim() || item.Dutch?.trim() || "";
      const english = item.english?.trim() || item.English?.trim() || "";

      if (!dutch || !english) return;

      // Skip duplicates
      if (processedDutch.has(dutch.toLowerCase())) return;
      processedDutch.add(dutch.toLowerCase());

      const level = parseLevelString(item.level || item.Level || "A1-A2");
      const categories = Array.isArray(item.categories) ? item.categories : parseCommaSeparated(item.categories || "");
      const functions = Array.isArray(item.functions) ? item.functions : parseCommaSeparated(item.functions || "");
      const practice = Array.isArray(item.practice) ? item.practice : parseCommaSeparated(item.practice || "");

      const word: VocabularyWord = {
        id: item.id || `${dutch}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dutch,
        english,
        pos: item.pos || item.POS || "",
        level: level as CEFRLevel,
        categories: categories.length > 0 ? categories : autoCategorize(dutch, english),
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

      allVocabulary.push(word);
    } catch (error) {
      console.error(`Error processing JSON item ${index}:`, error);
    }
  });
}

function processExcelVocabulary(jsonData: any[], allVocabulary: VocabularyWord[], processedDutch: Set<string>) {
  jsonData.forEach((row, index) => {
    try {
      const dutch = row['Dutch Word'] || row.Dutch || row.dutch || "";
      const english = row['English Translation'] || row.English || row.english || "";

      if (!dutch || !english) return;

      // Skip duplicates
      if (processedDutch.has(dutch.toLowerCase())) return;
      processedDutch.add(dutch.toLowerCase());

      const grammarNote = row['Grammar Note'] || row['Part of Speech'] || row.pos || row.POS || "";
      const exampleNL = row['Example Sentence (Dutch)'] || row['Example (NL)'] || row.example_nl || "";
      const exampleEN = row['Example Sentence (English)'] || row['Example (EN)'] || row.example_en || "";

      const level = parseLevelString(row['Level'] || row.level || "A1");
      const excelCategories = parseCommaSeparated(row.Categories || row.categories || row.Category || "");
      const categories = excelCategories.length > 0 
        ? excelCategories 
        : autoCategorize(dutch, english);

      const word: VocabularyWord = {
        id: `${dutch}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dutch,
        english,
        pos: grammarNote,
        level: level as CEFRLevel,
        categories,
        functions: parseCommaSeparated(row.Functions || row.functions || ""),
        contexts: parseCommaSeparated(row.Contexts || row.contexts || ""),
        grammar: {
          present: row['Present Tense'] || row.PresentTense || "",
          past: row['Past Tense'] || row.PastTense || "",
          future: row['Future Tense'] || row.FutureTense || "",
        },
        example: {
          nl: exampleNL,
          en: exampleEN,
        },
        practice: parseCommaSeparated(row['Practice Sentences'] || row.Practice || ""),
        progress: (row.Progress || row.progress || "new") as ProgressStatus,
        notes: row.Notes || row.notes || "",
        createdAt: new Date().toISOString(),
      };

      allVocabulary.push(word);
    } catch (error) {
      console.error(`Error processing Excel row ${index}:`, error);
    }
  });
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
