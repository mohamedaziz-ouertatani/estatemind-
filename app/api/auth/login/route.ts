import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Check password
    const isValid = await compare(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Return user data (password excluded)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        subscriptionTier: user.subscriptionTier,
        valuationCredits: user.valuationCredits,
      }
    })

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
