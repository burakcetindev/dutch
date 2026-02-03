import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  let client;
  
  try {
    client = await pool.connect();
    
    // Export ALL data from PostgreSQL database
    const result = await client.query(
      `SELECT id, dutch, english, pos, level, categories, functions, 
              example_nl, example_en, progress, practice, notes,
              grammar_present, grammar_past, grammar_future, grammar_separable,
              created_at, updated_at, last_reviewed
       FROM vocabulary 
       ORDER BY dutch ASC`
    );
    
    const allVocabulary = result.rows;
    
    if (allVocabulary.length === 0) {
      return NextResponse.json(
        { error: 'No vocabulary found in database' },
        { status: 400 }
      );
    }
    
    // Create backup files with timestamp
    const backupFiles: string[] = [];
    try {
      const inputDir = process.env.NODE_ENV === 'production' ? '/app/input' : path.join(process.cwd(), 'input');
      
      if (!fs.existsSync(inputDir)) {
        fs.mkdirSync(inputDir, { recursive: true });
      }
      
      const now = new Date();
      const timestamp = now.toISOString()
        .replace(/T/, '_')
        .replace(/:/g, '-')
        .split('.')[0]; // Format: 2026-02-01_14-30-45
      
      // Create NEW backup files first (don't delete old ones yet)
      const csvPath = path.join(inputDir, `vocabulary_backup_${timestamp}.csv`);
      const jsonPath = path.join(inputDir, `vocabulary_backup_${timestamp}.json`);
      
      // Create CSV backup in the same format as the import
      const csvHeader = 'Dutch,English,Level,Categories,Functions,Example (NL),Example (EN),Progress,Practice\n';
      const csvRows = allVocabulary.map(word => {
        const categories = Array.isArray(word.categories) ? word.categories.join(', ') : '';
        const functions = Array.isArray(word.functions) ? word.functions.join(', ') : '';
        const practice = Array.isArray(word.practice) ? word.practice.join(', ') : '';
        return [
          `"${(word.dutch || '').replace(/"/g, '""')}"`,
          `"${(word.english || '').replace(/"/g, '""')}"`,
          word.level || 'A1-A2',
          `"${categories}"`,
          `"${functions}"`,
          `"${(word.example_nl || '').replace(/"/g, '""')}"`,
          `"${(word.example_en || '').replace(/"/g, '""')}"`,
          word.progress || 'new',
          `"${practice}"`
        ].join(',');
      });
      fs.writeFileSync(csvPath, csvHeader + csvRows.join('\n'));
      backupFiles.push(`vocabulary_backup_${timestamp}.csv`);
      
      // Create JSON backup with full data
      const jsonData = allVocabulary.map(word => ({
        id: word.id,
        dutch: word.dutch,
        english: word.english,
        pos: word.pos,
        level: word.level,
        categories: word.categories,
        functions: word.functions,
        example: {
          nl: word.example_nl,
          en: word.example_en
        },
        progress: word.progress,
        practice: word.practice,
        notes: word.notes,
        grammar: {
          present: word.grammar_present,
          past: word.grammar_past,
          future: word.grammar_future,
          separable: word.grammar_separable
        },
        createdAt: word.created_at,
        updatedAt: word.updated_at,
        lastReviewed: word.last_reviewed
      }));
      fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
      backupFiles.push(`vocabulary_backup_${timestamp}.json`);
      
      // Verify the backup files were created successfully
      if (!fs.existsSync(csvPath) || !fs.existsSync(jsonPath)) {
        throw new Error('Backup files were not created successfully');
      }
      
      // Only NOW delete old backup files (after new ones are verified)
      const existingFiles = fs.readdirSync(inputDir);
      const oldBackups = existingFiles.filter(file => 
        file.startsWith('vocabulary_backup_') && 
        (file.endsWith('.csv') || file.endsWith('.json')) &&
        file !== `vocabulary_backup_${timestamp}.csv` &&
        file !== `vocabulary_backup_${timestamp}.json`
      );
      
      for (const oldBackup of oldBackups) {
        try {
          fs.unlinkSync(path.join(inputDir, oldBackup));
          console.log(`Deleted old backup: ${oldBackup}`);
        } catch (err) {
          console.error(`Failed to delete ${oldBackup}:`, err);
        }
      }
      
    } catch (backupError) {
      console.error('Backup creation failed:', backupError);
      return NextResponse.json(
        { error: 'Failed to create backup: ' + (backupError instanceof Error ? backupError.message : 'Unknown error') },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      saved: allVocabulary.length,
      backupFiles,
      message: `✅ Successfully exported ${allVocabulary.length} word${allVocabulary.length !== 1 ? 's' : ''} to backup files!`
    });
  } catch (error) {
    console.error('Save state error:', error);
    return NextResponse.json(
      { error: 'Failed to save state: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
