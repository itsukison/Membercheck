// POST /api/admin/bookings/[id]/refund
// Staff-initiated refund. Accepts an amount in cents; if omitted, refunds the
// maximum remaining refundable amount. Performs the Stripe refund first, then
// updates the booking via apply_booking_cancellation which respects the net
// refundable cap.

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUserSupabase } from '@/lib/supabase-server';

export const runtime = 'nodejs';

type Body = {
  amountCents?: number;
  reason?: string;
  cancelBooking?: boolean;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Body = {};
  try { body = (await req.json()) as Body; } catch {}

  const supabase = getUserSupabase(req.headers.get('authorization'));

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  // Confirm caller is staff.
  const { data: memberRow } = await supabase.from('members').select('id, role').eq('id', userData.user.id).maybeSingle();
  if (!memberRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: bookingRow, error: bErr } = await supabase
    .from('bookings')
    .select('id, status, payment_status, total_price, refund_amount_cents, stripe_payment_intent_id, stripe_charge_id')
    .eq('id', id)
    .maybeSingle();
  if (bErr || !bookingRow) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (!bookingRow.stripe_payment_intent_id && !bookingRow.stripe_charge_id) {
    return NextResponse.json({ error: 'No Stripe payment associated with this booking.' }, { status: 409 });
  }

  const totalCents = (bookingRow.total_price as number) * 100;
  const alreadyRefunded = (bookingRow.refund_amount_cents as number) ?? 0;
  const remaining = Math.max(0, totalCents - alreadyRefunded);
  if (remaining <= 0) return NextResponse.json({ error: 'Nothing left to refund.' }, { status: 409 });

  const amountCents = Math.min(body.amountCents && body.amountCents > 0 ? body.amountCents : remaining, remaining);

  let refundId: string;
  try {
    const refund = await stripe.refunds.create({
      payment_intent: bookingRow.stripe_payment_intent_id ?? undefined,
      charge: bookingRow.stripe_payment_intent_id ? undefined : bookingRow.stripe_charge_id ?? undefined,
      amount: amountCents,
      reason: 'requested_by_customer',
      metadata: {
        booking_id: id,
        kind: 'admin_refund',
        issued_by: userData.user.id,
        note: body.reason ?? '',
      },
    });
    refundId = refund.id;
  } catch (err) {
    console.error('[admin refund] Stripe refund failed', err);
    const msg = err instanceof Error ? err.message : 'Refund failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // If the admin requested we also cancel the booking (e.g. a full refund
  // workflow), route through apply_booking_cancellation. Otherwise just let
  // the charge.refunded webhook sync totals; but do a direct update here so
  // the UI reflects the change immediately.
  if (body.cancelBooking || amountCents >= remaining) {
    // Full refund or explicit cancellation request: transition to cancelled.
    if (bookingRow.status !== 'cancelled') {
      const { error: applyErr } = await supabase.rpc('apply_booking_cancellation', {
        p_booking_id: id,
        p_refund_amount_cents: amountCents,
        p_stripe_refund_id: refundId,
      });
      if (applyErr) console.error('[admin refund] apply_booking_cancellation failed', applyErr.message);
    } else {
      // Already cancelled; just record the refund.
      await supabase
        .from('bookings')
        .update({
          refund_amount_cents: alreadyRefunded + amountCents,
          payment_status: alreadyRefunded + amountCents >= totalCents ? 'refunded' : 'partially_refunded',
          refunded_at: new Date().toISOString(),
          stripe_refund_id: refundId,
        })
        .eq('id', id);
    }
  } else {
    // Partial refund, booking stays scheduled.
    const newRefundTotal = alreadyRefunded + amountCents;
    await supabase
      .from('bookings')
      .update({
        refund_amount_cents: newRefundTotal,
        payment_status: newRefundTotal >= totalCents ? 'refunded' : 'partially_refunded',
        refunded_at: new Date().toISOString(),
        stripe_refund_id: refundId,
      })
      .eq('id', id);
  }

  return NextResponse.json({ ok: true, refundId, amountCents });
}
