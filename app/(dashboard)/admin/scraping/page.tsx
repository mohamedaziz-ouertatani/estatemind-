'use client';

/**
 * Admin Scraping Dashboard
 * Manage and monitor scraping jobs
 */

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUiPreferences } from '@/components/providers/ui-preferences-provider';

type Tab = 'quick' | 'individual' | 'monitor';

type QueueMetrics = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
};

type RealTimeJob = {
  id: string;
  state: string;
  progress: number | object;
  data: {
    sources: string[];
    type?: 'full' | 'incremental';
    maxPages?: number;
    priority?: 'high' | 'normal' | 'low';
  };
  failedReason?: string;
  result?: {
    success: boolean;
    totalPropertiesScraped: number;
    results?: Array<{ source: string; success: boolean; propertiesScraped: number }>;
  };
};

type RealTimeResponse = {
  success: boolean;
  timestamp: string;
  queue: QueueMetrics;
  trackedJob: RealTimeJob | null;
  recentJobs: RealTimeJob[];
};


type ReconcileSummary = {
  dryRun: boolean;
  deleteMode: boolean;
  scanned: number;
  unchanged: number;
  markedInactive: number;
  markedSold: number;
  deleted: number;
  errors: number;
};

type AutomationSchedule = {
  id: string;
  name: string;
  cron: string;
  description: string;
  timezone: string;
  nextRun: string;
  msUntilNextRun: number;
};


