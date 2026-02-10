import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      userType: string
      subscriptionTier: string
      valuationCredits: number
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    userType: string
    subscriptionTier: string
    valuationCredits: number
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    userType: string
    subscriptionTier: string
    valuationCredits: number
  }
}
