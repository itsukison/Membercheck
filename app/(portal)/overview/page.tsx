'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, CalendarDays, ChevronLeft, ChevronRight, MapPin, Repeat, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomSelect } from '@/components/ui/custom-select';
import { CustomMultiSelect } from '@/components/ui/custom-multi-select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

type Member = {
  id: string;
  name: string;
  color: string;
};

type Location = { id: string; name: string };

type Event = {
  id: string;
  memberId: string;
  date: string;
  start: number; // minutes from midnight
  end: number;   // minutes from midnight
  title: string;
  type: 'availability' | 'booking';
  locationIds: string[];
  locationNames: string[];
  column?: number;
  totalColumns?: number;
  clientName?: string;
  reference?: string;
};

// Fixed palette — color hex → CSS classes
const PALETTE_MAP: Record<string, { bg: string; border: string; text: string; solidBg: string }> = {
  '#ff4d94': { bg: 'bg-[#ff4d94]/10', border: 'border-[#ff4d94]', text: 'text-[#ff4d94]',   solidBg: 'bg-[#ff4d94]' },
  '#3b82f6': { bg: 'bg-blue-500/10',   border: 'border-blue-500',   text: 'text-blue-700',    solidBg: 'bg-blue-500'   },
  '#10b981': { bg: 'bg-emerald-500/10',border: 'border-emerald-500',text: 'text-emerald-700', solidBg: 'bg-emerald-500'},
  '#f59e0b': { bg: 'bg-amber-500/10',  border: 'border-amber-500',  text: 'text-amber-700',   solidBg: 'bg-amber-500'  },
  '#8b5cf6': { bg: 'bg-violet-500/10', border: 'border-violet-500', text: 'text-violet-700',  solidBg: 'bg-violet-500' },
};
const PALETTE_COLORS = Object.keys(PALETTE_MAP);

function paletteFor(color: string) {
  return PALETTE_MAP[color] ?? PALETTE_MAP['#3b82f6'];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const START_MINUTE = 9 * 60;   // 540  — 09:00
const END_MINUTE   = 23 * 60;  // 1380 — 23:00
const HOURS = Array.from({ length: END_MINUTE / 60 - START_MINUTE / 60 + 1 }, (_, i) => i + START_MINUTE / 60);
// 30-min time options for modal selects (start 09:00 → 23:00, end 09:30 → 24:00)
const timeOptions = (fromMinute: number, toMinute: number, step = 30) => {
  const opts = [];
  for (let m = fromMinute; m <= toMinute; m += step) {
    const label = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    opts.push({ label, value: String(m) });
  }
  return opts;
};
const START_TIME_OPTIONS = timeOptions(START_MINUTE, END_MINUTE);
const END_TIME_OPTIONS   = timeOptions(START_MINUTE + 30, 1440);

const formatDate = (d: Date) => {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekDays = (date: Date) => {
  const d   = new Date(date);
  const day = d.getDay();
  const sun = new Date(d);
  sun.setDate(d.getDate() - day);
  return Array.from({ length: 7 }).map((_, i) => {
    const next = new Date(sun);
    next.setDate(sun.getDate() + i);
    return next;
  });
};

const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) days.push(new Date(year, month, -firstDay.getDay() + i + 1));
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
  for (let i = 1; i <= 42 - days.length; i++) days.push(new Date(year, month + 1, i));
  return days;
};

const formatWeekRange = (days: Date[]) => {
  const start     = days[0];
  const end       = days[6];
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth   = end.toLocaleDateString('en-US', { month: 'short' });
  if (startMonth === endMonth)
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
};

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth()    === d2.getMonth()    &&
  d1.getDate()     === d2.getDate();

