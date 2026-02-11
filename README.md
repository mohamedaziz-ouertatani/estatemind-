# EstateMind - Intelligence Immobilière en Tunisie 🏠

Plateforme d'intelligence immobilière alimentée par l'IA pour le marché tunisien. Évaluation de propriétés, recherche avancée, et analyses de quartiers.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Python 3.11+ (for AI service)

### Installation

1. **Clone and install dependencies:**
```bash
git clone https://github.com/mohamedaziz-ouertatani/estatemind-.git
cd estatemind-
npm install
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Set up database:**
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

4. **Start development servers:**
```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Python AI Service
cd ai-service
pip install -r requirements.txt
python main.py
```

5. **Access the application:**
- Frontend: http://localhost:3000
- AI Service: http://localhost:8000
- Health Check: http://localhost:3000/api/health

### Test Users
- `dev@estatemind.tn / dev123` - Investor Pro (unlimited credits)
- `normal@estatemind.tn / user123` - Free tier (3 credits)
- `agent@estatemind.tn / agent123` - Agency (unlimited credits)

---

## 🎯 Features

### ✅ Property Search
- 236 realistic Tunisia properties across 17 regions
- Advanced search with 20+ filters
- Location cascading (Governorate → Delegation → Neighborhood)
- Price and size range sliders
- Feature filters (parking, pool, sea view, etc.)
- Multiple sorting options

### ✅ AI Valuation Engine
- Rule-based valuation model
- 70+ Tunisia neighborhoods with specific pricing
- Factors: location, property type, amenities, floor, condition
- Confidence scoring
- 30-day caching
- Batch valuation support

### ✅ User Dashboards
- **Normal Users:** Saved properties, valuation credits, recent searches
- **Investors:** Portfolio tracker, ROI calculations, performance metrics
- Real-time credit tracking

### ✅ Property Details
- Image galleries with lightbox
- Comprehensive property information
- AI valuation with score breakdown
- Neighborhood insights
- Similar properties
- Contact seller

### ✅ Neighborhoods
- 31 detailed Tunisia neighborhoods
- Overall and category scores
- Market statistics (price/m², yield, growth)
- Schools, transportation, amenities
- Future projects and outlook

### ✅ Development Features
- Auth bypass mode for easy testing
- Database health check
- Toast notifications
- Error boundaries
- Mobile responsive

---

## 📊 Database

### Models
- **User** - Authentication and subscriptions
- **Property** - 236 properties with full details
- **Neighborhood** - 31 neighborhoods with metrics
- **Valuation** - AI valuation results
- **SavedProperty** - User favorites
- **Portfolio** - Investment tracking

### Seed Data
Run `npx prisma db seed` to populate:
- 3 test users
- 236 properties (17 Tunisia regions)
- 31 neighborhoods with full data
- Sample valuations and portfolio

---

## 🔧 Configuration

### Environment Variables

**Required:**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/estatemind"
NEXTAUTH_SECRET="your-secret-32-chars"
```

**Development:**
```env
NODE_ENV="development"
NEXT_PUBLIC_BYPASS_AUTH="true"  # Enable auth bypass
```

**AI Service:**
```env
AI_SERVICE_URL="http://localhost:8000"
AI_SERVICE_API_KEY="your-api-key"
```

**Optional:**
```env
NEXT_PUBLIC_MAPBOX_TOKEN="your-token"
RESEND_API_KEY="re_..."
OPENAI_API_KEY="sk-..."
```

See `.env.example` for complete configuration.

---

## 🏗️ Architecture

### Tech Stack
- **Frontend:** Next.js 15, React 18, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Database:** PostgreSQL + Prisma ORM
- **AI Service:** Python FastAPI
- **Maps:** Mapbox GL JS (integration ready)
- **Auth:** NextAuth.js + Dev Bypass

### Project Structure
```
├── app/                  # Next.js App Router
│   ├── api/             # API routes
│   ├── (auth)/          # Auth pages
│   └── (dashboard)/     # Protected pages
├── components/          # React components
│   ├── property/       # Property components
│   ├── neighborhood/   # Neighborhood components
│   └── ui/             # shadcn/ui components
├── lib/                # Utilities
│   ├── db.ts          # Prisma client
│   ├── auth-bypass.ts # Dev authentication
│   └── credits.ts     # Credit management
├── prisma/             # Database schema
│   ├── schema.prisma
│   └── seed.ts        # Comprehensive seed data
├── ai-service/         # Python AI service
│   ├── main.py
│   └── valuation_model.py
└── types/              # TypeScript types
```

---

## 📡 API Endpoints

### Properties
- `GET /api/properties` - List with filters
- `GET /api/properties/search` - Advanced search
- `GET /api/properties/[id]` - Get single property

### Valuations
- `POST /api/valuations` - Request valuation (requires credits)

### Saved Properties
- `POST /api/users/saved-properties` - Save property
- `GET /api/users/saved-properties` - List saved
- `DELETE /api/users/saved-properties/[id]` - Remove

### Health
- `GET /api/health` - Database health check

### AI Service (FastAPI)
- `POST /api/v1/valuations/estimate` - Single valuation
- `POST /api/v1/valuations/batch` - Batch valuation

See [docs/API.md](docs/API.md) for complete API documentation.

---

## 🚀 Deployment

### Vercel (Next.js)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Environment Variables:** Set in Vercel dashboard
- DATABASE_URL (use Vercel Postgres or Neon)
- NEXTAUTH_SECRET
- AI_SERVICE_URL (Railway/Render deployment)
- Other optional vars

### Railway/Render (Python AI Service)
```bash
cd ai-service
# Add Dockerfile and deploy via Railway/Render
```

**Environment Variables:**
- AI_SERVICE_API_KEY
- NODE_ENV=production

---

## 🧪 Testing

### Run Tests
```bash
npm test                 # Unit tests
npm run test:e2e        # E2E tests (when added)
```

### Manual Testing
1. Enable dev bypass: `NEXT_PUBLIC_BYPASS_AUTH="true"`
2. Visit http://localhost:3000
3. Test search, valuations, saved properties
4. Check dashboard, portfolio, neighborhoods

---

## 📝 Data

### Tunisia Coverage
**Properties (236 total):**
- Tunis: 75 properties (La Marsa 30, Carthage 20, Ariana 25, Menzah 20)
- Sousse: 35 properties
- Nabeul: 45 properties (Hammamet 20, Nabeul 15, Yasmine 10)
- Sfax: 25 properties
- Bizerte: 18 properties
- Others: 38 properties

**Neighborhoods (31 total):**
- Complete scoring (housing, schools, transport, amenities, lifestyle, safety)
- Market data (price/m², yield, growth)
- Schools, transportation, future projects

---

## 🤝 Contributing

This is a production-ready MVP. Future enhancements:
- [ ] Mapbox integration with clustering
- [ ] Investment opportunity scout
- [ ] Legal assistant chatbot (RAG)
- [ ] Advanced analytics dashboard
- [ ] Real-time notifications
- [ ] Mobile app

---

## 📄 License

MIT License - See LICENSE file

---

## 🐛 Known Issues

- Map integration pending (placeholders in place)
- Some API endpoints need production testing
- Need actual Mapbox token for maps

---

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Email: support@estatemind.tn

---

**Built with ❤️ for the Tunisia real estate market**
