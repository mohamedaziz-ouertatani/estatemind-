/**
 * Scheduler Service Entry Point
 * Starts the scheduler and keeps the process alive
 */

import './src/scheduler.js';

const TIMEZONE = 'Africa/Tunis';

console.log('\n' + '='.repeat(60));
console.log('🎯 ESTATEMIND SCRAPER SCHEDULER SERVICE');
console.log('='.repeat(60));
console.log(`⏰ Started at: ${new Date().toLocaleString('en-US', { timeZone: TIMEZONE })}`);
console.log(`🌍 Timezone: ${TIMEZONE}`);
console.log('='.repeat(60) + '\n');

// Keep process alive
process.stdin.resume();
