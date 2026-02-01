import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { VocabularyWord } from '@/types/vocabulary';

// GET - Fetch all vocabulary
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM vocabulary ORDER BY created_at DESC'
    );
    
    const vocabulary: VocabularyWord[] = result.rows.map((row: any) => ({
      id: row.id,
      dutch: row.dutch,
      english: row.english,
      pos: row.pos || '',
      level: row.level as any,
      categories: row.categories || [],
      functions: row.functions || [],
      grammar: row.grammar_present || row.grammar_past || row.grammar_future ? {
        present: row.grammar_present,
        past: row.grammar_past,
        future: row.grammar_future,
        separable: row.grammar_separable
      } : undefined,
      example: row.example_nl && row.example_en ? {
        nl: row.example_nl,
        en: row.example_en
      } : undefined,
      progress: row.progress as any,
      practice: row.practice || [],
      notes: row.notes,
      createdAt: row.created_at,
      lastReviewed: row.last_reviewed
    }));
    
    return NextResponse.json({ vocabulary });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary' },
      { status: 500 }
    );
  }
}

// POST - Add new word or bulk import
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { words } = body;
    
    if (!words || !Array.isArray(words)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const inserted = [];
      const duplicates = [];
      
      for (const word of words) {
        // Check for duplicate
        const existing = await client.query(
          'SELECT id FROM vocabulary WHERE dutch = $1',
          [word.dutch]
        );
        
        if (existing.rows.length > 0) {
          duplicates.push(word.dutch);
          continue;
        }
        
        // Generate unique ID if not provided
        const wordId = word.id || `${word.dutch}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Insert new word with all fields including grammar
        await client.query(
          `INSERT INTO vocabulary 
           (id, dutch, english, pos, level, categories, functions, example_nl, example_en, progress, practice, 
            grammar_present, grammar_past, grammar_future, grammar_separable, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            wordId,
            word.dutch,
            word.english,
            word.pos || '',
            word.level || 'A1-A2',
            word.categories || [],
            word.functions || [],
            word.example?.nl || null,
            word.example?.en || null,
            word.progress || 'new',
            word.practice || [],
            word.grammar?.present || null,
            word.grammar?.past || null,
            word.grammar?.future || null,
            word.grammar?.separable || false,
            word.notes || null
          ]
        );
        
        inserted.push(wordId);
      }
      
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        inserted: inserted.length,
        duplicates: duplicates.length,
        duplicateWords: duplicates
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to add vocabulary' },
      { status: 500 }
    );
  }
}

// PUT - Update word (progress, practice sentences, examples, etc)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;
    
    if (!id || !updates) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const setClauses = [];
    const values = [];
    let valueIndex = 1;
    
    // Allow updating all fields
    if (updates.dutch !== undefined) {
      setClauses.push(`dutch = $${valueIndex++}`);
      values.push(updates.dutch);
    }
    
    if (updates.english !== undefined) {
      setClauses.push(`english = $${valueIndex++}`);
      values.push(updates.english);
    }
    
    if (updates.progress !== undefined) {
      setClauses.push(`progress = $${valueIndex++}`);
      values.push(updates.progress);
    }
    
    if (updates.practice !== undefined) {
      setClauses.push(`practice = $${valueIndex++}`);
      values.push(updates.practice);
    }
    
    if (updates.level !== undefined) {
      setClauses.push(`level = $${valueIndex++}`);
      values.push(updates.level);
    }
    
    if (updates.categories !== undefined) {
      setClauses.push(`categories = $${valueIndex++}`);
      values.push(updates.categories);
    }
    
    if (updates.functions !== undefined) {
      setClauses.push(`functions = $${valueIndex++}`);
      values.push(updates.functions);
    }
    
    if (updates.example_nl !== undefined) {
      setClauses.push(`example_nl = $${valueIndex++}`);
      values.push(updates.example_nl);
    }
    
    if (updates.example_en !== undefined) {
      setClauses.push(`example_en = $${valueIndex++}`);
      values.push(updates.example_en);
    }
    
    if (setClauses.length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }
    
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE vocabulary 
      SET ${setClauses.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      );
    }
    
    const row = result.rows[0];
    const word: VocabularyWord = {
      id: row.id,
      dutch: row.dutch,
      english: row.english,
      pos: row.pos || '',
      level: row.level,
      categories: row.categories || [],
      functions: row.functions || [],
      grammar: row.grammar_present || row.grammar_past || row.grammar_future ? {
        present: row.grammar_present,
        past: row.grammar_past,
        future: row.grammar_future,
        separable: row.grammar_separable
      } : undefined,
      example: row.example_nl && row.example_en ? {
        nl: row.example_nl,
        en: row.example_en
      } : undefined,
      progress: row.progress,
      practice: row.practice || [],
      notes: row.notes,
      createdAt: row.created_at,
      lastReviewed: row.last_reviewed
    };
    
    return NextResponse.json({ success: true, word });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update vocabulary' },
      { status: 500 }
    );
  }
}

// DELETE - Remove word
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Word ID required' },
        { status: 400 }
      );
    }
    
    const result = await pool.query(
      'DELETE FROM vocabulary WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete vocabulary' },
      { status: 500 }
    );
  }
}
