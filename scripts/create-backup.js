const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function createBackup() {
  const pool = new Pool({
    connectionString: 'postgresql://dutch_user:dutch_password@db:5432/dutch_vocabulary',
    max: 20,
  });

  try {
    console.log('📦 Creating backup...\n');

    const result = await pool.query(`
      SELECT 
        dutch, english, pos, level, categories, functions, 
        example_nl, example_en, progress, practice, notes,
        created_at, last_reviewed
      FROM vocabulary 
      ORDER BY dutch
    `);

    const headers = [
      'Dutch', 'English', 'Part of Speech', 'Level', 'Categories', 'Functions',
      'Example (NL)', 'Example (EN)', 'Progress', 'Practice', 'Notes',
      'Created At', 'Last Reviewed'
    ];

    let csv = headers.join(',') + '\n';

    for (const row of result.rows) {
      const values = [
        escapeCSV(row.dutch),
        escapeCSV(row.english),
        escapeCSV(row.pos || ''),
        escapeCSV(row.level || ''),
        escapeCSV(row.categories ? row.categories.join(', ') : ''),
        escapeCSV(row.functions ? row.functions.join(', ') : ''),
        escapeCSV(row.example_nl || ''),
        escapeCSV(row.example_en || ''),
        escapeCSV(row.progress || 'new'),
        escapeCSV(row.practice ? row.practice.join('; ') : ''),
        escapeCSV(row.notes || ''),
        escapeCSV(row.created_at ? row.created_at.toISOString() : ''),
        escapeCSV(row.last_reviewed ? row.last_reviewed.toISOString() : '')
      ];
      csv += values.join(',') + '\n';
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const backupPath = `/app/input/vocabulary_backup_${timestamp}_verified.csv`;
    
    fs.writeFileSync(backupPath, csv);

    const inputDir = '/app/input';
    const currentBackupFile = path.basename(backupPath);
    const existingFiles = fs.readdirSync(inputDir);
    const oldBackups = existingFiles.filter(file =>
      file.startsWith('vocabulary_backup_') &&
      file.endsWith('.csv') &&
      file !== currentBackupFile
    );

    for (const oldBackup of oldBackups) {
      try {
        fs.unlinkSync(path.join(inputDir, oldBackup));
        console.log(`Deleted old backup: ${oldBackup}`);
      } catch (err) {
        console.error(`Failed to delete ${oldBackup}:`, err);
      }
    }

    await pool.end();

    console.log(`✅ Backup created: ${backupPath}`);
    console.log(`   Total words: ${result.rows.length}`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Backup failed:', e);
    process.exit(1);
  }
}

function escapeCSV(str) {
  if (str === null || str === undefined) return '';
  str = String(str);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

createBackup();
