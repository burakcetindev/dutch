# 🇳🇱 Dutch Vocabulary Learning App

A modern, full-stack web application for learning Dutch vocabulary with an elegant glassmorphism UI, intelligent word management, and performance-optimized animations.

## 📸 Screenshots

<div align="center">

### Light Mode
![Dutch Vocabulary App - Light Mode](docs/images/day_mode.png)

### Dark Mode
![Dutch Vocabulary App - Dark Mode](docs/images/night_mode.png)

</div>

## ✨ Features

### Core Functionality
- 📚 **Comprehensive Vocabulary** with English translations, categories, and example sentences
- 🎯 **CEFR Level Support** (A1-A2, B1-B2, C1-C2) for structured learning
- 🔄 **Smart Import System** with intelligent merging and deduplication
- 📊 **Progress Tracking** (New → Learning → Mastered)
- 🔍 **Advanced Filtering** by level, category, and progress status
- ✅ **Complete CRUD**: Add, edit, delete, and manage all vocabulary with inline editing

### Advanced Features
- 🧠 **Intelligent Merge Logic**: 
  - Preserves longer examples
  - Deduplicates practice sentences (case-insensitive)
  - Parses JSON practice strings automatically
  - Never loses data on re-import
- 🎨 **Glassmorphism UI** with dark mode support
- ⚡ **Performance Optimized**: 
  - React.memo for component memoization
  - GPU-accelerated animations
  - Smooth 60fps interactions
- 🎭 **Rich Grammar Support**: Verb conjugations, parts of speech, contexts
- 📝 **Practice Sentences**: Add your own examples with translations
- 🎬 **YouGlish Integration**: Click to see real pronunciation examples

### Data Management
- 💾 **PostgreSQL Database** with connection pooling
- 📤 **Import/Export**: CSV and JSON formats with smart merging
- 💿 **Automatic Backups**: Timestamped backups on every save
- 🐳 **Dockerized**: Easy deployment with Docker Compose

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- Or: Node.js 20+, PostgreSQL 16+

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/burakcetindev/dutch.git
cd dutch

# Build and start (first time or after package changes)
./scripts/build-and-start.sh

# Quick start (daily use - instant!)
./scripts/start.sh
```

The app will be available at **http://localhost:3000**  
PostgreSQL database runs on **localhost:5432**

> **💡 Performance:** First build takes ~90 seconds. Subsequent cached builds complete in ~3 seconds (27.9x faster)!  
> **💡 Tip:** Use `build-and-start.sh` only when you change packages. Use `start.sh` for instant startup!

### Option 2: Local Development (Without Docker)

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Start PostgreSQL locally (or use existing instance)
# Update DATABASE_URL in .env

# Run database migrations
psql -U your_user -d dutch_vocabulary -f infra/init.sql

# Start development server
npm run dev
```

Visit **http://localhost:3000**

## 📁 Project Structure

```
dutch/
├── app/                    # Next.js 15 App Router
│   ├── page.tsx           # Dashboard with stats
│   ├── vocabulary/        # Vocabulary browser
│   │   └── page.tsx       # Main vocabulary view with filters
│   ├── api/               # API routes
│   │   ├── vocabulary-db/ # CRUD operations
│   │   └── save-state/    # Save & backup
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Optimized animations & styles
│
├── src/components/vocabulary/  # Vocabulary-specific components
│   ├── VocabularyCard.tsx     # Main word card (React.memo optimized)
│   ├── AddWordModal.tsx       # Add new word dialog
│   └── YouGlish.tsx           # Pronunciation integration
│
├── lib/                   # Utilities & database
│   ├── db.ts             # PostgreSQL connection pool
│   ├── vocabulary.ts     # Import/export logic
│   ├── stats.ts          # Statistics calculations
│   └── levelMapper.ts    # CEFR level normalization
│
├── scripts/              # Automation scripts
│   ├── first-run.sh      # Initial setup
│   ├── build-and-start.sh # Build & start Docker
│   ├── start.sh          # Quick start (existing images)
│   └── import-full-backup.js  # Import backups
│
├── infra/                # Infrastructure
│   ├── docker-compose.yml # Multi-container orchestration
│   ├── Dockerfile        # Next.js container
│   └── init.sql          # Database schema
│
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md   # System architecture
│   ├── DATA-FLOW.md      # Data flow diagrams
│   └── QUICK-START.md    # Getting started guide
│
└── input/                # Backup storage (gitignored)
    └── vocabulary_backup_*.{csv,json}
```

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 15 (App Router) + React 18
- TypeScript 5.7.2
- Tailwind CSS 3.4.17
- Lucide React (icons)

