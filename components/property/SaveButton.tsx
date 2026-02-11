"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { getCurrentUserWithBypass } from "@/lib/auth-bypass"

interface SaveButtonProps {
  propertyId: string
  initialSaved?: boolean
  className?: string
  showText?: boolean
}

export function SaveButton({ 
  propertyId, 
  initialSaved = false, 
  className = "",
  showText = false
}: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isLoading, setIsLoading] = useState(false)
  const [savedPropertyId, setSavedPropertyId] = useState<string | null>(null)

  // Check if property is saved on mount
  useEffect(() => {
    checkIfSaved()
  }, [propertyId])

  async function checkIfSaved() {
    try {
      const user = await getCurrentUserWithBypass()
      if (!user) return

      const response = await fetch('/api/users/saved-properties')
      if (response.ok) {
        const data = await response.json()
        const saved = data.savedProperties.find(
          (sp: any) => sp.property.id === propertyId
        )
        if (saved) {
          setIsSaved(true)
          setSavedPropertyId(saved.id)
        }
      }
    } catch (error) {
      console.error('Error checking if property is saved:', error)
    }
  }

  async function handleToggleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    // Check authentication
    const user = await getCurrentUserWithBypass()
    if (!user) {
      toast.error('Connexion requise', {
        description: 'Vous devez être connecté pour sauvegarder des propriétés'
      })
      return
    }

    setIsLoading(true)

    try {
      if (isSaved && savedPropertyId) {
        // Unsave property
        const response = await fetch(`/api/users/saved-properties/${savedPropertyId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to unsave property')
        }

        setIsSaved(false)
        setSavedPropertyId(null)
        toast.success('Propriété retirée', {
          description: 'La propriété a été retirée de vos favoris'
        })
      } else {
        // Save property
        const response = await fetch('/api/users/saved-properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ propertyId })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to save property')
        }

        const data = await response.json()
        setIsSaved(true)
        setSavedPropertyId(data.savedProperty.id)
        toast.success('Propriété sauvegardée', {
          description: 'La propriété a été ajoutée à vos favoris'
        })
      }
    } catch (error) {
      console.error('Error toggling save:', error)
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      })
      // Revert optimistic update
      setIsSaved(!isSaved)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggleSave}
      disabled={isLoading}
      className={`bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart 
        className={`w-4 h-4 transition-all ${
          isSaved 
            ? 'fill-red-500 text-red-500' 
            : 'text-gray-600'
        } ${isLoading ? 'animate-pulse' : ''}`}
      />
      {showText && (
        <span className="ml-2 text-sm">
          {isSaved ? 'Sauvegardé' : 'Sauvegarder'}
        </span>
      )}
    </button>
  )
}
