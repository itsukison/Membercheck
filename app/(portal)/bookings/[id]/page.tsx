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
  start_minutes: number;
  end_minutes: number;
  extra_duration_minutes: number;
  group_size: number;
  status: string;
  payment_confirmed: boolean;
  payment_status: string;
  total_price: number;
  refund_amount_cents: number;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_refund_id: string | null;
  refunded_at: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  plan: { name: string; duration_minutes: number } | null;
  location: { name: string } | null;
  assigned_member: { id: string; name: string } | null;
  booking_addons: { price_snapshot: number; addon: { name: string } | null }[];
};

async function authedFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(input, { ...init, headers });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function statusLabel(s: string) {
  if (s === 'pending_confirmation') return 'Pending';
  if (s === 'pending_payment') return 'Awaiting Payment';
  if (s === 'pending_reschedule_confirmation') return 'Reschedule Pending';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function paymentStatusLabel(p: string) {
  switch (p) {
    case 'paid': return 'Paid';
    case 'refunded': return 'Refunded';
    case 'partially_refunded': return 'Partially Refunded';
    case 'failed': return 'Failed';
    case 'disputed': return 'Disputed';
    case 'pending':
    default: return 'Unpaid';
  }
}

function paymentStatusTone(p: string) {
  if (p === 'paid') return 'bg-green-100 text-green-800 border border-green-300';
  if (p === 'refunded' || p === 'partially_refunded') return 'bg-blue-100 text-blue-800 border border-blue-300';
  if (p === 'disputed') return 'bg-red-100 text-red-800 border border-red-300';
  return 'bg-[#fcfbf9] text-[#777] border border-[#e8e6e1]';
}

export default function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { member } = useAuth();
  const [b, setB] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundCancelBooking, setRefundCancelBooking] = useState(true);
  const [refundBusy, setRefundBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, reference, client_name, client_email, client_phone, client_country,
        special_requests, retouch_notes, date, start_minutes, end_minutes,
        extra_duration_minutes, group_size, status, payment_confirmed, payment_status,
        total_price, refund_amount_cents, stripe_payment_intent_id, stripe_charge_id,
        stripe_refund_id, refunded_at, cancelled_at, cancelled_reason,
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

  const submitRefund = async () => {
    if (!b) return;
    const amountCents = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined;
    if (refundAmount && (!amountCents || amountCents <= 0)) {
      setError('Refund amount must be a positive number.');
      return;
    }
    setRefundBusy(true);
    setError(null);
    try {
      const res = await authedFetch(`/api/admin/bookings/${b.id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amountCents, reason: refundReason, cancelBooking: refundCancelBooking }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        setError(payload.error ?? 'Refund failed.');
        return;
      }
      setRefundOpen(false);
      setRefundAmount('');
      setRefundReason('');
      await load();
    } finally {
      setRefundBusy(false);
    }
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
                  <span>{`${String(Math.floor(b.start_minutes/60)).padStart(2,'0')}:${String(b.start_minutes%60).padStart(2,'0')}`} - {`${String(Math.floor(b.end_minutes/60)).padStart(2,'0')}:${String(b.end_minutes%60).padStart(2,'0')}`} ({durationLabel})</span>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-[#111]">Payment</h3>
              <span className={`px-2 py-1 text-xs font-medium ${paymentStatusTone(b.payment_status)}`}>
                {paymentStatusLabel(b.payment_status)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#777] text-sm">Total Charged</span>
              <span className="text-[#111] font-bold text-xl">${b.total_price}</span>
            </div>
            {b.refund_amount_cents > 0 && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-[#777] text-sm">Refunded</span>
                <span className="text-blue-700 font-medium">-${(b.refund_amount_cents / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e8e6e1]">
              <span className="text-[#777] text-sm">Net</span>
              <span className="text-[#111] font-bold">${(b.total_price - b.refund_amount_cents / 100).toFixed(2)}</span>
            </div>

            {b.booking_addons.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#e8e6e1] space-y-2">
                <span className="block text-xs text-[#777] uppercase tracking-wider">Add-ons</span>
                {b.booking_addons.map((ba, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#777]">{ba.addon?.name ?? 'Add-on'}</span>
                    <span className="text-[#111]">+${ba.price_snapshot}</span>
                  </div>
                ))}
              </div>
            )}

            {(b.stripe_payment_intent_id || b.stripe_charge_id || b.stripe_refund_id) && (
              <div className="mt-4 pt-4 border-t border-[#e8e6e1] space-y-2 text-[11px] font-mono text-[#777] break-all">
                {b.stripe_payment_intent_id && (
                  <div><span className="block text-[#aaa] uppercase">Payment Intent</span>{b.stripe_payment_intent_id}</div>
                )}
                {b.stripe_charge_id && (
                  <div><span className="block text-[#aaa] uppercase">Charge</span>{b.stripe_charge_id}</div>
                )}
                {b.stripe_refund_id && (
                  <div><span className="block text-[#aaa] uppercase">Last Refund</span>{b.stripe_refund_id}</div>
                )}
              </div>
            )}
          </section>

          {canEdit && b.payment_status === 'paid' && b.status !== 'cancelled' && (
            <section>
              {!refundOpen ? (
                <button
                  onClick={() => { setRefundOpen(true); setRefundCancelBooking(true); setRefundAmount(''); }}
                  className="w-full border border-[#ff4d94] text-[#ff4d94] py-3 font-medium hover:bg-[#ff4d94] hover:text-white transition-colors"
                >
                  Issue Refund
                </button>
              ) : (
                <div className="border border-[#111] bg-white p-5 space-y-4">
                  <div>
                    <label className="block text-xs text-[#777] uppercase tracking-wider mb-2">Amount (USD, leave empty for full remaining)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={`Remaining: $${(b.total_price - b.refund_amount_cents / 100).toFixed(2)}`}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full border border-[#e8e6e1] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#777] uppercase tracking-wider mb-2">Reason (optional)</label>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full border border-[#e8e6e1] px-3 py-2 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[#444]">
                    <input
                      type="checkbox"
                      checked={refundCancelBooking}
                      onChange={(e) => setRefundCancelBooking(e.target.checked)}
                    />
                    <span>Also cancel this booking</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={submitRefund}
                      disabled={refundBusy}
                      className="flex-1 bg-[#111] text-white py-2 text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
                    >
                      {refundBusy ? 'Processing…' : 'Issue Refund'}
                    </button>
                    <button
                      onClick={() => { setRefundOpen(false); setRefundAmount(''); setRefundReason(''); setError(null); }}
                      className="flex-1 border border-[#111] text-[#111] py-2 text-sm font-medium hover:bg-[#111] hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[11px] text-[#777] leading-relaxed">Refund is issued to the customer&apos;s original payment method and typically settles within 5–10 business days.</p>
                </div>
              )}
            </section>
          )}

          {canEdit && (
            <section className="space-y-3">
              {b.status === 'pending_reschedule_confirmation' && (
                <div className="border border-violet-300 bg-violet-50 p-3 text-sm text-violet-800 font-medium mb-1">
                  ↻ Customer rescheduled — please review the new date and confirm.
                </div>
              )}
              {(b.status === 'pending_confirmation' || b.status === 'pending_reschedule_confirmation') && (
                <button
                  onClick={() => updateStatus('confirmed')}
                  disabled={saving}
                  className="w-full border border-[#111] bg-white py-3 font-medium text-[#111] hover:bg-[#111] hover:text-white transition-colors disabled:opacity-50"
                >
                  {b.status === 'pending_reschedule_confirmation' ? 'Confirm Reschedule' : 'Confirm Booking'}
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
              {b.status !== 'cancelled' && b.status !== 'completed' && b.payment_status !== 'paid' && (
                <button
                  onClick={() => updateStatus('cancelled')}
                  disabled={saving}
                  className="w-full border border-[#ff4d94] text-[#ff4d94] py-3 font-medium hover:bg-[#ff4d94] hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel Booking
                </button>
              )}
              {b.status !== 'cancelled' && b.status !== 'completed' && b.payment_status === 'paid' && (
                <p className="text-xs text-[#777] text-center">To cancel a paid booking, use &ldquo;Issue Refund&rdquo; above and select &ldquo;Also cancel this booking&rdquo;.</p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
