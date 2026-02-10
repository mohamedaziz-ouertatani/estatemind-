import { User, UserType, SubscriptionTier } from '@prisma/client'

export type UserWithoutPassword = Omit<User, 'password'>

export type UserSession = {
  id: string
  email: string
  name: string | null
  userType: UserType
  subscriptionTier: SubscriptionTier
  valuationCredits: number
}

export type RegisterData = {
  email: string
  password: string
  name?: string
  phone?: string
  userType: UserType
}

export type LoginData = {
  email: string
  password: string
}
