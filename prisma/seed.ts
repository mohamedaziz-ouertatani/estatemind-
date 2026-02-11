import { PrismaClient, PropertyType, TransactionType, UserType, SubscriptionTier } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Comprehensive Tunisia locations with coordinates
const TUNISIA_LOCATIONS = [
  // Tunis (75 properties - La Marsa 30, Carthage 20, Ariana 25)
  { governorate: 'Tunis', delegation: 'La Marsa', neighborhood: 'La Marsa Plage', lat: 36.8783, lng: 10.3247, pricePerM2: 3800 },
  { governorate: 'Tunis', delegation: 'La Marsa', neighborhood: 'La Marsa Corniche', lat: 36.8795, lng: 10.3260, pricePerM2: 4200 },
  { governorate: 'Tunis', delegation: 'La Marsa', neighborhood: 'Sidi Daoud', lat: 36.8770, lng: 10.3230, pricePerM2: 3500 },
  { governorate: 'Tunis', delegation: 'Carthage', neighborhood: 'Carthage Hannibal', lat: 36.8531, lng: 10.3231, pricePerM2: 4500 },
  { governorate: 'Tunis', delegation: 'Carthage', neighborhood: 'Carthage Présidence', lat: 36.8545, lng: 10.3245, pricePerM2: 5000 },
  { governorate: 'Ariana', delegation: 'Ariana Ville', neighborhood: 'Centre Ville', lat: 36.8625, lng: 10.1956, pricePerM2: 2400 },
  { governorate: 'Ariana', delegation: 'Ariana Ville', neighborhood: 'Ariana Essoghra', lat: 36.8640, lng: 10.1970, pricePerM2: 2200 },
  { governorate: 'Tunis', delegation: 'Menzah', neighborhood: 'Menzah 6', lat: 36.8433, lng: 10.1825, pricePerM2: 2800 },
  { governorate: 'Tunis', delegation: 'Menzah', neighborhood: 'Menzah 9', lat: 36.8450, lng: 10.1845, pricePerM2: 2600 },
  
  // Sousse (35 properties)
  { governorate: 'Sousse', delegation: 'Sousse Ville', neighborhood: 'Centre Ville', lat: 35.8256, lng: 10.6364, pricePerM2: 1900 },
  { governorate: 'Sousse', delegation: 'Sousse Ville', neighborhood: 'Bouhsina', lat: 35.8270, lng: 10.6380, pricePerM2: 1700 },
  { governorate: 'Sousse', delegation: 'Port El Kantaoui', neighborhood: 'Port El Kantaoui', lat: 35.8925, lng: 10.5961, pricePerM2: 2500 },
  { governorate: 'Sousse', delegation: 'Khezama', neighborhood: 'Khezama Ouest', lat: 35.8167, lng: 10.6289, pricePerM2: 1600 },
  { governorate: 'Sousse', delegation: 'Khezama', neighborhood: 'Khezama Est', lat: 35.8180, lng: 10.6310, pricePerM2: 1550 },
  
  // Nabeul (45 properties)
  { governorate: 'Nabeul', delegation: 'Hammamet', neighborhood: 'Hammamet Centre', lat: 36.4000, lng: 10.6167, pricePerM2: 2200 },
  { governorate: 'Nabeul', delegation: 'Hammamet', neighborhood: 'Hammamet Nord', lat: 36.4100, lng: 10.6200, pricePerM2: 2400 },
  { governorate: 'Nabeul', delegation: 'Hammamet', neighborhood: 'Hammamet Sud', lat: 36.3950, lng: 10.6150, pricePerM2: 2000 },
  { governorate: 'Nabeul', delegation: 'Yasmine Hammamet', neighborhood: 'Marina', lat: 36.3736, lng: 10.5664, pricePerM2: 2800 },
  { governorate: 'Nabeul', delegation: 'Nabeul Ville', neighborhood: 'Centre Ville', lat: 36.4511, lng: 10.7353, pricePerM2: 1700 },
  { governorate: 'Nabeul', delegation: 'Nabeul Ville', neighborhood: 'Nabeul Plage', lat: 36.4550, lng: 10.7400, pricePerM2: 1900 },
  
  // Sfax (25 properties)
  { governorate: 'Sfax', delegation: 'Sfax Ville', neighborhood: 'Centre Ville', lat: 34.7406, lng: 10.7603, pricePerM2: 1800 },
  { governorate: 'Sfax', delegation: 'Sfax Ville', neighborhood: 'Sfax Jadida', lat: 34.7450, lng: 10.7650, pricePerM2: 2000 },
  { governorate: 'Sfax', delegation: 'Thyna', neighborhood: 'Thyna', lat: 34.6833, lng: 10.8167, pricePerM2: 1500 },
  
  // Bizerte (18 properties)
  { governorate: 'Bizerte', delegation: 'Bizerte Ville', neighborhood: 'Centre Ville', lat: 37.2744, lng: 9.8739, pricePerM2: 1600 },
  { governorate: 'Bizerte', delegation: 'Bizerte Ville', neighborhood: 'Corniche', lat: 37.2800, lng: 9.8800, pricePerM2: 2100 },
  
  // Other cities (18 properties)
  { governorate: 'Monastir', delegation: 'Monastir', neighborhood: 'Centre Ville', lat: 35.7643, lng: 10.8113, pricePerM2: 1700 },
  { governorate: 'Mahdia', delegation: 'Mahdia', neighborhood: 'Centre Ville', lat: 35.5047, lng: 11.0622, pricePerM2: 1400 },
  { governorate: 'Kairouan', delegation: 'Kairouan', neighborhood: 'Centre Ville', lat: 35.6781, lng: 10.0967, pricePerM2: 1100 },
]

// Property descriptions in French
const PROPERTY_DESCRIPTIONS = {
  APARTMENT_LUXURY: [
    "Magnifique appartement de standing avec vue panoramique sur la mer. Finitions haut de gamme, cuisine équipée, grandes baies vitrées. Résidence sécurisée avec piscine commune, salle de sport et parking souterrain. Proximité de toutes commodités.",
    "Superbe appartement moderne dans une résidence de prestige. Spacieux séjour lumineux, chambres avec placards, salles de bain élégantes. Terrasse avec vue mer. Finitions luxueuses, climatisation centrale, domotique.",
    "Appartement d'exception offrant un cadre de vie privilégié. Design contemporain, matériaux nobles, espaces optimisés. Balcons spacieux, cuisine américaine équipée, parking double. Environnement calme et verdoyant.",
  ],
  APARTMENT_MID: [
    "Bel appartement situé dans un quartier résidentiel calme. Bon état général, lumineux et bien agencé. Proche des écoles, commerces et transports en commun. Idéal pour famille ou investissement locatif.",
    "Appartement confortable dans immeuble récent. Séjour spacieux, chambres lumineuses, cuisine fonctionnelle. Balcon avec vue dégagée. Parking disponible. Quartier dynamique avec toutes commodités à proximité.",
    "Appartement bien entretenu offrant un excellent rapport qualité-prix. Distribution pratique, bon ensoleillement, calme absolu. Proche de toutes les commodités. Parfait pour premier achat ou investissement.",
  ],
  APARTMENT_BUDGET: [
    "Appartement à rénover offrant un beau potentiel. Bien situé dans un quartier en développement. Structure saine, bonne luminosité. Opportunité pour investisseurs ou primo-accédants.",
    "Appartement fonctionnel dans résidence bien entretenue. Idéalement situé, proche commerces et transport. Bon rapport qualité-prix pour ce quartier en pleine expansion.",
  ],
  VILLA_LUXURY: [
    "Villa d'architecte exceptionnelle avec piscine et jardin paysager. Design contemporain, matériaux premium, domotique complète. Grandes baies vitrées, terrasses panoramiques. Espace bien-être avec hammam et salle de sport.",
    "Somptueuse villa de prestige dans quartier privilégié. Architecture moderne, volumes généreux, finitions luxueuses. Piscine à débordement, pool house, jardin méditerranéen. Garage multiple, sécurité maximale.",
    "Villa de luxe offrant confort et raffinement absolu. Salon cathédrale, suite parentale avec dressing, cuisine professionnelle. Piscine chauffée, terrain de tennis, vue mer panoramique. Prestations exceptionnelles.",
  ],
  VILLA_MID: [
    "Belle villa familiale dans quartier résidentiel recherché. Spacieuse et lumineuse, jardin arboré avec piscine. Bon état général, belles prestations. Garage, terrasses, barbecue. Environnement calme.",
    "Villa moderne et fonctionnelle idéale pour famille. Plan bien pensé, belles surfaces, jardin avec espace jeux. Piscine, terrasse couverte, parking. Proche écoles et commodités.",
  ],
  HOUSE_MID: [
    "Maison de caractère avec charme authentique. Volumes intéressants, jardin agréable, emplacement calme. Quelques travaux de rafraîchissement à prévoir. Beau potentiel.",
    "Maison traditionnelle bien située. Espaces de vie confortables, chambres spacieuses, cour intérieure. Proche centre-ville et commodités. Bon investissement.",
  ],
  LAND: [
    "Terrain constructible viabilisé dans secteur en développement. Bien situé, accès facile, environnement calme. Idéal pour projet de construction résidentielle.",
    "Belle parcelle de terrain dans zone urbanisée. Plat et bien orienté, toutes commodités à proximité. Certificat d'urbanisme disponible. Opportunité rare.",
  ],
  COMMERCIAL: [
    "Local commercial stratégiquement situé dans zone de fort passage. Grandes vitrines, bon état, possibilité d'aménagement selon activité. Parking disponible.",
    "Espace commercial idéalement placé en centre-ville. Excellente visibilité, accès facile, bon état. Rentabilité assurée.",
  ],
}

