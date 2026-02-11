import { Metadata } from 'next'
import { NeighborhoodsListClient } from './NeighborhoodsListClient'
import { prisma } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Quartiers - EstateMind',
  description: 'Explorez les quartiers de Tunisie avec des scores détaillés et des statistiques du marché immobilier',
}

async function getNeighborhoods() {
  const neighborhoods = await prisma.neighborhood.findMany({
    orderBy: {
      overallScore: 'desc'
    }
  })

  return neighborhoods
}

export default async function NeighborhoodsListPage() {
  const neighborhoods = await getNeighborhoods()

  return <NeighborhoodsListClient neighborhoods={neighborhoods} />
}
