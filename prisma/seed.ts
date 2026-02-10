import { PrismaClient, PropertyType, TransactionType, UserType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Tunisia governorates with their coordinates
const TUNISIA_LOCATIONS = [
  { governorate: 'Tunis', delegation: 'La Marsa', lat: 36.8783, lng: 10.3247 },
  { governorate: 'Tunis', delegation: 'Carthage', lat: 36.8531, lng: 10.3231 },
  { governorate: 'Tunis', delegation: 'Sidi Bou Said', lat: 36.8687, lng: 10.3425 },
  { governorate: 'Ariana', delegation: 'Ariana Ville', lat: 36.8625, lng: 10.1956 },
  { governorate: 'Ben Arous', delegation: 'Hammam-Lif', lat: 36.7292, lng: 10.3442 },
  { governorate: 'Nabeul', delegation: 'Hammamet', lat: 36.4000, lng: 10.6167 },
  { governorate: 'Sousse', delegation: 'Sousse Ville', lat: 35.8256, lng: 10.6364 },
  { governorate: 'Monastir', delegation: 'Monastir', lat: 35.7643, lng: 10.8113 },
  { governorate: 'Sfax', delegation: 'Sfax Ville', lat: 34.7406, lng: 10.7603 },
]

async function main() {
  console.log('🌱 Starting database seeding...')

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

  // Create sample users
  const hashedPassword = await hash('password123', 12)

  const normalUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: hashedPassword,
      name: 'Jean Dupont',
      phone: '+216 50 123 456',
      userType: UserType.NORMAL,
      valuationCredits: 3,
    },
  })

  const investorUser = await prisma.user.create({
    data: {
      email: 'investor@example.com',
      password: hashedPassword,
      name: 'Marie Investisseuse',
      phone: '+216 50 789 012',
      userType: UserType.INVESTOR,
      subscriptionTier: 'INVESTOR_149',
      valuationCredits: -1, // Unlimited
    },
  })

  const agentUser = await prisma.user.create({
    data: {
      email: 'agent@example.com',
      password: hashedPassword,
      name: 'Ahmed Agent',
      phone: '+216 50 345 678',
      userType: UserType.AGENT,
      subscriptionTier: 'AGENCY_499',
      valuationCredits: -1,
    },
  })

  console.log('✅ Created users')

  // Create neighborhoods
  const neighborhoods = await Promise.all([
    prisma.neighborhood.create({
      data: {
        name: 'La Marsa',
        governorate: 'Tunis',
        delegation: 'La Marsa',
        overallScore: 92,
        housingScore: 88,
        schoolsScore: 95,
        transportScore: 85,
        amenitiesScore: 93,
        lifestyleScore: 96,
        safetyScore: 90,
        avgPricePerM2: 3500,
        rentalYield: 4.2,
        daysOnMarket: 45,
        priceGrowthYTD: 8.5,
        description: 'Quartier huppé en bord de mer avec excellentes écoles et commodités.',
        schools: JSON.stringify([
          { name: 'École Internationale de Carthage', distance: 2 },
          { name: 'Lycée Français Gustave Flaubert', distance: 3 },
        ]),
        transportation: JSON.stringify([
          { type: 'Metro', line: 'TGM', distance: 0.5 },
          { type: 'Bus', lines: ['20', '30'], distance: 0.2 },
        ]),
        amenities: JSON.stringify([
          { type: 'Supermarché', name: 'Carrefour', distance: 1 },
          { type: 'Hôpital', name: 'Clinique La Marsa', distance: 2 },
          { type: 'Plage', name: 'Plage de La Marsa', distance: 0.5 },
        ]),
        gentrificationScore: 85,
        futureProjects: JSON.stringify([
          { name: 'Extension du TGM', completion: '2025' },
          { name: 'Nouveau centre commercial', completion: '2024' },
        ]),
      },
    }),
    prisma.neighborhood.create({
      data: {
        name: 'Sousse Ville',
        governorate: 'Sousse',
        delegation: 'Sousse Ville',
        overallScore: 78,
        housingScore: 75,
        schoolsScore: 80,
        transportScore: 70,
        amenitiesScore: 82,
        lifestyleScore: 76,
        safetyScore: 74,
        avgPricePerM2: 1800,
        rentalYield: 6.5,
        daysOnMarket: 60,
        priceGrowthYTD: 5.2,
        description: 'Centre-ville animé avec bon rapport qualité-prix.',
        schools: JSON.stringify([
          { name: 'École Primaire Sousse Centre', distance: 1 },
        ]),
        transportation: JSON.stringify([
          { type: 'Train', line: 'Ligne Sud', distance: 1 },
        ]),
        amenities: JSON.stringify([
          { type: 'Marché', name: 'Marché Central', distance: 0.5 },
        ]),
      },
    }),
  ])

  console.log('✅ Created neighborhoods')

  // Create sample properties
  const properties = []
  const propertyTypes: PropertyType[] = [
    'APARTMENT',
    'HOUSE',
    'VILLA',
    'LAND',
    'COMMERCIAL',
    'OFFICE',
  ]
  const transactionTypes: TransactionType[] = ['SALE', 'RENT']

  for (let i = 0; i < 30; i++) {
    const location = TUNISIA_LOCATIONS[i % TUNISIA_LOCATIONS.length]
    const propertyType = propertyTypes[i % propertyTypes.length]
    const transactionType = transactionTypes[i % transactionTypes.length]
    const owner = i % 3 === 0 ? normalUser : i % 3 === 1 ? investorUser : agentUser

    const size = propertyType === 'LAND' 
      ? Math.floor(Math.random() * 1000) + 200 
      : Math.floor(Math.random() * 200) + 50

    const pricePerM2 = propertyType === 'VILLA' 
      ? Math.floor(Math.random() * 2000) + 2000
      : propertyType === 'APARTMENT'
      ? Math.floor(Math.random() * 1500) + 1000
      : Math.floor(Math.random() * 500) + 500

    const price = transactionType === 'SALE' 
      ? size * pricePerM2
      : Math.floor(size * pricePerM2 * 0.005) // Monthly rent

    const property = await prisma.property.create({
      data: {
        title: `${propertyType} ${location.delegation} - ${i + 1}`,
        description: `Belle propriété de type ${propertyType.toLowerCase()} située à ${location.delegation}, ${location.governorate}. ${
          propertyType === 'APARTMENT' ? 'Appartement moderne avec finitions de qualité.' :
          propertyType === 'HOUSE' ? 'Maison spacieuse avec jardin.' :
          propertyType === 'VILLA' ? 'Villa de luxe avec piscine.' :
          propertyType === 'LAND' ? 'Terrain constructible bien situé.' :
          propertyType === 'COMMERCIAL' ? 'Local commercial en bon état.' :
          'Bureau moderne avec parking.'
        }`,
        propertyType,
        transactionType,
        governorate: location.governorate,
        delegation: location.delegation,
        neighborhood: location.delegation,
        latitude: location.lat + (Math.random() - 0.5) * 0.01,
        longitude: location.lng + (Math.random() - 0.5) * 0.01,
        price,
        size,
        bedrooms: propertyType === 'LAND' ? null : Math.floor(Math.random() * 4) + 1,
        bathrooms: propertyType === 'LAND' ? null : Math.floor(Math.random() * 3) + 1,
        floor: propertyType === 'APARTMENT' ? Math.floor(Math.random() * 10) + 1 : null,
        hasParking: Math.random() > 0.5,
        hasElevator: propertyType === 'APARTMENT' && Math.random() > 0.6,
        hasGarden: propertyType !== 'APARTMENT' && Math.random() > 0.5,
        hasPool: propertyType === 'VILLA' && Math.random() > 0.7,
        hasSeaView: location.delegation.includes('Marsa') && Math.random() > 0.7,
        images: [
          `https://source.unsplash.com/800x600/?${propertyType.toLowerCase()},tunisia`,
          `https://source.unsplash.com/800x600/?real-estate,modern`,
        ],
        ownerId: owner.id,
        aiValuation: Math.floor(price * (0.95 + Math.random() * 0.1)),
        valuationConfidence: Math.random() * 0.2 + 0.75,
        isPriceFair: Math.random() > 0.3,
      },
    })

    properties.push(property)
  }

  console.log('✅ Created 30 sample properties')

  // Create some valuations
  for (let i = 0; i < 5; i++) {
    const property = properties[i]
    await prisma.valuation.create({
      data: {
        propertyId: property.id,
        userId: investorUser.id,
        estimatedValue: property.aiValuation!,
        confidenceScore: property.valuationConfidence!,
        minValue: Math.floor(property.aiValuation! * 0.9),
        maxValue: Math.floor(property.aiValuation! * 1.1),
        locationScore: Math.floor(Math.random() * 30) + 70,
        sizeScore: Math.floor(Math.random() * 30) + 70,
        conditionScore: Math.floor(Math.random() * 30) + 70,
        amenitiesScore: Math.floor(Math.random() * 30) + 70,
        comparables: JSON.stringify([
          {
            id: properties[(i + 1) % properties.length].id,
            similarity: 85,
            price: properties[(i + 1) % properties.length].price,
          },
        ]),
        aiInsights: `Cette propriété est bien positionnée dans le marché. Le prix demandé est ${
          property.isPriceFair ? 'juste' : 'légèrement élevé'
        } par rapport aux propriétés comparables dans la région.`,
      },
    })
  }

  console.log('✅ Created sample valuations')

  // Create portfolio for investor
  for (let i = 0; i < 3; i++) {
    const property = properties[i]
    await prisma.portfolio.create({
      data: {
        userId: investorUser.id,
        propertyId: property.id,
        purchasePrice: Math.floor(property.price * 0.95),
        purchaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        currentValue: property.aiValuation!,
        lastValuationDate: new Date(),
        monthlyRent: property.transactionType === 'RENT' ? property.price : Math.floor(property.price * 0.005),
        annualIncome: property.transactionType === 'RENT' ? property.price * 12 : Math.floor(property.price * 0.06),
        grossYield: 6.5,
        netYield: 5.2,
        occupancyRate: 95.0,
        appreciation: Math.random() * 15 + 5,
        totalReturn: Math.random() * 20 + 10,
        annualReturn: Math.random() * 10 + 5,
      },
    })
  }

  console.log('✅ Created investor portfolio')

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
