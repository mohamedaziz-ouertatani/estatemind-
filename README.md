# EstateMind - Intelligence Immobilière en Tunisie

<div align="center">
  <h3>🏡 Plateforme d'intelligence immobilière pour la Tunisie</h3>
  <p>Évaluations IA • Recherche Intelligente • Analyse de Quartiers • Gestion de Portefeuille</p>
</div>

## 📋 Vue d'Ensemble

EstateMind est une plateforme complète d'intelligence immobilière conçue spécifiquement pour le marché tunisien. Elle propose des évaluations de propriétés basées sur l'IA, une recherche intelligente, des analyses de quartiers et des outils professionnels pour les investisseurs.

### Fonctionnalités Principales

- 🤖 **Évaluations IA**: Estimation précise des valeurs immobilières avec analyse de propriétés comparables
- 🔍 **Recherche Intelligente**: Moteur de recherche avancé avec filtres et carte interactive
- 📊 **Analyse de Quartiers**: Scores de qualité de vie, données de marché et prévisions
- 💼 **Gestionnaire de Portefeuille**: Suivi des investissements et analyse de rentabilité (investisseurs)
- 🎯 **Scout d'Investissement**: Détection automatique des meilleures opportunités
- ⚖️ **Assistant Juridique**: Réponses aux questions sur le droit immobilier tunisien
- 🗺️ **Carte Interactive**: Visualisation des propriétés sur une carte de Tunisie avec GeoJSON

## 🛠️ Stack Technique

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL avec Prisma ORM
- **Authentication**: NextAuth.js
- **Maps**: Mapbox GL JS
- **Styling**: Tailwind CSS + shadcn/ui
- **AI/ML**: Python FastAPI (microservice)
- **State Management**: React Context + Zustand
- **Validation**: Zod
- **Deployment**: Vercel (frontend) + séparé pour l'API

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn
- Python 3.9+ (pour le service IA)

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/estatemind.git
cd estatemind
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
```bash
cp .env.example .env
```

Éditer `.env` avec vos valeurs :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/estatemind"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-token"
```

4. **Configurer la base de données**
```bash
# Générer le client Prisma
npx prisma generate

# Créer les migrations
npx prisma migrate dev --name init

# Seed les données initiales (optionnel)
npx prisma db seed
```

5. **Lancer le serveur de développement**
```bash
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du Projet

```
estatemind/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Routes d'authentification
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Routes du tableau de bord
│   │   ├── properties/
│   │   ├── portfolio/
│   │   ├── opportunities/
│   │   └── neighborhoods/
│   ├── api/                 # API Routes
│   │   ├── auth/
│   │   ├── properties/
│   │   ├── valuations/
│   │   └── ...
│   ├── layout.tsx
│   └── page.tsx
├── components/              # Composants React
│   ├── ui/                 # shadcn/ui components
│   ├── map/                # Composants de carte
│   ├── property/           # Composants de propriété
│   ├── layout/             # Composants de layout
│   └── dashboard/          # Composants de dashboard
├── lib/                    # Utilitaires et configuration
│   ├── db.ts              # Client Prisma
│   ├── auth.ts            # Configuration NextAuth
│   ├── utils.ts           # Fonctions utilitaires
│   └── constants.ts       # Constantes
├── prisma/                # Prisma schema et migrations
│   ├── schema.prisma
│   └── seed.ts
├── public/                # Assets statiques
│   ├── geojson/          # Données GeoJSON
│   └── images/
├── styles/               # Styles globaux
│   └── globals.css
├── types/                # Types TypeScript
│   ├── property.ts
│   ├── user.ts
│   └── valuation.ts
└── ai-service/          # Service Python FastAPI
    ├── main.py
    ├── models/
    └── requirements.txt
```

## 🗄️ Modèle de Base de Données

### Modèles Principaux

- **User**: Utilisateurs avec types (NORMAL, INVESTOR, AGENT, ADMIN)
- **Property**: Propriétés immobilières avec détails complets
- **Valuation**: Évaluations IA des propriétés
- **Neighborhood**: Données et scores des quartiers
- **Portfolio**: Portefeuille d'investissement (investisseurs)
- **InvestmentOpportunity**: Opportunités d'investissement détectées
- **LegalQuery**: Questions juridiques et réponses

Voir `prisma/schema.prisma` pour le schéma complet.

## 🔑 Authentification

L'authentification est gérée par NextAuth.js avec un provider de credentials.

### Inscription
```typescript
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "userType": "NORMAL"
}
```

### Connexion
```typescript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

## 📊 Niveaux d'Abonnement

| Niveau | Prix | Fonctionnalités |
|--------|------|-----------------|
| **Gratuit** | 0 TND | 3 évaluations/mois, recherche basique |
| **Basique** | 19 TND/mois | 20 évaluations/mois, recherche avancée |
| **Investisseur** | 149 TND/mois | Évaluations illimitées, portefeuille, scout |
| **Investisseur Pro** | 299 TND/mois | + Rapports PDF, API, analyse avancée |
| **Agence** | 499 TND/mois | Multi-utilisateurs, CRM, support 24/7 |

## 🌍 Spécificités Tunisiennes

- **24 Gouvernorats**: Données complètes pour toutes les régions
- **Devise TND**: Formatage en Dinars Tunisiens
- **Cadre Légal**: Calculateurs de taxes et frais notariaux
- **Données de Marché**: Prix moyens par région et tendances

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec coverage
npm run test:coverage

# Tests E2E
npm run test:e2e
```

## 📦 Déploiement

### Vercel (Frontend)

1. Connecter votre repository à Vercel
2. Configurer les variables d'environnement
3. Déployer automatiquement

### Base de Données

Options recommandées :
- [Neon](https://neon.tech/) - PostgreSQL serverless
- [Vercel Postgres](https://vercel.com/storage/postgres)
- [Supabase](https://supabase.com/)

### Service IA (Python)

Déployer sur :
- [Railway](https://railway.app/)
- [Render](https://render.com/)
- [Fly.io](https://fly.io/)

## 🛣️ Roadmap

### Phase 1 (Actuelle) ✅
- [x] Infrastructure de base
- [x] Authentification
- [x] Pages principales
- [ ] Composants de propriété
- [ ] Carte interactive
- [ ] API complète

### Phase 2
- [ ] Service d'évaluation IA
- [ ] Intégration Stripe
- [ ] Notifications email
- [ ] Dashboard investisseur

### Phase 3
- [ ] Intégration WhatsApp
- [ ] Recherche vocale
- [ ] Application mobile (PWA)
- [ ] Panel admin

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les directives.

## 📄 License

MIT License - voir [LICENSE](LICENSE) pour plus de détails.

## 📧 Contact

- **Email**: contact@estatemind.tn
- **Website**: https://estatemind.tn
- **Support**: support@estatemind.tn

## 🙏 Remerciements

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Mapbox](https://www.mapbox.com/)
- [Vercel](https://vercel.com/)

---

<div align="center">
  <p>Fait avec ❤️ pour le marché immobilier tunisien</p>
</div>
