const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Setup database connection - use explicit DATABASE_URL
let pool;

// Log what we're using
process.stderr.write('Using connection string\n');

// Use hardcoded connection since env vars aren't reliable
pool = new Pool({
  connectionString: 'postgresql://dutch_user:dutch_password@db:5432/dutch_vocabulary',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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

function parseCategories(catStr) {
  if (!catStr || catStr.trim() === '') return [];
  return catStr.split(',').map(c => c.trim()).filter(c => c.length > 0 && c !== '-');
}

async function mergeBackupCategories() {
  const backupFile = '/app/input/vocabulary_backup_2026-02-01.csv';
  
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  console.log(`🔄 Merging categories from backup...\n`);
  console.error('DATABASE_URL:', process.env.DATABASE_URL);  // Force to stderr to ensure output

  try {
    const csvContent = fs.readFileSync(backupFile, 'utf-8');
    const lines = csvContent.trim().split('\n');
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);

    const backupData = {};

    // Parse backup file to build a map of dutch word -> categories
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });

      const dutch = record['Dutch']?.trim().toLowerCase();
      const categories = parseCategories(record['Categories'] || '');

      if (dutch && categories.length > 0) {
        backupData[dutch] = categories;
      }
    }

    console.log(`📊 Loaded ${Object.keys(backupData).length} words with categories from backup\n`);

    try {
      await pool.query('BEGIN');

      let updated = 0;
      let skipped = 0;

      // Get all words from database that don't have categories
      const result = await pool.query(
        `SELECT id, dutch FROM vocabulary WHERE categories IS NULL OR array_length(categories, 1) IS NULL`
      );

      console.log(`🔍 Found ${result.rows.length} words without categories\n`);

      for (const row of result.rows) {
        const dutchLower = row.dutch.toLowerCase();
        const categories = backupData[dutchLower];

        if (categories && categories.length > 0) {
          await pool.query(
            'UPDATE vocabulary SET categories = $1 WHERE id = $2',
            [categories, row.id]
          );
          updated++;
          if (updated % 50 === 0) {
            console.log(`   ✓ Updated ${updated} words...`);
          }
        } else {
          skipped++;
        }
      }

      await pool.query('COMMIT');

      console.log(`\n✅ Merge complete!`);
      console.log(`   Updated: ${updated} words with categories`);
      console.log(`   Skipped: ${skipped} words not found in backup`);
      process.exit(0);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('❌ Merge failed:', error);
    process.exit(1);
  }
}

mergeBackupCategories();
