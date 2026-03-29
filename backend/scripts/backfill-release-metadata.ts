/**
 * One-off: re-parse each videos.title and overwrite parsed columns.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (root .env).
 *
 *   cd backend && npx tsx scripts/backfill-release-metadata.ts
 */
import * as dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  parseReleaseMetadata,
  releaseMetadataToVideoColumns,
} from '../src/lib/release-metadata';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BATCH = 150;

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  const supabase = createClient(url, key);
  let offset = 0;
  let updated = 0;
  let unknownQuality = 0;

  for (;;) {
    const { data: rows, error } = await supabase
      .from('videos')
      .select('id, title')
      .order('created_at', { ascending: true })
      .range(offset, offset + BATCH - 1);

    if (error) throw error;
    if (!rows?.length) break;

    for (const row of rows) {
      const meta = await parseReleaseMetadata(row.title);
      const cols = releaseMetadataToVideoColumns(meta);
      if (meta.quality === 'unknown') unknownQuality += 1;

      const { error: upErr } = await supabase.from('videos').update(cols).eq('id', row.id);
      if (upErr) {
        console.error('update failed', row.id, upErr.message);
      } else {
        updated += 1;
      }
    }

    offset += rows.length;
    console.log(`Progress: ${updated} rows updated, offset ${offset}`);
  }

  console.log(`Done. Updated: ${updated}. Rows with unknown resolution/quality: ${unknownQuality}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
