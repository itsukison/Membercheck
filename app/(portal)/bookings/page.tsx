'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, CalendarDays } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type BookingRow = {
  id: string;
  reference: string;
  client_name: string;
  date: string;
  start_minutes: number;
  end_minutes: number;
  status: string;
  payment_status: string | null;
  total_price: number | null;
  refund_amount_cents: number | null;
  location: { name: string } | null;
  assigned_member: { name: string } | null;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatWindow(startMin: number, endMin: number) {
  const fmt = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return `${fmt(startMin)} - ${fmt(endMin)}`;
}

function statusLabel(s: string) {
  if (s === 'pending_confirmation') return 'Pending';
  if (s === 'pending_payment') return 'Awaiting Payment';
  if (s === 'pending_reschedule_confirmation') return 'Reschedule Pending';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function statusClass(s: string) {
  if (s === 'confirmed') return 'bg-[#111] text-white';
  if (s === 'completed') return 'bg-[#e8e6e1] text-[#777]';
  if (s === 'cancelled') return 'border border-[#ff4d94] text-[#ff4d94]';
  if (s === 'pending_payment') return 'border border-[#e8e6e1] text-[#777]';
  if (s === 'pending_reschedule_confirmation') return 'bg-violet-100 text-violet-800 border border-violet-300';
  return 'border border-[#111] text-[#111]';
}

function paymentLabel(p: string | null) {
  switch (p) {
    case 'paid': return 'Paid';
    case 'refunded': return 'Refunded';
    case 'partially_refunded': return 'Partial Refund';
    case 'failed': return 'Failed';
    case 'disputed': return 'Disputed';
    case 'pending':
    default: return 'Unpaid';
  }
}

function paymentClass(p: string | null) {
  if (p === 'paid') return 'bg-green-100 text-green-800 border border-green-300';
  if (p === 'refunded') return 'bg-blue-100 text-blue-800 border border-blue-300';
  if (p === 'partially_refunded') return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (p === 'disputed') return 'bg-red-100 text-red-800 border border-red-300';
  if (p === 'failed') return 'bg-gray-100 text-gray-700 border border-gray-300';
  return 'bg-[#fcfbf9] text-[#777] border border-[#e8e6e1]';
}

export default function Bookings() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasAutoScrolled = useRef(false);

  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  useEffect(() => {
    (async () => {
      hasAutoScrolled.current = false;
      setLoading(true);
      // Hide abandoned payment attempts: they're noise and get cleaned up by sweep_expired_pending_bookings.
      const { data, error } = await supabase
        .from('bookings')
        .select('id, reference, client_name, date, start_minutes, end_minutes, status, payment_status, total_price, refund_amount_cents, location:locations(name), assigned_member:members!bookings_assigned_member_id_fkey(name)')
        .neq('status', 'pending_payment')
        .order('date', { ascending: true })
        .order('start_minutes', { ascending: true });
      if (error) {
        setError(error.message);
      } else {
        setRows((data ?? []) as unknown as BookingRow[]);
        setError(null);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      r.reference.toLowerCase().includes(q) ||
      r.client_name.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, BookingRow[]>();
    for (const r of filtered) {
      const key = r.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    if (loading || hasAutoScrolled.current || grouped.length === 0 || search.trim()) return;

    const dates = grouped.map(([date]) => date);
    const targetDate = dates.includes(todayIso)
      ? todayIso
      : (dates.find((date) => date >= todayIso) ?? dates[dates.length - 1]);

    const targetElement = sectionRefs.current[targetDate];
    if (!targetElement) return;

    targetElement.scrollIntoView({ behavior: 'auto', block: 'start' });
    hasAutoScrolled.current = true;
  }, [grouped, loading, search, todayIso]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-[#111] leading-tight">Bookings</h1>
          <p className="text-[#777] mt-2">Manage and view all scheduled shoots.</p>
        </div>
        <div className="flex w-full md:w-auto space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference or client..."
              className="w-full md:w-auto min-w-[250px] pl-10 pr-4 py-2 border border-[#111] bg-white focus:outline-none focus:border-[#ff4d94]"
            />
          </div>
        </div>
      </header>

      {error && (
        <div className="border border-[#ff4d94] bg-[#ff4d94]/5 text-[#ff4d94] p-4">{error}</div>
      )}

      {loading ? (
        <p className="text-[#777]">Loading…</p>
      ) : grouped.length === 0 ? (
        <p className="text-[#777]">No bookings yet.</p>
      ) : (
        <div className="space-y-10">
          {grouped.map(([date, bookings]) => (
            <div key={date} ref={(el) => { sectionRefs.current[date] = el; }} className="space-y-4">
              <h2 className="font-serif text-xl md:text-2xl text-[#111] flex items-center space-x-2 border-b border-[#e8e6e1] pb-2">
                <CalendarDays size={20} className="text-[#ff4d94]" />
                <span>{formatDate(date)}</span>
              </h2>
              <div className="bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-[#fcfbf9] border-b border-[#111]">
                        <th className="p-4 font-medium text-[#111]">Ref</th>
                        <th className="p-4 font-medium text-[#111]">Client</th>
                        <th className="p-4 font-medium text-[#111]">Time</th>
                        <th className="p-4 font-medium text-[#111]">Location</th>
                        <th className="p-4 font-medium text-[#111]">Assigned To</th>
                        <th className="p-4 font-medium text-[#111]">Status</th>
                        <th className="p-4 font-medium text-[#111]">Payment</th>
                        <th className="p-4 font-medium text-[#111]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-[#e8e6e1] hover:bg-[#fcfbf9]/50 transition-colors last:border-b-0">
                          <td className="p-4 text-[#ff4d94] font-medium">{b.reference}</td>
                          <td className="p-4 text-[#111] font-medium">{b.client_name}</td>
                          <td className="p-4 text-[#777]">{formatWindow(b.start_minutes, b.end_minutes)}</td>
                          <td className="p-4 text-[#777]">{b.location?.name ?? '—'}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center space-x-1.5 bg-[#fcfbf9] border border-[#e8e6e1] px-2 py-1 text-xs font-medium text-[#111]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#111]"></span>
                              <span>{b.assigned_member?.name ?? 'Unassigned'}</span>
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 text-xs font-medium ${statusClass(b.status)}`}>
                              {statusLabel(b.status)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 text-xs font-medium inline-block ${paymentClass(b.payment_status)}`}>
                              {paymentLabel(b.payment_status)}
                            </span>
                            {b.refund_amount_cents && b.refund_amount_cents > 0 ? (
                              <div className="text-[11px] text-[#777] mt-1">-${(b.refund_amount_cents / 100).toFixed(2)}</div>
                            ) : null}
                          </td>
                          <td className="p-4">
                            <Link href={`/bookings/${b.id}`} className="text-[#111] hover:text-[#ff4d94] font-medium text-sm underline underline-offset-2">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
