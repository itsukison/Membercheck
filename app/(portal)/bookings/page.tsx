'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, CalendarDays } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type BookingRow = {
  id: string;
  reference: string;
  client_name: string;
  date: string;
  start_hour: number;
  end_hour: number;
  status: string;
  location: { name: string } | null;
  assigned_member: { name: string } | null;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatWindow(start: number, end: number) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(start)}:00 - ${pad(end)}:00`;
}

function statusLabel(s: string) {
  if (s === 'pending_confirmation') return 'Pending';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function statusClass(s: string) {
  if (s === 'confirmed') return 'bg-[#111] text-white';
  if (s === 'completed') return 'bg-[#e8e6e1] text-[#777]';
  if (s === 'cancelled') return 'border border-[#ff4d94] text-[#ff4d94]';
  return 'border border-[#111] text-[#111]';
}

export default function Bookings() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('id, reference, client_name, date, start_hour, end_hour, status, location:locations(name), assigned_member:members!bookings_assigned_member_id_fkey(name)')
        .order('date', { ascending: true })
        .order('start_hour', { ascending: true });
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-serif text-4xl text-[#111]">Bookings</h1>
          <p className="text-[#777] mt-2">Manage and view all scheduled shoots.</p>
        </div>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference or client..."
              className="pl-10 pr-4 py-2 border border-[#111] bg-white focus:outline-none focus:border-[#ff4d94]"
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
            <div key={date} className="space-y-4">
              <h2 className="font-serif text-2xl text-[#111] flex items-center space-x-2 border-b border-[#e8e6e1] pb-2">
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
                        <th className="p-4 font-medium text-[#111]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-[#e8e6e1] hover:bg-[#fcfbf9]/50 transition-colors last:border-b-0">
                          <td className="p-4 text-[#ff4d94] font-medium">{b.reference}</td>
                          <td className="p-4 text-[#111] font-medium">{b.client_name}</td>
                          <td className="p-4 text-[#777]">{formatWindow(b.start_hour, b.end_hour)}</td>
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