**Backend:**
- Node.js 20 (Alpine)
- PostgreSQL 16
- pg (node-postgres) connection pool

**Infrastructure:**
- Docker & Docker Compose
- BuildKit with aggressive caching
- Multi-stage optimized builds
- Persistent cache mounts
- Health checks & volume management

### Docker Performance Optimizations

Our Docker setup is optimized for maximum build speed without sacrificing functionality:

**Build Performance:**
- ⚡ **First Build**: ~90 seconds (clean build with npm install + Next.js build)
- ⚡ **Cached Rebuild**: ~3 seconds (96.4% faster - 27.9x speedup!)
- 📦 **Image Size**: 300MB (35% smaller than unoptimized)

**Optimization Techniques:**
1. **BuildKit Cache Mounts**: npm packages and Next.js build cache persist between builds
2. **Layer Caching Strategy**: Smart layer ordering maximizes cache hits
3. **Build Context**: Optimized `.dockerignore` reduces context from 674MB → 2.2KB (99.9% reduction)
4. **Multi-Stage Build**: Separate deps and runtime for minimal final image
5. **Persistent Volumes**: Database and backup data survive container recreation

**Cache Behavior:**
- No changes: All layers cached (instant rebuild)
- Code changes only: Rebuilds from code copy step (~45 seconds)
- Package.json changes: Full rebuild required (~90 seconds)

These optimizations mean you can iterate quickly during development without waiting for slow Docker builds!

- **React Level**: `memo()`, `useCallback()`, `useMemo()`
- **CSS Level**: GPU-accelerated animations, `will-change` properties
- **Database Level**: Connection pooling, indexed queries
- **Network Level**: Optimistic updates, debounced search

### Data Flow

See [docs/DATA-FLOW.md](docs/DATA-FLOW.md) for comprehensive architectural diagrams including:
- System architecture overview
- Database schema & initialization
- API routes architecture
- Complete request/response flows
- Import merge logic with intelligent deduplication
- CRUD operations
- Component architecture & performance
- Error handling & toast notifications

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed system architecture.

## 🗄️ Database Schema

```sql
CREATE TABLE vocabulary (
  id               VARCHAR(255)  PRIMARY KEY,
  dutch            VARCHAR(255)  NOT NULL UNIQUE,
  english          VARCHAR(255)  NOT NULL,
  pos              VARCHAR(50),               -- Part of speech
  level            VARCHAR(10),               -- A1-A2, B1-B2, C1-C2
  categories       TEXT[],                    -- Tags array
  functions        TEXT[],                    -- Grammar notes
  example_nl       TEXT,                      -- Dutch example
  example_en       TEXT,                      -- English translation
  practice         TEXT[],                    -- User practice sentences
  contexts         TEXT[],                    -- Usage contexts
  grammar_present  VARCHAR(255),              -- Present tense
  grammar_past     VARCHAR(255),              -- Past tense
  grammar_future   VARCHAR(255),              -- Future tense
  grammar_separable BOOLEAN,                  -- Separable verb?
  notes            TEXT,                      -- Additional notes
  progress         VARCHAR(20)   DEFAULT 'new',
  last_reviewed    TIMESTAMP,
  created_at       TIMESTAMP     DEFAULT NOW(),
  updated_at       TIMESTAMP     DEFAULT NOW()
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_dutch ON vocabulary(LOWER(dutch));
CREATE INDEX idx_level ON vocabulary(level);
CREATE INDEX idx_progress ON vocabulary(progress);
```

