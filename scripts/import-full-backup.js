const { Pool } = require('pg');
const fs = require('fs');

// Parse CSV line properly handling quotes
function parseCSVLine(line) {
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

function parseArray(str) {
  if (!str || str.trim() === '' || str === '-') return null;
  return str.split(',').map(s => s.trim()).filter(s => s.length > 0 && s !== '-');
}

function parseLevel(levelStr) {
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

async function importFullBackup() {
  const backupFile = '/app/input/vocabulary_backup_2026-02-01.csv';
  
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: 'postgresql://dutch_user:dutch_password@db:5432/dutch_vocabulary',
    max: 20,
  });

  console.log(`📥 Importing full backup from ${backupFile}...\n`);

  try {
    const csvContent = fs.readFileSync(backupFile, 'utf-8');
    const lines = csvContent.trim().split('\n');
    const headers = parseCSVLine(lines[0]);

    console.log(`📊 Found ${lines.length - 1} words in backup\n`);
    console.log(`Headers: ${headers.join(', ')}\n`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const record = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });

      const dutch = record['Dutch']?.trim();
      const english = record['English']?.trim();
      
      if (!dutch || !english) {
        skipped++;
        continue;
      }

      try {
        const level = parseLevel(record['Level']);
        const categories = parseArray(record['Categories']);
        const functions = parseArray(record['Functions']);
        const progress = (record['Progress'] || 'new').toLowerCase();
        const practice = parseArray(record['Practice']);

        await pool.query(
          `INSERT INTO vocabulary 
           (id, dutch, english, pos, level, categories, functions, example_nl, example_en, 
            progress, practice, notes, created_at, last_reviewed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13)
           ON CONFLICT (dutch) DO UPDATE SET
             english = EXCLUDED.english,
             pos = COALESCE(EXCLUDED.pos, vocabulary.pos),
             level = EXCLUDED.level,
             categories = COALESCE(EXCLUDED.categories, vocabulary.categories),
             functions = COALESCE(EXCLUDED.functions, vocabulary.functions),
             example_nl = COALESCE(EXCLUDED.example_nl, vocabulary.example_nl),
             example_en = COALESCE(EXCLUDED.example_en, vocabulary.example_en),
             progress = EXCLUDED.progress,
             practice = COALESCE(EXCLUDED.practice, vocabulary.practice),
             notes = COALESCE(EXCLUDED.notes, vocabulary.notes),
             updated_at = NOW()`,
          [
            `${dutch}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            dutch,
            english,
            record['Part of Speech']?.trim() || null,
            level,
            categories,
            functions,
            record['Example (NL)']?.trim() || null,
            record['Example (EN)']?.trim() || null,
            progress,
            practice,
            record['Notes']?.trim() || null,
            record['Last Reviewed'] || null
          ]
        );
        
        imported++;
        if (imported % 50 === 0) {
          console.log(`   ✓ Imported ${imported} words...`);
        }
      } catch (e) {
        console.error(`❌ Error importing "${dutch}":`, e.message);
        errors++;
      }
    }

    await pool.end();

    console.log(`\n✅ Import complete!`);
    console.log(`   Imported: ${imported} words`);
    console.log(`   Skipped: ${skipped} (missing dutch/english)`);
    console.log(`   Errors: ${errors}`);
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Import failed:', e);
    process.exit(1);
  }
}

importFullBackup();
