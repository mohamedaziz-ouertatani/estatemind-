import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserWithBypass } from '@/lib/auth-bypass'

// POST /api/users/saved-properties - Save a property
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserWithBypass()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { propertyId } = body

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if already saved
    const existingSave = await prisma.savedProperty.findUnique({
      where: {
        userId_propertyId: {
          userId: user.id,
          propertyId
        }
      }
    })

    if (existingSave) {
      return NextResponse.json(
        { error: 'Property already saved' },
        { status: 400 }
      )
    }

    // Save the property
    const savedProperty = await prisma.savedProperty.create({
      data: {
        userId: user.id,
        propertyId
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            size: true,
            governorate: true,
            delegation: true,
            propertyType: true,
            transactionType: true,
            images: true,
            bedrooms: true,
            bathrooms: true,
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Property saved successfully',
      savedProperty
    })

  } catch (error) {
    console.error('Error saving property:', error)
    return NextResponse.json(
      { error: 'Failed to save property' },
      { status: 500 }
    )
  }
}

// GET /api/users/saved-properties - List user's saved properties
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserWithBypass()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Get total count
    const total = await prisma.savedProperty.count({
      where: { userId: user.id }
    })

    // Get saved properties with pagination
    const savedProperties = await prisma.savedProperty.findMany({
      where: { userId: user.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            size: true,
            governorate: true,
            delegation: true,
            neighborhood: true,
            propertyType: true,
            transactionType: true,
            images: true,
            bedrooms: true,
            bathrooms: true,
            hasParking: true,
            hasPool: true,
            hasGarden: true,
            hasSeaView: true,
            hasElevator: true,
            aiValuation: true,
            isPriceFair: true,
            views: true,
            listingDate: true,
            status: true,
          }
        }
      }
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      savedProperties: savedProperties.map(sp => ({
        id: sp.id,
        savedAt: sp.createdAt,
        property: sp.property
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching saved properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved properties' },
      { status: 500 }
    )
  }
}