export default function Overview() {
  const { member: currentMember } = useAuth();
  const [currentDate,   setCurrentDate]   = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [members,   setMembers]   = useState<Member[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [events,    setEvents]    = useState<Event[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [isCalendarOpen,       setIsCalendarOpen]       = useState(false);

  const memberDropdownRef = useRef<HTMLDivElement>(null);
  const calendarRef       = useRef<HTMLDivElement>(null);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    eventId?: string;
    memberId: string;
    date: Date;
    start: number;
    end: number;
    locationIds: string[];
    repeat: boolean;
    readOnly: boolean;
  }>({
    isOpen: false,
    memberId: '',
    date: new Date(),
    start: START_MINUTE,
    end: START_MINUTE + 60,
    locationIds: [],
    repeat: false,
    readOnly: false,
  });
  const [modalError,  setModalError]  = useState<string | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  const [resizing, setResizing] = useState<{ eventId: string; startY: number; originalEnd: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; eventId: string } | null>(null);

  const weekDays  = getWeekDays(currentDate);
  const monthDays = getMonthDays(calendarMonth.getFullYear(), calendarMonth.getMonth());

  // Fetch members (with color) & locations on mount
  useEffect(() => {
    (async () => {
      const [{ data: mData, error: mErr }, { data: lData, error: lErr }] = await Promise.all([
        supabase.from('members').select('id, name, color').order('created_at', { ascending: true }),
        supabase.from('locations').select('id, name').order('sort_order', { ascending: true }),
      ]);
      if (mErr || lErr) { setError(mErr?.message ?? lErr?.message ?? 'Failed to load.'); return; }
      setMembers((mData ?? []) as Member[]);
      setSelectedMembers((mData ?? []).map((m: { id: string }) => m.id));
      setLocations((lData ?? []) as Location[]);
    })();
  }, []);

  const loadEventsForWeek = useCallback(async () => {
    if (members.length === 0 || locations.length === 0) return;
    setLoading(true);
    const week      = getWeekDays(currentDate);
    const startDate = formatDate(week[0]);
    const endDate   = formatDate(week[6]);

    const [availRes, bookRes] = await Promise.all([
      supabase
        .from('availability_slots')
        .select('id, member_id, date, start_minutes, end_minutes, availability_slot_locations(location_id)')
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('bookings')
        .select('id, reference, assigned_member_id, date, start_minutes, end_minutes, location_id, client_name, status')
        .gte('date', startDate)
        .lte('date', endDate)
        .in('status', ['pending_confirmation', 'confirmed', 'pending_reschedule_confirmation']),
    ]);

    if (availRes.error || bookRes.error) {
      setError(availRes.error?.message ?? bookRes.error?.message ?? 'Failed to load.');
      setLoading(false);
      return;
    }

    const locMap = new Map(locations.map((l) => [l.id, l.name]));

    const availEvents: Event[] = (availRes.data ?? []).map((row: {
      id: string; member_id: string; date: string;
      start_minutes: number; end_minutes: number;
      availability_slot_locations: { location_id: string }[];
    }) => {
      const locIds = (row.availability_slot_locations ?? []).map((r) => r.location_id);
      return {
        id: row.id, memberId: row.member_id, date: row.date,
        start: row.start_minutes, end: row.end_minutes,
        title: 'Available', type: 'availability' as const,
        locationIds: locIds,
        locationNames: locIds.map((id) => locMap.get(id) ?? '').filter(Boolean),
      };
    });

    const bookingEvents: Event[] = (bookRes.data ?? [])
      .filter((b: { assigned_member_id: string | null }) => b.assigned_member_id !== null)
      .map((b: {
        id: string; reference: string; assigned_member_id: string; date: string;
        start_minutes: number; end_minutes: number; location_id: string; client_name: string;
      }) => ({
        id: `booking-${b.id}`,
        memberId: b.assigned_member_id,
        date: b.date,
        start: b.start_minutes,
        end: b.end_minutes,
        title: `Booking: ${b.reference}`,
        type: 'booking' as const,
        locationIds: [b.location_id],
        locationNames: [locMap.get(b.location_id) ?? ''],
        clientName: b.client_name,
        reference: b.reference,
      }));

    setEvents([...availEvents, ...bookingEvents]);
    setError(null);
    setLoading(false);
  }, [currentDate, members, locations]);

  useEffect(() => { loadEventsForWeek(); }, [loadEventsForWeek]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target as Node))
        setIsMemberDropdownOpen(false);
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node))
        setIsCalendarOpen(false);
      setContextMenu(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Resize — snap to 30-min increments
  useEffect(() => {
    if (!resizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY       = e.clientY - resizing.startY;
      const deltaMinutes = Math.round(deltaY / 30) * 30;
      setEvents((prev) =>
        prev.map((ev) => {
          if (ev.id !== resizing.eventId) return ev;
          const newEnd = Math.max(ev.start + 30, resizing.originalEnd + deltaMinutes);
          return { ...ev, end: Math.min(newEnd, 1440) };
        })
      );
    };
    const handleMouseUp = async () => {
      const ev = events.find((e) => e.id === resizing.eventId);
      setResizing(null);
      if (ev && ev.type === 'availability' && ev.memberId === currentMember?.id) {
        const { error } = await supabase
          .from('availability_slots')
          .update({ end_minutes: ev.end })
          .eq('id', ev.id);
        if (error) { setError(error.message); loadEventsForWeek(); }
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [resizing, events, currentMember, loadEventsForWeek]);

  const toggleMember = (id: string) =>
    setSelectedMembers((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);

  const getProcessedEvents = (dateStr: string) => {
    const dayEvents = events.filter((e) => e.date === dateStr && selectedMembers.includes(e.memberId));
    const availOnly = dayEvents.filter((e) => e.type === 'availability');
    const bookOnly  = dayEvents.filter((e) => e.type === 'booking');

    // Column-place only availability events
    const sorted  = [...availOnly].sort((a, b) => a.start - b.start);
    const columns: Event[][] = [];
    sorted.forEach((event) => {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        if (!columns[i].some((e) => e.start < event.end && e.end > event.start)) {
          columns[i].push(event); event.column = i; placed = true; break;
        }
      }
      if (!placed) { event.column = columns.length; columns.push([event]); }
    });
    const totalAvailCols = columns.length;
    sorted.forEach((e) => { e.totalColumns = totalAvailCols || 1; });

    // Booking events inherit the column of the matching availability from the same member
    bookOnly.forEach((event) => {
      const matchingAvail = sorted.find(
        (av) => av.memberId === event.memberId && av.start <= event.start && av.end >= event.end
      );
      event.column       = matchingAvail?.column       ?? 0;
      event.totalColumns = (matchingAvail?.totalColumns ?? totalAvailCols) || 1;
    });

    return [...sorted, ...bookOnly];
  };

  const fmtMin = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  const handleSlotClick = (date: Date, hourInt: number) => {
    if (!currentMember) return;
    const startM = hourInt * 60;
    setModalError(null);
    setModalState({
      isOpen: true,
      memberId: currentMember.id,
      date,
      start: startM,
      end: Math.min(startM + 60, 1440),
      locationIds: locations.map((l) => l.id),
      repeat: false,
      readOnly: false,
    });
  };

  const handleEventClick = (event: Event, date: Date) => {
    if (event.type === 'booking') return;
    setModalError(null);
    setModalState({
      isOpen: true,
      eventId: event.id,
      memberId: event.memberId,
      date,
      start: event.start,
      end: event.end,
      locationIds: event.locationIds,
      repeat: false,
      readOnly: event.memberId !== currentMember?.id,
    });
  };

  const insertAvailability = async (memberId: string, dateStr: string, startM: number, endM: number, locationIds: string[]) => {
    const { data, error: insErr } = await supabase
      .from('availability_slots')
      .insert({ member_id: memberId, date: dateStr, start_minutes: startM, end_minutes: endM })
      .select('id')
      .single();
    if (insErr || !data) throw new Error(insErr?.message ?? 'Insert failed');
    if (locationIds.length > 0) {
      const { error: juncErr } = await supabase
        .from('availability_slot_locations')
        .insert(locationIds.map((lid) => ({ availability_slot_id: data.id, location_id: lid })));
      if (juncErr) throw new Error(juncErr.message);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalState.readOnly) { setModalState({ ...modalState, isOpen: false }); return; }
    if (modalState.end <= modalState.start) { setModalError('End time must be after start time.'); return; }
    if (modalState.locationIds.length === 0) { setModalError('Please select at least one location.'); return; }
    setModalSaving(true);
    setModalError(null);
    try {
      if (modalState.eventId) {
        const { error: updErr } = await supabase
          .from('availability_slots')
          .update({ date: formatDate(modalState.date), start_minutes: modalState.start, end_minutes: modalState.end })
          .eq('id', modalState.eventId);
        if (updErr) throw new Error(updErr.message);
        const { error: delErr } = await supabase
          .from('availability_slot_locations').delete().eq('availability_slot_id', modalState.eventId);
        if (delErr) throw new Error(delErr.message);
        if (modalState.locationIds.length > 0) {
          const { error: insErr } = await supabase
            .from('availability_slot_locations')
            .insert(modalState.locationIds.map((lid) => ({ availability_slot_id: modalState.eventId!, location_id: lid })));
          if (insErr) throw new Error(insErr.message);
        }
      } else {
        await insertAvailability(modalState.memberId, formatDate(modalState.date), modalState.start, modalState.end, modalState.locationIds);
        if (modalState.repeat) {
          for (let i = 1; i <= 3; i++) {
            const nextDate = new Date(modalState.date);
            nextDate.setDate(nextDate.getDate() + i * 7);
            await insertAvailability(modalState.memberId, formatDate(nextDate), modalState.start, modalState.end, modalState.locationIds);
          }
        }
      }
      await loadEventsForWeek();
      setModalState({ ...modalState, isOpen: false });
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!modalState.eventId || modalState.readOnly) return;
    const { error: delErr } = await supabase.from('availability_slots').delete().eq('id', modalState.eventId);
    if (delErr) { setModalError(delErr.message); return; }
    await loadEventsForWeek();
    setModalState({ ...modalState, isOpen: false });
  };

  const handleDeleteFromContext = async (eventId: string) => {
    const ev = events.find((e) => e.id === eventId);
    setContextMenu(null);
    if (!ev || ev.type === 'booking' || ev.memberId !== currentMember?.id) return;
    const { error: delErr } = await supabase.from('availability_slots').delete().eq('id', eventId);
    if (delErr) { setError(delErr.message); return; }
    await loadEventsForWeek();
  };

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    const ev = events.find((x) => x.id === eventId);
    if (!ev || ev.type === 'booking' || ev.memberId !== currentMember?.id) { e.preventDefault(); return; }
    e.dataTransfer.setData('eventId', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, date: Date, hourInt: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    if (!eventId) return;
    const ev = events.find((x) => x.id === eventId);
    if (!ev || ev.type === 'booking' || ev.memberId !== currentMember?.id) return;
    const duration = ev.end - ev.start;
    const newStart = hourInt * 60;
    const newEnd   = Math.min(newStart + duration, 1440);
    const newDate  = formatDate(date);
    setEvents((prev) => prev.map((x) => (x.id === eventId ? { ...x, date: newDate, start: newStart, end: newEnd } : x)));
    const { error: updErr } = await supabase
      .from('availability_slots')
      .update({ date: newDate, start_minutes: newStart, end_minutes: newEnd })
      .eq('id', eventId);
    if (updErr) { setError(updErr.message); loadEventsForWeek(); }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-[#111] leading-tight">Team Overview</h1>
          <p className="text-[#777] mt-2">Click empty cells to add your availability. Drag or resize your own blocks.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full md:w-auto">
          {/* Date picker */}
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center space-x-3 px-4 py-2 w-full sm:w-auto bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:bg-[#fcfbf9] transition-colors"
            >
              <CalendarDays size={18} className="text-[#111]" />
              <span className="font-medium text-[#111] min-w-[160px] text-left">{formatWeekRange(weekDays)}</span>
              <ChevronDown size={16} className="text-[#111]" />
            </button>
            {isCalendarOpen && (
              <div className="absolute top-full left-0 mt-2 w-[calc(100vw-2rem)] max-w-72 bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] z-50 p-4">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="p-1 hover:bg-[#fcfbf9] rounded">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-medium text-[#111]">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="p-1 hover:bg-[#fcfbf9] rounded">
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#777] mb-2">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-sm">
                  {monthDays.map((d, i) => {
                    const isCurrentMonth = d.getMonth() === calendarMonth.getMonth();
                    const isSelected     = isSameDay(d, currentDate);
                    return (
                      <button
                        key={i}
                        onClick={() => { setCurrentDate(d); setIsCalendarOpen(false); }}
                        className={`p-2 flex items-center justify-center transition-colors
                          ${!isCurrentMonth ? 'text-[#ccc]' : 'text-[#111] hover:bg-[#fcfbf9]'}
                          ${isSelected ? 'bg-[#111] text-white hover:bg-[#111]' : ''}`}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Member filter */}
          <div className="relative" ref={memberDropdownRef}>
            <button
              onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
              className="flex items-center justify-between w-full sm:w-64 px-4 py-2 bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:bg-[#fcfbf9] transition-colors"
            >
              <span className="font-medium text-[#111]">
                {selectedMembers.length === members.length ? 'All Members' : `${selectedMembers.length} Selected`}
              </span>
              <ChevronDown size={16} className="text-[#111]" />
            </button>
            {isMemberDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-full sm:w-64 bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] z-50 py-2">
                <div className="px-3 pb-2 mb-2 border-b border-[#e8e6e1] text-xs font-medium text-[#777] uppercase tracking-wider">Filter by Member</div>
                {members.map((m) => {
                  const isSelected = selectedMembers.includes(m.id);
                  return (
                    <button key={m.id} onClick={() => toggleMember(m.id)} className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-[#fcfbf9] transition-colors text-left">
                      <div className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#111] border-[#111]' : 'border-[#111] bg-white'}`}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                        <span className="text-sm font-medium text-[#111]">{m.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {error && <div className="border border-[#ff4d94] bg-[#ff4d94]/5 text-[#ff4d94] p-4">{error}</div>}

      <div className="bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 z-40 flex items-center justify-center pointer-events-none">
            <div className="text-[#777] font-medium">Loading…</div>
          </div>
        )}
        <div className="overflow-x-auto">
          <div className="min-w-[900px] flex">
            {/* Time gutter */}
            <div className="w-20 border-r border-[#111] bg-[#fcfbf9] shrink-0">
              <div className="h-12 border-b border-[#111]" />
              {HOURS.map((hour) => (
                <div key={hour} className="h-[60px] border-b border-[#e8e6e1] relative">
                  <span className="absolute -top-2.5 right-2 text-xs text-[#777] bg-[#fcfbf9] px-1">
                    {String(hour).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="flex-1 flex">
              {weekDays.map((dayDate, index) => {
                const dateStr  = formatDate(dayDate);
                const dayEvents = getProcessedEvents(dateStr);
                const isToday  = isSameDay(dayDate, new Date());

                return (
                  <div key={dateStr} className="flex-1 border-r border-[#e8e6e1] last:border-r-0 relative min-w-[120px]">
                    <div className={`h-12 border-b border-[#111] flex flex-col items-center justify-center ${isToday ? 'bg-[#111] text-white' : 'bg-[#fcfbf9] text-[#111]'}`}>
                      <span className="text-xs font-medium uppercase tracking-wider">{DAYS[index]}</span>
                      <span className="text-sm font-bold">{dayDate.getDate()}</span>
                    </div>

                    {/* Drop zones — one per hour row */}
                    <div className="absolute inset-0 top-12 bottom-0 flex flex-col z-0">
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          className="flex-1 border-b border-[#e8e6e1] hover:bg-[#111]/5 cursor-pointer transition-colors"
                          onClick={() => handleSlotClick(dayDate, hour)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, dayDate, hour)}
                        />
                      ))}
                    </div>

                    {/* Events layer */}
                    <div className="absolute inset-0 top-12 bottom-0 pointer-events-none z-10">
                      {dayEvents.map((event) => {
                        const m = members.find((x) => x.id === event.memberId);
                        if (!m) return null;
                        const palette    = paletteFor(m.color);
                        const top        = event.start - START_MINUTE; // px = minutes offset
                        const height     = event.end - event.start;
                        const width      = 100 / (event.totalColumns || 1);
                        const left       = (event.column || 0) * width;
                        const isBooking  = event.type === 'booking';
                        const isOwn      = event.memberId === currentMember?.id && !isBooking;

                        return (
                          <div
                            key={event.id}
                            draggable={isOwn && !resizing}
                            onDragStart={(e) => handleDragStart(e, event.id)}
                            onClick={(e) => { e.stopPropagation(); handleEventClick(event, dayDate); }}
                            onContextMenu={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              if (isOwn) setContextMenu({ x: e.clientX, y: e.clientY, eventId: event.id });
                            }}
                            className={`absolute p-1.5 border-l-4 overflow-hidden transition-shadow pointer-events-auto
                              ${isOwn && !resizing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                              ${isBooking ? `${palette.solidBg} hover:z-30 hover:shadow-md` : `${palette.bg} hover:z-20 hover:shadow-md`}
                              ${palette.border}
                            `}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              left: `${left}%`,
                              marginLeft: event.column && event.column > 0 ? '2px' : '0',
                              width: event.column && event.column > 0 ? `calc(${width}% - 2px)` : `${width}%`,
                              zIndex: isBooking ? 20 : 10,
                            }}
                            title={`${m.name}: ${event.title} (${fmtMin(event.start)} - ${fmtMin(event.end)})`}
                          >
                            <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isBooking ? 'text-white' : palette.text}`}>
                              {m.name.split(' ')[0]}
                            </div>
                            <div className={`text-xs font-medium leading-tight ${isBooking ? 'text-white' : palette.text}`}>
                              {event.title}
                            </div>
                            {event.locationNames.length > 0 && (
                              <div className={`text-[10px] mt-1 opacity-90 flex items-center space-x-1 ${isBooking ? 'text-white' : palette.text}`}>
                                <MapPin size={10} className="shrink-0" />
                                <span className="truncate">{event.locationNames.join(', ')}</span>
                              </div>
                            )}
                            {isOwn && (
                              <div
                                className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-black/20 z-30"
                                onMouseDown={(e) => {
                                  e.stopPropagation(); e.preventDefault();
                                  setResizing({ eventId: event.id, startY: e.clientY, originalEnd: event.end });
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {contextMenu && (
          <div
            className="fixed z-[100] bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] py-1 w-32"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              className="w-full text-left px-4 py-2 text-sm text-[#ff4d94] hover:bg-[#fcfbf9] font-medium"
              onClick={() => handleDeleteFromContext(contextMenu.eventId)}
            >
              Delete Block
            </button>
          </div>
        )}
      </div>

      {/* Availability modal */}
      <AnimatePresence>
        {modalState.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white border border-[#111] shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setModalState({ ...modalState, isOpen: false })} className="absolute top-4 right-4 text-[#777] hover:text-[#111]">
                <X size={20} />
              </button>
              <h2 className="font-serif text-2xl text-[#111] mb-6">
                {modalState.readOnly ? 'View Availability' : modalState.eventId ? 'Edit Availability' : 'Add Availability'}
              </h2>
              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">Member</label>
                  <div className="w-full border border-[#111] p-2 bg-[#fcfbf9] text-[#111] text-sm">
                    {members.find((m) => m.id === modalState.memberId)?.name ?? '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">Location(s)</label>
                  <CustomMultiSelect
                    value={modalState.locationIds}
                    onChange={(val) => setModalState({ ...modalState, locationIds: val })}
                    options={locations.map((l) => ({ label: l.name, value: l.id }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">Start Time</label>
                    <CustomSelect
                      value={String(modalState.start)}
                      onChange={(val: string) => setModalState({ ...modalState, start: parseInt(val) })}
                      options={START_TIME_OPTIONS}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">End Time</label>
                    <CustomSelect
                      value={String(modalState.end)}
                      onChange={(val: string) => setModalState({ ...modalState, end: parseInt(val) })}
                      options={END_TIME_OPTIONS}
                    />
                  </div>
                </div>

                {!modalState.eventId && !modalState.readOnly && (
                  <div className="flex items-center space-x-2 pt-2">
                    <input type="checkbox" id="repeat" checked={modalState.repeat}
                      onChange={(e) => setModalState({ ...modalState, repeat: e.target.checked })}
                      className="w-4 h-4 accent-[#111]" />
                    <label htmlFor="repeat" className="text-sm font-medium text-[#111] flex items-center space-x-1">
                      <Repeat size={14} className="text-[#777]" />
                      <span>Repeat for next 3 weeks</span>
                    </label>
                  </div>
                )}

                {modalError && (
                  <div className="text-sm text-[#ff4d94] border border-[#ff4d94] p-3 bg-[#ff4d94]/5">{modalError}</div>
                )}

                <div className="pt-6 flex justify-between items-center">
                  {modalState.eventId && !modalState.readOnly ? (
                    <button type="button" onClick={handleDeleteEvent} className="text-[#ff4d94] font-medium text-sm hover:underline">Delete</button>
                  ) : <div />}
                  <div className="flex space-x-3">
                    <button type="button" onClick={() => setModalState({ ...modalState, isOpen: false })}
                      className="px-4 py-2 border border-[#111] text-[#111] hover:bg-[#fcfbf9]">
                      {modalState.readOnly ? 'Close' : 'Cancel'}
                    </button>
                    {!modalState.readOnly && (
                      <button type="submit" disabled={modalSaving}
                        className="px-6 py-2 bg-[#111] text-white hover:bg-[#ff4d94] transition-colors disabled:opacity-50">
                        {modalSaving ? 'Saving…' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
