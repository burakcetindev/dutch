const { Pool } = require('pg');
const fs = require('fs');

async function reimport() {
  const pool = new Pool({
    connectionString: 'postgresql://dutch_user:dutch_password@db:5432/dutch_vocabulary',
    max: 20,
  });

  try {
    const dirs = fs.readdirSync('/app/input/remove_after_use');
    const files = dirs.filter(f => f.endsWith('.csv'));
    
    let totalImported = 0;
    console.log(`Found ${files.length} CSV files`);
    
    for (const file of files) {
      const path = `/app/input/remove_after_use/${file}`;
      const content = fs.readFileSync(path, 'utf-8');
      const lines = content.trim().split('\n');
      
      for (let i = 1; i < lines.length; i++) {
        const [dutch, english] = lines[i].split(',').map(s => s.trim());
        if (!dutch || !english) continue;
        
        try {
          await pool.query(
            'INSERT INTO vocabulary (id, dutch, english, progress, created_at) VALUES ($1, $2, $3, $4, now()) ON CONFLICT DO NOTHING',
            [`${dutch}-${Date.now()}`, dutch, english, 'new']
          );
          totalImported++;
        } catch (e) {
          // Skip duplicates
        }
      }
    }
    
    console.log(`✅ Imported ${totalImported} words`);
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

reimport();
