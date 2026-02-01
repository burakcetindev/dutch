import fs from 'fs';
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

function parseCSV(csvContent: string): VocabularyRecord[] {
  const lines = csvContent.trim().split('\n');
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  const records: VocabularyRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < 2 || !values[0]) continue; // Skip empty lines

    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });

    // Map CSV headers to normalized names
    const levelRaw = record['Level'] || 'A1';
    // Convert "A1-A2" to "A1" or "B1-B2" to "B1" etc
    const level = levelRaw.split('-')[0] || 'A1';
    
    const categories = record['Categories'] ? 
      record['Categories'].split(',').map(c => c.trim()).filter(c => c) : [];
    
    const functions = record['Functions'] ? 
      record['Functions'].split(',').map(f => f.trim()).filter(f => f) : [];
      
    const practice = record['Practice'] ? 
      record['Practice'].split(',').map(p => p.trim()).filter(p => p) : [];

    records.push({
      dutch: record['Dutch'],
      english: record['English'],
      level,
      categories,
      functions,
      example_nl: record['Example (NL)'] || '',
      example_en: record['Example (EN)'] || '',
      progress: record['Progress'] || 'new',
      practice
    });
  }

  return records;
}

async function importCSV() {
  try {
    const csvPath = '/app/input/vocabulary_backup_2026-02-01.csv';
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parseCSV(fileContent);

    console.log(`Processing ${records.length} records...`);

    const batchSize = 100;
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      for (const record of batch) {
        try {
          // Skip records without required fields
          if (!record.dutch || !record.english) {
            skipped++;
            continue;
          }
          
          // Validate level
          const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
          if (!validLevels.includes(record.level)) {
            console.warn(`Skipping "${record.dutch}" - invalid level: ${record.level}`);
            skipped++;
            continue;
          }

          // Create unique ID from dutch word
          const id = record.dutch.toLowerCase().replace(/\s+/g, '-').substring(0, 255);
          
          const result = await pool.query(
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
              record.categories,
              record.functions,
              record.example_nl.substring(0, 500),
              record.example_en.substring(0, 500),
              record.progress,
              record.practice
            ]
          );

          if (result.command === 'INSERT') {
            inserted++;
          } else {
            updated++;
          }
        } catch (err) {
          console.error(`Error inserting record for "${record.dutch}":`, (err as Error).message);
        }
      }
      
      const processed = Math.min(i + batchSize, records.length);
      console.log(`Processed ${processed}/${records.length}`);
    }

    console.log(`✅ Import complete! Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importCSV();
