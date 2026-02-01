# 🇳🇱 Dutch Vocabulary Learning App

A modern, full-stack web application for learning Dutch vocabulary with an elegant glassmorphism UI, smart categorization, and spaced repetition learning.

## 📸 Screenshots

<div align="center">

### Light Mode
![Dutch Vocabulary App - Light Mode](docs/images/day_mode.png)

### Dark Mode
![Dutch Vocabulary App - Dark Mode](docs/images/night_mode.png)

</div>

## ✨ Features

- 📚 **600+ Dutch Words** with English translations, categories, and example sentences
- 🎯 **Smart Categorization** (A1-A2, B1-B2, C1-C2 CEFR levels)
- 🔄 **Spaced Repetition** learning system with progress tracking
- 🎨 **Glassmorphism UI** with smooth animations and dark mode support
- 📊 **Progress Tracking** (New → Learning → Mastered)
- 🔍 **Advanced Filtering** by level, category, and progress status
- 💾 **PostgreSQL Database** with full CRUD operations
- 📤 **Import/Export** vocabulary in CSV format
- 🐳 **Dockerized** for easy deployment
- ✅ **Complete CRUD**: Add, edit, delete, and manage all vocabulary
- 🔤 **Verb Conjugations**: Display present, past, and future tense forms
- 📝 **Practice Sentences**: Dutch and English example sentences
- 🎭 **Part of Speech**: Track nouns, verbs, adjectives, and more

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- Or: Node.js 20+, PostgreSQL 16+

### First Time Setup

```bash
# Clone the repository
git clone https://github.com/burakcetindev/dutch.git
cd dutch

# Run first-time setup (creates .env, installs dependencies, sets up Docker)
./scripts/first-run.sh
```

### Starting the Application

```bash
# Start the application (after first-run.sh)
./scripts/start.sh
```

The app will be available at **http://localhost:3000**
PostgreSQL database runs on **localhost:5432**

> **💡 Tip:** The `first-run.sh` script automatically creates your `.env` file and sets up everything you need. No manual configuration required!

### Local Development (Without Docker)

```bash
# Run first-time setup
./scripts/first-run.sh

# Start dev server
npm run dev

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
├── Dockerfile            # Container definition (in infra/)
├── docker-compose.yml    # Multi-container orchestration (in infra/)
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
# Start everything (recommended)
./scripts/start.sh

# Manual Docker commands
docker compose -f infra/docker-compose.yml up --build    # Build and start all services
docker compose -f infra/docker-compose.yml down          # Stop all services
docker compose -f infra/docker-compose.yml logs -f app   # View app logs
docker compose -f infra/docker-compose.yml logs -f db    # View database logs
docker compose -f infra/docker-compose.yml restart app   # Restart app only

# Access database
docker compose -f infra/docker-compose.yml exec db psql -U dutch_user -d dutch_vocabulary

# Stop and remove volumes (fresh start)
docker compose -f infra/docker-compose.yml down -v
```

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
