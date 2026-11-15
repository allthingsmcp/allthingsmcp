import { after } from 'next/server';
import {
  buildRow,
  collectPayloadSchema,
  parseHostnames,
} from '@/lib/analytics/collect';
import { createServiceSupabaseClient } from '@/lib/supabase/admin';

const maxBodyBytes = 4096;

// First-party analytics collector. It always answers 204 so the page never
// waits on it or learns whether an event was stored.
export async function POST(request: Request) {
  const done = () => new Response(null, { status: 204 });
  const secret = process.env.ANALYTICS_SECRET;
  const supabase = createServiceSupabaseClient();
  if (!secret || !supabase) return done();

  const body = await request.text().catch(() => '');
  if (!body || body.length > maxBodyBytes) return done();
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return done();
  }
  const parsed = collectPayloadSchema.safeParse(json);
  if (!parsed.success) return done();

  const row = buildRow(parsed.data, request.headers, {
    secret,
    hostnames: parseHostnames(process.env.ANALYTICS_HOSTNAMES),
  });
  if (!row) return done();

  after(async () => {
    const { error } = await supabase.from('analytics_events').insert(row);
    if (error) console.error('analytics insert failed:', error.message);
  });
  return done();
}
