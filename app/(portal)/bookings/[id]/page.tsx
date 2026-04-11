'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, MapPin, Clock, Calendar as CalIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

type BookingDetail = {
  id: string;
  reference: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_country: string;
  special_requests: string;
  retouch_notes: string;
  date: string;
  start_hour: number;
  end_hour: number;
  extra_duration_minutes: number;
  group_size: number;
  status: string;
  payment_confirmed: boolean;
  total_price: number;
  plan: { name: string; duration_minutes: number } | null;
  location: { name: string } | null;
  assigned_member: { id: string; name: string } | null;
  booking_addons: { price_snapshot: number; addon: { name: string } | null }[];
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function statusLabel(s: string) {
  if (s === 'pending_confirmation') return 'Pending';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { member } = useAuth();
  const [b, setB] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, reference, client_name, client_email, client_phone, client_country,
        special_requests, retouch_notes, date, start_hour, end_hour,
        extra_duration_minutes, group_size, status, payment_confirmed, total_price,
        plan:plans(name, duration_minutes),
        location:locations(name),
        assigned_member:members!bookings_assigned_member_id_fkey(id, name),
        booking_addons(price_snapshot, addon:addons(name))
      `)
      .eq('id', resolvedParams.id)
      .maybeSingle();

    if (error) {
      setError(error.message);
      setB(null);
    } else if (!data) {
      setError('Booking not found.');
      setB(null);
    } else {
      setB(data as unknown as BookingDetail);
      setError(null);
    }
    setLoading(false);
  }, [resolvedParams.id]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (status: string) => {
    if (!b) return;
    setSaving(true);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', b.id);
    setSaving(false);
    if (error) { setError(error.message); return; }
    await load();
  };

  const togglePayment = async () => {
    if (!b) return;
    setSaving(true);
    const { error } = await supabase
      .from('bookings')
      .update({ payment_confirmed: !b.payment_confirmed })
      .eq('id', b.id);
    setSaving(false);
    if (error) { setError(error.message); return; }
    await load();
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto"><p className="text-[#777]">Loading…</p></div>;
  }

  if (error || !b) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link href="/bookings" className="inline-flex items-center space-x-2 text-[#777] hover:text-[#111]">
          <ArrowLeft size={18} /><span>Back to Bookings</span>
        </Link>
        <p className="text-[#ff4d94]">{error ?? 'Booking not found.'}</p>
      </div>
    );
  }

  const canEdit = member?.role === 'Leader' || member?.id === b.assigned_member?.id;
  const durationMin = (b.plan?.duration_minutes ?? 0) + b.extra_duration_minutes;
  const durationLabel = `${Math.floor(durationMin / 60)}h${durationMin % 60 ? ` ${durationMin % 60}m` : ''}`;
  const whatsappHref = b.client_phone ? `https://wa.me/${b.client_phone.replace(/[^\d]/g, '')}` : '#';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/bookings" className="inline-flex items-center space-x-2 text-[#777] hover:text-[#111] transition-colors">
        <ArrowLeft size={18} />
        <span>Back to Bookings</span>
      </Link>

      <header className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-[#ff4d94] font-bold tracking-wider uppercase">{b.reference}</span>
            <span className="bg-[#111] text-white text-xs px-2 py-1 font-medium">{statusLabel(b.status)}</span>
            {b.payment_confirmed && (
              <span className="bg-[#ff4d94] text-white text-xs px-2 py-1 font-medium">Paid</span>
            )}
          </div>
          <h1 className="font-serif text-4xl text-[#111]">{b.client_name}</h1>
          <p className="text-[#777] mt-1">{b.plan?.name ?? '—'}</p>
        </div>
        {b.client_phone && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-[#25D366] text-white px-6 py-3 font-medium hover:bg-[#128C7E] transition-colors shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] border border-[#111]"
          >
            <MessageCircle size={20} />
            <span>Open WhatsApp</span>
          </a>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white border border-[#111] p-8 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
            <h2 className="font-serif text-2xl text-[#111] mb-6 border-b border-[#e8e6e1] pb-2">Event Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="block text-sm text-[#777] mb-1">Date</span>
                <div className="flex items-center space-x-2 text-[#111] font-medium">
                  <CalIcon size={18} className="text-[#ff4d94]" />
                  <span>{formatDate(b.date)}</span>
                </div>
              </div>
              <div>
                <span className="block text-sm text-[#777] mb-1">Time</span>
                <div className="flex items-center space-x-2 text-[#111] font-medium">
                  <Clock size={18} className="text-[#ff4d94]" />
                  <span>{b.start_hour.toString().padStart(2, '0')}:00 - {b.end_hour.toString().padStart(2, '0')}:00 ({durationLabel})</span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-sm text-[#777] mb-1">Location</span>
                <div className="flex items-center space-x-2 text-[#111] font-medium">
                  <MapPin size={18} className="text-[#ff4d94]" />
                  <span>{b.location?.name ?? '—'}</span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-sm text-[#777] mb-1">Assigned Photographer</span>
                <span className="text-[#111] font-medium">{b.assigned_member?.name ?? 'Unassigned'}</span>
              </div>
            </div>
          </section>

          {(b.special_requests || b.retouch_notes) && (
            <section className="bg-white border border-[#111] p-8 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
              <h2 className="font-serif text-2xl text-[#111] mb-6 border-b border-[#e8e6e1] pb-2">Client Notes</h2>
              {b.special_requests && (
                <div className="mb-4">
                  <span className="block text-xs text-[#777] uppercase tracking-wider mb-1">Special Requests</span>
                  <p className="text-[#444] leading-relaxed">{b.special_requests}</p>
                </div>
              )}
              {b.retouch_notes && (
                <div>
                  <span className="block text-xs text-[#777] uppercase tracking-wider mb-1">Retouch Notes</span>
                  <p className="text-[#444] leading-relaxed">{b.retouch_notes}</p>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="space-y-8">
          <section className="bg-[#fcfbf9] border border-[#111] p-6">
            <h3 className="font-serif text-xl text-[#111] mb-4">Client Info</h3>
            <div className="space-y-4">
              <div>
                <span className="block text-xs text-[#777] uppercase tracking-wider">Name</span>
                <span className="text-[#111] font-medium">{b.client_name}</span>
              </div>
              <div>
                <span className="block text-xs text-[#777] uppercase tracking-wider">Email</span>
                <span className="text-[#111] font-medium">{b.client_email}</span>
              </div>
              <div>
                <span className="block text-xs text-[#777] uppercase tracking-wider">Phone</span>
                <span className="text-[#111] font-medium">{b.client_phone}</span>
              </div>
              <div>
                <span className="block text-xs text-[#777] uppercase tracking-wider">Country</span>
                <span className="text-[#111] font-medium">{b.client_country}</span>
              </div>
              <div>
                <span className="block text-xs text-[#777] uppercase tracking-wider">Group Size</span>
                <span className="text-[#111] font-medium">{b.group_size} {b.group_size > 1 ? 'People' : 'Person'}</span>
              </div>
            </div>
          </section>

          <section className="bg-[#fcfbf9] border border-[#111] p-6">
            <h3 className="font-serif text-xl text-[#111] mb-4">Payment</h3>
            <div className="flex items-center justify-between">
              <span className="text-[#777] text-sm">Total</span>
              <span className="text-[#111] font-bold text-xl">${b.total_price}</span>
            </div>
            {b.booking_addons.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#e8e6e1] space-y-2">
                {b.booking_addons.map((ba, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#777]">{ba.addon?.name ?? 'Add-on'}</span>
                    <span className="text-[#111]">+${ba.price_snapshot}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {canEdit && (
            <section className="space-y-3">
              <button
                onClick={togglePayment}
                disabled={saving}
                className="w-full border border-[#111] bg-white py-3 font-medium text-[#111] hover:bg-[#111] hover:text-white transition-colors disabled:opacity-50"
              >
                {b.payment_confirmed ? 'Mark Payment Unpaid' : 'Mark Payment Confirmed'}
              </button>
              {b.status === 'pending_confirmation' && (
                <button
                  onClick={() => updateStatus('confirmed')}
                  disabled={saving}
                  className="w-full border border-[#111] bg-white py-3 font-medium text-[#111] hover:bg-[#111] hover:text-white transition-colors disabled:opacity-50"
                >
                  Confirm Booking
                </button>
              )}
              {b.status === 'confirmed' && (
                <button
                  onClick={() => updateStatus('completed')}
                  disabled={saving}
                  className="w-full border border-[#111] bg-white py-3 font-medium text-[#111] hover:bg-[#111] hover:text-white transition-colors disabled:opacity-50"
                >
                  Mark as Completed
                </button>
              )}
              {b.status !== 'cancelled' && b.status !== 'completed' && (
                <button
                  onClick={() => updateStatus('cancelled')}
                  disabled={saving}
                  className="w-full border border-[#ff4d94] text-[#ff4d94] py-3 font-medium hover:bg-[#ff4d94] hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel Booking
                </button>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
