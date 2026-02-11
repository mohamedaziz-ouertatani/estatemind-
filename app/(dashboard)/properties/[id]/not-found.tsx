import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Propriété non trouvée</h1>
        <p className="text-gray-600">
          Cette propriété n'existe pas ou a été supprimée.
        </p>
        <Link href="/properties">
          <Button>
            Voir toutes les propriétés
          </Button>
        </Link>
      </div>
    </div>
  )
}
