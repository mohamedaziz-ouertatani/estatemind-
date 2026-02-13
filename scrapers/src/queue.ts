/**
 * Bull Queue System with Redis
 * Manages scraping jobs with retry logic and priority
 */

import Queue, { Job } from 'bull';
import Redis from 'ioredis';
import { ScraperManager } from './scraper-manager.js';
import type { ScrapeJobData, JobResult, ScraperConfig } from './interfaces/scraper.interface.js';

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

// Create Bull queue
export const scrapeQueue = new Queue<ScrapeJobData>('multi-source-scraping', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000, // 60 seconds initial delay
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200, // Keep last 200 failed jobs
  },
});

/**
 * Add a scrape job to the queue
 */
export async function addScrapeJob(data: ScrapeJobData): Promise<Job<ScrapeJobData>> {
  // Set default values
  const jobData: ScrapeJobData = {
    sources: data.sources || ['tayara', 'mubawab', 'tunisie-annonce'],
    type: data.type || 'incremental',
    governorates: data.governorates,
    propertyTypes: data.propertyTypes,
    maxPages: data.maxPages || 5,
    priority: data.priority || 'normal',
    trigger: data.trigger || 'manual',
  };

  // Map priority to number (lower = higher priority)
  const priorityMap = {
    high: 1,
    normal: 5,
    low: 10,
  };

  const job = await scrapeQueue.add(jobData, {
    priority: priorityMap[jobData.priority!],
  });

  console.log(`✅ Job ${job.id} added to queue (priority: ${jobData.priority})`);
  return job;
}

/**
 * Process scrape jobs
 */
scrapeQueue.process(async (job: Job<ScrapeJobData>) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 Processing Job ${job.id}`);
  console.log(`   Sources: ${job.data.sources.join(', ')}`);
  console.log(`   Type: ${job.data.type}`);
  console.log(`   Max Pages: ${job.data.maxPages}`);
  console.log(`   Trigger: ${job.data.trigger}`);
  console.log(`${'='.repeat(60)}\n`);

  const manager = new ScraperManager();

  try {
    // Build configs for each source
    const configs: ScraperConfig[] = job.data.sources.map(source => ({
      source,
      maxPages: job.data.maxPages,
      governorates: job.data.governorates,
      propertyTypes: job.data.propertyTypes,
    }));

    // Run scrapers
    const results = await manager.scrapeAll(configs);

    // Calculate total properties scraped
    const totalPropertiesScraped = results.reduce((sum, r) => sum + r.propertiesScraped, 0);

    // Check if any failed
    const errors = results.filter(r => !r.success).map(r => r.errors).flat();
    const allSuccessful = results.every(r => r.success);

    const jobResult: JobResult = {
      jobId: job.id!.toString(),
      success: allSuccessful,
      results,
      totalPropertiesScraped,
      errors,
      completedAt: new Date().toISOString(),
    };

    console.log(`\n✅ Job ${job.id} completed`);
    console.log(`   Total properties scraped: ${totalPropertiesScraped}`);
    console.log(`   Success: ${allSuccessful ? 'Yes' : 'No'}`);

    return jobResult;
  } catch (error: any) {
    console.error(`❌ Job ${job.id} failed:`, error);
    throw error; // Let Bull handle retry logic
  } finally {
    await manager.cleanup();
  }
});

/**
 * Event listeners
 */
scrapeQueue.on('completed', (job, result: JobResult) => {
  console.log(`\n🎉 Job ${job.id} completed successfully`);
  console.log(`   Properties scraped: ${result.totalPropertiesScraped}`);
});

scrapeQueue.on('failed', (job, error) => {
  console.error(`\n💥 Job ${job?.id} failed:`, error.message);
  console.error(`   Attempts: ${job?.attemptsMade}/${job?.opts.attempts}`);
});

scrapeQueue.on('stalled', (job) => {
  console.warn(`\n⚠️  Job ${job.id} stalled`);
});

scrapeQueue.on('error', (error) => {
  console.error('\n❌ Queue error:', error);
});

// Log queue ready
scrapeQueue.on('ready', () => {
  console.log('✅ Queue is ready and connected to Redis');
});

console.log('🚀 Queue worker started');
console.log(`   Redis: ${REDIS_HOST}:${REDIS_PORT}`);
console.log(`   Queue: multi-source-scraping`);
console.log('   Waiting for jobs...\n');

// Keep process alive
process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down queue worker...');
  await scrapeQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down queue worker...');
  await scrapeQueue.close();
  process.exit(0);
});
