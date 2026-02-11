import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { PropertyDetailClient } from './PropertyDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getProperty(id: string) {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      valuations: {
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!property) {
    return null
  }

  // Increment view count
  await prisma.property.update({
    where: { id },
    data: {
      views: {
        increment: 1
      }
    }
  })

  return property
}

async function getSimilarProperties(property: any) {
  const similarProperties = await prisma.property.findMany({
    where: {
      id: { not: property.id },
      propertyType: property.propertyType,
      governorate: property.governorate,
      status: 'ACTIVE',
      price: {
        gte: property.price * 0.7,
        lte: property.price * 1.3
      }
    },
    take: 4,
    orderBy: {
      listingDate: 'desc'
    }
  })

  return similarProperties
}

async function getNeighborhood(property: any) {
  if (!property.neighborhood) return null

  const neighborhood = await prisma.neighborhood.findFirst({
    where: {
      name: property.neighborhood,
      governorate: property.governorate,
      delegation: property.delegation
    }
  })

  return neighborhood
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const property = await getProperty(id)

  if (!property) {
    return {
      title: 'Propriété non trouvée',
    }
  }

  return {
    title: `${property.title} - EstateMind`,
    description: property.description.substring(0, 160),
    openGraph: {
      title: property.title,
      description: property.description.substring(0, 160),
      images: property.images.length > 0 ? [property.images[0]] : [],
    }
  }
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params
  const property = await getProperty(id)

  if (!property) {
    notFound()
  }

  const [similarProperties, neighborhood] = await Promise.all([
    getSimilarProperties(property),
    getNeighborhood(property)
  ])

  return (
    <PropertyDetailClient
      property={property}
      similarProperties={similarProperties}
      neighborhood={neighborhood}
    />
  )
}