## 📝 Smart Import System

The import system intelligently merges duplicate words:

### Features
- ✅ **Case-insensitive duplicate detection**: "mogen", "Mogen", "MOGEN" → same word
- ✅ **Example replacement**: Keeps longer examples, moves old to practice
- ✅ **Practice merging**: Combines all unique practice sentences
- ✅ **JSON parsing**: Converts `{"nl":"X","en":"Y"}` → `"X (Y)"`
- ✅ **Deduplication**: Removes duplicate practice (case-insensitive)
- ✅ **Additive fields**: Only fills empty fields, never overwrites
- ✅ **Safe updates**: Reports inserted/updated/skipped counts

### Example
Importing "mogen" with different sentence:
```
Existing: "Mag ik?" (May I?)
Import:   "Mag ik hier parkeren?" (May I park here?)
Result:   Example updated, old moved to practice ✅
```when packages change)
./scripts/build-and-start.sh     # ~90 seconds first build, ~3s cached

# Quick start (daily use - instant!)
./scripts/start.sh               # Uses existing image, starts in seconds

# View logs
docker compose -f infra/docker-compose.yml logs -f vocab

# Stop containers
docker compose -f infra/docker-compose.yml down

# Restart app (no rebuild)
docker compose -f infra/docker-compose.yml restart vocab

# Rebuild after code changes
DOCKER_BUILDKIT=1 docker compose -f infra/docker-compose.yml build  # ~3-45s cached

### First-Time Setup
```bash
./scripts/first-run.sh           # Initial environment setup
```

### Docker Commands
```bash
# Build and start (first time or after code changes)
./scripts/build-and-start.sh

# Quick start (daily use)
# Quick start (daily use)
./scripts/start.sh

# View logs
docker compose -f infra/docker-compose.yml logs -f vocab

# Stop containers
docker compose -f infra/docker-compose.yml down

# Restart app
docker compose -f infra/docker-compose.yml restart vocab
```

### Development Commands
```bash
npm run dev                      # Start dev server (port 3000)
npm run build                    # Production build
npm start                        # Start production server
```

### Data Management
```bash
# Import backup
docker exec dutch-vocab-app node scripts/import-full-backup.js

# Access database
docker compose -f infra/docker-compose.yml exec db psql -U dutch_user -d dutch_vocabulary
```

## 🐳 Docker Detailshighly optimized multi-container setup:

**Containers:**
- **dutch-vocab-app**: Next.js application (port 3000)
  - 300MB optimized image size
  - BuildKit cache mounts for fast rebuilds
  - Runs as non-root user (nextjs:nodejs)
- **dutch-vocab-postgres**: PostgreSQL 16 database (port 5432)
  - 389MB Alpine-based image
  - Health checks ensure reliability

**Volumes:**
- `postgres_data`: Database persistence
- `vocab_backups`: Backup files with proper permissions

**Performance:**
- BuildKit cache enables 3-second rebuilds (vs 90 seconds uncached)
- `.dockerignore` reduces build context by 99.9%
- Multi-stage build separates dependencies from runtime
- Inline cache for faster subsequent builds
- **dutch-vocab-app**: Next.js application (port 3000)
- **dutch-vocab-postgres**: PostgreSQL 16 database (port 5432)

Containers are health-checked and dependencies managed automatically.

## 📚 Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture and tech stack
- [DATA-FLOW.md](docs/DATA-FLOW.md) - Comprehensive data flow diagrams
- [QUICK-START.md](docs/QUICK-START.md) - Getting started guide

## 🎯 Usage

### Adding Words
1. Click "Add Word" button
2. Fill in Dutch word, English translation, and optional fields
3. Save - word is immediately stored in database

