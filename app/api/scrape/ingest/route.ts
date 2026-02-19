/**
 * Scrape Ingestion API
 * Manually trigger ingestion of scraped bronze data into the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { promisify } from 'util';
import { exec } from 'child_process';

export const runtime = 'nodejs';

const execAsync = promisify(exec);

/**
 * POST /api/scrape/ingest
 */
export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json().catch(() => ({}));
    const requestedByJobId = body?.jobId ? String(body.jobId) : null;

    const { stdout, stderr } = await execAsync('npm run ingest', {
      cwd: process.cwd(),
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    });

    return NextResponse.json({
      success: true,
      message: 'Ingestion completed successfully',
      requestedByJobId,
      output: {
        stdout: stdout?.trim() || null,
        stderr: stderr?.trim() || null,
      },
    });
  } catch (error: any) {
    console.error('Error running ingestion:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Ingestion failed',
        output: {
          stdout: error?.stdout || null,
          stderr: error?.stderr || null,
        },
      },
      { status: 500 }
    );
  }
}

