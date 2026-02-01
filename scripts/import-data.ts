import fs from 'fs';
import path from 'path';
import pool from '../lib/db';

interface VocabularyRecord {
  dutch: string;
  english: string;
  level: string;
  categories: string[];
  functions: string[];
  example_nl: string;
  example_en: string;
  progress: string;
  practice: string[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
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

function normalizeValue(value: string): string {
  if (!value || value.trim() === '') {
    return '-';
  }
  return value.trim();
}

function parseLevelValue(levelStr: string): string {
  if (!levelStr || levelStr.trim() === '') return 'A1-A2';
  
  levelStr = levelStr.trim().toLowerCase();
  
  // Handle grouped format: "a1 a2 | b1 b2 | c1 c2" - extract first group
  if (levelStr.includes('|')) {
    levelStr = levelStr.split('|')[0].trim();
  }
  
  // Extract the first level mentioned (a1, a2, b1, b2, c1, c2)
  const match = levelStr.match(/([a-c])([12])/);
  if (!match) return 'A1-A2';
  
  const letter = match[1].toUpperCase();
  
  // Convert individual level to grouped level
  if (letter === 'A') return 'A1-A2';
  if (letter === 'B') return 'B1-B2';
  if (letter === 'C') return 'C1-C2';
  
  return 'A1-A2';
}

function parseCSV(csvContent: string): VocabularyRecord[] {
  const lines = csvContent.trim().split('\n');
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  // Map common header variations
  const headerMap: Record<string, string> = {
    'Dutch Word': 'Dutch',
    'Dutch': 'Dutch',
    'dutch': 'Dutch',
    'English Translation': 'English',
    'English': 'English',
    'english': 'English',
    'Grammar Note (POS, gender, separable verb, etc.)': 'Functions',
    'Functions': 'Functions',
    'functions': 'Functions',
    'Level': 'Level',
    'level': 'Level',
    'Categories': 'Categories',
    'categories': 'Categories',
    'Example Sentence (Dutch)': 'Example (NL)',
    'Example Sentence (English)': 'Example (EN)',
    'Example (NL)': 'Example (NL)',
    'Example (EN)': 'Example (EN)',
    'Present Tense': 'Present',
    'Past Tense': 'Past',
    'Future Tense': 'Future',
    'Progress': 'Progress',
    'progress': 'Progress'
  };
  
  const records: VocabularyRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < 1 || !values[0] || !values[0].trim()) continue;

    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      const normalizedHeader = headerMap[header] || header;
      record[normalizedHeader] = values[index] || '';
    });

    // Extract Dutch word (required)
    const dutch = normalizeValue(record['Dutch'] || '');
    if (!dutch || dutch === '-') continue;

    // Extract English translation (required for this app)
    const english = normalizeValue(record['English'] || '');
    if (!english || english === '-') continue;

    // Map CSV headers to normalized names with proper level parsing
    const levelRaw = record['Level'] || 'A1-A2';
    const level = parseLevelValue(levelRaw);
    
    const categories = (record['Categories'] || '')
      .split(',')
      .map(c => normalizeValue(c))
      .filter(c => c !== '-');
    
    const functions = (record['Functions'] || '')
      .split(',')
      .map(f => normalizeValue(f))
      .filter(f => f !== '-');
      
    const practice = (record['Practice'] || record['practice'] || '')
      .split(',')
      .map(p => normalizeValue(p))
      .filter(p => p !== '-');

    records.push({
      dutch,
      english,
      level,
      categories,
      functions,
      example_nl: normalizeValue(record['Example (NL)'] || ''),
      example_en: normalizeValue(record['Example (EN)'] || ''),
      progress: normalizeValue(record['Progress'] || 'new'),
      practice
    });
  }

  return records;
}

