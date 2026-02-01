-- Initialize Dutch Vocabulary Database

CREATE TABLE IF NOT EXISTS vocabulary (
  id VARCHAR(255) PRIMARY KEY,
  dutch VARCHAR(255) NOT NULL UNIQUE,
  english VARCHAR(255) NOT NULL,
  level VARCHAR(10) NOT NULL,
  categories TEXT[],
  functions TEXT[],
  example_nl TEXT,
  example_en TEXT,
  progress VARCHAR(20) DEFAULT 'new',
  practice TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT vocabulary_level_check CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'A1-A2', 'B1-B2', 'C1-C2')),
  CONSTRAINT vocabulary_progress_check CHECK (progress IN ('new', 'learning', 'mastered'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vocabulary_level ON vocabulary(level);
CREATE INDEX IF NOT EXISTS idx_vocabulary_progress ON vocabulary(progress);
CREATE INDEX IF NOT EXISTS idx_vocabulary_dutch ON vocabulary(dutch);
