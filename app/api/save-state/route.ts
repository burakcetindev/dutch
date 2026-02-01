import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

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
    
    try {
      await client.query('BEGIN');
      
      // Clear existing data
      await client.query('DELETE FROM vocabulary');
      
      // Insert all words
      for (const word of validatedVocab) {
        const level = word.level || 'A1'; // Default to A1 if not specified
        const progress = word.progress || 'new';
        
        // Validate level is in correct format (A1-C2)
        const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const finalLevel = validLevels.includes(level) ? level : 'A1';
        
        // Validate progress
        const validProgress = ['new', 'learning', 'mastered'].includes(progress) ? progress : 'new';
        
        await client.query(
          `INSERT INTO vocabulary 
           (id, dutch, english, level, categories, functions, example_nl, example_en, progress, practice)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
           dutch = EXCLUDED.dutch,
           english = EXCLUDED.english,
           level = EXCLUDED.level,
           categories = EXCLUDED.categories,
           functions = EXCLUDED.functions,
           example_nl = EXCLUDED.example_nl,
           example_en = EXCLUDED.example_en,
           progress = EXCLUDED.progress,
           practice = EXCLUDED.practice,
           updated_at = CURRENT_TIMESTAMP`,
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
      }
      
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        saved: validatedVocab.length,
        message: `✅ Successfully saved ${validatedVocab.length} words to database!`
      });
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
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
