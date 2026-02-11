import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700">Page non trouvée</h2>
        <p className="text-gray-600 max-w-md">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button variant="default">
              Retour à l'accueil
            </Button>
          </Link>
          <Link href="/properties">
            <Button variant="outline">
              Voir les propriétés
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
