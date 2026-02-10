import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="text-xl font-bold">EstateMind</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/properties" className="text-gray-700 hover:text-blue-600 font-medium">
                Propriétés
              </Link>
              <Link href="/neighborhoods" className="text-gray-700 hover:text-blue-600 font-medium">
                Quartiers
              </Link>
              <Link href="/portfolio" className="text-gray-700 hover:text-blue-600 font-medium">
                Portfolio
              </Link>
              <Link href="/opportunities" className="text-gray-700 hover:text-blue-600 font-medium">
                Opportunités
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-700 hover:text-blue-600">
                Mon Compte
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          © 2024 EstateMind. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}
