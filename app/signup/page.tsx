'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CustomSelect } from '@/components/ui/custom-select';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studioCode, setStudioCode] = useState('');
  const [role, setRole] = useState<'Photographer' | 'Leader'>('Photographer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: member } = await supabase
        .from('members')
        .select('id, status')
        .eq('id', session.user.id)
        .maybeSingle();
      if (member && member.status === 'Active') router.replace('/dashboard');
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, studioCode, role }),
    });

    if (!res.ok) {
      const { error: errMsg } = await res.json().catch(() => ({ error: 'Unknown error' }));
      setError(errMsg ?? 'Failed to create account.');
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setError('Account created, but auto sign-in failed. Please sign in manually.');
      setLoading(false);
      return;
    }

    router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#fcfbf9] relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#e8e6e1 1px, transparent 1px), linear-gradient(90deg, #e8e6e1 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          backgroundPosition: 'center top'
        }}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md bg-[#fcfbf9] p-10 border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]"
      >
        <h1 className="font-serif text-4xl text-[#111] mb-2">Team Portal</h1>
        <p className="text-[#777] mb-8">Create your account.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#111] mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-transparent border-b-2 border-[#111] py-2 focus:outline-none focus:border-[#ff4d94] transition-colors rounded-none"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border-b-2 border-[#111] py-2 focus:outline-none focus:border-[#ff4d94] transition-colors rounded-none"
              placeholder="you@shion.photography"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="w-full bg-transparent border-b-2 border-[#111] py-2 focus:outline-none focus:border-[#ff4d94] transition-colors rounded-none"
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111] mb-2">Studio Code</label>
            <input
              type="password"
              value={studioCode}
              onChange={(e) => setStudioCode(e.target.value)}
              required
              className="w-full bg-transparent border-b-2 border-[#111] py-2 focus:outline-none focus:border-[#ff4d94] transition-colors rounded-none"
              placeholder="Provided by your studio lead"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111] mb-2">Role</label>
            <CustomSelect
              value={role}
              onChange={(val: string) => setRole(val as 'Photographer' | 'Leader')}
              options={[
                { label: 'Photographer', value: 'Photographer' },
                { label: 'Leader', value: 'Leader' }
              ]}
            />
          </div>

          {error && (
            <div className="text-sm text-[#ff4d94] border border-[#ff4d94] p-3 bg-[#ff4d94]/5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="block w-full bg-[#111] text-white text-center py-3 font-medium hover:bg-[#ff4d94] transition-colors mt-8 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-[#777]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#111] hover:text-[#ff4d94] transition-colors font-medium">
              Sign in →
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
