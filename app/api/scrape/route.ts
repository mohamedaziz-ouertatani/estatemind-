/**
 * Scrape API Endpoints
 * Manual triggering and status checking of scraping jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import Queue from 'bull';
import type { ScrapeJobData } from '@/scrapers/src/interfaces/scraper.interface';

// Redis configuration
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

// Create queue connection
const scrapeQueue = new Queue<ScrapeJobData>('multi-source-scraping', {
  redis: redisConfig,
});

/**
 * POST /api/scrape - Trigger a scrape job
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.SCRAPER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured on server' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Build job data with defaults
    const jobData: ScrapeJobData = {
      sources: body.sources || ['tayara', 'mubawab', 'tunisie-annonce'],
      type: body.type || 'incremental',
      governorates: body.governorates,
      propertyTypes: body.propertyTypes,
      maxPages: body.maxPages || 5,
      priority: body.priority || 'normal',
      trigger: 'api',
    };

    // Validate sources
    const validSources = ['tayara', 'mubawab', 'tunisie-annonce'];
    if (!jobData.sources.every(s => validSources.includes(s))) {
      return NextResponse.json(
        { success: false, error: 'Invalid sources. Must be: tayara, mubawab, or tunisie-annonce' },
        { status: 400 }
      );
    }

    // Map priority to number (lower = higher priority)
    const priorityMap = {
      high: 1,
      normal: 5,
      low: 10,
    };

    // Add job to queue
    const job = await scrapeQueue.add(jobData, {
      priority: priorityMap[jobData.priority!],
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000,
      },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: `Scrape job queued successfully`,
      data: {
        sources: jobData.sources,
        type: jobData.type,
        maxPages: jobData.maxPages,
        priority: jobData.priority,
      },
    });
  } catch (error: any) {
    console.error('Error creating scrape job:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scrape?jobId={id} - Get job status
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId parameter is required' },
        { status: 400 }
      );
    }

    // Get job from queue
    const job = await scrapeQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get job state and details
    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;

    return NextResponse.json({
      success: true,
      jobId: job.id,
      state,
      progress,
      data: job.data,
      result,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
    });
  } catch (error: any) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
