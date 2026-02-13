/**
 * Auto-Ingestion Service
 * Watches scrapers/data/bronze/ directory and auto-ingests new files
 */

import chokidar from 'chokidar';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

const BRONZE_DIR = path.join(__dirname, '..', 'scrapers', 'data', 'bronze');
const STABILITY_THRESHOLD = 3000; // Wait 3 seconds for file write to finish

console.log('🔍 Auto-Ingestion Service Starting...');
console.log(`📁 Watching directory: ${BRONZE_DIR}`);
console.log(`⏱️  Stability threshold: ${STABILITY_THRESHOLD}ms\n`);

// Ensure directory exists
if (!fs.existsSync(BRONZE_DIR)) {
  fs.mkdirSync(BRONZE_DIR, { recursive: true });
  console.log(`✅ Created bronze directory: ${BRONZE_DIR}\n`);
}

// Track files being processed to avoid duplicates
const processingFiles = new Set<string>();

/**
 * Extract source from filename (first part before underscore)
 */
function extractSource(filename: string): string {
  const parts = filename.split('_');
  return parts[0] || 'unknown';
}

/**
 * Ingest a scraped data file
 */
async function ingestFile(filePath: string) {
  const filename = path.basename(filePath);
  
  // Check if already processing
  if (processingFiles.has(filename)) {
    console.log(`⚠️  Already processing: ${filename}`);
    return;
  }

  processingFiles.add(filename);

  try {
    const source = extractSource(filename);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📥 Starting ingestion: ${filename}`);
    console.log(`   Source: ${source}`);
    console.log(`   Time: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));

    // Run the ingest script
    const { stdout, stderr } = await execAsync('npm run ingest', {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env },
    });

    if (stdout) {
      console.log(stdout);
    }

    if (stderr && !stderr.includes('punycode')) {
      console.error('⚠️  Warnings:', stderr);
    }

    console.log('='.repeat(60));
    console.log(`✅ Ingestion completed: ${filename}`);
    console.log('='.repeat(60) + '\n');
  } catch (error: any) {
    console.error(`\n❌ Error ingesting ${filename}:`, error.message);
    if (error.stdout) console.log('stdout:', error.stdout);
    if (error.stderr) console.error('stderr:', error.stderr);
  } finally {
    processingFiles.delete(filename);
  }
}

// Initialize file watcher
const watcher = chokidar.watch(`${BRONZE_DIR}/*.json`, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: STABILITY_THRESHOLD,
    pollInterval: 100,
  },
});

// Handle new files
watcher.on('add', (filePath) => {
  const filename = path.basename(filePath);
  console.log(`\n🆕 New file detected: ${filename}`);
  ingestFile(filePath);
});

// Handle file changes (re-ingest)
watcher.on('change', (filePath) => {
  const filename = path.basename(filePath);
  console.log(`\n🔄 File changed: ${filename}`);
  ingestFile(filePath);
});

// Handle errors
watcher.on('error', (error) => {
  console.error('\n❌ Watcher error:', error);
});

// Log when ready
watcher.on('ready', () => {
  console.log('✅ File watcher is ready');
  console.log('👀 Monitoring for new JSON files...\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down auto-ingestion service...');
  await watcher.close();
  console.log('✅ Watcher closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down auto-ingestion service...');
  await watcher.close();
  console.log('✅ Watcher closed');
  process.exit(0);
});

// Keep process alive
console.log('🚀 Auto-ingestion service is running');
console.log('   Press Ctrl+C to stop\n');
