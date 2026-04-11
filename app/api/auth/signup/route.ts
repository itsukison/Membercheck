import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const STUDIO_CODE = 'Shionparkphoto';

type SignupBody = {
  name: string;
  email: string;
  password: string;
  studioCode: string;
  role: 'Photographer' | 'Leader';
};

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !url) {
    return NextResponse.json(
      { error: 'Server misconfigured: missing Supabase keys.' },
      { status: 500 }
    );
  }

  let body: SignupBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { name, password, studioCode, role } = body;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!name || !email || !password || !studioCode || !role) {
    return NextResponse.json(
      { error: 'name, email, password, studioCode, and role are required.' },
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
  if (studioCode !== STUDIO_CODE) {
    return NextResponse.json({ error: 'Invalid studio code.' }, { status: 403 });
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
    const msg = createError?.message ?? 'Failed to create user.';
    const friendly = /already|exists|registered/i.test(msg)
      ? 'An account with this email already exists. Please sign in instead.'
      : msg;
    return NextResponse.json({ error: friendly }, { status: 400 });
  }

  const { error: insertError } = await admin.from('members').insert({
    id: created.user.id,
    name,
    email,
    role,
    status: 'Active',
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: `Failed to create member: ${insertError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: created.user.id });
}
