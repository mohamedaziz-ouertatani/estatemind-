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
    
    // Build where clause dynamically
    const where: any = {
      status: PropertyStatus.ACTIVE,
    }
    
    // Text search on title and description
    const q = searchParams.get('q')
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ]
    }
    
    // Location filters
    const governorate = searchParams.get('governorate')
    const delegation = searchParams.get('delegation')
    const neighborhood = searchParams.get('neighborhood')
    
    if (governorate) where.governorate = governorate
    if (delegation) where.delegation = delegation
    if (neighborhood) where.neighborhood = neighborhood
    
    // Property type filter (can be multiple)
    const type = searchParams.get('type')
    if (type) {
      const types = type.split(',').filter(t => 
        Object.values(PropertyType).includes(t as PropertyType)
      ) as PropertyType[]
      if (types.length > 0) {
        where.propertyType = { in: types }
      }
    }
    
    // Transaction type filter
    const transaction = searchParams.get('transaction')
    if (transaction && Object.values(TransactionType).includes(transaction as TransactionType)) {
      where.transactionType = transaction as TransactionType
    }
    
    // Price range
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseInt(minPrice)
      if (maxPrice) where.price.lte = parseInt(maxPrice)
    }
    
    // Size range
    const minSize = searchParams.get('minSize')
    const maxSize = searchParams.get('maxSize')
    if (minSize || maxSize) {
      where.size = {}
      if (minSize) where.size.gte = parseFloat(minSize)
      if (maxSize) where.size.lte = parseFloat(maxSize)
    }
    
    // Bedrooms
    const bedrooms = searchParams.get('bedrooms')
    if (bedrooms && bedrooms !== '0') {
      where.bedrooms = { gte: parseInt(bedrooms) }
    }
    
    // Bathrooms
    const bathrooms = searchParams.get('bathrooms')
    if (bathrooms && bathrooms !== '0') {
      where.bathrooms = { gte: parseInt(bathrooms) }
    }
    
    // Features/Amenities
    const parking = searchParams.get('parking')
    if (parking === 'true') where.hasParking = true
    
    const elevator = searchParams.get('elevator')
    if (elevator === 'true') where.hasElevator = true
    
    const pool = searchParams.get('pool')
    if (pool === 'true') where.hasPool = true
    
    const garden = searchParams.get('garden')
    if (garden === 'true') where.hasGarden = true
    
    const seaview = searchParams.get('seaview')
    if (seaview === 'true') where.hasSeaView = true
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'date'
    const order = searchParams.get('order') || 'desc'
    
    let orderBy: any = { createdAt: order }
    
    switch (sortBy) {
      case 'price':
        orderBy = { price: order }
        break
      case 'size':
        orderBy = { size: order }
        break
      case 'views':
        orderBy = { views: order }
        break
      case 'date':
      default:
        orderBy = { createdAt: order }
        break
    }
    
    // Get total count
    const total = await prisma.property.count({ where })
    
    // Get properties with owner info
    const properties = await prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            userType: true
          }
        }
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
    console.error("Error searching properties:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
