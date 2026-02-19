/**
 * Source Reconciliation API
 * Runs source-sync agent to mark/remove stale listings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runSourceSync } from '@/scripts/source-sync-agent';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.SCRAPER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured on server' },
        { status: 500 },
      );
    }

    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = Boolean(body?.dryRun);
    const batchSize = body?.batchSize ? Number(body.batchSize) : undefined;

    const summary = await runSourceSync({ dryRun, batchSize });

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('Error running source reconciliation:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
