'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, TrendingUp, CreditCard, CheckCircle, Activity, ChevronDown, ChevronUp } from 'lucide-react';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type UserRow = {
  user_id: string;
  email: string;
  name: string;
  signed_up_at: string;
  last_seen_at: string;
  total_bookings: number;
  paid_bookings: number;
  latest_booking_status: string | null;
  max_step_reached: number | null;
  has_payment_attempt: boolean;
};

type StepRow = {
  step: number;
  step_name: string;
  unique_users: number;
};

type EventRow = {
  id: string;
  tourist_id: string;
  email: string;
  name: string;
  event_type: string;
  properties: Record<string, unknown>;
  created_at: string;
};

type FunnelMetric = {
  label: string;
  count: number;
  icon: React.ElementType;
  description: string;
};

const STEP_LABELS: Record<number, string> = {
  0: 'Auth',
  1: 'Plan',
  2: 'Location',
  3: 'Date & Time',
  4: 'Group Size',
  5: 'Add-ons',
  6: 'Client Info',
  7: 'Review',
};

function getDropoffStage(user: UserRow): { label: string; color: string } {
  if (user.paid_bookings > 0) return { label: 'Paid', color: 'bg-[#10b981]/10 text-[#10b981]' };
  if (user.has_payment_attempt) return { label: 'Abandoned at Stripe', color: 'bg-[#f59e0b]/10 text-[#f59e0b]' };
  if (user.total_bookings > 0) return { label: 'Booked, not paid', color: 'bg-[#3b82f6]/10 text-[#3b82f6]' };
  if (user.max_step_reached !== null) {
    return { label: `Stopped at: ${STEP_LABELS[user.max_step_reached] ?? `Step ${user.max_step_reached}`}`, color: 'bg-[#777]/10 text-[#777]' };
  }
  const returnedAfterSignup = new Date(user.last_seen_at).getTime() - new Date(user.signed_up_at).getTime() > 30000;
  if (returnedAfterSignup) return { label: 'Signed up, returned', color: 'bg-[#777]/10 text-[#777]' };
  return { label: 'Signed up only', color: 'bg-[#e8e6e1] text-[#777]' };
}

function describeEvent(event: EventRow): string {
  if (event.event_type === 'booking_step_entered') {
    const step = event.properties.step as number;
    const name = STEP_LABELS[step] ?? `Step ${step}`;
    return `Reached booking step: ${name}`;
  }
  if (event.event_type === 'payment_initiated') {
    const amount = event.properties.amount as number;
    return `Initiated payment — $${amount}`;
  }
  if (event.event_type === 'payment_cancelled') return 'Cancelled at Stripe checkout';
  if (event.event_type === 'payment_success') return 'Payment completed';
  return event.event_type.replace(/_/g, ' ');
}

