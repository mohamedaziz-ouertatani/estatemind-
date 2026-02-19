/**
 * Source Sync Daemon
 * Periodically reconciles listing availability against source websites.
 */

import { runSourceSync } from './source-sync-agent';

const intervalMinutes = Number(process.env.SOURCE_SYNC_INTERVAL_MIN || 30);
const intervalMs = Math.max(intervalMinutes, 1) * 60 * 1000;
const dryRun = process.env.SOURCE_SYNC_DRY_RUN === 'true';
const batchSize = Number(process.env.SOURCE_SYNC_BATCH_SIZE || 50);

async function tick() {
  console.log(`\n🔁 Source sync tick @ ${new Date().toISOString()}`);
  const summary = await runSourceSync({ dryRun, batchSize });
  console.log(
    `✅ scanned=${summary.scanned} unchanged=${summary.unchanged} inactive=${summary.markedInactive} sold=${summary.markedSold} deleted=${summary.deleted} errors=${summary.errors}`,
  );
}

async function main() {
  console.log('🤖 Source Sync Daemon started');
  console.log(`   interval=${intervalMinutes}m dryRun=${dryRun} batchSize=${batchSize}`);

  await tick();

  const timer = setInterval(() => {
    tick().catch((error) => {
      console.error('❌ Source sync tick failed:', error);
    });
  }, intervalMs);

  const shutdown = () => {
    clearInterval(timer);
    console.log('🛑 Source Sync Daemon stopped');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('❌ Source sync daemon failed:', error);
  process.exit(1);
});
