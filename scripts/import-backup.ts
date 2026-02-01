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

function parseCategories(catStr: string): string[] {
  if (!catStr || catStr.trim() === '') return [];
  return catStr.split(',').map(c => normalizeValue(c)).filter(c => c !== '-' && c.length > 0);
}

async function importBackup() {
  const backupFile = '/app/input/vocabulary_backup_2026-02-01.csv';
  
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  console.log(`🚀 Importing backup from: ${backupFile}\n`);

  try {
    const csvContent = fs.readFileSync(backupFile, 'utf-8');
    const lines = csvContent.trim().split('\n');
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    
    console.log(`📊 Headers: ${headers.join(', ')}\n`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let inserted = 0;
      let duplicates = 0;
      let errors: Array<{ word: string; reason: string }> = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        if (values.length < 2 || !values[0] || !values[0].trim()) continue;

        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });

        try {
          const dutch = normalizeValue(record['Dutch'] || '');
          const english = normalizeValue(record['English'] || '');
          
          if (!dutch || dutch === '-' || !english || english === '-') continue;

          // Check for duplicate (case-insensitive)
          const existing = await client.query(
            'SELECT id FROM vocabulary WHERE LOWER(dutch) = LOWER($1)',
            [dutch]
          );

          if (existing.rows.length > 0) {
            duplicates++;
            continue;
          }

          // Generate unique ID
          const id = dutch.toLowerCase().replace(/\s+/g, '-').substring(0, 255);

          const level = normalizeValue(record['Level'] || 'A1-A2');
          const categories = parseCategories(record['Categories'] || '');
          const functions = parseCategories(record['Functions'] || '');
          const example_nl = normalizeValue(record['Example (NL)'] || '');
          const example_en = normalizeValue(record['Example (EN)'] || '');
          const progress = normalizeValue(record['Progress'] || 'new');

          await client.query(
            `INSERT INTO vocabulary 
            (id, dutch, english, level, categories, functions, example_nl, example_en, progress, practice)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET
            dutch = $2, english = $3, level = $4, categories = $5, 
            functions = $6, example_nl = $7, example_en = $8, 
            progress = $9, practice = $10, updated_at = NOW()`,
            [
              id,
              dutch.substring(0, 255),
              english.substring(0, 255),
              level,
              categories.length > 0 ? categories : null,
              functions.length > 0 ? functions : null,
              example_nl.substring(0, 1000),
              example_en.substring(0, 1000),
              progress,
              null
            ]
          );

          inserted++;
          if (inserted % 100 === 0) {
            console.log(`   ✓ Inserted ${inserted} records...`);
          }
        } catch (err) {
          errors.push({
            word: record['Dutch'] || 'unknown',
            reason: (err as Error).message
          });
        }
      }

      await client.query('COMMIT');

      console.log(`\n✅ Backup import complete!`);
      console.log(`   Total inserted: ${inserted}`);
      console.log(`   Total duplicates skipped: ${duplicates}`);
      if (errors.length > 0) {
        console.log(`   Errors: ${errors.length}`);
        errors.slice(0, 5).forEach(err => {
          console.log(`      - "${err.word}": ${err.reason}`);
        });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importBackup();
