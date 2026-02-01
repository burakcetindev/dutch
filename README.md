# 🇳🇱 Dutch Vocabulary Learning App

A modern, full-stack web application for learning Dutch vocabulary with an elegant glassmorphism UI, smart categorization, and spaced repetition learning.

![Dutch Vocabulary App](docs/images/app-preview.png)

## ✨ Features

- 📚 **500+ Dutch Words** with English translations and example sentences
- 🎯 **Smart Categorization** (A1-A2, B1-B2, C1-C2 levels)
- 🔄 **Spaced Repetition** learning system
- 🎨 **Glassmorphism UI** with smooth animations
- 📊 **Progress Tracking** (New → Learning → Mastered)
- 🔍 **Advanced Filtering** by level, category, and progress
- 💾 **Auto-save** progress in database
- 📤 **Import/Export** vocabulary in CSV format
- 🐳 **Dockerized** for easy deployment
- ✅ **CRUD Operations**: Add, edit, delete, and manage vocabulary
- 🔤 **Verb Conjugations**: Display present, past, and future tense forms
- 📝 **Practice Sentences**: Add custom sentences for each word

## ✅ Recent Updates

- **Grammar/Tenses Support**: All verbs now support present, past, and future tense conjugations (85 words imported)
- **Add Word Form**: Fixed level validation errors - words can now be added successfully with all optional fields
- **Practice Sentences Persistence**: Practice sentences are now properly saved to database and persist across sessions
- **Bulk Grammar Import**: Direct SQL import ensures 100% data integrity
- **Enhanced Animations**: Float, pulse, glow, and spin animations throughout the app
- **Fixed UI Rendering**: Resolved black boxes on scroll with CSS optimizations
- **Edit/Delete Menu**: Expandable action menu at bottom-right corner with smooth animations
- **Comprehensive Test Suite**: 50+ tests covering API, components, and data validation
- **Accessibility**: Proper ARIA labels and keyboard navigation support

## 🧪 Testing

Comprehensive test suite with 50+ tests:

```bash
# Run all tests
npm test

# Run with coverage report
npm test:coverage

# Watch mode for development
npm test:watch

# CI mode (for GitHub Actions)
npm test:ci
```

**Test Coverage**:
- ✅ API Integration (CRUD operations, error handling)
- ✅ Component Testing (rendering, interactions, accessibility)
- ✅ Data Validation (grammar data, vocabulary structure)
- ✅ Error Handling (network errors, malformed requests)
- ✅ Data Persistence (cross-request consistency)

See [__tests__/README.md](__tests__/README.md) for detailed testing documentation.

## ✅ Recent Updates

- **Grammar/Tenses Support**: All verbs now support present, past, and future tense conjugations
- **Add Word Form**: Fixed level validation errors - words can now be added successfully with all optional fields
- **Practice Sentences Persistence**: Practice sentences are now properly saved to database and persist across sessions
- **Bulk Grammar Import**: 84 verbs updated with conjugation data from CSV files

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- Or: Node.js 20+, PostgreSQL 16+

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/burakcetindev/dutch.git
cd dutch

# Start the application
./scripts/start.sh
```

The app will be available at **http://localhost:3000**

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run database migrations
npm run migrate

# Import vocabulary
npx tsx scripts/import-csv.ts

# Start development server
npm run dev
```

## 📁 Project Structure

```
dutch/
├── app/                    # Next.js 15 App Router
│   ├── page.tsx           # Dashboard
│   ├── vocabulary/        # Vocabulary browser
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── vocabulary/        # Vocabulary-specific
│   └── ui/                # Reusable UI primitives
├── lib/                   # Utilities & database
│   ├── db.ts             # PostgreSQL connection pool
│   └── levelMapper.ts    # CEFR level normalization
├── scripts/              # Build & maintenance scripts
│   ├── migrate.ts        # Database migrations
│   ├── import-csv.ts     # CSV importer
│   ├── cleanup_bad_entries.ts  # Data cleanup
│   └── start.sh          # Docker startup script
├── input/                # Vocabulary data (CSV)
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md   # System architecture
│   └── DATA-FLOW.md      # Data flow diagrams
├── Dockerfile            # Container definition
├── docker-compose.yml    # Multi-container orchestration
└── next.config.mjs       # Next.js configuration
```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, PostgreSQL 16
- **Deployment**: Docker & Docker Compose
- **Libraries**: Lucide Icons, csv-parse, pg (node-postgres)

### Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  CSV Files  │────▶│  PostgreSQL  │────▶│  Next.js    │
│  (input/)   │     │  Database    │     │  Frontend   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Progress API │
                    │ (Auto-save)  │
                    └──────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DATA-FLOW.md](docs/DATA-FLOW.md) for details.

## 🗄️ Database Schema

```sql
CREATE TABLE vocabulary (
  id VARCHAR(255) PRIMARY KEY,
  dutch VARCHAR(255) NOT NULL UNIQUE,
  english VARCHAR(255) NOT NULL,
  level VARCHAR(10) NOT NULL,          -- A1-A2, B1-B2, C1-C2
  categories TEXT[],                    -- Array of tags
  functions TEXT[],                     -- Grammar notes
  example_nl TEXT,                      -- Dutch example
  example_en TEXT,                      -- English example
  progress VARCHAR(20) DEFAULT 'new',   -- new|learning|mastered
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 📝 Scripts

```bash
# Database
npm run migrate              # Run database migrations
npx tsx scripts/import-csv.ts   # Import vocabulary from CSV

# Development
npm run dev                  # Start dev server (port 3000)
npm run build                # Production build
npm start                    # Start production server

# Docker
docker-compose up --build    # Build and start all services
docker-compose down          # Stop all services
docker-compose logs -f app   # View app logs
docker-compose logs -f db    # View database logs

# Data Management
npx tsx scripts/cleanup_bad_entries.ts  # Remove duplicates & low-quality entries
```

## 🐳 Docker Commands

```bash
# Start everything
./scripts/start.sh

# View logs
docker-compose logs -f

# Restart app only
docker-compose restart app

# Access database
docker-compose exec db psql -U dutch_user -d dutch_vocabulary

# Stop everything
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

## 🔧 Environment Variables

Create a `.env` file (see `.env.example`):

```env
# Database
POSTGRES_USER=dutch_user
POSTGRES_PASSWORD=dutch_password
POSTGRES_DB=dutch_vocabulary
POSTGRES_PORT=5432

# Application
APP_PORT=3000
DATABASE_URL=postgresql://dutch_user:dutch_password@localhost:5432/dutch_vocabulary
```

## 📊 Features in Detail

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

1. Edit `input/merged-vocabulary.csv`
2. Run the importer:
   ```bash
   npx tsx scripts/import-csv.ts
   ```

### CSV Format

```csv
Dutch,English,Grammar Note,Present Tense,Past Tense,Future Tense,Example Sentence (Dutch),Example Sentence (English),Practice Sentences,Level,Categories,Progress,Notes
huis,house,"noun, het",-,-,-,Ik woon in een klein huis.,I live in a small house.,,A1-A2,home,new,
```

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
