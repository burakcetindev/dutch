import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  let client;
  
  try {
    client = await pool.connect();
    const body = await request.json();
    const { vocabulary } = body;
    
    if (!vocabulary || !Array.isArray(vocabulary)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Validate vocabulary data before saving
    const validatedVocab = vocabulary.filter(word => {
      return word.id && word.dutch && word.english;
    });
    
    if (validatedVocab.length === 0) {
      return NextResponse.json(
        { error: 'No valid words to save' },
        { status: 400 }
      );
    }
    
    // Check for duplicates in the batch
    const dutchWords = new Set<string>();
    const duplicateWords: string[] = [];
    
    for (const word of validatedVocab) {
      const dutchLower = word.dutch.toLowerCase();
      if (dutchWords.has(dutchLower)) {
        duplicateWords.push(word.dutch);
      }
      dutchWords.add(dutchLower);
    }
    
    let saved = 0;
    let duplicatesFound = 0;
    
    try {
      for (const word of validatedVocab) {
        // Check if word already exists in database
        const existing = await client.query(
          'SELECT id FROM vocabulary WHERE LOWER(dutch) = LOWER($1)',
          [word.dutch]
        );
        
        if (existing.rows.length > 0) {
          duplicatesFound++;
          continue;
        }
        
        const level = word.level || 'A1';
        const progress = word.progress || 'new';
        
        const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const finalLevel = validLevels.includes(level) ? level : 'A1';
        const validProgress = ['new', 'learning', 'mastered'].includes(progress) ? progress : 'new';
        
        await client.query(
          `INSERT INTO vocabulary 
           (id, dutch, english, level, categories, functions, example_nl, example_en, progress, practice)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [
            word.id,
            word.dutch,
            word.english,
            finalLevel,
            word.categories ? Array.isArray(word.categories) ? word.categories : [] : [],
            word.functions ? Array.isArray(word.functions) ? word.functions : [] : [],
            word.example?.nl || null,
            word.example?.en || null,
            validProgress,
            word.practice ? Array.isArray(word.practice) ? word.practice : [] : []
          ]
        );
        
        saved++;
      }
      
      // Try to backup to input folder (non-blocking)
      try {
        const inputDir = '/app/input';
        if (fs.existsSync(inputDir)) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
          const backupPath = path.join(inputDir, `vocabulary_backup_${timestamp}.json`);
          
          // Only create backup if it doesn't already exist today
          if (!fs.existsSync(backupPath)) {
            fs.writeFileSync(backupPath, JSON.stringify(vocabulary, null, 2));
          }
        }
      } catch (backupError) {
        // Silently fail on backup - don't affect the main save
        console.warn('Backup write skipped (expected in read-only mode):', (backupError as Error).message);
      }
      
      return NextResponse.json({
        success: true,
        saved,
        duplicates: duplicatesFound,
        message: saved > 0 
          ? `✅ Successfully saved ${saved} word${saved !== 1 ? 's' : ''}!${duplicatesFound > 0 ? ` (${duplicatesFound} duplicate${duplicatesFound !== 1 ? 's' : ''} skipped)` : ''}`
          : `⚠️ All ${duplicatesFound} word${duplicatesFound !== 1 ? 's' : ''} already exist in the database`
      });
    } catch (error) {
      throw error;
    }
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
