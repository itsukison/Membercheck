import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type CreateMemberBody = {
  name: string;
  email: string;
  password: string;
  role: 'Photographer' | 'Leader';
  status?: 'Active' | 'On Leave' | 'Inactive';
};

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!serviceKey || !url || !publishableKey) {
    return NextResponse.json(
      { error: 'Server misconfigured: missing Supabase keys.' },
      { status: 500 }
    );
  }

  // Verify the caller is an authenticated staff member (Leader role)
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
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (callerError || !callerMember || callerMember.status !== 'Active') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (callerMember.role !== 'Leader') {
    return NextResponse.json(
      { error: 'Only Leaders can create new members.' },
      { status: 403 }
    );
  }

  let body: CreateMemberBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { name, email, password, role, status } = body;
  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: 'name, email, password, and role are required.' },
      { status: 400 }
    );
  }
  if (role !== 'Photographer' && role !== 'Leader') {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 }
    );
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? 'Failed to create user.' },
      { status: 400 }
    );
  }

  const { error: insertError } = await admin.from('members').insert({
    id: created.user.id,
    name,
    email,
    role,
    status: status ?? 'Active',
  });

  if (insertError) {
    // Roll back the auth user if the members row insert fails
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: `Failed to create member: ${insertError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: created.user.id });
}
