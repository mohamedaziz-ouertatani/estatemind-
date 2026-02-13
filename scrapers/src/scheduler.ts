/**
 * Scheduler with Cron Jobs
 * Schedules automated scraping tasks
 */

import cron from 'node-cron';
import { addScrapeJob } from './queue.js';
import type { ScrapeJobData } from './interfaces/scraper.interface.js';

// Timezone for Tunisia
const TIMEZONE = 'Africa/Tunis';

console.log('🕐 Initializing scheduler...');
console.log(`   Timezone: ${TIMEZONE}`);
console.log(`   Current time: ${new Date().toLocaleString('en-US', { timeZone: TIMEZONE })}\n`);

/**
 * Schedule 1: Full scrape - All 3 sources, 10 pages, daily at 2:00 AM
 */
const fullScrapeJob = cron.schedule(
  '0 2 * * *',
  async () => {
    console.log('\n🌙 Running scheduled FULL SCRAPE (2:00 AM daily)');
    const jobData: ScrapeJobData = {
      sources: ['tayara', 'mubawab', 'tunisie-annonce'],
      type: 'full',
      maxPages: 10,
      priority: 'normal',
      trigger: 'scheduled',
    };
    await addScrapeJob(jobData);
  },
  {
    timezone: TIMEZONE,
  }
);

console.log('✅ Schedule 1: Full scrape (all sources, 10 pages) - Daily at 2:00 AM');

/**
 * Schedule 2: Incremental scrape - All 3 sources, 3 pages, every 6 hours
 */
const incrementalScrapeJob = cron.schedule(
  '0 */6 * * *',
  async () => {
    console.log('\n🔄 Running scheduled INCREMENTAL SCRAPE (every 6 hours)');
    const jobData: ScrapeJobData = {
      sources: ['tayara', 'mubawab', 'tunisie-annonce'],
      type: 'incremental',
      maxPages: 3,
      priority: 'normal',
      trigger: 'scheduled',
    };
    await addScrapeJob(jobData);
  },
  {
    timezone: TIMEZONE,
  }
);

console.log('✅ Schedule 2: Incremental scrape (all sources, 3 pages) - Every 6 hours');

/**
 * Schedule 3: Hot listings (Tayara) - Tunis area only, 3 pages, every 2 hours
 */
const hotListingsJob = cron.schedule(
  '0 */2 * * *',
  async () => {
    console.log('\n🔥 Running scheduled HOT LISTINGS (Tayara - Tunis area, every 2 hours)');
    const jobData: ScrapeJobData = {
      sources: ['tayara'],
      governorates: ['Tunis', 'La Marsa', 'Carthage', 'Ariana'],
      type: 'incremental',
      maxPages: 3,
      priority: 'high',
      trigger: 'scheduled',
    };
    await addScrapeJob(jobData);
  },
  {
    timezone: TIMEZONE,
  }
);

console.log('✅ Schedule 3: Hot listings (Tayara - Tunis area, 3 pages) - Every 2 hours');

/**
 * Schedule 4: Premium properties (Mubawab) - Major cities, 5 pages, every 4 hours
 */
const premiumPropertiesJob = cron.schedule(
  '0 */4 * * *',
  async () => {
    console.log('\n💎 Running scheduled PREMIUM PROPERTIES (Mubawab - major cities, every 4 hours)');
    const jobData: ScrapeJobData = {
      sources: ['mubawab'],
      governorates: ['Tunis', 'Sousse', 'Sfax'],
      propertyTypes: ['villa', 'apartment'],
      type: 'incremental',
      maxPages: 5,
      priority: 'normal',
      trigger: 'scheduled',
    };
    await addScrapeJob(jobData);
  },
  {
    timezone: TIMEZONE,
  }
);

console.log('✅ Schedule 4: Premium properties (Mubawab - major cities, 5 pages) - Every 4 hours');

console.log('\n' + '='.repeat(60));
console.log('🚀 All schedules initialized successfully!');
console.log('='.repeat(60) + '\n');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down scheduler...');
  fullScrapeJob.stop();
  incrementalScrapeJob.stop();
  hotListingsJob.stop();
  premiumPropertiesJob.stop();
  console.log('✅ All schedules stopped');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down scheduler...');
  fullScrapeJob.stop();
  incrementalScrapeJob.stop();
  hotListingsJob.stop();
  premiumPropertiesJob.stop();
  console.log('✅ All schedules stopped');
  process.exit(0);
});

// Export for use in scheduler-service
export { fullScrapeJob, incrementalScrapeJob, hotListingsJob, premiumPropertiesJob };
