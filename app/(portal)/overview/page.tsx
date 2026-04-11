'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, CalendarDays, ChevronLeft, ChevronRight, MapPin, Repeat, X, User, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomSelect } from '@/components/ui/custom-select';

import { CustomMultiSelect } from '@/components/ui/custom-multi-select';

type Member = {
  id: string;
  name: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  solidBgClass: string;
};

type Event = {
  id: string;
  memberId: string;
  date: string;
  start: number;
  end: number;
  title: string;
  type: 'availability' | 'booking';
  location?: string[];
  column?: number;
  totalColumns?: number;
  clientName?: string;
  whatsappStatus?: 'Pending' | 'Contacted' | 'Completed';
};

const MEMBERS: Member[] = [
  { id: 'sarah', name: 'Sarah Jenkins', color: '#ff4d94', bgClass: 'bg-[#ff4d94]/10', borderClass: 'border-[#ff4d94]', textClass: 'text-[#ff4d94]', solidBgClass: 'bg-[#ff4d94]' },
  { id: 'david', name: 'David Kim', color: '#3b82f6', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500', textClass: 'text-blue-700', solidBgClass: 'bg-blue-500' },
  { id: 'elena', name: 'Elena Rossi', color: '#10b981', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500', textClass: 'text-emerald-700', solidBgClass: 'bg-emerald-500' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const START_HOUR = 9;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

// Date Helpers
const formatDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekDays = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const sunday = new Date(d);
  sunday.setDate(diff);
  return Array.from({ length: 7 }).map((_, i) => {
    const nextDay = new Date(sunday);
    nextDay.setDate(sunday.getDate() + i);
    return nextDay;
  });
};

const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(new Date(year, month, -firstDay.getDay() + i + 1));
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
};

const formatWeekRange = (days: Date[]) => {
  const start = days[0];
  const end = days[6];
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
};

const isSameDay = (d1: Date, d2: Date) => 
  d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

export default function Overview() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedMembers, setSelectedMembers] = useState<string[]>(MEMBERS.map(m => m.id));
  
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const memberDropdownRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Initialize events based on the current week so they always show up
  const [events, setEvents] = useState<Event[]>(() => {
    const week = getWeekDays(new Date());
    return [
      { id: '1', memberId: 'sarah', date: formatDate(week[1]), start: 10, end: 14, title: 'Available', type: 'availability', location: ['Seoul Studio'] },
      { id: '2', memberId: 'sarah', date: formatDate(week[1]), start: 14, end: 18, title: 'Booking: SH-8001', type: 'booking', location: ['Jeju Island'], clientName: 'Alice & Bob', whatsappStatus: 'Completed' },
      { id: '3', memberId: 'sarah', date: formatDate(week[3]), start: 12, end: 16, title: 'Available', type: 'availability', location: ['Busan Beach'] },
      { id: '4', memberId: 'david', date: formatDate(week[1]), start: 11, end: 15, title: 'Available', type: 'availability', location: ['Seoul Studio'] },
      { id: '5', memberId: 'david', date: formatDate(week[2]), start: 10, end: 18, title: 'Available', type: 'availability', location: ['Jeju Island'] },
      { id: '6', memberId: 'david', date: formatDate(week[4]), start: 14, end: 16, title: 'Booking: SH-8002', type: 'booking', location: ['Seoul Studio'], clientName: 'Charlie Family', whatsappStatus: 'Pending' },
      { id: '7', memberId: 'elena', date: formatDate(week[1]), start: 13, end: 17, title: 'Available', type: 'availability', location: ['Busan Beach'] },
      { id: '8', memberId: 'elena', date: formatDate(week[3]), start: 10, end: 14, title: 'Available', type: 'availability', location: ['Seoul Studio'] },
    ];
  });

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    eventId?: string;
    memberId: string;
    date: Date;
    start: number;
    end: number;
    location: string[];
    repeat: boolean;
    type: 'availability' | 'booking';
    title: string;
    clientName: string;
    whatsappStatus: 'Pending' | 'Contacted' | 'Completed';
  }>({
    isOpen: false,
    memberId: 'sarah',
    date: new Date(),
    start: 9,
    end: 10,
    location: ['Seoul Studio', 'Jeju Island', 'Busan Beach', 'Remote / Editing'],
    repeat: false,
    type: 'availability',
    title: 'Available',
    clientName: '',
    whatsappStatus: 'Pending'
  });

  const [resizing, setResizing] = useState<{ eventId: string; startY: number; originalEnd: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; eventId: string } | null>(null);

  // Close dropdowns and context menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target as Node)) {
        setIsMemberDropdownOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
      setContextMenu(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Resizing
  useEffect(() => {
    if (!resizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizing.startY;
      const deltaHours = Math.round(deltaY / 60); // 60px per hour
      setEvents(prev => prev.map(ev => {
        if (ev.id === resizing.eventId) {
          const newEnd = Math.max(ev.start + 1, resizing.originalEnd + deltaHours);
          return { ...ev, end: Math.min(newEnd, END_HOUR + 1) };
        }
        return ev;
      }));
    };
    const handleMouseUp = () => setResizing(null);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const weekDays = getWeekDays(currentDate);
  const monthDays = getMonthDays(calendarMonth.getFullYear(), calendarMonth.getMonth());

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const getProcessedEvents = (dateStr: string) => {
    const dayEvents = events.filter(e => e.date === dateStr && selectedMembers.includes(e.memberId));
    
    // Sort by start time
    const sorted = [...dayEvents].sort((a, b) => a.start - b.start);
    const columns: Event[][] = [];
    
    sorted.forEach(event => {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        if (!columns[i].some(e => e.start < event.end && e.end > event.start)) {
          columns[i].push(event);
          event.column = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        event.column = columns.length;
        columns.push([event]);
      }
    });

    sorted.forEach(event => {
      event.totalColumns = columns.length;
    });

    return sorted;
  };

  const handleSlotClick = (date: Date, hour: number) => {
    setModalState({
      isOpen: true,
      memberId: 'sarah', // Default to current user
      date: date,
      start: hour,
      end: hour + 1,
      location: ['Seoul Studio', 'Jeju Island', 'Busan Beach', 'Remote / Editing'],
      repeat: false,
      type: 'availability',
      title: 'Available',
      clientName: '',
      whatsappStatus: 'Pending'
    });
  };

  const handleEventClick = (event: Event, date: Date) => {
    setModalState({
      isOpen: true,
      eventId: event.id,
      memberId: event.memberId,
      date: date,
      start: event.start,
      end: event.end,
      location: event.location || [],
      repeat: false,
      type: event.type,
      title: event.title,
      clientName: event.clientName || '',
      whatsappStatus: event.whatsappStatus || 'Pending'
    });
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: Event = {
      id: modalState.eventId || Date.now().toString(),
      memberId: modalState.memberId,
      date: formatDate(modalState.date),
      start: modalState.start,
      end: modalState.end,
      location: modalState.location,
      title: modalState.type === 'availability' ? 'Available' : modalState.title,
      type: modalState.type,
      clientName: modalState.type === 'booking' ? modalState.clientName : undefined,
      whatsappStatus: modalState.type === 'booking' ? modalState.whatsappStatus : undefined,
    };

    if (modalState.eventId) {
      setEvents(events.map(ev => ev.id === modalState.eventId ? newEvent : ev));
    } else {
      setEvents([...events, newEvent]);
      if (modalState.repeat) {
        const repeatedEvents: Event[] = [];
        for (let i = 1; i <= 3; i++) {
          const nextDate = new Date(modalState.date);
          nextDate.setDate(nextDate.getDate() + (i * 7));
          repeatedEvents.push({
            ...newEvent,
            id: Date.now().toString() + i,
            date: formatDate(nextDate)
          });
        }
        setEvents(prev => [...prev, newEvent, ...repeatedEvents]);
        setModalState({ ...modalState, isOpen: false });
        return;
      }
    }
    setModalState({ ...modalState, isOpen: false });
  };

  const handleDeleteEvent = () => {
    if (modalState.eventId) {
      setEvents(events.filter(e => e.id !== modalState.eventId));
    }
    setModalState({ ...modalState, isOpen: false });
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('eventId', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, date: Date, hour: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    if (!eventId) return;
    
    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        const duration = ev.end - ev.start;
        const newStart = hour;
        const newEnd = Math.min(hour + duration, END_HOUR + 1);
        return { ...ev, date: formatDate(date), start: newStart, end: newEnd };
      }
      return ev;
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-serif text-4xl text-[#111]">Team Overview</h1>
          <p className="text-[#777] mt-2">Drag to move, resize from bottom, right-click to delete.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Calendar Week Navigator */}
          <div className="relative" ref={calendarRef}>
            <button 
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center space-x-3 px-4 py-2 bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:bg-[#fcfbf9] transition-colors"
            >
              <CalendarDays size={18} className="text-[#111]" />
              <span className="font-medium text-[#111] min-w-[160px] text-left">
                {formatWeekRange(weekDays)}
              </span>
              <ChevronDown size={16} className="text-[#111]" />
            </button>

            {isCalendarOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] z-50 p-4">
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
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-sm">
                  {monthDays.map((d, i) => {
                    const isCurrentMonth = d.getMonth() === calendarMonth.getMonth();
                    const isSelected = isSameDay(d, currentDate);
                    return (
                      <button 
                        key={i} 
                        onClick={() => { setCurrentDate(d); setIsCalendarOpen(false); }}
                        className={`p-2 flex items-center justify-center transition-colors
                          ${!isCurrentMonth ? 'text-[#ccc]' : 'text-[#111] hover:bg-[#fcfbf9]'}
                          ${isSelected ? 'bg-[#111] text-white hover:bg-[#111]' : ''}
                        `}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Member Multi-Select Dropdown */}
          <div className="relative" ref={memberDropdownRef}>
            <button 
              onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
              className="flex items-center justify-between w-64 px-4 py-2 bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:bg-[#fcfbf9] transition-colors"
            >
              <span className="font-medium text-[#111]">
                {selectedMembers.length === MEMBERS.length 
                  ? 'All Members' 
                  : `${selectedMembers.length} Selected`}
              </span>
              <ChevronDown size={16} className="text-[#111]" />
            </button>
            
            {isMemberDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] z-50 py-2">
                <div className="px-3 pb-2 mb-2 border-b border-[#e8e6e1] text-xs font-medium text-[#777] uppercase tracking-wider">
                  Filter by Member
                </div>
                {MEMBERS.map(member => {
                  const isSelected = selectedMembers.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-[#fcfbf9] transition-colors text-left"
                    >
                      <div className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#111] border-[#111]' : 'border-[#111] bg-white'}`}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: member.color }} />
                        <span className="text-sm font-medium text-[#111]">{member.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] overflow-hidden relative">
        <div className="overflow-x-auto">
          <div className="min-w-[800px] flex">
            
            {/* Time Column */}
            <div className="w-20 border-r border-[#111] bg-[#fcfbf9] shrink-0">
              <div className="h-12 border-b border-[#111]"></div> {/* Header spacer */}
              {HOURS.map(hour => (
                <div key={hour} className="h-[60px] border-b border-[#e8e6e1] relative">
                  <span className="absolute -top-2.5 right-2 text-xs text-[#777] bg-[#fcfbf9] px-1">
                    {hour}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Days Columns */}
            <div className="flex-1 flex">
              {weekDays.map((dayDate, index) => {
                const dateStr = formatDate(dayDate);
                const dayEvents = getProcessedEvents(dateStr);
                const isToday = isSameDay(dayDate, new Date());
                
                return (
                  <div key={dateStr} className="flex-1 border-r border-[#e8e6e1] last:border-r-0 relative min-w-[120px]">
                    {/* Header */}
                    <div className={`h-12 border-b border-[#111] flex flex-col items-center justify-center ${isToday ? 'bg-[#111] text-white' : 'bg-[#fcfbf9] text-[#111]'}`}>
                      <span className="text-xs font-medium uppercase tracking-wider">{DAYS[index]}</span>
                      <span className="text-sm font-bold">{dayDate.getDate()}</span>
                    </div>
                    
                    {/* Clickable/Droppable Grid Cells */}
                    <div className="absolute inset-0 top-12 bottom-0 flex flex-col z-0">
                      {HOURS.map(hour => (
                        <div
                          key={hour}
                          className="flex-1 border-b border-[#e8e6e1] hover:bg-[#111]/5 cursor-pointer transition-colors"
                          onClick={() => handleSlotClick(dayDate, hour)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, dayDate, hour)}
                        />
                      ))}
                    </div>

                    {/* Events Container */}
                    <div className="absolute inset-0 top-12 bottom-0 pointer-events-none z-10">
                      {dayEvents.map(event => {
                        const member = MEMBERS.find(m => m.id === event.memberId)!;
                        const top = (event.start - START_HOUR) * 60;
                        const height = (event.end - event.start) * 60;
                        const width = 100 / (event.totalColumns || 1);
                        const left = (event.column || 0) * width;
                        const isBooking = event.type === 'booking';

                        return (
                          <div
                            key={event.id}
                            draggable={!resizing}
                            onDragStart={(e) => handleDragStart(e, event.id)}
                            onClick={(e) => { e.stopPropagation(); handleEventClick(event, dayDate); }}
                            onContextMenu={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              setContextMenu({ x: e.clientX, y: e.clientY, eventId: event.id }); 
                            }}
                            className={`absolute p-1.5 border-l-4 overflow-hidden transition-shadow hover:z-20 hover:shadow-md pointer-events-auto
                              ${!resizing ? 'cursor-grab active:cursor-grabbing' : ''}
                              ${isBooking ? member.solidBgClass : member.bgClass}
                              ${member.borderClass}
                            `}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              left: `${left}%`,
                              marginLeft: event.column && event.column > 0 ? '2px' : '0',
                              width: event.column && event.column > 0 ? `calc(${width}% - 2px)` : `${width}%`
                            }}
                            title={`${member.name}: ${event.title} (${event.start}:00 - ${event.end}:00)`}
                          >
                            <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isBooking ? 'text-white' : member.textClass}`}>
                              {member.name.split(' ')[0]}
                            </div>
                            <div className={`text-xs font-medium leading-tight ${isBooking ? 'text-white' : member.textClass}`}>
                              {event.title}
                            </div>
                            {event.location && event.location.length > 0 && (
                              <div className={`text-[10px] mt-1 opacity-90 flex items-center space-x-1 ${isBooking ? 'text-white' : member.textClass}`}>
                                <MapPin size={10} className="shrink-0" />
                                <span className="truncate">{event.location.join(', ')}</span>
                              </div>
                            )}

                            {/* Resize Handle */}
                            <div 
                              className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-black/20 z-30"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setResizing({ eventId: event.id, startY: e.clientY, originalEnd: event.end });
                              }}
                            />
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

        {/* Context Menu */}
        {contextMenu && (
          <div 
            className="fixed z-[100] bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] py-1 w-32"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button 
              className="w-full text-left px-4 py-2 text-sm text-[#ff4d94] hover:bg-[#fcfbf9] font-medium"
              onClick={() => {
                setEvents(prev => prev.filter(e => e.id !== contextMenu.eventId));
                setContextMenu(null);
              }}
            >
              Delete Block
            </button>
          </div>
        )}
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {modalState.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white border border-[#111] shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setModalState({ ...modalState, isOpen: false })}
                className="absolute top-4 right-4 text-[#777] hover:text-[#111]"
              >
                <X size={20} />
              </button>
              
              <h2 className="font-serif text-2xl text-[#111] mb-6">
                {modalState.eventId ? 'Edit Schedule' : 'Add Schedule'}
              </h2>
              
              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">Member</label>
                    <CustomSelect 
                      value={modalState.memberId}
                      onChange={val => setModalState({ ...modalState, memberId: val })}
                      options={MEMBERS.map(m => ({ label: m.name, value: m.id }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">Type</label>
                    <CustomSelect 
                      value={modalState.type}
                      onChange={val => setModalState({ ...modalState, type: val as any })}
                      options={[
                        { label: 'Availability', value: 'availability' },
                        { label: 'Booking', value: 'booking' }
                      ]}
                    />
                  </div>
                </div>

                {modalState.type === 'booking' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#111] mb-1">Booking Reference / Title</label>
                      <input 
                        type="text"
                        value={modalState.title}
                        onChange={e => setModalState({ ...modalState, title: e.target.value })}
                        className="w-full border border-[#111] p-2 focus:outline-none focus:border-[#ff4d94]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111] mb-1">Client Name</label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
                        <input 
                          type="text"
                          value={modalState.clientName}
                          onChange={e => setModalState({ ...modalState, clientName: e.target.value })}
                          className="w-full border border-[#111] p-2 pl-10 focus:outline-none focus:border-[#ff4d94]"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111] mb-1">WhatsApp Status</label>
                      <div className="relative">
                        <MessageCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777] z-10" />
                        <CustomSelect 
                          value={modalState.whatsappStatus}
                          onChange={val => setModalState({ ...modalState, whatsappStatus: val as any })}
                          className="pl-8"
                          options={[
                            { label: 'Pending', value: 'Pending' },
                            { label: 'Contacted', value: 'Contacted' },
                            { label: 'Completed', value: 'Completed' }
                          ]}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">Location</label>
                  <CustomMultiSelect 
                    value={modalState.location}
                    onChange={val => setModalState({ ...modalState, location: val })}
                    options={[
                      { label: 'Seoul Studio', value: 'Seoul Studio' },
                      { label: 'Jeju Island', value: 'Jeju Island' },
                      { label: 'Busan Beach', value: 'Busan Beach' },
                      { label: 'Remote / Editing', value: 'Remote / Editing' }
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">Start Time</label>
                    <CustomSelect 
                      value={String(modalState.start)}
                      onChange={val => setModalState({ ...modalState, start: parseInt(val) })}
                      options={HOURS.map(h => ({ label: `${h}:00`, value: String(h) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">End Time</label>
                    <CustomSelect 
                      value={String(modalState.end)}
                      onChange={val => setModalState({ ...modalState, end: parseInt(val) })}
                      options={HOURS.map(h => ({ label: `${h + 1}:00`, value: String(h + 1) }))}
                    />
                  </div>
                </div>

                {!modalState.eventId && (
                  <div className="flex items-center space-x-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="repeat"
                      checked={modalState.repeat}
                      onChange={e => setModalState({ ...modalState, repeat: e.target.checked })}
                      className="w-4 h-4 accent-[#111]"
                    />
                    <label htmlFor="repeat" className="text-sm font-medium text-[#111] flex items-center space-x-1">
                      <Repeat size={14} className="text-[#777]" />
                      <span>Repeat for next 3 weeks</span>
                    </label>
                  </div>
                )}
                
                <div className="pt-6 flex justify-between items-center">
                  {modalState.eventId ? (
                    <button 
                      type="button" 
                      onClick={handleDeleteEvent}
                      className="text-[#ff4d94] font-medium text-sm hover:underline"
                    >
                      Delete
                    </button>
                  ) : <div></div>}
                  
                  <div className="flex space-x-3">
                    <button 
                      type="button" 
                      onClick={() => setModalState({ ...modalState, isOpen: false })}
                      className="px-4 py-2 border border-[#111] text-[#111] hover:bg-[#fcfbf9]"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-2 bg-[#111] text-white hover:bg-[#ff4d94] transition-colors"
                    >
                      Save
                    </button>
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
