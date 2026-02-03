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
      const updated = [];
      const skipped = [];
      
      for (const word of words) {
        // Validate required fields
        if (!word.dutch || !word.english) {
          continue; // Skip words without required fields
        }

        // Check for duplicate (case-insensitive)
        const existing = await client.query(
          'SELECT * FROM vocabulary WHERE LOWER(dutch) = LOWER($1)',
          [word.dutch]
        );
        
        if (existing.rows.length > 0) {
          // Word exists - check if new data has better/longer example or additional practice
          const existingWord = existing.rows[0];
          const existingExampleLength = (existingWord.example_nl || '').length + (existingWord.example_en || '').length;
          const newExampleLength = (word.example?.nl || '').length + (word.example?.en || '').length;
          
          let shouldUpdate = false;
          let updateFields: any = {};
          
          // Helper function to normalize practice sentences (remove JSON strings, clean up)
          const normalizePractice = (practice: any[]): string[] => {
            const normalized = practice
              .filter(p => p && typeof p === 'string' && p.trim().length > 0)
              .map(p => {
                // Try to parse JSON strings
                try {
                  const parsed = JSON.parse(p);
                  if (parsed.nl && parsed.en) {
                    return `${parsed.nl} (${parsed.en})`;
                  }
                  return p.trim();
                } catch {
                  return p.trim();
                }
              })
              .filter(p => p.length > 0);
            
            // Deduplicate (case-insensitive)
            const seen = new Set<string>();
            return normalized.filter(p => {
              const lower = p.toLowerCase();
              if (seen.has(lower)) return false;
              seen.add(lower);
              return true;
            });
          };
          
          // Collect all practice sentences
          let allPractice: string[] = [];
          
          // Add existing practice
          if (existingWord.practice && existingWord.practice.length > 0) {
            allPractice.push(...existingWord.practice);
          }
          
          // If new example is longer, move old example to practice and use new example
          if (newExampleLength > existingExampleLength && newExampleLength > 0) {
            updateFields.example_nl = word.example.nl?.trim() || null;
            updateFields.example_en = word.example.en?.trim() || null;
            
            // Add old example as practice sentence (if exists)
            if (existingWord.example_nl && existingWord.example_en) {
              const oldExample = `${existingWord.example_nl} (${existingWord.example_en})`;
              allPractice.push(oldExample);
            }
            
            shouldUpdate = true;
          }
          
          // Add new practice sentences
          if (word.practice && word.practice.length > 0) {
            allPractice.push(...word.practice);
          }
          
          // Normalize and deduplicate all practice sentences
          if (allPractice.length > 0) {
            const cleanedPractice = normalizePractice(allPractice);
            const existingClean = normalizePractice(existingWord.practice || []);
            
            if (cleanedPractice.length > existingClean.length || 
                JSON.stringify(cleanedPractice.sort()) !== JSON.stringify(existingClean.sort())) {
              updateFields.practice = cleanedPractice;
              shouldUpdate = true;
            }
          }
          
          // Update other fields if they're more complete
          if (word.pos && !existingWord.pos) {
            updateFields.pos = word.pos.trim();
            shouldUpdate = true;
          }
          
          if (word.notes && !existingWord.notes) {
            updateFields.notes = word.notes.trim();
            shouldUpdate = true;
          }
          
          if (word.grammar?.present && !existingWord.grammar_present) {
            updateFields.grammar_present = word.grammar.present.trim();
            shouldUpdate = true;
          }
          
          if (word.grammar?.past && !existingWord.grammar_past) {
            updateFields.grammar_past = word.grammar.past.trim();
            shouldUpdate = true;
          }
          
          if (word.grammar?.future && !existingWord.grammar_future) {
            updateFields.grammar_future = word.grammar.future.trim();
            shouldUpdate = true;
          }
          
          if (shouldUpdate) {
            // Build dynamic UPDATE query
            const setClause = Object.keys(updateFields).map((key, i) => `${key} = $${i + 2}`).join(', ');
            const values = Object.values(updateFields);
            
            await client.query(
              `UPDATE vocabulary SET ${setClause}, updated_at = NOW() WHERE id = $1`,
              [existingWord.id, ...values]
            );
            
            updated.push(word.dutch);
          } else {
            skipped.push(word.dutch);
          }
          continue;
        }
        
        // Generate unique ID if not provided
        const wordId = word.id || `${word.dutch}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Insert new word with all fields, using defaults for optional ones
        await client.query(
          `INSERT INTO vocabulary 
           (id, dutch, english, pos, level, categories, functions, example_nl, example_en, progress, practice, 
            grammar_present, grammar_past, grammar_future, grammar_separable, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            wordId,
            word.dutch.trim(),
            word.english.trim(),
            word.pos?.trim() || null,
            word.level || 'A1-A2',
            (word.categories && word.categories.length > 0) ? word.categories : null,
            (word.functions && word.functions.length > 0) ? word.functions : null,
            word.example?.nl?.trim() || null,
            word.example?.en?.trim() || null,
            word.progress || 'new',
            (word.practice && word.practice.length > 0) ? word.practice : null,
            word.grammar?.present?.trim() || null,
            word.grammar?.past?.trim() || null,
            word.grammar?.future?.trim() || null,
            word.grammar?.separable || false,
            word.notes?.trim() || null
          ]
        );

        inserted.push(wordId);
      }
      
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        inserted: inserted.length,
        updated: updated.length,
        skipped: skipped.length,
        updatedWords: updated,
        skippedWords: skipped
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
    
    // Handle example object (from VocabularyCard edit)
    if (updates.example !== undefined) {
      setClauses.push(`example_nl = $${valueIndex++}`);
      values.push(updates.example.nl || null);
      setClauses.push(`example_en = $${valueIndex++}`);
      values.push(updates.example.en || null);
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
    
    const idIndex = valueIndex;
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE vocabulary 
      SET ${setClauses.join(', ')}
      WHERE id = $${idIndex}
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