export default function AnalyticsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, stepsRes, eventsRes] = await Promise.all([
          supabase.rpc('get_analytics_users'),
          supabase.rpc('get_step_funnel'),
          supabase.rpc('get_recent_events', { p_limit: 30 }),
        ]);

        if (usersRes.error) throw new Error(usersRes.error.message);
        if (stepsRes.error) throw new Error(stepsRes.error.message);
        if (eventsRes.error) throw new Error(eventsRes.error.message);

        setUsers((usersRes.data as UserRow[]) ?? []);
        setSteps((stepsRes.data as StepRow[]) ?? []);
        setEvents((eventsRes.data as EventRow[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalSignups = users.length;
  const returnedUsers = users.filter(
    (u) =>
      new Date(u.last_seen_at).getTime() - new Date(u.signed_up_at).getTime() > 30000 ||
      u.total_bookings > 0
  ).length;
  const startedBooking = users.filter((u) => u.total_bookings > 0).length;
  const reachedPayment = users.filter((u) => u.has_payment_attempt).length;
  const completedPayment = users.filter((u) => u.paid_bookings > 0).length;

  const funnelMetrics: FunnelMetric[] = [
    { label: 'Total Signups', count: totalSignups, icon: Users, description: 'Accounts created' },
    { label: 'Returned', count: returnedUsers, icon: TrendingUp, description: 'Came back after signup' },
    { label: 'Reached Payment', count: reachedPayment, icon: CreditCard, description: 'Got to Stripe checkout' },
    { label: 'Completed', count: completedPayment, icon: CheckCircle, description: 'Successfully paid' },
  ];

  const maxStepUsers = steps.length > 0 ? Math.max(...steps.map((s) => Number(s.unique_users))) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#777] font-medium text-sm">Loading analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-[#ff4d94] bg-[#ff4d94]/5 rounded-sm p-4">
        <p className="text-sm text-[#ff4d94] font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl text-[#111]">Analytics</h1>
        <p className="text-[#777] text-sm mt-1">Conversion funnel and user activity insights.</p>
      </div>

      {/* Funnel Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {funnelMetrics.map((metric, i) => {
          const Icon = metric.icon;
          const pct = totalSignups > 0 ? Math.round((metric.count / totalSignups) * 100) : 0;
          return (
            <div key={metric.label} className="bg-white border border-[#e8e6e1] rounded-sm p-5 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
              <div className="flex items-start justify-between mb-3">
                <Icon size={16} strokeWidth={1.5} className="text-[#777] mt-0.5" />
                {i > 0 && (
                  <span className="text-xs font-medium text-[#777]">{pct}%</span>
                )}
              </div>
              <p className="text-3xl font-bold text-[#111] tabular-nums">{metric.count}</p>
              <p className="text-xs font-semibold text-[#111] mt-1">{metric.label}</p>
              <p className="text-xs text-[#777] mt-0.5">{metric.description}</p>
            </div>
          );
        })}
      </div>

      {/* Booking Started card (not in the 4-up grid) */}
      <div className="bg-white border border-[#e8e6e1] rounded-sm p-5 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex items-center gap-6">
        <div>
          <p className="text-xs text-[#777] uppercase tracking-widest font-medium">Signup → Booking</p>
          <p className="text-2xl font-bold text-[#111] tabular-nums mt-1">
            {startedBooking} / {totalSignups}
          </p>
          <p className="text-xs text-[#777] mt-0.5">users who created at least one booking</p>
        </div>
        <div className="flex-1 bg-[#e8e6e1] rounded-full h-2 max-w-xs">
          <div
            className="bg-[#111] h-2 rounded-full transition-all"
            style={{ width: totalSignups > 0 ? `${(startedBooking / totalSignups) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-lg font-bold text-[#111] tabular-nums">
          {totalSignups > 0 ? Math.round((startedBooking / totalSignups) * 100) : 0}%
        </span>
      </div>

      {/* Step Funnel */}
      <div className="bg-white border border-[#e8e6e1] rounded-sm shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
        <div className="px-6 py-5 border-b border-[#e8e6e1] flex items-center gap-2">
          <Activity size={16} strokeWidth={1.5} className="text-[#777]" />
          <h2 className="font-semibold text-sm text-[#111]">Booking Step Funnel</h2>
          {steps.length === 0 && (
            <span className="ml-auto text-xs text-[#777]">No step events yet — tracking begins on next user visit.</span>
          )}
        </div>
        <div className="p-6 space-y-3">
          {steps.length === 0 ? (
            Object.entries(STEP_LABELS).map(([step, label]) => (
              <div key={step} className="flex items-center gap-3">
                <span className="text-xs text-[#777] w-24 flex-shrink-0">{label}</span>
                <div className="flex-1 bg-[#e8e6e1] rounded-full h-2">
                  <div className="bg-[#e8e6e1] h-2 rounded-full w-0" />
                </div>
                <span className="text-xs text-[#777] w-6 text-right tabular-nums">—</span>
              </div>
            ))
          ) : (
            steps.map((s) => {
              const pct = maxStepUsers > 0 ? (Number(s.unique_users) / maxStepUsers) * 100 : 0;
              return (
                <div key={s.step} className="flex items-center gap-3">
                  <span className="text-xs text-[#777] w-24 flex-shrink-0">
                    {STEP_LABELS[s.step] ?? s.step_name}
                  </span>
                  <div className="flex-1 bg-[#e8e6e1] rounded-full h-2">
                    <div
                      className="bg-[#111] h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[#111] w-6 text-right tabular-nums">
                    {s.unique_users}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* User Journey Table */}
      <div className="bg-white border border-[#e8e6e1] rounded-sm shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
        <div className="px-6 py-5 border-b border-[#e8e6e1]">
          <h2 className="font-semibold text-sm text-[#111]">User Journeys</h2>
          <p className="text-xs text-[#777] mt-0.5">{users.length} accounts · click a row to expand</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8e6e1] bg-[#fcfbf9]">
                <th className="px-6 py-3 text-left text-xs font-medium text-[#777] uppercase tracking-widest whitespace-nowrap">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#777] uppercase tracking-widest whitespace-nowrap">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#777] uppercase tracking-widest whitespace-nowrap">Signed Up</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#777] uppercase tracking-widest whitespace-nowrap">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#777] uppercase tracking-widest whitespace-nowrap">Stage</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const stage = getDropoffStage(user);
                const isExpanded = expandedUser === user.user_id;
                return (
                  <React.Fragment key={user.user_id}>
                    <tr
                      onClick={() => setExpandedUser(isExpanded ? null : user.user_id)}
                      className="border-b border-[#e8e6e1] hover:bg-[#fcfbf9] cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-[#111] whitespace-nowrap">
                        {user.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-[#777] whitespace-nowrap text-xs">{user.email}</td>
                      <td className="px-6 py-4 text-[#777] whitespace-nowrap text-xs">
                        {formatDate(user.signed_up_at)}
                      </td>
                      <td className="px-6 py-4 text-[#111] tabular-nums whitespace-nowrap text-xs">
                        {Number(user.total_bookings)} total · {Number(user.paid_bookings)} paid
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stage.color}`}>
                          {stage.label}
                        </span>
                      </td>
                      <td className="px-2 py-4 text-[#777]">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-[#e8e6e1] bg-[#fcfbf9]">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <p className="text-[#777] uppercase tracking-widest font-medium mb-1">Last Active</p>
                              <p className="text-[#111] font-medium">
                                {timeAgo(user.last_seen_at)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[#777] uppercase tracking-widest font-medium mb-1">Max Step Reached</p>
                              <p className="text-[#111] font-medium">
                                {user.max_step_reached !== null
                                  ? `${STEP_LABELS[user.max_step_reached] ?? `Step ${user.max_step_reached}`}`
                                  : 'No step data yet'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[#777] uppercase tracking-widest font-medium mb-1">Booking Status</p>
                              <p className="text-[#111] font-medium capitalize">
                                {user.latest_booking_status?.replace(/_/g, ' ') ?? 'No bookings'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[#777] uppercase tracking-widest font-medium mb-1">Reached Stripe</p>
                              <p className="text-[#111] font-medium">
                                {user.has_payment_attempt ? 'Yes' : 'No'}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Events Feed */}
      <div className="bg-white border border-[#e8e6e1] rounded-sm shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
        <div className="px-6 py-5 border-b border-[#e8e6e1] flex items-center gap-2">
          <Activity size={16} strokeWidth={1.5} className="text-[#777]" />
          <h2 className="font-semibold text-sm text-[#111]">Recent Activity</h2>
          <span className="ml-auto text-xs text-[#777]">Latest 30 events</span>
        </div>
        {events.length === 0 ? (
          <div className="px-6 py-8 text-center text-[#777] text-sm">
            No events tracked yet. Events will appear here as users move through the booking flow.
          </div>
        ) : (
          <div className="divide-y divide-[#e8e6e1]">
            {events.map((event) => (
              <div key={event.id} className="px-6 py-3 flex items-center gap-4 hover:bg-[#fcfbf9] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#111] font-medium truncate">{event.name || event.email}</p>
                  <p className="text-xs text-[#777] mt-0.5">{describeEvent(event)}</p>
                </div>
                <p className="text-xs text-[#777] flex-shrink-0 whitespace-nowrap">
                  {timeAgo(event.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
