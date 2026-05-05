'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar as CalIcon, Clock, MapPin, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

type BookingRow = {
  id: string;
  reference: string;
  client_name: string;
  date: string;
  start_minutes: number;
  end_minutes: number;
  status: string;
  location: { name: string } | null;
  plan: { name: string } | null;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatWindow(startMin: number, endMin: number) {
  const fmt = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return `${fmt(startMin)} - ${fmt(endMin)}`;
}

export default function Dashboard() {
  const { member } = useAuth();
  const [pending, setPending] = useState<BookingRow[]>([]);
  const [todayBookings, setTodayBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!member) return;
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const [pendingRes, todayRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, reference, client_name, date, start_minutes, end_minutes, status, location:locations(name), plan:plans(name)')
        .eq('assigned_member_id', member.id)
        .in('status', ['pending_confirmation', 'pending_reschedule_confirmation'])
        .order('date', { ascending: true }),
      supabase
        .from('bookings')
        .select('id, reference, client_name, date, start_minutes, end_minutes, status, location:locations(name), plan:plans(name)')
        .eq('assigned_member_id', member.id)
        .eq('status', 'confirmed')
        .eq('date', today)
        .order('start_minutes', { ascending: true }),
    ]);

    if (pendingRes.error || todayRes.error) {
      setError(pendingRes.error?.message ?? todayRes.error?.message ?? 'Failed to load bookings.');
    } else {
      setPending((pendingRes.data ?? []) as unknown as BookingRow[]);
      setTodayBookings((todayRes.data ?? []) as unknown as BookingRow[]);
      setError(null);
    }
    setLoading(false);
  }, [member]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async (id: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', id);
    if (error) { setError(error.message); return; }
    await load();
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (error) { setError(error.message); return; }
    await load();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
      <header>
        <h1 className="font-serif text-3xl md:text-4xl text-[#111] leading-tight">Welcome back{member ? `, ${member.name}` : ''}</h1>
        <p className="text-[#777] mt-2">Here is your schedule and pending assignments.</p>
      </header>

      {error && (
        <div className="border border-[#ff4d94] bg-[#ff4d94]/5 text-[#ff4d94] p-4">{error}</div>
      )}

      {loading ? (
        <p className="text-[#777]">Loading…</p>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-serif text-xl md:text-2xl text-[#111] flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#ff4d94]"></span>
                <span>Pending Auto-Assignments</span>
              </h2>
              <p className="text-sm text-[#777] mb-4">These bookings were automatically assigned to you based on your availability. Please confirm or reject them.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pending.map(b => (
                  <div key={b.id} className="bg-white border border-[#ff4d94] p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(255,77,148,0.2)] flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                        <span className="text-[#ff4d94] font-bold tracking-wider uppercase text-sm">{b.reference}</span>
                        <span className={`text-xs px-2 py-1 font-medium ${b.status === 'pending_reschedule_confirmation' ? 'bg-violet-100 text-violet-700' : 'bg-[#ff4d94]/10 text-[#ff4d94]'}`}>
                          {b.status === 'pending_reschedule_confirmation' ? 'Reschedule Review' : 'Action Required'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                        <h3 className="text-lg sm:text-xl font-medium text-[#111]">{b.client_name}</h3>
                        <Link href={`/bookings/${b.id}`} className="text-sm font-medium text-[#111] underline underline-offset-2 hover:text-[#ff4d94] transition-colors">
                          View Details
                        </Link>
                      </div>
                      <div className="space-y-3 text-sm text-[#777]">
                        <div className="flex items-center space-x-3"><CalIcon size={16} className="text-[#111]" /><span>{formatDate(b.date)}</span></div>
                        <div className="flex items-center space-x-3"><Clock size={16} className="text-[#111]" /><span>{formatWindow(b.start_minutes, b.end_minutes)}</span></div>
                        <div className="flex items-center space-x-3"><MapPin size={16} className="text-[#111]" /><span>{b.location?.name ?? '—'}</span></div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                      <button onClick={() => handleConfirm(b.id)} className="flex-1 flex items-center justify-center space-x-2 bg-[#111] text-white py-2.5 hover:bg-[#ff4d94] transition-colors font-medium">
                        <Check size={16} /><span>Confirm</span>
                      </button>
                      <button onClick={() => handleReject(b.id)} className="flex-1 flex items-center justify-center space-x-2 border border-[#111] text-[#111] py-2.5 hover:bg-[#fcfbf9] transition-colors font-medium">
                        <X size={16} /><span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="font-serif text-xl md:text-2xl text-[#111]">Today&apos;s Bookings</h2>
            <div className="bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
              {todayBookings.length > 0 ? (
                <div className="divide-y divide-[#e8e6e1]">
                  {todayBookings.map(b => (
                    <div key={b.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fcfbf9] transition-colors">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center">
                        <div className="text-left sm:text-center min-w-[80px]">
                          <span className="block text-lg font-bold text-[#111]">{`${String(Math.floor(b.start_minutes/60)).padStart(2,'0')}:${String(b.start_minutes%60).padStart(2,'0')}`}</span>
                          <span className="block text-xs text-[#777] uppercase tracking-wider">Start</span>
                        </div>
                        <div className="w-px h-12 bg-[#e8e6e1] hidden sm:block"></div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="text-[#ff4d94] font-bold tracking-wider uppercase text-xs">{b.reference}</span>
                            <span className="bg-[#111] text-white text-[10px] px-2 py-0.5 uppercase tracking-wider">Confirmed</span>
                          </div>
                          <h3 className="text-lg font-medium text-[#111]">{b.client_name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-[#777] mt-1">
                            <MapPin size={14} /><span>{b.location?.name ?? '—'}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/bookings/${b.id}`} className="border border-[#111] px-4 py-2 text-sm font-medium hover:bg-[#111] hover:text-white transition-colors text-center">
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-[#777]">
                  No bookings scheduled for today.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
