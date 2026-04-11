'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export type Member = {
  id: string;
  name: string;
  role: 'Photographer' | 'Leader';
  email: string;
  status: 'Active' | 'On Leave' | 'Inactive';
};

type AuthContextType = {
  member: Member | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (mounted) {
          setMember(null);
          setLoading(false);
        }
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('members')
        .select('id, name, role, email, status')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error || !data || data.status !== 'Active') {
        await supabase.auth.signOut();
        if (mounted) {
          setMember(null);
          setLoading(false);
        }
        router.replace('/login');
        return;
      }

      if (mounted) {
        setMember(data as Member);
        setLoading(false);
      }
    };

    verify();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        if (mounted) setMember(null);
        router.replace('/login');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setMember(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ member, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
