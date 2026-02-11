import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserWithBypass } from '@/lib/auth-bypass'

// DELETE /api/users/saved-properties/[id] - Remove saved property
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserWithBypass()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    // Check if saved property exists and belongs to user
    const savedProperty = await prisma.savedProperty.findUnique({
      where: { id }
    })

    if (!savedProperty) {
      return NextResponse.json(
        { error: 'Saved property not found' },
        { status: 404 }
      )
    }

    if (savedProperty.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete the saved property
    await prisma.savedProperty.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Property removed from saved list'
    })

  } catch (error) {
    console.error('Error removing saved property:', error)
    return NextResponse.json(
      { error: 'Failed to remove saved property' },
      { status: 500 }
    )
  }
}
