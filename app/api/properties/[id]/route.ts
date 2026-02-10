import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const property = await prisma.property.findUnique({
      where: {
        id
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
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add authentication and ownership check
    
    const { id } = await params
    const body = await req.json()
    
    const property = await prisma.property.update({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add authentication and ownership check
    
    const { id } = await params
    await prisma.property.delete({
      where: { id }
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
