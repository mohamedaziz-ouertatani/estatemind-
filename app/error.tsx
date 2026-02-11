'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Une erreur s'est produite</h2>
        <p className="text-gray-600 max-w-md">
          Désolé, quelque chose s'est mal passé. Veuillez réessayer.
        </p>
        {error.message && (
          <p className="text-sm text-gray-500 font-mono bg-gray-100 p-3 rounded">
            {error.message}
          </p>
        )}
        <Button onClick={reset}>
          Réessayer
        </Button>
      </div>
    </div>
  )
}