### Importing Vocabulary
1. Click "Import" button (CSV or JSON)
2. Select file with vocabulary
3. System automatically:
   - Detects duplicates (case-insensitive)
   - Merges practice sentences
   - Updates examples if longer
   - Preserves existing data
4. View report: inserted/updated/skipped counts

### Tracking Progress
- Click progress buttons: 🔴 New → 🟡 Learning → 🟢 Mastered
- Progress tracked per word
- Visual color coding

### Managing Words
- **Edit**: Click gear icon → Edit → Modify inline → Save
- **Delete**: Click gear icon → Delete → Confirm
- **Add Practice**: Expand card → Type sentence → Add

## 🔧 Environment Variables

### Development Setup

For local development, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
# Edit .env.local with your local database credentials
```

Example `.env.local` for development:

```env
# PostgreSQL Database Configuration
POSTGRES_USER=dutch_user
POSTGRES_PASSWORD=dutch_password
POSTGRES_DB=dutch_vocabulary
POSTGRES_PORT=5432

# Database URL
DATABASE_URL=postgresql://dutch_user:dutch_password@localhost:5432/dutch_vocabulary

# Application
APP_PORT=3000
NODE_ENV=development
```

### 🔒 Security Best Practices

**⚠️ IMPORTANT:**
- ✅ `.env.local` is gitignored and safe for local development
- ✅ `.env.example` contains placeholders only (no real credentials)
- ❌ **NEVER** commit `.env` files with real credentials
- 🔐 For production, use environment variable managers:
  - Docker secrets
  - Kubernetes secrets
  - Cloud provider secret managers (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager)
  - Environment variables from hosting platform (Vercel, Railway, etc.)

**Production Credentials:**
1. **Change default passwords** - Never use `dutch_password` in production!
2. **Use strong passwords**: Minimum 16 characters, mix of letters/numbers/symbols
3. **Rotate credentials regularly**: Update database passwords quarterly
4. **Limit access**: Use database roles with minimal required permissions
5. **Enable SSL/TLS**: Force encrypted database connections in production

**Environment File Priority** (Next.js):
- `.env.local` (highest priority, local development only)
- `.env.development` (development mode)
- `.env.production` (production mode)
- `.env` (all environments - not recommended for secrets)

See `.env.example` for all available configuration options.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- UI inspiration from modern glassmorphism design trends
- Dutch language resources from various CEFR-aligned materials
- Icons by [Lucide](https://lucide.dev/)

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Happy learning Dutch! 🇳🇱**

##  Features in Detail

### Spaced Repetition Learning
Words progress through three stages:
- 🆕 **New**: Just added, need to learn
- 📖 **Learning**: Actively studying
- ✅ **Mastered**: Fully learned

### Smart Filtering
- Filter by CEFR level (A1-A2, B1-B2, C1-C2)
- Filter by category (verbs, nouns, food, family, etc.)
- Filter by progress status
- Combine multiple filters

### Import/Export
- Import vocabulary from CSV files
- Export filtered results to CSV
- Preserve progress state on import
- Automatic duplicate detection

## 🛠️ Development

### Adding New Words

Use the web interface at http://localhost:3000:
1. Click "Add Word" button
2. Fill in Dutch word, English translation, and level
3. Optional: Add categories, examples, and practice sentences
4. Click "Save State" to export backups

### Backup Format

Backup files are automatically created in `input/` folder with timestamps when you click "Save State":
- CSV format: `vocabulary_backup_YYYY-MM-DD_HH-MM-SS.csv`
- JSON format: `vocabulary_backup_YYYY-MM-DD_HH-MM-SS.json`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Burak Cetin**
- GitHub: [@burakcetindev](https://github.com/burakcetindev)

## 🙏 Acknowledgments

- Dutch vocabulary sourced from common word lists and language learning resources
- UI design inspired by modern glassmorphism trends
- Built with Next.js, React, and PostgreSQL

---

Made with ❤️ for Dutch language learners