// Helper functions
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getPropertyTitle(propertyType: PropertyType, location: any, bedrooms: number | null, hasSeaView: boolean, priceRange: string): string {
  const bedroomStr = bedrooms ? `S+${bedrooms}` : ''
  const viewStr = hasSeaView ? 'vue mer' : ''
  
  switch(propertyType) {
    case 'APARTMENT':
      return `Appartement ${bedroomStr} ${location.neighborhood} ${viewStr ? 'avec ' + viewStr : ''}`.trim()
    case 'VILLA':
      return `Villa de luxe ${bedroomStr} ${location.neighborhood} ${viewStr ? 'vue mer' : 'avec piscine'}`.trim()
    case 'HOUSE':
      return `Maison ${bedroomStr} à ${location.neighborhood}`.trim()
    case 'LAND':
      return `Terrain constructible ${location.neighborhood}`.trim()
    case 'COMMERCIAL':
      return `Local commercial ${location.neighborhood}`.trim()
    default:
      return `Propriété ${location.neighborhood}`.trim()
  }
}

function getPropertyDescription(propertyType: PropertyType, priceRange: string): string {
  const key = `${propertyType}_${priceRange}` as keyof typeof PROPERTY_DESCRIPTIONS
  const descriptions = PROPERTY_DESCRIPTIONS[key] || PROPERTY_DESCRIPTIONS.APARTMENT_MID
  return getRandomElement(descriptions)
}

function getImageUrls(propertyType: PropertyType, index: number): string[] {
  const baseQueries = [
    'mediterranean-villa',
    'luxury-apartment',
    'modern-house',
    'tunisia-architecture',
    'interior-design',
    'real-estate-luxury'
  ]
  
  return [
    `https://images.unsplash.com/photo-${1560000000 + index * 100}?w=800&q=80`,
    `https://images.unsplash.com/photo-${1560000100 + index * 100}?w=800&q=80`,
    `https://images.unsplash.com/photo-${1560000200 + index * 100}?w=800&q=80`,
    `https://images.unsplash.com/photo-${1560000300 + index * 100}?w=800&q=80`,
  ]
}

