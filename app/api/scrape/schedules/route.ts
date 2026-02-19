/**
 * Scraping Automation Schedules API
 * Returns configured automation jobs with next run times.
 */

import { NextResponse } from 'next/server';

type ScheduleConfig = {
  id: string;
  name: string;
  cron: string;
  description: string;
};

const TIMEZONE = 'Africa/Tunis';

const SCHEDULES: ScheduleConfig[] = [
  {
    id: 'full-scrape',
    name: 'Full scrape (all sources)',
    cron: '0 2 * * *',
    description: 'Daily at 02:00',
  },
  {
    id: 'incremental-scrape',
    name: 'Incremental scrape (all sources)',
    cron: '0 */6 * * *',
    description: 'Every 6 hours',
  },
  {
    id: 'hot-listings',
    name: 'Hot listings (Tayara)',
    cron: '0 */2 * * *',
    description: 'Every 2 hours',
  },
  {
    id: 'premium-properties',
    name: 'Premium properties (Mubawab)',
    cron: '0 */4 * * *',
    description: 'Every 4 hours',
  },
  {
    id: 'source-sync',
    name: 'Source sync agent',
    cron: '30 */3 * * *',
    description: 'Every 3 hours at :30',
  },
  {
    id: 'auto-ingestion',
    name: 'Auto ingestion',
    cron: '45 */6 * * *',
    description: 'Every 6 hours at :45',
  },
];

function nextRunFromCron(cron: string, now = new Date()): Date {
  const [minuteExpr, hourExpr] = cron.split(' ');

  // Pattern: M H * * *
  if (/^\d+$/.test(minuteExpr) && /^\d+$/.test(hourExpr)) {
    const minute = Number(minuteExpr);
    const hour = Number(hourExpr);
    const next = new Date(now);
    next.setSeconds(0, 0);
    next.setHours(hour, minute, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  // Pattern: M */N * * *
  if (/^\d+$/.test(minuteExpr) && /^\*\/\d+$/.test(hourExpr)) {
    const minute = Number(minuteExpr);
    const step = Number(hourExpr.split('/')[1]);
    const next = new Date(now);
    next.setSeconds(0, 0);

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    let nextHour = Math.ceil(currentHour / step) * step;
    if (nextHour === currentHour && currentMinute >= minute) {
      nextHour += step;
    }

    if (nextHour >= 24) {
      next.setDate(next.getDate() + 1);
      nextHour = nextHour % 24;
    }

    next.setHours(nextHour, minute, 0, 0);
    if (next <= now) {
      next.setHours(next.getHours() + step, minute, 0, 0);
    }
    return next;
  }

  // Fallback if unknown pattern
  return new Date(now.getTime() + 60 * 60 * 1000);
}

export async function GET() {
  const now = new Date();

  const data = SCHEDULES.map((schedule) => {
    const nextRun = nextRunFromCron(schedule.cron, now);
    return {
      ...schedule,
      timezone: TIMEZONE,
      nextRun: nextRun.toISOString(),
      msUntilNextRun: nextRun.getTime() - now.getTime(),
    };
  });

  return NextResponse.json({
    success: true,
    generatedAt: now.toISOString(),
    schedules: data,
  });
}
