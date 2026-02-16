/**
 * Real-time Scrape Monitor API
 * Returns queue metrics and recent jobs for live dashboards.
 */

import { NextRequest, NextResponse } from 'next/server';
import Queue from 'bull';
import type { Job } from 'bull';
import type { JobResult, ScrapeJobData } from '@/scrapers/src/interfaces/scraper.interface';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const redisConfig = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

const scrapeQueue = new Queue<ScrapeJobData>('multi-source-scraping', {
  redis: redisConfig,
});

type SerializableJob = {
  id: string;
  state: string;
  progress: number | object;
  data: ScrapeJobData;
  attemptsMade: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  result?: JobResult;
};

async function serializeJob(job: Job<ScrapeJobData>): Promise<SerializableJob> {
  return {
    id: job.id!.toString(),
    state: await job.getState(),
    progress: job.progress(),
    data: job.data,
    attemptsMade: job.attemptsMade,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
    result: job.returnvalue,
  };
}

/**
 * GET /api/scrape/realtime?limit=5&jobId=123
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || 5), 20);
    const jobId = searchParams.get('jobId');

    const [counts, active, waiting, completed, failed, trackedJob] = await Promise.all([
      scrapeQueue.getJobCounts(),
      scrapeQueue.getActive(0, limit - 1),
      scrapeQueue.getWaiting(0, limit - 1),
      scrapeQueue.getCompleted(0, limit - 1),
      scrapeQueue.getFailed(0, limit - 1),
      jobId ? scrapeQueue.getJob(jobId) : Promise.resolve(null),
    ]);

    const recentJobsRaw = [...active, ...waiting, ...completed, ...failed].sort((a, b) => {
      const aTs = a.finishedOn || a.processedOn || a.timestamp || 0;
      const bTs = b.finishedOn || b.processedOn || b.timestamp || 0;
      return bTs - aTs;
    });

    const dedupedRecentJobs = Array.from(new Map(recentJobsRaw.map((job) => [job.id, job])).values()).slice(0, limit);

    const [recentJobs, tracked] = await Promise.all([
      Promise.all(dedupedRecentJobs.map((job) => serializeJob(job))),
      trackedJob ? serializeJob(trackedJob) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      queue: {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
      },
      trackedJob: tracked,
      recentJobs,
    });
  } catch (error: any) {
    console.error('Error fetching real-time scrape data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
