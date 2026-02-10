// Tunisia Governorates
export const GOVERNORATES = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Zaghouan',
  'Bizerte',
  'Béja',
  'Jendouba',
  'Kef',
  'Siliana',
  'Kairouan',
  'Kasserine',
  'Sidi Bouzid',
  'Sousse',
  'Monastir',
  'Mahdia',
  'Sfax',
  'Gafsa',
  'Tozeur',
  'Kebili',
  'Gabès',
  'Medenine',
  'Tataouine'
] as const

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Gratuit',
    price: 0,
    features: [
      '3 évaluations IA par mois',
      'Recherche de propriétés',
      'Infos de quartier basiques'
    ]
  },
  BASIC_19: {
    name: 'Basique',
    price: 19,
    features: [
      '20 évaluations IA par mois',
      'Recherche avancée',
      'Alertes de recherche',
      'Infos de quartier complètes'
    ]
  },
  INVESTOR_149: {
    name: 'Investisseur',
    price: 149,
    features: [
      'Évaluations IA illimitées',
      'Gestionnaire de portefeuille',
      'Scout d\'investissement hebdomadaire',
      'Analyse de rentabilité',
      'Support prioritaire'
    ]
  },
  INVESTOR_PRO_299: {
    name: 'Investisseur Pro',
    price: 299,
    features: [
      'Toutes les fonctionnalités Investisseur',
      'Analyse comparative avancée',
      'Rapports PDF personnalisés',
      'API d\'accès',
      'Support dédié'
    ]
  },
  AGENCY_499: {
    name: 'Agence',
    price: 499,
    features: [
      'Multi-utilisateurs (jusqu\'à 10)',
      'Gestion de catalogue',
      'CRM intégré',
      'Statistiques avancées',
      'Support prioritaire 24/7'
    ]
  }
} as const

// Property Types
export const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'HOUSE', label: 'Maison' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'LAND', label: 'Terrain' },
  { value: 'COMMERCIAL', label: 'Local Commercial' },
  { value: 'OFFICE', label: 'Bureau' }
] as const

// Transaction Types
export const TRANSACTION_TYPES = [
  { value: 'SALE', label: 'Vente' },
  { value: 'RENT', label: 'Location' },
  { value: 'BOTH', label: 'Vente/Location' }
] as const

// Legal Categories
export const LEGAL_CATEGORIES = [
  { value: 'BUYING_PROCESS', label: 'Processus d\'Achat' },
  { value: 'SELLING_PROCESS', label: 'Processus de Vente' },
  { value: 'TAXATION', label: 'Fiscalité' },
  { value: 'FOREIGN_INVESTMENT', label: 'Investissement Étranger' },
  { value: 'INHERITANCE', label: 'Héritage' },
  { value: 'RENTAL_LAW', label: 'Droit Locatif' },
  { value: 'CONTRACTS', label: 'Contrats' },
  { value: 'OTHER', label: 'Autre' }
] as const

// Transfer tax rate in Tunisia
export const TRANSFER_TAX_RATE = 0.05 // 5%

// Notary fee rate in Tunisia
export const NOTARY_FEE_RATE = 0.01 // 1%

// Default map center (Tunisia)
export const TUNISIA_CENTER = {
  latitude: 33.8869,
  longitude: 9.5375,
  zoom: 6
}
