import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/db"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  phone: z.string().optional(),
  userType: z.enum(["NORMAL", "INVESTOR", "AGENT", "ADMIN"]).default("NORMAL"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, phone, userType } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        userType,
      }
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
