import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-xl font-bold">EstateMind</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-gray-900">
              Fonctionnalités
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
              Tarifs
            </Link>
            <Link href="#about" className="text-gray-600 hover:text-gray-900">
              À propos
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button>S&apos;inscrire</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          L&apos;Intelligence Immobilière <br />
          <span className="text-blue-600">en Tunisie</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Évaluations IA, recherche intelligente de propriétés et analyses de quartiers 
          pour vous aider à prendre les meilleures décisions immobilières.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Commencer Gratuitement
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Découvrir
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Fonctionnalités Principales</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Évaluation IA</CardTitle>
              <CardDescription>
                Obtenez une estimation précise de la valeur de n&apos;importe quelle propriété en Tunisie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Analyse de propriétés comparables</li>
                <li>• Score de confiance</li>
                <li>• Conseils de négociation</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recherche Intelligente</CardTitle>
              <CardDescription>
                Trouvez la propriété idéale avec notre moteur de recherche avancé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Filtres avancés</li>
                <li>• Carte interactive</li>
                <li>• Alertes personnalisées</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analyse de Quartiers</CardTitle>
              <CardDescription>
                Découvrez tous les détails sur les quartiers tunisiens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Scores de qualité de vie</li>
                <li>• Données de marché</li>
                <li>• Tendances et prévisions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestionnaire de Portefeuille</CardTitle>
              <CardDescription>
                Pour les investisseurs: suivez vos investissements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Suivi de performance</li>
                <li>• Analyse de rentabilité</li>
                <li>• Rapports détaillés</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scout d&apos;Investissement</CardTitle>
              <CardDescription>
                Recevez les meilleures opportunités chaque semaine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Détection d&apos;opportunités</li>
                <li>• Score d&apos;investissement</li>
                <li>• Analyse risques/bénéfices</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assistant Juridique</CardTitle>
              <CardDescription>
                Posez vos questions sur le droit immobilier tunisien
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Réponses instantanées</li>
                <li>• Sources légales citées</li>
                <li>• Calculateurs de frais</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20 bg-gray-50">
        <h2 className="text-4xl font-bold text-center mb-12">Tarifs Transparents</h2>
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Gratuit</CardTitle>
              <CardDescription>Pour commencer</CardDescription>
              <div className="text-3xl font-bold mt-4">0 TND</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 3 évaluations/mois</li>
                <li>• Recherche basique</li>
                <li>• Infos de quartier</li>
              </ul>
              <Link href="/register" className="block mt-6">
                <Button className="w-full" variant="outline">Commencer</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basique</CardTitle>
              <CardDescription>Pour utilisateurs réguliers</CardDescription>
              <div className="text-3xl font-bold mt-4">19 TND<span className="text-sm">/mois</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 20 évaluations/mois</li>
                <li>• Recherche avancée</li>
                <li>• Alertes de recherche</li>
              </ul>
              <Link href="/register" className="block mt-6">
                <Button className="w-full">Souscrire</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-blue-600 border-2">
            <CardHeader>
              <CardTitle>Investisseur</CardTitle>
              <CardDescription>Pour investisseurs</CardDescription>
              <div className="text-3xl font-bold mt-4">149 TND<span className="text-sm">/mois</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Évaluations illimitées</li>
                <li>• Gestion de portefeuille</li>
                <li>• Scout hebdomadaire</li>
              </ul>
              <Link href="/register" className="block mt-6">
                <Button className="w-full">Souscrire</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agence</CardTitle>
              <CardDescription>Pour professionnels</CardDescription>
              <div className="text-3xl font-bold mt-4">499 TND<span className="text-sm">/mois</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Multi-utilisateurs</li>
                <li>• CRM intégré</li>
                <li>• Support prioritaire</li>
              </ul>
              <Link href="/register" className="block mt-6">
                <Button className="w-full">Contactez-nous</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">E</span>
                </div>
                <span className="text-lg font-bold">EstateMind</span>
              </div>
              <p className="text-sm text-gray-600">
                L&apos;intelligence immobilière en Tunisie
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#features">Fonctionnalités</Link></li>
                <li><Link href="#pricing">Tarifs</Link></li>
                <li><Link href="/properties">Propriétés</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Ressources</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/docs">Documentation</Link></li>
                <li><Link href="/api">API</Link></li>
                <li><Link href="/blog">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/about">À propos</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/legal">Mentions légales</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            © 2024 EstateMind. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
