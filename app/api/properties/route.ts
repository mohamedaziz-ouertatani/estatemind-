import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { PropertyType, TransactionType, PropertyStatus } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit
    
    // Filters
    const governorate = searchParams.get('governorate')
    const propertyType = searchParams.get('propertyType') as PropertyType | null
    const transactionType = searchParams.get('transactionType') as TransactionType | null
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined
    const minSize = searchParams.get('minSize') ? parseFloat(searchParams.get('minSize')!) : undefined
    const maxSize = searchParams.get('maxSize') ? parseFloat(searchParams.get('maxSize')!) : undefined
    const bedrooms = searchParams.get('bedrooms') ? parseInt(searchParams.get('bedrooms')!) : undefined
    const hasParking = searchParams.get('hasParking') === 'true'
    const hasPool = searchParams.get('hasPool') === 'true'
    const hasSeaView = searchParams.get('hasSeaView') === 'true'
    
    // Build where clause
    const where: any = {
      status: PropertyStatus.ACTIVE,
    }
    
    if (governorate) where.governorate = governorate
    if (propertyType) where.propertyType = propertyType
    if (transactionType) where.transactionType = transactionType
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = minPrice
      if (maxPrice) where.price.lte = maxPrice
    }
    if (minSize || maxSize) {
      where.size = {}
      if (minSize) where.size.gte = minSize
      if (maxSize) where.size.lte = maxSize
    }
    if (bedrooms) where.bedrooms = bedrooms
    if (hasParking) where.hasParking = true
    if (hasPool) where.hasPool = true
    if (hasSeaView) where.hasSeaView = true
    
    // Get total count
    const total = await prisma.property.count({ where })
    
    // Get properties
    const properties = await prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        propertyType: true,
        transactionType: true,
        governorate: true,
        delegation: true,
        price: true,
        size: true,
        bedrooms: true,
        bathrooms: true,
        images: true,
        aiValuation: true,
        isPriceFair: true,
        createdAt: true,
      }
    })
    
    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    })
    
  } catch (error) {
    console.error("Error fetching properties:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // For now, we'll use a mock user ID
    const mockUserId = "clxxxxx"
    
    const body = await req.json()
    
    const property = await prisma.property.create({
      data: {
        ...body,
        ownerId: mockUserId,
      }
    })
    
    return NextResponse.json(property, { status: 201 })
    
  } catch (error) {
    console.error("Error creating property:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
