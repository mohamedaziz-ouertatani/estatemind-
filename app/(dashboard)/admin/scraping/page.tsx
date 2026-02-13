'use client';

/**
 * Admin Scraping Dashboard
 * Manage and monitor scraping jobs
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Tab = 'quick' | 'individual' | 'monitor';

export default function ScrapingAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('quick');
  const [loading, setLoading] = useState(false);
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);

  const API_KEY = process.env.NEXT_PUBLIC_SCRAPER_API_KEY;

  /**
   * Trigger a scrape job
   */
  async function triggerScrape(
    sources: string[],
    type: 'full' | 'incremental' = 'incremental',
    maxPages: number = 5
  ) {
    setLoading(true);
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          sources,
          type,
          maxPages,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLastJobId(data.jobId);
        alert(`✅ Scrape job queued! Job ID: ${data.jobId}`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Failed to trigger scrape: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Check job status
   */
  async function checkJobStatus() {
    if (!lastJobId) {
      alert('No job ID available');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/scrape?jobId=${lastJobId}`);
      const data = await response.json();

      if (data.success) {
        setJobStatus(data);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Failed to check status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🕷️ Scraping Management
        </h1>
        <p className="text-gray-600">
          Manage and monitor web scraping jobs for property listings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b mb-6">
        <button
          onClick={() => setActiveTab('quick')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'quick'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Quick Actions
        </button>
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'individual'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Individual Sources
        </button>
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'monitor'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Monitor
        </button>
      </div>

      {/* Quick Actions Tab */}
      {activeTab === 'quick' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Scrape Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2">Quick Scrape (All)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Incremental scrape of all sources (5 pages each)
                </p>
                <Button
                  onClick={() =>
                    triggerScrape(
                      ['tayara', 'mubawab', 'tunisie-annonce'],
                      'incremental',
                      5
                    )
                  }
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? '⏳ Starting...' : '🚀 Quick Scrape'}
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2">Full Scrape (All)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Full scrape of all sources (10 pages each)
                </p>
                <Button
                  onClick={() =>
                    triggerScrape(
                      ['tayara', 'mubawab', 'tunisie-annonce'],
                      'full',
                      10
                    )
                  }
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  {loading ? '⏳ Starting...' : '🔄 Full Scrape'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Individual Sources Tab */}
      {activeTab === 'individual' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Scrape Individual Sources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tayara */}
              <div className="border rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center mb-3">
                  <span className="text-3xl mr-2">🟡</span>
                  <h3 className="font-medium text-lg">Tayara.tn</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Tunisia&apos;s largest classifieds platform
                </p>
                <Button
                  onClick={() => triggerScrape(['tayara'], 'incremental', 5)}
                  disabled={loading}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  {loading ? '⏳ Starting...' : 'Scrape Tayara'}
                </Button>
              </div>

              {/* Mubawab */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center mb-3">
                  <span className="text-3xl mr-2">🔵</span>
                  <h3 className="font-medium text-lg">Mubawab.tn</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Real estate focused website
                </p>
                <Button
                  onClick={() => triggerScrape(['mubawab'], 'incremental', 5)}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? '⏳ Starting...' : 'Scrape Mubawab'}
                </Button>
              </div>

              {/* TunisieAnnonce */}
              <div className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-center mb-3">
                  <span className="text-3xl mr-2">🟢</span>
                  <h3 className="font-medium text-lg">TunisieAnnonce</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  General classifieds website
                </p>
                <Button
                  onClick={() =>
                    triggerScrape(['tunisie-annonce'], 'incremental', 5)
                  }
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? '⏳ Starting...' : 'Scrape TunisieAnnonce'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Monitor Tab */}
      {activeTab === 'monitor' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Job Monitor</h2>

            {lastJobId ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last Job ID:</p>
                    <p className="font-mono font-medium">{lastJobId}</p>
                  </div>
                  <Button onClick={checkJobStatus} disabled={loading}>
                    {loading ? '⏳ Checking...' : '🔄 Refresh Status'}
                  </Button>
                </div>

                {jobStatus && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">State:</p>
                        <p className="font-medium capitalize">{jobStatus.state}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Progress:</p>
                        <p className="font-medium">{jobStatus.progress || 0}%</p>
                      </div>
                      {jobStatus.result && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">
                              Properties Scraped:
                            </p>
                            <p className="font-medium">
                              {jobStatus.result.totalPropertiesScraped || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Success:</p>
                            <p className="font-medium">
                              {jobStatus.result.success ? '✅ Yes' : '❌ No'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {jobStatus.result?.results && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">
                          Source Results:
                        </p>
                        <div className="space-y-2">
                          {jobStatus.result.results.map(
                            (result: any, index: number) => (
                              <div
                                key={index}
                                className="text-sm border-l-4 border-blue-500 pl-3"
                              >
                                <span className="font-medium">
                                  {result.source}
                                </span>
                                : {result.propertiesScraped} properties{' '}
                                {result.success ? '✅' : '❌'}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No recent jobs. Trigger a scrape to see job status here.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Info Panel */}
      <Card className="p-6 mt-6 bg-blue-50">
        <h3 className="font-medium mb-2">ℹ️ Information</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Incremental scrapes fetch the latest listings (5 pages)</li>
          <li>• Full scrapes fetch more comprehensive data (10+ pages)</li>
          <li>• Jobs are queued and processed by background workers</li>
          <li>• Scraped data is automatically ingested into the database</li>
          <li>
            • Scheduled jobs run automatically (every 2-6 hours depending on type)
          </li>
        </ul>
      </Card>
    </div>
  );
}
