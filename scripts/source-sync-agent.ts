/**
 * Source Sync Agent
 *
 * Detects listings removed/sold on original source websites and updates or deletes local records.
 */

import { PrismaClient, PropertyStatus } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_BATCH_SIZE = Number(process.env.SOURCE_SYNC_BATCH_SIZE || 50);
const REQUEST_TIMEOUT_MS = Number(process.env.SOURCE_SYNC_TIMEOUT_MS || 15000);
const DELETE_MODE = process.env.SOURCE_SYNC_DELETE === 'true';
const DEFAULT_DRY_RUN = process.env.SOURCE_SYNC_DRY_RUN === 'true';

const soldPatterns = [
  /vendu/i,
  /sold\s*out/i,
  /n[’']est\s+plus\s+disponible/i,
  /plus\s+disponible/i,
  /annonce\s+indisponible/i,
  /cette\s+annonce\s+n[’']existe\s+plus/i,
  /désactivée/i,
  /supprimée/i,
  /deleted/i,
  /expired/i,
  /not\s+found/i,
];

type SyncDecision = {
  exists: boolean;
  inferredStatus?: PropertyStatus;
  reason: string;
};

function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  return fn(controller.signal).finally(() => clearTimeout(timeout));
}

async function probeListing(sourceUrl: string): Promise<SyncDecision> {
  try {
    const response = await withTimeout(
      (signal) => fetch(sourceUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal,
      }),
      REQUEST_TIMEOUT_MS,
    );

    if ([404, 410].includes(response.status)) {
      return {
        exists: false,
        inferredStatus: PropertyStatus.INACTIVE,
        reason: `HTTP ${response.status}`,
      };
    }

    const html = (await response.text()).slice(0, 200_000);

    if (!html.trim()) {
      return {
        exists: false,
        inferredStatus: PropertyStatus.INACTIVE,
        reason: 'Empty response body',
      };
    }

    const soldMatch = soldPatterns.find((pattern) => pattern.test(html));
    if (soldMatch) {
      const soldLike = /vendu|sold/i.test(soldMatch.source);
      return {
        exists: false,
        inferredStatus: soldLike ? PropertyStatus.SOLD : PropertyStatus.INACTIVE,
        reason: `Pattern matched: ${soldMatch}`,
      };
    }

    return {
      exists: true,
      reason: `HTTP ${response.status}`,
    };
  } catch (error: any) {
    return {
      exists: true,
      reason: `Probe error (kept active): ${error.message}`,
    };
  }
}

export async function runSourceSync(options?: {
  dryRun?: boolean;
  batchSize?: number;
}) {
  const dryRun = options?.dryRun ?? DEFAULT_DRY_RUN;
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;

  const candidates = await prisma.property.findMany({
    where: {
      sourceUrl: { not: null },
      sourceWebsite: { not: null },
      status: { in: [PropertyStatus.ACTIVE, PropertyStatus.PENDING] },
    },
    orderBy: { updatedAt: 'asc' },
    take: batchSize,
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      sourceWebsite: true,
      status: true,
    },
  });

  const summary = {
    dryRun,
    deleteMode: DELETE_MODE,
    scanned: candidates.length,
    unchanged: 0,
    markedInactive: 0,
    markedSold: 0,
    deleted: 0,
    errors: 0,
    details: [] as Array<{ id: string; action: string; reason: string; sourceUrl: string }>,
  };

  for (const item of candidates) {
    const sourceUrl = item.sourceUrl!;
    try {
      const decision = await probeListing(sourceUrl);

      if (decision.exists) {
        summary.unchanged++;
        continue;
      }

      if (dryRun) {
        summary.details.push({
          id: item.id,
          action: DELETE_MODE ? 'would_delete' : `would_mark_${decision.inferredStatus?.toLowerCase()}`,
          reason: decision.reason,
          sourceUrl,
        });
        continue;
      }

      if (DELETE_MODE) {
        await prisma.property.delete({ where: { id: item.id } });
        summary.deleted++;
        summary.details.push({
          id: item.id,
          action: 'deleted',
          reason: decision.reason,
          sourceUrl,
        });
      } else {
        const nextStatus = decision.inferredStatus || PropertyStatus.INACTIVE;
        await prisma.property.update({
          where: { id: item.id },
          data: { status: nextStatus },
        });

        if (nextStatus === PropertyStatus.SOLD) {
          summary.markedSold++;
        } else {
          summary.markedInactive++;
        }

        summary.details.push({
          id: item.id,
          action: `marked_${nextStatus.toLowerCase()}`,
          reason: decision.reason,
          sourceUrl,
        });
      }
    } catch (error: any) {
      summary.errors++;
      summary.details.push({
        id: item.id,
        action: 'error',
        reason: error.message,
        sourceUrl,
      });
    }
  }

  return summary;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const batchArg = process.argv.find((arg) => arg.startsWith('--batch='));
  const batchSize = batchArg ? Number(batchArg.split('=')[1]) : undefined;

  console.log('🔎 Source Sync Agent started');
  console.log(`   dryRun=${dryRun || DEFAULT_DRY_RUN}`);
  console.log(`   deleteMode=${DELETE_MODE}`);
  console.log(`   batchSize=${batchSize || DEFAULT_BATCH_SIZE}`);

  const summary = await runSourceSync({ dryRun, batchSize });

  console.log('\n📊 Source Sync Summary');
  console.log(`   scanned: ${summary.scanned}`);
  console.log(`   unchanged: ${summary.unchanged}`);
  console.log(`   markedInactive: ${summary.markedInactive}`);
  console.log(`   markedSold: ${summary.markedSold}`);
  console.log(`   deleted: ${summary.deleted}`);
  console.log(`   errors: ${summary.errors}`);

  if (summary.details.length > 0) {
    console.log('\n🧾 Changes');
    summary.details.slice(0, 20).forEach((d) => {
      console.log(`   - ${d.id}: ${d.action} (${d.reason})`);
    });
  }
}

main()
  .catch((error) => {
    console.error('❌ Source sync failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