async function main() {
  console.log('🌱 Starting comprehensive database seeding...')

  // Clear existing data
  await prisma.legalQuery.deleteMany()
  await prisma.investmentOpportunity.deleteMany()
  await prisma.portfolio.deleteMany()
  await prisma.searchAlert.deleteMany()
  await prisma.savedProperty.deleteMany()
  await prisma.valuation.deleteMany()
  await prisma.property.deleteMany()
  await prisma.neighborhood.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Cleared existing data')

  // Create test users
  const devPassword = await hash('dev123', 12)
  const normalPassword = await hash('user123', 12)
  const agentPassword = await hash('agent123', 12)

  const devUser = await prisma.user.create({
    data: {
      email: 'dev@estatemind.tn',
      password: devPassword,
      name: 'Developer Account',
      phone: '+216 20 000 001',
      userType: UserType.INVESTOR,
      subscriptionTier: SubscriptionTier.INVESTOR_PRO_299,
      valuationCredits: -1, // Unlimited
    },
  })

  const normalUser = await prisma.user.create({
    data: {
      email: 'normal@estatemind.tn',
      password: normalPassword,
      name: 'Utilisateur Normal',
      phone: '+216 20 000 002',
      userType: UserType.NORMAL,
      subscriptionTier: SubscriptionTier.FREE,
      valuationCredits: 3,
    },
  })

  const agentUser = await prisma.user.create({
    data: {
      email: 'agent@estatemind.tn',
      password: agentPassword,
      name: 'Agent Immobilier',
      phone: '+216 20 000 003',
      userType: UserType.AGENT,
      subscriptionTier: SubscriptionTier.AGENCY_499,
      valuationCredits: -1,
    },
  })

  console.log('✅ Created test users')
  console.log('  - dev@estatemind.tn / dev123 (Investor Pro)')
  console.log('  - normal@estatemind.tn / user123 (Free)')
  console.log('  - agent@estatemind.tn / agent123 (Agency)')

  // Create comprehensive neighborhoods
  console.log('🏘️  Creating neighborhoods...')
  
  const neighborhoodsData = [
    // Tunis - Premium areas
    {
      name: 'La Marsa Plage',
      governorate: 'Tunis',
      delegation: 'La Marsa',
      overallScore: 94,
      housingScore: 92,
      schoolsScore: 96,
      transportScore: 88,
      amenitiesScore: 95,
      lifestyleScore: 97,
      safetyScore: 93,
      avgPricePerM2: 3800,
      rentalYield: 4.0,
      daysOnMarket: 35,
      priceGrowthYTD: 9.2,
      description: 'Quartier côtier prestigieux de La Marsa, prisé pour ses plages, ses restaurants et son ambiance méditerranéenne. Excellentes écoles internationales et infrastructures de qualité.',
      schools: [
        { name: 'École Internationale de Carthage', distance: 1.5, rating: 9.5 },
        { name: 'Lycée Français Gustave Flaubert', distance: 2.5, rating: 9.2 },
        { name: 'Collège Ibn Khaldoun', distance: 1.0, rating: 8.5 }
      ],
      transportation: [
        { type: 'TGM', line: 'Tunis-La Marsa', distance: 0.3 },
        { type: 'Bus', lines: ['20', '30', '40'], distance: 0.2 },
        { type: 'Taxi', available: true }
      ],
      amenities: [
        { type: 'Supermarché', name: 'Carrefour Market', distance: 0.5 },
        { type: 'Centre commercial', name: 'Marsa Mall', distance: 1.2 },
        { type: 'Clinique', name: 'Clinique La Marsa', distance: 1.5 },
        { type: 'Plage', name: 'Plage de La Marsa', distance: 0.2 },
        { type: 'Restaurant', name: 'Zone restaurants', distance: 0.3 }
      ],
      gentrificationScore: 88,
      futureProjects: [
        { name: 'Extension Marina La Marsa', completion: '2025', impact: 'high' },
        { name: 'Nouveau centre culturel', completion: '2024', impact: 'medium' }
      ]
    },
    {
      name: 'Carthage Hannibal',
      governorate: 'Tunis',
      delegation: 'Carthage',
      overallScore: 96,
      housingScore: 95,
      schoolsScore: 97,
      transportScore: 90,
      amenitiesScore: 94,
      lifestyleScore: 98,
      safetyScore: 96,
      avgPricePerM2: 4500,
      rentalYield: 3.8,
      daysOnMarket: 30,
      priceGrowthYTD: 10.5,
      description: 'Quartier historique ultra-prestigieux de Carthage, résidentiel et calme. Proximité des sites archéologiques, ambassades et écoles d\'élite. Vue mer exceptionnelle.',
      schools: [
        { name: 'Lycée Français Pierre Mendes France', distance: 2.0, rating: 9.7 },
        { name: 'Carthage American School', distance: 1.5, rating: 9.5 }
      ],
      transportation: [
        { type: 'TGM', line: 'Tunis-La Marsa', distance: 0.5 },
        { type: 'Bus', lines: ['15', '20'], distance: 0.3 }
      ],
      amenities: [
        { type: 'Supermarché', name: 'Monoprix', distance: 1.5 },
        { type: 'Centre médical', name: 'Clinique Hannibal', distance: 2.0 },
        { type: 'Plage', name: 'Plage de Carthage', distance: 0.8 },
        { type: 'Sites historiques', name: 'Thermes d\'Antonin', distance: 1.0 }
      ],
      gentrificationScore: 92,
      futureProjects: [
        { name: 'Rénovation port punique', completion: '2026', impact: 'medium' }
      ]
    },
    {
      name: 'Ariana Centre',
      governorate: 'Ariana',
      delegation: 'Ariana Ville',
      overallScore: 82,
      housingScore: 80,
      schoolsScore: 85,
      transportScore: 78,
      amenitiesScore: 84,
      lifestyleScore: 81,
      safetyScore: 80,
      avgPricePerM2: 2400,
      rentalYield: 5.5,
      daysOnMarket: 50,
      priceGrowthYTD: 6.8,
      description: 'Centre-ville d\'Ariana, quartier dynamique et bien desservi. Excellente accessibilité, nombreux commerces et services. Rapport qualité-prix attractif.',
      schools: [
        { name: 'Lycée Pilote Ariana', distance: 1.0, rating: 8.5 },
        { name: 'École Primaire Ariana', distance: 0.5, rating: 8.0 }
      ],
      transportation: [
        { type: 'Métro léger', line: 'Ligne 5', distance: 0.4 },
        { type: 'Bus', lines: ['11', '12', '13'], distance: 0.2 }
      ],
      amenities: [
        { type: 'Supermarché', name: 'Géant', distance: 0.8 },
        { type: 'Hôpital', name: 'Hôpital Régional Ariana', distance: 1.5 },
        { type: 'Centre commercial', name: 'City Center', distance: 2.0 }
      ],
      gentrificationScore: 75,
      futureProjects: [
        { name: 'Extension métro léger', completion: '2025', impact: 'high' }
      ]
    },
    {
      name: 'Menzah 6',
      governorate: 'Tunis',
      delegation: 'Menzah',
      overallScore: 86,
      housingScore: 85,
      schoolsScore: 88,
      transportScore: 82,
      amenitiesScore: 87,
      lifestyleScore: 85,
      safetyScore: 86,
      avgPricePerM2: 2800,
      rentalYield: 5.0,
      daysOnMarket: 45,
      priceGrowthYTD: 7.5,
      description: 'Quartier résidentiel moderne et verdoyant. Très prisé des familles pour ses écoles de qualité et son environnement calme. Proximité du centre-ville.',
      schools: [
        { name: 'Lycée Technique Menzah', distance: 0.8, rating: 8.8 },
        { name: 'École Primaire Menzah 6', distance: 0.4, rating: 8.5 }
      ],
      transportation: [
        { type: 'Bus', lines: ['5', '6', '7'], distance: 0.3 },
        { type: 'Taxi collectif', available: true }
      ],
      amenities: [
        { type: 'Supermarché', name: 'Monoprix Menzah', distance: 0.5 },
        { type: 'Clinique', name: 'Polyclinique Menzah', distance: 1.0 },
        { type: 'Parc', name: 'Parc Menzah', distance: 0.6 }
      ],
      gentrificationScore: 78,
      futureProjects: []
    },
    
    // Sousse
    {
      name: 'Sousse Corniche',
      governorate: 'Sousse',
      delegation: 'Sousse Ville',
      overallScore: 85,
      housingScore: 83,
      schoolsScore: 82,
      transportScore: 80,
      amenitiesScore: 88,
      lifestyleScore: 90,
      safetyScore: 84,
      avgPricePerM2: 1900,
      rentalYield: 6.2,
      daysOnMarket: 55,
      priceGrowthYTD: 5.8,
      description: 'Front de mer de Sousse, animation et vie nocturne. Proche de la médina et des zones touristiques. Excellent potentiel locatif.',
      schools: [
        { name: 'Lycée Rue de Russie', distance: 2.0, rating: 8.0 }
      ],
      transportation: [
        { type: 'Train', line: 'Ligne principale', distance: 1.5 },
        { type: 'Louage', available: true }
      ],
      amenities: [
        { type: 'Centre commercial', name: 'Sousse City Center', distance: 1.0 },
        { type: 'Plage', name: 'Plage Boujaffar', distance: 0.2 },
        { type: 'Médina', name: 'Médina de Sousse', distance: 1.5 }
      ],
      gentrificationScore: 70,
      futureProjects: [
        { name: 'Réaménagement corniche', completion: '2025', impact: 'high' }
      ]
    },
    {
      name: 'Port El Kantaoui',
      governorate: 'Sousse',
      delegation: 'Port El Kantaoui',
      overallScore: 88,
      housingScore: 87,
      schoolsScore: 80,
      transportScore: 75,
      amenitiesScore: 92,
      lifestyleScore: 93,
      safetyScore: 90,
      avgPricePerM2: 2500,
      rentalYield: 7.0,
      daysOnMarket: 40,
      priceGrowthYTD: 6.5,
      description: 'Station balnéaire haut de gamme avec marina, golf et plages. Résidences sécurisées et services premium. Idéal investissement touristique.',
      schools: [
        { name: 'École Internationale Sousse', distance: 5.0, rating: 8.5 }
      ],
      transportation: [
        { type: 'Bus touristique', available: true },
        { type: 'Taxi', available: true }
      ],
      amenities: [
        { type: 'Marina', name: 'Port El Kantaoui', distance: 0.3 },
        { type: 'Golf', name: 'Golf El Kantaoui', distance: 1.0 },
        { type: 'Centre commercial', name: 'Hannibal Center', distance: 0.5 },
        { type: 'Plage', name: 'Plages privées', distance: 0.2 }
      ],
      gentrificationScore: 82,
      futureProjects: []
    },
    {
      name: 'Khezama Sousse',
      governorate: 'Sousse',
      delegation: 'Khezama',
      overallScore: 78,
      housingScore: 76,
      schoolsScore: 80,
      transportScore: 75,
      amenitiesScore: 79,
      lifestyleScore: 77,
      safetyScore: 78,
      avgPricePerM2: 1600,
      rentalYield: 6.8,
      daysOnMarket: 60,
      priceGrowthYTD: 5.2,
      description: 'Quartier résidentiel en expansion, offrant un excellent rapport qualité-prix. Proche université et zones d\'activité économique.',
      schools: [
        { name: 'École Khezama', distance: 0.5, rating: 7.5 }
      ],
      transportation: [
        { type: 'Bus', lines: ['10', '15'], distance: 0.3 }
      ],
      amenities: [
        { type: 'Supermarché', name: 'Azur', distance: 0.8 },
        { type: 'Université', name: 'Campus Sousse', distance: 2.0 }
      ],
      gentrificationScore: 72,
      futureProjects: [
        { name: 'Nouveau pole commercial', completion: '2025', impact: 'medium' }
      ]
    },
    
    // Nabeul & Hammamet
    {
      name: 'Hammamet Centre',
      governorate: 'Nabeul',
      delegation: 'Hammamet',
      overallScore: 84,
      housingScore: 82,
      schoolsScore: 80,
      transportScore: 76,
      amenitiesScore: 87,
      lifestyleScore: 89,
      safetyScore: 85,
      avgPricePerM2: 2200,
      rentalYield: 6.5,
      daysOnMarket: 50,
      priceGrowthYTD: 6.0,
      description: 'Centre-ville d\'Hammamet, destination touristique majeure. Plages magnifiques, médina authentique, excellente infrastructure touristique.',
      schools: [
        { name: 'Lycée Hammamet', distance: 1.0, rating: 8.0 }
      ],
      transportation: [
        { type: 'Louage', available: true },
        { type: 'Taxi', available: true }
      ],
      amenities: [
        { type: 'Médina', name: 'Médina Hammamet', distance: 0.5 },
        { type: 'Plage', name: 'Plage publique', distance: 0.3 },
        { type: 'Marché', name: 'Marché central', distance: 0.4 }
      ],
      gentrificationScore: 75,
      futureProjects: []
    },
    {
      name: 'Yasmine Hammamet',
      governorate: 'Nabeul',
      delegation: 'Yasmine Hammamet',
      overallScore: 90,
      housingScore: 89,
      schoolsScore: 82,
      transportScore: 78,
      amenitiesScore: 93,
      lifestyleScore: 95,
      safetyScore: 92,
      avgPricePerM2: 2800,
      rentalYield: 7.5,
      daysOnMarket: 35,
      priceGrowthYTD: 7.8,
      description: 'Station touristique moderne et intégrée. Marina, golf, parcs d\'attractions. Résidences haut de gamme et rendement locatif exceptionnel.',
      schools: [
        { name: 'École Internationale Hammamet', distance: 3.0, rating: 8.5 }
      ],
      transportation: [
        { type: 'Navettes', available: true },
        { type: 'Taxi', available: true }
      ],
      amenities: [
        { type: 'Marina', name: 'Yasmine Marina', distance: 0.5 },
        { type: 'Centre commercial', name: 'Hammamet Mall', distance: 0.3 },
        { type: 'Parc', name: 'Carthage Land', distance: 1.0 },
        { type: 'Golf', name: 'Citrus Golf', distance: 2.0 }
      ],
      gentrificationScore: 85,
      futureProjects: [
        { name: 'Extension marina', completion: '2026', impact: 'high' }
      ]
    },
    {
      name: 'Nabeul Ville',
      governorate: 'Nabeul',
      delegation: 'Nabeul Ville',
      overallScore: 79,
      housingScore: 77,
      schoolsScore: 82,
      transportScore: 74,
      amenitiesScore: 81,
      lifestyleScore: 78,
      safetyScore: 80,
      avgPricePerM2: 1700,
      rentalYield: 6.0,
      daysOnMarket: 65,
      priceGrowthYTD: 4.8,
      description: 'Chef-lieu du gouvernorat, ville artisanale réputée pour sa poterie. Marché hebdomadaire célèbre, plages à proximité.',
      schools: [
        { name: 'Lycée Ibn Khaldoun Nabeul', distance: 1.0, rating: 8.2 }
      ],
      transportation: [
        { type: 'Train', line: 'Ligne Tunis-Nabeul', distance: 1.5 },
        { type: 'Louage', available: true }
      ],
      amenities: [
        { type: 'Marché', name: 'Marché du vendredi', distance: 0.8 },
        { type: 'Centre artisanal', name: 'Zone potiers', distance: 1.0 },
        { type: 'Plage', name: 'Plage Nabeul', distance: 2.0 }
      ],
      gentrificationScore: 68,
      futureProjects: []
    },
    
    // Sfax
    {
      name: 'Sfax Centre Ville',
      governorate: 'Sfax',
      delegation: 'Sfax Ville',
      overallScore: 81,
      housingScore: 79,
      schoolsScore: 84,
      transportScore: 76,
      amenitiesScore: 85,
      lifestyleScore: 80,
      safetyScore: 82,
      avgPricePerM2: 1800,
      rentalYield: 6.3,
      daysOnMarket: 58,
      priceGrowthYTD: 5.5,
      description: 'Centre économique du sud tunisien. Ville dynamique et commerçante, excellentes opportunités d\'investissement. Médina historique.',
      schools: [
        { name: 'Lycée Pilote Sfax', distance: 1.5, rating: 8.8 },
        { name: 'Lycée Technique Sfax', distance: 1.0, rating: 8.2 }
      ],
      transportation: [
        { type: 'Train', line: 'Ligne principale', distance: 2.0 },
        { type: 'Louage', available: true }
      ],
      amenities: [
        { type: 'Médina', name: 'Médina de Sfax', distance: 0.5 },
        { type: 'Centre commercial', name: 'Sfax City Center', distance: 1.0 },
        { type: 'Hôpital', name: 'CHU Habib Bourguiba', distance: 2.0 }
      ],
      gentrificationScore: 70,
      futureProjects: [
        { name: 'Rénovation médina', completion: '2025', impact: 'medium' }
      ]
    },
    {
      name: 'Thyna Sfax',
      governorate: 'Sfax',
      delegation: 'Thyna',
      overallScore: 76,
      housingScore: 74,
      schoolsScore: 78,
      transportScore: 72,
      amenitiesScore: 77,
      lifestyleScore: 75,
      safetyScore: 77,
      avgPricePerM2: 1500,
      rentalYield: 6.8,
      daysOnMarket: 70,
      priceGrowthYTD: 4.5,
      description: 'Banlieue de Sfax en développement rapide. Prix attractifs, proche zones industrielles et universitaires. Bon potentiel d\'appréciation.',
      schools: [
        { name: 'École Thyna', distance: 0.5, rating: 7.5 }
      ],
      transportation: [
        { type: 'Bus', lines: ['20', '21'], distance: 0.4 }
      ],
      amenities: [
        { type: 'Supermarché', name: 'Magasin Général', distance: 0.8 },
        { type: 'Zone industrielle', distance: 2.0 }
      ],
      gentrificationScore: 72,
      futureProjects: [
        { name: 'Nouveau complexe résidentiel', completion: '2024', impact: 'medium' }
      ]
    },
    
    // Bizerte
    {
      name: 'Bizerte Centre',
      governorate: 'Bizerte',
      delegation: 'Bizerte Ville',
      overallScore: 80,
      housingScore: 78,
      schoolsScore: 82,
      transportScore: 75,
      amenitiesScore: 83,
      lifestyleScore: 81,
      safetyScore: 80,
      avgPricePerM2: 1600,
      rentalYield: 6.0,
      daysOnMarket: 62,
      priceGrowthYTD: 5.0,
      description: 'Ville portuaire du nord, riche patrimoine historique. Vieux port pittoresque, proximité plages magnifiques. Prix compétitifs.',
      schools: [
        { name: 'Lycée Technique Bizerte', distance: 1.0, rating: 8.0 }
      ],
      transportation: [
        { type: 'Train', line: 'Ligne Tunis-Bizerte', distance: 1.5 },
        { type: 'Louage', available: true }
      ],
      amenities: [
        { type: 'Port', name: 'Vieux Port', distance: 0.5 },
        { type: 'Centre commercial', name: 'Libya Mall', distance: 2.0 },
        { type: 'Hôpital', name: 'Hôpital Régional', distance: 1.5 }
      ],
      gentrificationScore: 68,
      futureProjects: []
    },
    {
      name: 'Corniche Bizerte',
      governorate: 'Bizerte',
      delegation: 'Bizerte Ville',
      overallScore: 84,
      housingScore: 83,
      schoolsScore: 80,
      transportScore: 77,
      amenitiesScore: 88,
      lifestyleScore: 89,
      safetyScore: 85,
      avgPricePerM2: 2100,
      rentalYield: 5.8,
      daysOnMarket: 48,
      priceGrowthYTD: 6.2,
      description: 'Front de mer de Bizerte, cadre agréable et paisible. Plages réputées, restaurants de poissons. Qualité de vie exceptionnelle.',
      schools: [
        { name: 'École Corniche', distance: 1.0, rating: 8.0 }
      ],
      transportation: [
        { type: 'Bus', lines: ['10', '12'], distance: 0.3 }
      ],
      amenities: [
        { type: 'Plage', name: 'Plage de la Corniche', distance: 0.2 },
        { type: 'Restaurants', name: 'Zone restaurants', distance: 0.3 }
      ],
      gentrificationScore: 75,
      futureProjects: []
    },
    
    // Other cities
    {
      name: 'Monastir Centre',
      governorate: 'Monastir',
      delegation: 'Monastir',
      overallScore: 82,
      housingScore: 80,
      schoolsScore: 84,
      transportScore: 78,
      amenitiesScore: 85,
      lifestyleScore: 83,
      safetyScore: 82,
      avgPricePerM2: 1700,
      rentalYield: 6.2,
      daysOnMarket: 55,
      priceGrowthYTD: 5.5,
      description: 'Ville côtière historique avec marina moderne. Aéroport international, université. Mélange patrimoine et modernité.',
      schools: [
        { name: 'Université de Monastir', distance: 2.0, rating: 8.5 }
      ],
      transportation: [
        { type: 'Train', line: 'Ligne Sahel', distance: 1.0 },
        { type: 'Aéroport', name: 'Aéroport Monastir', distance: 8.0 }
      ],
      amenities: [
        { type: 'Marina', name: 'Marina Cap Monastir', distance: 2.0 },
        { type: 'Ribat', name: 'Ribat de Monastir', distance: 0.5 }
      ],
      gentrificationScore: 70,
      futureProjects: []
    },
    {
      name: 'Mahdia Centre',
      governorate: 'Mahdia',
      delegation: 'Mahdia',
      overallScore: 77,
      housingScore: 75,
      schoolsScore: 79,
      transportScore: 70,
      amenitiesScore: 80,
      lifestyleScore: 81,
      safetyScore: 78,
      avgPricePerM2: 1400,
      rentalYield: 6.5,
      daysOnMarket: 68,
      priceGrowthYTD: 4.2,
      description: 'Ville de pêcheurs authentique et paisible. Plages immaculées, vieille ville charmante. Destination en développement touristique.',
      schools: [
        { name: 'Lycée Mahdia', distance: 1.0, rating: 7.8 }
      ],
      transportation: [
        { type: 'Louage', available: true }
      ],
      amenities: [
        { type: 'Médina', name: 'Vieille ville', distance: 0.5 },
        { type: 'Port', name: 'Port de pêche', distance: 0.3 },
        { type: 'Plage', name: 'Grande plage', distance: 0.5 }
      ],
      gentrificationScore: 65,
      futureProjects: [
        { name: 'Développement zone touristique', completion: '2026', impact: 'high' }
      ]
    },
    {
      name: 'Kairouan Médina',
      governorate: 'Kairouan',
      delegation: 'Kairouan',
      overallScore: 72,
      housingScore: 70,
      schoolsScore: 76,
      transportScore: 68,
      amenitiesScore: 74,
      lifestyleScore: 73,
      safetyScore: 75,
      avgPricePerM2: 1100,
      rentalYield: 7.0,
      daysOnMarket: 75,
      priceGrowthYTD: 3.8,
      description: 'Ville sainte historique, quatrième lieu saint de l\'Islam. Patrimoine UNESCO, artisanat réputé. Prix très accessibles.',
      schools: [
        { name: 'Lycée Kairouan', distance: 1.5, rating: 7.5 }
      ],
      transportation: [
        { type: 'Louage', available: true }
      ],
      amenities: [
        { type: 'Grande Mosquée', name: 'Mosquée Okba', distance: 0.5 },
        { type: 'Médina', name: 'Médina historique', distance: 0.3 },
        { type: 'Souks', name: 'Souks traditionnels', distance: 0.4 }
      ],
      gentrificationScore: 60,
      futureProjects: [
        { name: 'Restauration patrimoine', completion: '2025', impact: 'medium' }
      ]
    },
    
    // Additional Tunis neighborhoods
    {
      name: 'Lac 1',
      governorate: 'Tunis',
      delegation: 'Les Berges du Lac',
      overallScore: 88,
      housingScore: 87,
      schoolsScore: 86,
      transportScore: 80,
      amenitiesScore: 90,
      lifestyleScore: 89,
      safetyScore: 88,
      avgPricePerM2: 3200,
      rentalYield: 4.5,
      daysOnMarket: 42,
      priceGrowthYTD: 7.8,
      description: 'Quartier moderne des Berges du Lac, résidences haut de gamme et bureaux. Proche de la zone d\'activités économiques.',
      schools: [{ name: 'International School of Carthage', distance: 2.0, rating: 9.0 }],
      transportation: [{ type: 'Bus', lines: ['25', '26'], distance: 0.3 }],
      amenities: [
        { type: 'Centre commercial', name: 'Tunisia Mall', distance: 1.5 },
        { type: 'Lac', name: 'Lac de Tunis', distance: 0.5 }
      ],
      gentrificationScore: 85,
      futureProjects: []
    },
    {
      name: 'Ennasr',
      governorate: 'Ariana',
      delegation: 'Ariana Ville',
      overallScore: 83,
      housingScore: 82,
      schoolsScore: 86,
      transportScore: 79,
      amenitiesScore: 84,
      lifestyleScore: 82,
      safetyScore: 84,
      avgPricePerM2: 2600,
      rentalYield: 5.2,
      daysOnMarket: 48,
      priceGrowthYTD: 6.8,
      description: 'Quartier résidentiel populaire, bien desservi et animé. Nombreux commerces et services de proximité.',
      schools: [{ name: 'Lycée Ennasr', distance: 0.8, rating: 8.3 }],
      transportation: [{ type: 'Bus', lines: ['15', '16', '17'], distance: 0.2 }],
      amenities: [
        { type: 'Supermarché', name: 'Carrefour Ennasr', distance: 0.6 },
        { type: 'Clinique', name: 'Clinique Ennasr', distance: 1.0 }
      ],
      gentrificationScore: 76,
      futureProjects: []
    },
    {
      name: 'Manar',
      governorate: 'Tunis',
      delegation: 'Manar',
      overallScore: 85,
      housingScore: 84,
      schoolsScore: 89,
      transportScore: 81,
      amenitiesScore: 86,
      lifestyleScore: 84,
      safetyScore: 85,
      avgPricePerM2: 2700,
      rentalYield: 5.0,
      daysOnMarket: 46,
      priceGrowthYTD: 7.2,
      description: 'Quartier universitaire dynamique, proche de l\'Université de Tunis El Manar. Jeune et cosmopolite.',
      schools: [{ name: 'Université de Tunis El Manar', distance: 1.0, rating: 9.0 }],
      transportation: [{ type: 'Bus', lines: ['8', '9', '10'], distance: 0.3 }],
      amenities: [
        { type: 'Campus universitaire', distance: 1.0 },
        { type: 'Bibliothèque', name: 'BU Manar', distance: 1.2 }
      ],
      gentrificationScore: 74,
      futureProjects: []
    },
    {
      name: 'Sidi Bou Said',
      governorate: 'Tunis',
      delegation: 'Sidi Bou Said',
      overallScore: 93,
      housingScore: 91,
      schoolsScore: 88,
      transportScore: 86,
      amenitiesScore: 94,
      lifestyleScore: 98,
      safetyScore: 92,
      avgPricePerM2: 4000,
      rentalYield: 4.2,
      daysOnMarket: 38,
      priceGrowthYTD: 9.0,
      description: 'Village pittoresque emblématique aux portes bleues, vue panoramique sur la Méditerranée. Quartier touristique prestigieux.',
      schools: [{ name: 'École de Sidi Bou Said', distance: 0.8, rating: 8.5 }],
      transportation: [{ type: 'TGM', line: 'Tunis-La Marsa', distance: 0.4 }],
      amenities: [
        { type: 'Café', name: 'Café des Délices', distance: 0.3 },
        { type: 'Médina', name: 'Village historique', distance: 0.2 }
      ],
      gentrificationScore: 90,
      futureProjects: []
    },
    
    // Additional Sousse neighborhoods
    {
      name: 'Sahloul Sousse',
      governorate: 'Sousse',
      delegation: 'Sousse Ville',
      overallScore: 80,
      housingScore: 78,
      schoolsScore: 82,
      transportScore: 76,
      amenitiesScore: 83,
      lifestyleScore: 79,
      safetyScore: 80,
      avgPricePerM2: 1750,
      rentalYield: 6.0,
      daysOnMarket: 58,
      priceGrowthYTD: 5.5,
      description: 'Quartier médical et résidentiel, proche du CHU Sahloul. Calme et bien équipé.',
      schools: [{ name: 'Faculté de Médecine', distance: 1.0, rating: 8.8 }],
      transportation: [{ type: 'Bus', lines: ['12', '14'], distance: 0.4 }],
      amenities: [
        { type: 'Hôpital', name: 'CHU Sahloul', distance: 0.8 },
        { type: 'Supermarché', name: 'Magasin Général', distance: 0.6 }
      ],
      gentrificationScore: 72,
      futureProjects: []
    },
    {
      name: 'Hammam Sousse',
      governorate: 'Sousse',
      delegation: 'Hammam Sousse',
      overallScore: 79,
      housingScore: 77,
      schoolsScore: 78,
      transportScore: 74,
      amenitiesScore: 82,
      lifestyleScore: 80,
      safetyScore: 79,
      avgPricePerM2: 1650,
      rentalYield: 6.5,
      daysOnMarket: 62,
      priceGrowthYTD: 5.0,
      description: 'Ville balnéaire familiale au nord de Sousse, plages agréables et ambiance détendue.',
      schools: [{ name: 'Lycée Hammam Sousse', distance: 1.2, rating: 7.8 }],
      transportation: [{ type: 'Train', line: 'Ligne Sahel', distance: 1.5 }],
      amenities: [
        { type: 'Plage', name: 'Plage Hammam Sousse', distance: 0.5 },
        { type: 'Marché', name: 'Marché municipal', distance: 0.7 }
      ],
      gentrificationScore: 68,
      futureProjects: []
    },
    
    // Additional Nabeul neighborhoods
    {
      name: 'Hammamet Yasmine Centre',
      governorate: 'Nabeul',
      delegation: 'Yasmine Hammamet',
      overallScore: 89,
      housingScore: 88,
      schoolsScore: 81,
      transportScore: 77,
      amenitiesScore: 94,
      lifestyleScore: 96,
      safetyScore: 91,
      avgPricePerM2: 2900,
      rentalYield: 7.8,
      daysOnMarket: 33,
      priceGrowthYTD: 8.2,
      description: 'Cœur de la station Yasmine Hammamet, animation permanente, excellents rendements locatifs.',
      schools: [{ name: 'École Privée Yasmine', distance: 2.0, rating: 8.2 }],
      transportation: [{ type: 'Navettes touristiques', available: true }],
      amenities: [
        { type: 'Centre commercial', name: 'Medina Mediterranean', distance: 0.4 },
        { type: 'Parc d\'attractions', name: 'Carthage Land', distance: 0.8 }
      ],
      gentrificationScore: 86,
      futureProjects: []
    },
    {
      name: 'Kelibia',
      governorate: 'Nabeul',
      delegation: 'Kelibia',
      overallScore: 76,
      housingScore: 74,
      schoolsScore: 77,
      transportScore: 70,
      amenitiesScore: 78,
      lifestyleScore: 80,
      safetyScore: 77,
      avgPricePerM2: 1500,
      rentalYield: 6.2,
      daysOnMarket: 70,
      priceGrowthYTD: 4.5,
      description: 'Ville côtière du Cap Bon, forteresse historique et port de pêche. Plages superbes et tranquillité.',
      schools: [{ name: 'Lycée Kelibia', distance: 1.5, rating: 7.6 }],
      transportation: [{ type: 'Louage', available: true }],
      amenities: [
        { type: 'Fort', name: 'Fort de Kelibia', distance: 0.8 },
        { type: 'Port', name: 'Port de pêche', distance: 0.6 }
      ],
      gentrificationScore: 65,
      futureProjects: []
    },
    
    // Additional southern cities
    {
      name: 'Gabès Centre',
      governorate: 'Gabès',
      delegation: 'Gabès Ville',
      overallScore: 74,
      housingScore: 72,
      schoolsScore: 76,
      transportScore: 70,
      amenitiesScore: 75,
      lifestyleScore: 74,
      safetyScore: 75,
      avgPricePerM2: 1200,
      rentalYield: 6.8,
      daysOnMarket: 72,
      priceGrowthYTD: 4.0,
      description: 'Oasis maritime du sud tunisien, porte du désert. Économie en croissance, prix attractifs.',
      schools: [{ name: 'Lycée de Gabès', distance: 1.5, rating: 7.7 }],
      transportation: [{ type: 'Train', line: 'Ligne Sud', distance: 2.0 }],
      amenities: [
        { type: 'Oasis', name: 'Oasis de Gabès', distance: 2.0 },
        { type: 'Marché', name: 'Souk Jara', distance: 1.0 }
      ],
      gentrificationScore: 62,
      futureProjects: []
    },
    {
      name: 'Tozeur',
      governorate: 'Tozeur',
      delegation: 'Tozeur',
      overallScore: 73,
      housingScore: 71,
      schoolsScore: 74,
      transportScore: 68,
      amenitiesScore: 76,
      lifestyleScore: 78,
      safetyScore: 74,
      avgPricePerM2: 1100,
      rentalYield: 7.2,
      daysOnMarket: 75,
      priceGrowthYTD: 3.5,
      description: 'Porte du désert, architecture de briques ocres unique. Tourisme saharien en développement.',
      schools: [{ name: 'Lycée Tozeur', distance: 1.8, rating: 7.4 }],
      transportation: [{ type: 'Aéroport', name: 'Aéroport Tozeur-Nefta', distance: 5.0 }],
      amenities: [
        { type: 'Palmeraie', name: 'Palmeraie de Tozeur', distance: 1.5 },
        { type: 'Musée', name: 'Musée Dar Cheraït', distance: 1.0 }
      ],
      gentrificationScore: 60,
      futureProjects: []
    },
    {
      name: 'Djerba Houmt Souk',
      governorate: 'Médenine',
      delegation: 'Djerba',
      overallScore: 81,
      housingScore: 79,
      schoolsScore: 78,
      transportScore: 72,
      amenitiesScore: 84,
      lifestyleScore: 88,
      safetyScore: 82,
      avgPricePerM2: 1800,
      rentalYield: 7.5,
      daysOnMarket: 55,
      priceGrowthYTD: 5.8,
      description: 'Île paradisiaque, centre-ville animé. Tourisme florissant, investissement locatif rentable.',
      schools: [{ name: 'Lycée Houmt Souk', distance: 1.2, rating: 7.9 }],
      transportation: [
        { type: 'Aéroport', name: 'Aéroport Djerba-Zarzis', distance: 10.0 },
        { type: 'Ferry', available: true }
      ],
      amenities: [
        { type: 'Souk', name: 'Souk Houmt Souk', distance: 0.3 },
        { type: 'Plage', name: 'Plage Sidi Mehrez', distance: 2.0 }
      ],
      gentrificationScore: 70,
      futureProjects: []
    },
    {
      name: 'Sousse Riadh',
      governorate: 'Sousse',
      delegation: 'Sousse Riadh',
      overallScore: 77,
      housingScore: 75,
      schoolsScore: 79,
      transportScore: 73,
      amenitiesScore: 78,
      lifestyleScore: 76,
      safetyScore: 78,
      avgPricePerM2: 1600,
      rentalYield: 6.3,
      daysOnMarket: 60,
      priceGrowthYTD: 5.0,
      description: 'Quartier résidentiel moderne de Sousse, calme et familial. Bon rapport qualité-prix.',
      schools: [{ name: 'École Riadh', distance: 0.6, rating: 7.8 }],
      transportation: [{ type: 'Bus', lines: ['18', '19'], distance: 0.4 }],
      amenities: [
        { type: 'Supermarché', name: 'Azur Riadh', distance: 0.5 },
        { type: 'Parc', name: 'Parc Riadh', distance: 0.8 }
      ],
      gentrificationScore: 68,
      futureProjects: []
    },
    {
      name: 'Ben Arous Centre',
      governorate: 'Ben Arous',
      delegation: 'Ben Arous',
      overallScore: 75,
      housingScore: 73,
      schoolsScore: 77,
      transportScore: 72,
      amenitiesScore: 76,
      lifestyleScore: 74,
      safetyScore: 76,
      avgPricePerM2: 1900,
      rentalYield: 5.8,
      daysOnMarket: 65,
      priceGrowthYTD: 5.5,
      description: 'Banlieue sud de Tunis en développement, proche zones industrielles et aéroport.',
      schools: [{ name: 'Lycée Ben Arous', distance: 1.0, rating: 7.8 }],
      transportation: [
        { type: 'Métro léger', line: 'Ligne 6', distance: 0.8 },
        { type: 'Bus', lines: ['30', '31'], distance: 0.3 }
      ],
      amenities: [
        { type: 'Centre commercial', name: 'Mall Ben Arous', distance: 1.5 },
        { type: 'Marché', name: 'Marché municipal', distance: 0.6 }
      ],
      gentrificationScore: 70,
      futureProjects: [
        { name: 'Extension métro', completion: '2026', impact: 'high' }
      ]
    },
    {
      name: 'Sfax Jadida',
      governorate: 'Sfax',
      delegation: 'Sfax Ville',
      overallScore: 79,
      housingScore: 77,
      schoolsScore: 81,
      transportScore: 75,
      amenitiesScore: 82,
      lifestyleScore: 78,
      safetyScore: 80,
      avgPricePerM2: 1950,
      rentalYield: 6.0,
      daysOnMarket: 56,
      priceGrowthYTD: 5.8,
      description: 'Nouveau quartier moderne de Sfax, bien planifié avec infrastructures récentes.',
      schools: [{ name: 'École Sfax Jadida', distance: 0.8, rating: 8.0 }],
      transportation: [{ type: 'Bus', lines: ['22', '23', '24'], distance: 0.3 }],
      amenities: [
        { type: 'Centre médical', name: 'Polyclinique Jadida', distance: 1.0 },
        { type: 'Supermarché', name: 'Carrefour Sfax', distance: 0.7 }
      ],
      gentrificationScore: 75,
      futureProjects: [
        { name: 'Nouveau complexe sportif', completion: '2024', impact: 'medium' }
      ]
    }
  ]

  const neighborhoods = await Promise.all(
    neighborhoodsData.map(n => 
      prisma.neighborhood.create({
        data: {
          ...n,
          schools: JSON.stringify(n.schools),
          transportation: JSON.stringify(n.transportation),
          amenities: JSON.stringify(n.amenities),
          futureProjects: JSON.stringify(n.futureProjects)
        }
      })
    )
  )

  console.log(`✅ Created ${neighborhoods.length} neighborhoods`)

  // Create 100+ comprehensive properties
  console.log('🏠 Creating properties...')
  const properties = []
  const users = [devUser, normalUser, agentUser]
  
  // Property distribution counts per area
  const areaProperties = [
    // La Marsa (30)
    ...Array(30).fill({ ...TUNISIA_LOCATIONS[0], count: 30 }),
    // Carthage (20)
    ...Array(20).fill({ ...TUNISIA_LOCATIONS[3], count: 20 }),
    // Ariana (25)
    ...Array(25).fill({ ...TUNISIA_LOCATIONS[5], count: 25 }),
    // Menzah (20)
    ...Array(20).fill({ ...TUNISIA_LOCATIONS[7], count: 20 }),
    // Sousse Ville (15)
    ...Array(15).fill({ ...TUNISIA_LOCATIONS[9], count: 15 }),
    // Port El Kantaoui (10)
    ...Array(10).fill({ ...TUNISIA_LOCATIONS[11], count: 10 }),
    // Khezama (10)
    ...Array(10).fill({ ...TUNISIA_LOCATIONS[13], count: 10 }),
    // Hammamet (20)
    ...Array(20).fill({ ...TUNISIA_LOCATIONS[15], count: 20 }),
    // Nabeul (15)
    ...Array(15).fill({ ...TUNISIA_LOCATIONS[19], count: 15 }),
    // Yasmine Hammamet (10)
    ...Array(10).fill({ ...TUNISIA_LOCATIONS[18], count: 10 }),
    // Sfax Downtown (15)
    ...Array(15).fill({ ...TUNISIA_LOCATIONS[21], count: 15 }),
    // Thyna (10)
    ...Array(10).fill({ ...TUNISIA_LOCATIONS[23], count: 10 }),
    // Bizerte (10)
    ...Array(10).fill({ ...TUNISIA_LOCATIONS[24], count: 10 }),
    // Corniche Bizerte (8)
    ...Array(8).fill({ ...TUNISIA_LOCATIONS[25], count: 8 }),
    // Monastir (8)
    ...Array(8).fill({ ...TUNISIA_LOCATIONS[26], count: 8 }),
    // Mahdia (5)
    ...Array(5).fill({ ...TUNISIA_LOCATIONS[27], count: 5 }),
    // Kairouan (5)
    ...Array(5).fill({ ...TUNISIA_LOCATIONS[28], count: 5 }),
  ]

  for (let i = 0; i < areaProperties.length; i++) {
    const location = areaProperties[i]
    const owner = users[i % users.length]
    
    // Determine property type based on distribution (60% apt, 25% house/villa, 10% land, 5% commercial)
    let propertyType: PropertyType
    const typeRand = Math.random()
    if (typeRand < 0.60) {
      propertyType = PropertyType.APARTMENT
    } else if (typeRand < 0.85) {
      propertyType = Math.random() < 0.7 ? PropertyType.VILLA : PropertyType.HOUSE
    } else if (typeRand < 0.95) {
      propertyType = PropertyType.LAND
    } else {
      propertyType = PropertyType.COMMERCIAL
    }
    
    // Determine price range (40% budget, 40% mid, 15% luxury, 5% ultra)
    const priceRand = Math.random()
    let priceMultiplier: number
    let priceRange: string
    if (priceRand < 0.40) {
      priceMultiplier = 0.7 + Math.random() * 0.3 // Budget
      priceRange = 'BUDGET'
    } else if (priceRand < 0.80) {
      priceMultiplier = 1.0 + Math.random() * 0.5 // Mid-range
      priceRange = 'MID'
    } else if (priceRand < 0.95) {
      priceMultiplier = 1.5 + Math.random() * 1.0 // Luxury
      priceRange = 'LUXURY'
    } else {
      priceMultiplier = 2.5 + Math.random() * 1.5 // Ultra-luxury
      priceRange = 'LUXURY'
    }
    
    // Property size based on type
    let size: number
    if (propertyType === PropertyType.LAND) {
      size = Math.floor(Math.random() * 800) + 200
    } else if (propertyType === PropertyType.VILLA) {
      size = Math.floor(Math.random() * 250) + 200
    } else if (propertyType === PropertyType.HOUSE) {
      size = Math.floor(Math.random() * 150) + 100
    } else if (propertyType === PropertyType.APARTMENT) {
      size = Math.floor(Math.random() * 120) + 50
    } else {
      size = Math.floor(Math.random() * 200) + 80
    }
    
    // Calculate price
    const basePricePerM2 = location.pricePerM2 || 2000
    const adjustedPricePerM2 = Math.floor(basePricePerM2 * priceMultiplier)
    const transactionType = Math.random() < 0.75 ? TransactionType.SALE : TransactionType.RENT
    const price = transactionType === TransactionType.SALE 
      ? size * adjustedPricePerM2
      : Math.floor(size * adjustedPricePerM2 * 0.004) // Monthly rent ~5% annual yield
    
    // Property features based on type and price
    const bedrooms = propertyType === PropertyType.LAND || propertyType === PropertyType.COMMERCIAL
      ? null 
      : priceRange === 'LUXURY' 
        ? Math.floor(Math.random() * 3) + 3 
        : Math.floor(Math.random() * 3) + 2
    
    const bathrooms = propertyType === PropertyType.LAND || propertyType === PropertyType.COMMERCIAL
      ? null
      : Math.ceil((bedrooms || 0) * 0.7)
    
    const hasSeaView = ['La Marsa', 'Carthage', 'Port El Kantaoui', 'Hammamet', 'Yasmine Hammamet', 'Corniche'].some(n => 
      location.neighborhood?.includes(n)
    ) && Math.random() < 0.3
    
    const hasPool = propertyType === PropertyType.VILLA && priceRange === 'LUXURY' && Math.random() < 0.7
    const hasGarden = (propertyType === PropertyType.HOUSE || propertyType === PropertyType.VILLA) && Math.random() < 0.8
    const hasParking = Math.random() < (priceRange === 'LUXURY' ? 0.95 : priceRange === 'MID' ? 0.7 : 0.4)
    const hasElevator = propertyType === PropertyType.APARTMENT && Math.random() < 0.6
    const floor = propertyType === PropertyType.APARTMENT ? Math.floor(Math.random() * 8) + 1 : null
    
    // Generate title and description
    const title = getPropertyTitle(propertyType, location, bedrooms, hasSeaView, priceRange)
    const description = getPropertyDescription(propertyType, priceRange)
    
    // Create property
    const property = await prisma.property.create({
      data: {
        title,
        description,
        propertyType,
        transactionType,
        governorate: location.governorate,
        delegation: location.delegation,
        neighborhood: location.neighborhood,
        latitude: location.lat + (Math.random() - 0.5) * 0.01,
        longitude: location.lng + (Math.random() - 0.5) * 0.01,
        price,
        size,
        bedrooms,
        bathrooms,
        floor,
        hasParking,
        hasElevator,
        hasGarden,
        hasPool,
        hasSeaView,
        images: getImageUrls(propertyType, i),
        ownerId: owner.id,
        aiValuation: Math.floor(price * (0.93 + Math.random() * 0.14)),
        valuationConfidence: 0.75 + Math.random() * 0.2,
        isPriceFair: Math.random() > 0.35,
        views: Math.floor(Math.random() * 150),
        listingDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      },
    })
    
    properties.push(property)
    
    if ((i + 1) % 50 === 0) {
      console.log(`  Created ${i + 1} properties...`)
    }
  }

  console.log(`✅ Created ${properties.length} properties`)

  // Create valuations for some properties
  console.log('📊 Creating valuations...')
  const valuationCount = Math.min(20, properties.length)
  for (let i = 0; i < valuationCount; i++) {
    const property = properties[i]
    const user = users[i % users.length]
    
    await prisma.valuation.create({
      data: {
        propertyId: property.id,
        userId: user.id,
        estimatedValue: property.aiValuation!,
        confidenceScore: property.valuationConfidence!,
        minValue: Math.floor(property.aiValuation! * 0.92),
        maxValue: Math.floor(property.aiValuation! * 1.08),
        locationScore: Math.floor(Math.random() * 25) + 75,
        sizeScore: Math.floor(Math.random() * 25) + 70,
        conditionScore: Math.floor(Math.random() * 25) + 72,
        amenitiesScore: Math.floor(Math.random() * 25) + 70,
        comparables: JSON.stringify([
          {
            id: properties[(i + 1) % properties.length].id,
            address: properties[(i + 1) % properties.length].neighborhood,
            price: properties[(i + 1) % properties.length].price,
            similarity: 85 + Math.floor(Math.random() * 10),
          },
          {
            id: properties[(i + 2) % properties.length].id,
            address: properties[(i + 2) % properties.length].neighborhood,
            price: properties[(i + 2) % properties.length].price,
            similarity: 78 + Math.floor(Math.random() * 10),
          },
        ]),
        aiInsights: property.isPriceFair
          ? `Cette propriété présente un excellent rapport qualité-prix. Le prix demandé de ${property.price.toLocaleString()} TND est conforme au marché local. Les propriétés comparables dans le secteur se vendent à des prix similaires.`
          : `Le prix demandé de ${property.price.toLocaleString()} TND semble légèrement supérieur à la moyenne du marché. Une réduction de 5-8% pourrait accélérer la vente. Les biens comparables dans le quartier se négocient généralement entre ${Math.floor(property.price * 0.92).toLocaleString()} et ${Math.floor(property.price * 0.98).toLocaleString()} TND.`,
      },
    })
  }

  console.log(`✅ Created ${valuationCount} valuations`)

  // Create investment portfolio for dev user
  console.log('💼 Creating investment portfolios...')
  const portfolioCount = Math.min(8, properties.length)
  for (let i = 0; i < portfolioCount; i++) {
    const property = properties[i]
    const purchaseDate = new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000) // Last 2 years
    const monthsPassed = (Date.now() - purchaseDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
    const purchasePrice = Math.floor(property.price * (0.85 + Math.random() * 0.1))
    const currentValue = property.aiValuation!
    const appreciation = ((currentValue - purchasePrice) / purchasePrice) * 100
    const annualAppreciation = (appreciation / monthsPassed) * 12
    
    const monthlyRent = property.transactionType === TransactionType.RENT 
      ? property.price 
      : Math.floor(property.price * 0.004)
    const annualIncome = monthlyRent * 12
    const grossYield = (annualIncome / currentValue) * 100
    const netYield = grossYield * 0.75 // Assuming 25% expenses
    
    await prisma.portfolio.create({
      data: {
        userId: devUser.id,
        propertyId: property.id,
        purchasePrice,
        purchaseDate,
        currentValue,
        lastValuationDate: new Date(),
        monthlyRent,
        annualIncome,
        grossYield: parseFloat(grossYield.toFixed(2)),
        netYield: parseFloat(netYield.toFixed(2)),
        occupancyRate: 90 + Math.random() * 10,
        appreciation: parseFloat(appreciation.toFixed(2)),
        totalReturn: parseFloat((appreciation + (grossYield * (monthsPassed / 12))).toFixed(2)),
        annualReturn: parseFloat(annualAppreciation.toFixed(2)),
      },
    })
  }

  console.log(`✅ Created portfolio with ${portfolioCount} properties`)

  console.log('🎉 Database seeding completed successfully!')
  console.log(`\n📈 Summary:`)
  console.log(`   Users: 3`)
  console.log(`   Neighborhoods: ${neighborhoods.length}`)
  console.log(`   Properties: ${properties.length}`)
  console.log(`   Valuations: ${valuationCount}`)
  console.log(`   Portfolio items: ${portfolioCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