export default function ScrapingAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('quick');
  const [loading, setLoading] = useState(false);
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [realtimeData, setRealtimeData] = useState<RealTimeResponse | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pendingIngestionJobId, setPendingIngestionJobId] = useState<string | null>(null);
  const [ingestionLoading, setIngestionLoading] = useState(false);
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileSummary, setReconcileSummary] = useState<ReconcileSummary | null>(null);
  const [automationSchedules, setAutomationSchedules] = useState<AutomationSchedule[]>([]);
  const [scheduleNow, setScheduleNow] = useState(Date.now());
  const API_KEY = process.env.NEXT_PUBLIC_SCRAPER_API_KEY;
  const { t } = useUiPreferences();

  const fetchRealtimeStatus = useCallback(async () => {
    const params = new URLSearchParams({ limit: '8' });
    if (lastJobId) {
      params.set('jobId', lastJobId);
    }

    const response = await fetch(`/api/scrape/realtime?${params.toString()}`, {
      cache: 'no-store',
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Unable to fetch real-time scraping status');
    }

    setRealtimeData(data);

    if (data.trackedJob) {
      setJobStatus({
        state: data.trackedJob.state,
        progress:
          typeof data.trackedJob.progress === 'number'
            ? data.trackedJob.progress
            : 0,
        result: data.trackedJob.result,
      });
    }
  }, [lastJobId]);

  useEffect(() => {
    if (activeTab !== 'monitor') {
      return;
    }

    fetchRealtimeStatus().catch((error) => {
      console.error('Failed to fetch real-time data:', error);
    });

    if (!autoRefresh) {
      return;
    }

    const interval = window.setInterval(() => {
      fetchRealtimeStatus().catch((error) => {
        console.error('Failed to fetch real-time data:', error);
      });
    }, 3000);

    return () => window.clearInterval(interval);
  }, [activeTab, autoRefresh, fetchRealtimeStatus]);

  const fetchRealtimeStatus = useCallback(async () => {
    const params = new URLSearchParams({ limit: '8' });
    if (lastJobId) {
      params.set('jobId', lastJobId);
    }

    const response = await fetch(`/api/scrape/realtime?${params.toString()}`, {
      cache: 'no-store',
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Unable to fetch real-time scraping status');
    }

    setRealtimeData(data);

    if (data.trackedJob) {
      setJobStatus({
        state: data.trackedJob.state,
        progress:
          typeof data.trackedJob.progress === 'number'
            ? data.trackedJob.progress
            : 0,
        result: data.trackedJob.result,
      });
    }
  }, [lastJobId]);

  useEffect(() => {
    if (activeTab !== 'monitor') {
      return;
    }

    fetchRealtimeStatus().catch((error) => {
      console.error('Failed to fetch real-time data:', error);
    });

    if (!autoRefresh) {
      return;
    }

    const interval = window.setInterval(() => {
      fetchRealtimeStatus().catch((error) => {
        console.error('Failed to fetch real-time data:', error);
      });
    }, 3000);

    return () => window.clearInterval(interval);
  }, [activeTab, autoRefresh, fetchRealtimeStatus]);

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
          Authorization: `Bearer ${API_KEY}`,
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
        await fetchRealtimeStatus();
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
      await fetchRealtimeStatus();
    } catch (error: any) {
      alert(`❌ Failed to check status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (!lastJobId || !realtimeData?.trackedJob?.result?.success) {
      return;
    }

    if (realtimeData.trackedJob.id === pendingIngestionJobId) {
      return;
    }

    if (realtimeData.trackedJob.id === lastJobId) {
      setPendingIngestionJobId(lastJobId);
    }
  }, [lastJobId, pendingIngestionJobId, realtimeData]);

  async function acceptAndIngest() {
    if (!pendingIngestionJobId) {
      return;
    }

    setIngestionLoading(true);
    try {
      const response = await fetch('/api/scrape/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ jobId: pendingIngestionJobId }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to ingest scraped data');
      }

      alert(`✅ Data ingested for job ${pendingIngestionJobId}`);
      setPendingIngestionJobId(null);
    } catch (error: any) {
      alert(`❌ Ingestion failed: ${error.message}`);
    } finally {
      setIngestionLoading(false);
    }
  }


  async function runSourceReconcile(dryRun: boolean) {
    setReconcileLoading(true);
    try {
      const response = await fetch('/api/scrape/reconcile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ dryRun, batchSize: 100 }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to run source reconciliation');
      }

      setReconcileSummary(data.summary);
      alert(`✅ Source sync ${dryRun ? 'dry-run' : 'run'} completed`);
    } catch (error: any) {
      alert(`❌ Source sync failed: ${error.message}`);
    } finally {
      setReconcileLoading(false);
    }
  }



  function formatRemainingTime(ms: number) {
    if (ms <= 0) {
      return 'now';
    }

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  async function fetchSchedules() {
    const response = await fetch('/api/scrape/schedules', { cache: 'no-store' });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch schedules');
    }
    setAutomationSchedules(data.schedules || []);
  }

  useEffect(() => {
    if (activeTab !== 'monitor') {
      return;
    }

    fetchSchedules().catch((error) => {
      console.error('Failed to fetch schedules:', error);
    });

    const schedulesInterval = window.setInterval(() => {
      setScheduleNow(Date.now());
    }, 1000);

    const refreshInterval = window.setInterval(() => {
      fetchSchedules().catch((error) => {
        console.error('Failed to fetch schedules:', error);
      });
    }, 30000);

    return () => {
      window.clearInterval(schedulesInterval);
      window.clearInterval(refreshInterval);
    };
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🕷️ {t('title')}
        </h1>
        <p className="text-gray-600">
          {t('subtitle')}
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
          {t('quick')}
        </button>
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'individual'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('individual')}
        </button>
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'monitor'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('monitor')}
        </button>
      </div>

      {/* {t('quick')} Tab */}
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

      {/* {t('individual')} Tab */}
      {activeTab === 'individual' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Scrape {t('individual')}
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

      {/* {t('monitor')} Tab */}
      {activeTab === 'monitor' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Real-Time Scraping Agent</h2>
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    autoRefresh
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => setAutoRefresh((prev) => !prev)}
                >
                  {autoRefresh ? '🟢 Live (3s)' : '⚪ Paused'}
                </button>
                <Button onClick={checkJobStatus} disabled={loading}>
                  {loading ? '⏳ Checking...' : '🔄 Refresh Status'}
                </Button>
              </div>
            </div>

            {pendingIngestionJobId && (
              <div className="mb-4 border border-amber-300 bg-amber-50 rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-medium text-amber-900">📥 Scrape completed</p>
                  <p className="text-sm text-amber-800">
                    Job #{pendingIngestionJobId} finished successfully. Do you want to ingest this scraped data into the database now?
                  </p>
                </div>
                <Button onClick={acceptAndIngest} disabled={ingestionLoading}>
                  {ingestionLoading ? '⏳ Ingesting...' : '✅ Accept & Ingest'}
                </Button>
              </div>
            )}

            {realtimeData && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="border rounded p-3">
                  <p className="text-xs text-gray-600">Waiting</p>
                  <p className="text-xl font-semibold">{realtimeData.queue.waiting}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-xs text-gray-600">Active</p>
                  <p className="text-xl font-semibold text-blue-600">{realtimeData.queue.active}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-xs text-gray-600">Completed</p>
                  <p className="text-xl font-semibold text-emerald-600">{realtimeData.queue.completed}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-xs text-gray-600">Failed</p>
                  <p className="text-xl font-semibold text-red-600">{realtimeData.queue.failed}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-xs text-gray-600">Delayed</p>
                  <p className="text-xl font-semibold">{realtimeData.queue.delayed}</p>
                </div>
              </div>
            )}

            {lastJobId ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tracked Job ID:</p>
                    <p className="font-mono font-medium">{lastJobId}</p>
                  </div>
                  {realtimeData?.timestamp && (
                    <p className="text-xs text-gray-500">
                      Last update: {new Date(realtimeData.timestamp).toLocaleTimeString()}
                    </p>
                  )}
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
                No tracked job yet. Trigger a scrape to monitor it in real-time.
              </p>
            )}


            <div className="mt-6 border rounded-lg p-4 bg-indigo-50">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-indigo-900">🤖 {t('sourceAgent')}</p>
                  <p className="text-xs text-indigo-800">
                    Automatically detects deleted/sold source listings and updates local records.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => runSourceReconcile(true)}
                    disabled={reconcileLoading}
                  >
                    {reconcileLoading ? '⏳ Running...' : t('dryRun')}
                  </Button>
                  <Button
                    onClick={() => runSourceReconcile(false)}
                    disabled={reconcileLoading}
                  >
                    {reconcileLoading ? '⏳ Running...' : t('runNow')}
                  </Button>
                </div>
              </div>

              {reconcileSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="border rounded bg-white p-2">Scanned: {reconcileSummary.scanned}</div>
                  <div className="border rounded bg-white p-2">Unchanged: {reconcileSummary.unchanged}</div>
                  <div className="border rounded bg-white p-2">Inactive: {reconcileSummary.markedInactive}</div>
                  <div className="border rounded bg-white p-2">Sold: {reconcileSummary.markedSold}</div>
                  <div className="border rounded bg-white p-2">Deleted: {reconcileSummary.deleted}</div>
                  <div className="border rounded bg-white p-2">Errors: {reconcileSummary.errors}</div>
                  <div className="border rounded bg-white p-2">Dry Run: {reconcileSummary.dryRun ? 'Yes' : 'No'}</div>
                  <div className="border rounded bg-white p-2">Delete Mode: {reconcileSummary.deleteMode ? 'On' : 'Off'}</div>
                </div>
              )}
            </div>


            <div className="mt-6 border rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-900">⏱️ {t('automation')}</p>
                  <p className="text-xs text-slate-700">
                    Upcoming automated jobs for scrape, source sync, and ingestion.
                  </p>
                </div>
              </div>

              {automationSchedules.length > 0 ? (
                <div className="space-y-2">
                  {automationSchedules.map((schedule) => {
                    const msUntil = new Date(schedule.nextRun).getTime() - scheduleNow;
                    return (
                      <div key={schedule.id} className="border rounded bg-white p-3 text-sm">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                          <p className="font-medium">{schedule.name}</p>
                          <p className="text-slate-600">
                            Next run in <span className="font-semibold">{formatRemainingTime(msUntil)}</span>
                          </p>
                        </div>
                        <p className="text-slate-600 mt-1">
                          {schedule.description} • Cron: <span className="font-mono">{schedule.cron}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Next at {new Date(schedule.nextRun).toLocaleString()} ({schedule.timezone})
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No schedules available.</p>
              )}
            </div>

            {realtimeData?.recentJobs?.length ? (
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2">Recent Queue Activity</p>
                <div className="space-y-2">
                  {realtimeData.recentJobs.map((job) => (
                    <div key={job.id} className="border rounded p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-mono">#{job.id}</p>
                        <p className="capitalize font-medium">{job.state}</p>
                      </div>
                      <p className="text-gray-600 mt-1">
                        Sources: {job.data.sources.join(', ')} • Type: {job.data.type || 'incremental'}
                      </p>
                      {job.failedReason && (
                        <p className="text-red-600 mt-1">Reason: {job.failedReason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      )}

      {/* Info Panel */}
      <Card className="p-6 mt-6 bg-blue-50">
        <h3 className="font-medium mb-2">ℹ️ {t('info')}</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Incremental scrapes fetch the latest listings (5 pages)</li>
          <li>• Full scrapes fetch more comprehensive data (10+ pages)</li>
          <li>• Jobs are queued and processed by background workers</li>
          <li>• Scraped data is automatically ingested into the database</li>
          <li>
            • Scheduled jobs include scraping, source-sync reconciliation, and auto-ingestion
          </li>
        </ul>
      </Card>
    </div>
  );
}
