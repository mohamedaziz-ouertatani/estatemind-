import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property = await prisma.property.findUnique({
      where: {
        id: params.id
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })
    
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      )
    }
    
    // Increment views
    await prisma.property.update({
      where: { id: params.id },
      data: { views: { increment: 1 } }
    })
    
    return NextResponse.json(property)
    
  } catch (error) {
    console.error("Error fetching property:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication and ownership check
    
    const body = await req.json()
    
    const property = await prisma.property.update({
      where: { id: params.id },
      data: body
    })
    
    return NextResponse.json(property)
    
  } catch (error) {
    console.error("Error updating property:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication and ownership check
    
    await prisma.property.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error("Error deleting property:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
