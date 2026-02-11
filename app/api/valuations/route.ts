import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserWithBypass } from '@/lib/auth-bypass'
import { hasValuationCredits } from '@/lib/credits'
import { ValuationResult } from '@/types/valuation'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserWithBypass()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { propertyId } = await request.json()

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID requis' },
        { status: 400 }
      )
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propriété non trouvée' },
        { status: 404 }
      )
    }

    // Check if user already has a valuation for this property
    const existingValuation = await prisma.valuation.findFirst({
      where: {
        propertyId,
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // If valuation exists and is less than 30 days old, return it
    if (existingValuation) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      if (existingValuation.createdAt > thirtyDaysAgo) {
        const comparables = existingValuation.comparables as any[]
        
        return NextResponse.json({
          valuation: {
            estimatedValue: existingValuation.estimatedValue,
            confidenceScore: existingValuation.confidenceScore,
            minValue: existingValuation.minValue,
            maxValue: existingValuation.maxValue,
            locationScore: existingValuation.locationScore,
            sizeScore: existingValuation.sizeScore,
            conditionScore: existingValuation.conditionScore,
            amenitiesScore: existingValuation.amenitiesScore,
            comparables,
            aiInsights: existingValuation.aiInsights
          },
          cached: true
        })
      }
    }

    // Check valuation credits
    const hasCredits = await hasValuationCredits(user.id)
    
    if (!hasCredits) {
      return NextResponse.json(
        { 
          error: 'Crédits d\'évaluation épuisés',
          message: 'Vous avez utilisé tous vos crédits d\'évaluation pour ce mois. Mettez à niveau votre abonnement pour des évaluations illimitées.'
        },
        { status: 403 }
      )
    }

    // Call AI service for valuation
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'
    const aiServiceApiKey = process.env.AI_SERVICE_API_KEY || ''

    let aiValuation: ValuationResult

    try {
      const response = await fetch(`${aiServiceUrl}/api/valuations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiServiceApiKey}`
        },
        body: JSON.stringify({
          property: {
            id: property.id,
            propertyType: property.propertyType,
            transactionType: property.transactionType,
            governorate: property.governorate,
            delegation: property.delegation,
            neighborhood: property.neighborhood,
            price: property.price,
            size: property.size,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            floor: property.floor,
            hasParking: property.hasParking,
            hasElevator: property.hasElevator,
            hasGarden: property.hasGarden,
            hasPool: property.hasPool,
            hasSeaView: property.hasSeaView,
            latitude: property.latitude,
            longitude: property.longitude
          }
        })
      })

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`)
      }

      aiValuation = await response.json()
    } catch (error) {
      console.error('AI service call failed:', error)
      
      // Fallback: Generate basic valuation based on similar properties
      const similarProperties = await prisma.property.findMany({
        where: {
          propertyType: property.propertyType,
          governorate: property.governorate,
          status: 'ACTIVE',
          id: { not: propertyId },
          size: {
            gte: property.size * 0.8,
            lte: property.size * 1.2
          }
        },
        take: 5,
        orderBy: {
          listingDate: 'desc'
        }
      })

      const avgPricePerM2 = similarProperties.length > 0
        ? similarProperties.reduce((sum, p) => sum + (p.price / p.size), 0) / similarProperties.length
        : property.price / property.size

      const estimatedValue = Math.round(avgPricePerM2 * property.size)
      const variance = estimatedValue * 0.1

      aiValuation = {
        estimatedValue,
        confidenceScore: similarProperties.length >= 3 ? 70 : 50,
        minValue: Math.round(estimatedValue - variance),
        maxValue: Math.round(estimatedValue + variance),
        locationScore: 75,
        sizeScore: 80,
        conditionScore: 70,
        amenitiesScore: property.hasParking || property.hasPool || property.hasGarden ? 80 : 60,
        comparables: similarProperties.slice(0, 3).map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          size: p.size,
          pricePerM2: Math.round(p.price / p.size),
          distance: 0,
          similarity: 75
        })),
        aiInsights: `Évaluation basée sur ${similarProperties.length} propriétés similaires dans ${property.governorate}. Prix moyen de ${Math.round(avgPricePerM2)} TND/m² dans cette zone.`
      }
    }

    // Save valuation to database
    await prisma.valuation.create({
      data: {
        propertyId,
        userId: user.id,
        estimatedValue: aiValuation.estimatedValue,
        confidenceScore: aiValuation.confidenceScore,
        minValue: aiValuation.minValue,
        maxValue: aiValuation.maxValue,
        locationScore: aiValuation.locationScore,
        sizeScore: aiValuation.sizeScore,
        conditionScore: aiValuation.conditionScore,
        amenitiesScore: aiValuation.amenitiesScore,
        comparables: aiValuation.comparables,
        aiInsights: aiValuation.aiInsights
      }
    })

    // Update property with AI valuation
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        aiValuation: aiValuation.estimatedValue,
        valuationConfidence: aiValuation.confidenceScore,
        isPriceFair: Math.abs(property.price - aiValuation.estimatedValue) <= (aiValuation.estimatedValue * 0.05)
      }
    })

    return NextResponse.json({
      valuation: aiValuation,
      cached: false
    })

  } catch (error) {
    console.error('Valuation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'évaluation' },
      { status: 500 }
    )
  }
}
