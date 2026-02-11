import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { NeighborhoodDetailClient } from './NeighborhoodDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getNeighborhood(id: string) {
  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id }
  })

  return neighborhood
}

async function getPropertiesInNeighborhood(neighborhood: any) {
  const properties = await prisma.property.findMany({
    where: {
      neighborhood: neighborhood.name,
      governorate: neighborhood.governorate,
      delegation: neighborhood.delegation,
      status: 'ACTIVE'
    },
    take: 6,
    orderBy: {
      listingDate: 'desc'
    }
  })

  return properties
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const neighborhood = await getNeighborhood(id)

  if (!neighborhood) {
    return {
      title: 'Quartier non trouvé',
    }
  }

  return {
    title: `${neighborhood.name}, ${neighborhood.governorate} - EstateMind`,
    description: neighborhood.description.substring(0, 160),
  }
}

export default async function NeighborhoodDetailPage({ params }: PageProps) {
  const { id } = await params
  const neighborhood = await getNeighborhood(id)

  if (!neighborhood) {
    notFound()
  }

  const properties = await getPropertiesInNeighborhood(neighborhood)

  return (
    <NeighborhoodDetailClient
      neighborhood={neighborhood}
      properties={properties}
    />
  )
}
