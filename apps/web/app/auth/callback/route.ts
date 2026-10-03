import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function safeReturnPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/guides';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeReturnPath(url.searchParams.get('next'));
  const supabase = await createServerSupabaseClient();

  if (!code || !supabase) {
    return NextResponse.redirect(
      new URL(`${next}?auth=unavailable`, url.origin),
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`${next}?auth=failed`, url.origin));
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await supabase
      .from('profiles')
      .update({ newsletter_opt_in: url.searchParams.get('newsletter') === '1' })
      .eq('id', data.user.id);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