async function importCSVFile(filePath: string): Promise<{ inserted: number; updated: number; duplicates: number; errors: Array<{word: string; reason: string}> }> {
  const stats = {
    inserted: 0,
    updated: 0,
    duplicates: 0,
    errors: [] as Array<{word: string; reason: string}>
  };

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parseCSV(fileContent);
    const fileName = path.basename(filePath);

    console.log(`\n📄 Importing: ${fileName}`);
    console.log(`   Found ${records.length} records`);

    for (const record of records) {
      try {
        const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'A1-A2', 'B1-B2', 'C1-C2'];
        if (!validLevels.includes(record.level)) {
          stats.errors.push({ word: record.dutch, reason: `Invalid level: ${record.level}` });
          continue;
        }

        // Create unique ID from dutch word
        const id = record.dutch.toLowerCase().replace(/\s+/g, '-').substring(0, 255);
        
        // Check for duplicates
        const existingCheck = await pool.query(
          'SELECT id FROM vocabulary WHERE LOWER(dutch) = LOWER($1)',
          [record.dutch]
        );

        if (existingCheck.rows.length > 0) {
          stats.duplicates++;
          continue;
        }

        await pool.query(
          `INSERT INTO vocabulary 
          (id, dutch, english, level, categories, functions, example_nl, example_en, progress, practice)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
          dutch = $2, english = $3, level = $4, categories = $5, 
          functions = $6, example_nl = $7, example_en = $8, 
          progress = $9, practice = $10, updated_at = NOW()`,
          [
            id,
            record.dutch.substring(0, 255),
            record.english.substring(0, 255),
            record.level,
            record.categories.length > 0 ? record.categories : null,
            record.functions.length > 0 ? record.functions : null,
            record.example_nl.substring(0, 1000),
            record.example_en.substring(0, 1000),
            record.progress,
            record.practice.length > 0 ? record.practice : null
          ]
        );

        stats.inserted++;
      } catch (err) {
        stats.errors.push({
          word: record.dutch,
          reason: (err as Error).message
        });
      }
    }

    console.log(`   ✓ Inserted: ${stats.inserted}, Duplicates skipped: ${stats.duplicates}`);
    if (stats.errors.length > 0) {
      console.log(`   ⚠ Errors: ${stats.errors.length}`);
      // Show first 3 errors for debugging
      stats.errors.slice(0, 3).forEach(err => {
        console.log(`      - "${err.word}": ${err.reason}`);
      });
    }

    return stats;
  } catch (error) {
    console.error(`❌ Failed to import ${filePath}:`, error);
    return stats;
  }
}

async function importAllCSVs() {
  try {
    const inputDir = '/app/input/remove_after_use';
    const backupDir = '/app/input';

    if (!fs.existsSync(inputDir)) {
      console.log(`ℹ Directory not found: ${inputDir}`);
      process.exit(0);
    }

    const csvFiles = fs.readdirSync(inputDir)
      .filter(f => f.toLowerCase().endsWith('.csv'))
      .map(f => path.join(inputDir, f));

    if (csvFiles.length === 0) {
      console.log('ℹ No CSV files found');
      process.exit(0);
    }

    console.log(`\n🚀 Starting import of ${csvFiles.length} CSV file(s)...\n`);

    let totalInserted = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;
    const allErrorDetails: Array<{file: string; word: string; reason: string}> = [];

    for (const csvFile of csvFiles) {
      const result = await importCSVFile(csvFile);
      totalInserted += result.inserted;
      totalDuplicates += result.duplicates;
      totalErrors += result.errors.length;
      result.errors.forEach(err => {
        allErrorDetails.push({
          file: path.basename(csvFile),
          word: err.word,
          reason: err.reason
        });
      });
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Total inserted: ${totalInserted}`);
    console.log(`   Total duplicates skipped: ${totalDuplicates}`);
    console.log(`   Total errors: ${totalErrors}`);

    if (allErrorDetails.length > 0 && allErrorDetails.length <= 10) {
      console.log(`\n⚠ Error details:`);
      allErrorDetails.forEach(err => {
        console.log(`   ${err.file}: "${err.word}" - ${err.reason}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importAllCSVs();
