import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type UpdateMemberBody = {
  id: string;
  name?: string;
  role?: 'Photographer' | 'Leader';
  status?: 'Active' | 'On Leave' | 'Inactive';
  color?: string;
};

export async function PATCH(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!serviceKey || !url || !publishableKey) {
    return NextResponse.json(
      { error: 'Server misconfigured: missing Supabase keys.' },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const accessToken = authHeader.slice('Bearer '.length);

  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: callerMember, error: callerError } = await userClient
    .from('members')
    .select('id, role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (callerError || !callerMember || callerMember.status !== 'Active') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: UpdateMemberBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { id, name, role, status, color } = body;
  if (!id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 });
  }

  // Only allow updating yourself, or any member if you're a Leader
  if (callerMember.id !== id && callerMember.role !== 'Leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updates: Record<string, string | undefined> = {};
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;
  if (status !== undefined) updates.status = status;
  if (color !== undefined) updates.color = color;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: updateError } = await admin
    .from('members')
    .update(updates)
    .eq('id', id);

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to update member: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
