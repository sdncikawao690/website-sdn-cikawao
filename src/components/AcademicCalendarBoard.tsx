import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  GraduationCap,
  List,
  MapPin,
  Search,
  Sparkles,
  Sun,
  UserCheck,
  X,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import {
  ACADEMIC_EVENT_CATEGORIES,
  ROMBEL_LIST,
  SCHOOL_INFO,
  type AcademicEvent,
  type AcademicEventCategory,
} from '../types/school';
import { Icon3D } from './Icon3D';

interface AcademicCalendarBoardProps {
  compactMode?: boolean;
  onOpenFullCalendar?: () => void;
  headerAction?: React.ReactNode;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const WEEKDAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoParts(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split('-').map((n) => Number(n) || 1);
  return { year: y, month: m, day: d };
}

function formatIndoDate(iso: string): string {
  const { year, month, day } = parseIsoParts(iso);
  return `${day} ${SHORT_MONTHS[month - 1] || ''} ${year}`;
}

function formatIndoRange(startDate: string, endDate: string): string {
  if (!endDate || startDate === endDate) {
    return formatIndoDate(startDate);
  }
  const s = parseIsoParts(startDate);
  const e = parseIsoParts(endDate);
  if (s.year === e.year && s.month === e.month) {
    return `${s.day} – ${e.day} ${SHORT_MONTHS[s.month - 1]} ${s.year}`;
  }
  return `${formatIndoDate(startDate)} – ${formatIndoDate(endDate)}`;
}

function formatMonthYearLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map((n) => Number(n) || 1);
  return `${MONTH_NAMES[m - 1] || ''} ${y}`;
}

function addDaysIso(iso: string, days: number): string {
  const { year, month, day } = parseIsoParts(iso);
  const d = new Date(year, month - 1, day + days);
  return toIsoDate(d);
}

function escapeIcsText(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function buildIcsHref(events: AcademicEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SDN Cikawao//Kalender Akademik//ID',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Kalender Akademik SDN Cikawao',
  ];

  for (const ev of events) {
    const startCompact = ev.startDate.replace(/-/g, '');
    const endExclusive = addDaysIso(ev.endDate || ev.startDate, 1).replace(/-/g, '');
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.id}@sdncikawao.sch.id`);
    lines.push(`DTSTART;VALUE=DATE:${startCompact}`);
    lines.push(`DTEND;VALUE=DATE:${endExclusive}`);
    lines.push(`SUMMARY:${escapeIcsText(`[${ev.category}] ${ev.title}`)}`);
    lines.push(
      `DESCRIPTION:${escapeIcsText(`${ev.description} (Sasaran: ${ev.targetRombel})`)}`
    );
    if (ev.location) {
      lines.push(`LOCATION:${escapeIcsText(ev.location)}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`;
}

function getCategoryStyle(category: AcademicEventCategory): {
  chipClass: string;
  surfaceClass: string;
  labelClass: string;
  dotClass: string;
} {
  if (category === 'Ujian') {
    return {
      chipClass: 'bg-amber-100 text-amber-950 border border-amber-300',
      surfaceClass: 'bg-amber-50/70 border-amber-200',
      labelClass: 'text-amber-800',
      dotClass: 'bg-amber-500',
    };
  }
  if (category === 'Hari Libur') {
    return {
      chipClass: 'bg-rose-100 text-rose-900 border border-rose-300',
      surfaceClass: 'bg-rose-50/70 border-rose-200',
      labelClass: 'text-rose-700',
      dotClass: 'bg-rose-500',
    };
  }
  return {
    chipClass: 'bg-sky-100 text-sky-950 border border-sky-300',
    surfaceClass: 'bg-sky-50/70 border-sky-200',
    labelClass: 'text-sky-700',
    dotClass: 'bg-sky-500',
  };
}

function CategoryIcon({
  category,
  className = 'w-3.5 h-3.5',
}: {
  category: AcademicEventCategory;
  className?: string;
}) {
  if (category === 'Ujian') {
    return <GraduationCap className={className} />;
  }
  if (category === 'Hari Libur') {
    return <Sun className={className} />;
  }
  return <Sparkles className={className} />;
}

export function AcademicCalendarBoard({
  compactMode = false,
  onOpenFullCalendar,
  headerAction,
}: AcademicCalendarBoardProps) {
  const { academicEvents } = useSchool();

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const initialDate = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, []);

  const [viewYear, setViewYear] = useState<number>(initialDate.year);
  const [viewMonth, setViewMonth] = useState<number>(initialDate.month); // 0..11
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const [inspectorScope, setInspectorScope] = useState<'day' | 'month'>('day');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | AcademicEventCategory>(
    'Semua'
  );
  const [rombelFilter, setRombelFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sortedEvents = useMemo(
    () =>
      [...academicEvents].sort(
        (a, b) =>
          a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title)
      ),
    [academicEvents]
  );

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedEvents.filter((ev) => {
      if (categoryFilter !== 'Semua' && ev.category !== categoryFilter) {
        return false;
      }
      if (rombelFilter !== 'Semua') {
        if (rombelFilter === 'Semua Kelas') {
          if (ev.targetRombel !== 'Semua Kelas') return false;
        } else if (
          ev.targetRombel !== rombelFilter &&
          ev.targetRombel !== 'Semua Kelas'
        ) {
          return false;
        }
      }
      if (q) {
        const hay = `${ev.title} ${ev.description} ${ev.location || ''} ${ev.category} ${ev.targetRombel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sortedEvents, categoryFilter, rombelFilter, searchQuery]);

  const currentMonthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthStartIso = `${currentMonthKey}-01`;
  const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthEndIso = `${currentMonthKey}-${String(lastDayOfMonth).padStart(2, '0')}`;

  const monthEvents = useMemo(() => {
    return filteredEvents.filter(
      (ev) => ev.startDate <= monthEndIso && (ev.endDate || ev.startDate) >= monthStartIso
    );
  }, [filteredEvents, monthStartIso, monthEndIso]);

  const monthStats = useMemo(() => {
    let kegiatan = 0;
    let ujian = 0;
    let libur = 0;
    for (const ev of monthEvents) {
      if (ev.category === 'Ujian') ujian += 1;
      else if (ev.category === 'Hari Libur') libur += 1;
      else kegiatan += 1;
    }
    return {
      total: monthEvents.length,
      kegiatan,
      ujian,
      libur,
    };
  }, [monthEvents]);

  const calendarCells = useMemo(() => {
    const firstDate = new Date(viewYear, viewMonth, 1);
    // Convert JS Sun=0..Sat=6 to Mon=0..Sun=6
    const startOffset = (firstDate.getDay() + 6) % 7;
    const totalCells = Math.ceil((startOffset + lastDayOfMonth) / 7) * 7;
    const cells: Array<{
      iso: string;
      dayNum: number;
      inCurrentMonth: boolean;
      isWeekend: boolean;
    }> = [];

    for (let i = 0; i < totalCells; i++) {
      const cellDate = new Date(viewYear, viewMonth, 1 - startOffset + i);
      const dayOfWeek = cellDate.getDay();
      cells.push({
        iso: toIsoDate(cellDate),
        dayNum: cellDate.getDate(),
        inCurrentMonth: cellDate.getMonth() === viewMonth,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }
    return cells;
  }, [viewYear, viewMonth, lastDayOfMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, AcademicEvent[]>();
    for (const cell of calendarCells) {
      const matching = filteredEvents.filter(
        (ev) => ev.startDate <= cell.iso && (ev.endDate || ev.startDate) >= cell.iso
      );
      if (matching.length > 0) {
        map.set(cell.iso, matching);
      }
    }
    return map;
  }, [calendarCells, filteredEvents]);

  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter(
      (ev) => ev.startDate <= selectedDate && (ev.endDate || ev.startDate) >= selectedDate
    );
  }, [filteredEvents, selectedDate]);

  const upcomingEvents = useMemo(() => {
    return filteredEvents
      .filter((ev) => (ev.endDate || ev.startDate) >= todayIso)
      .slice(0, 4);
  }, [filteredEvents, todayIso]);

  const groupedAgenda = useMemo(() => {
    const groups = new Map<string, AcademicEvent[]>();
    for (const ev of filteredEvents) {
      const key = ev.startDate.slice(0, 7);
      const list = groups.get(key) || [];
      list.push(ev);
      groups.set(key, list);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredEvents]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>([viewYear, initialDate.year, initialDate.year + 1]);
    for (const ev of academicEvents) {
      years.add(parseIsoParts(ev.startDate).year);
      years.add(parseIsoParts(ev.endDate || ev.startDate).year);
    }
    return Array.from(years).sort((a, b) => a - b);
  }, [academicEvents, viewYear, initialDate.year]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(todayIso);
    setInspectorScope('day');
  };

  const handleJumpToEvent = (ev: AcademicEvent) => {
    const { year, month } = parseIsoParts(ev.startDate);
    setViewYear(year);
    setViewMonth(month - 1);
    setSelectedDate(ev.startDate);
    setViewMode('grid');
    setInspectorScope('day');
  };

  const inspectorEvents =
    inspectorScope === 'day' ? selectedDayEvents : monthEvents;
  const icsHref = useMemo(() => buildIcsHref(filteredEvents), [filteredEvents]);

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Icon3D name="calendar" size={compactMode ? 'md' : 'lg'} />
          <div>
            <p className="text-xs font-bold text-indigo-700 mb-1">
              Kalender Akademik Interaktif · {SCHOOL_INFO.name}
            </p>
            <h2
              className={`${
                compactMode ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
              } font-extrabold text-slate-900 font-display text-balance`}
            >
              Jadwal Kegiatan Sekolah, Ujian &amp; Hari Libur
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Klik tanggal untuk melihat rincian agenda, saring berdasarkan jenis kegiatan atau
              rombongan belajar, atau unduh jadwal ke kalender pribadi (.ics).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {filteredEvents.length > 0 && (
            <a
              href={icsHref}
              download={`kalender-akademik-sdn-cikawao-${currentMonthKey}.ics`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Kalender (.ics)
            </a>
          )}
          {onOpenFullCalendar && (
            <button
              type="button"
              onClick={onOpenFullCalendar}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Buka Kalender Lengkap
            </button>
          )}
          {headerAction}
        </div>
      </div>

      {/* Summary Stats Strip for Viewed Month */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-indigo-700 truncate">
              Agenda {MONTH_NAMES[viewMonth]}
            </p>
            <p className="text-xl font-extrabold text-slate-900 font-display tabular-nums">
              {monthStats.total}
            </p>
          </div>
        </div>

        <div className="bg-white border-2 border-sky-200 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-sky-700 truncate">Kegiatan Sekolah</p>
            <p className="text-xl font-extrabold text-slate-900 font-display tabular-nums">
              {monthStats.kegiatan}
            </p>
          </div>
        </div>

        <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-800 truncate">Jadwal Ujian</p>
            <p className="text-xl font-extrabold text-slate-900 font-display tabular-nums">
              {monthStats.ujian}
            </p>
          </div>
        </div>

        <div className="bg-white border-2 border-rose-200 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-rose-700 truncate">Hari Libur</p>
            <p className="text-xl font-extrabold text-slate-900 font-display tabular-nums">
              {monthStats.libur}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & View Switcher Toolbar */}
      <div className="bg-white border-2 border-indigo-200 rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-indigo-50 rounded-xl border border-indigo-200">
            {(['Semua', ...ACADEMIC_EVENT_CATEGORIES] as const).map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-indigo-800'
                  }`}
                >
                  {cat !== 'Semua' && <CategoryIcon category={cat} className="w-3.5 h-3.5" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          <select
            aria-label="Filter Rombel"
            value={rombelFilter}
            onChange={(e) => setRombelFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border-2 border-slate-200 rounded-xl cursor-pointer"
          >
            <option value="Semua">Semua Sasaran</option>
            <option value="Semua Kelas">Umum (Semua Kelas)</option>
            {ROMBEL_LIST.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ujian, kegiatan, libur..."
              className="w-full pl-8 pr-7 py-2 text-xs border-2 border-slate-200 rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Hapus kata kunci"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white text-indigo-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Daftar Agenda
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Interactive View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Monthly Interactive Calendar Grid */}
          <div className="lg:col-span-7 bg-white border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Month Controls */}
            <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-sky-600 to-teal-600 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Bulan sebelumnya"
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  <select
                    aria-label="Pilih Bulan"
                    value={viewMonth}
                    onChange={(e) => setViewMonth(Number(e.target.value))}
                    className="bg-white/15 hover:bg-white/25 text-white font-display font-extrabold text-sm sm:text-base rounded-lg px-2.5 py-1 border border-white/20 cursor-pointer [&>option]:text-slate-900"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Pilih Tahun"
                    value={viewYear}
                    onChange={(e) => setViewYear(Number(e.target.value))}
                    className="bg-white/15 hover:bg-white/25 text-white font-mono font-bold text-sm sm:text-base rounded-lg px-2 py-1 border border-white/20 cursor-pointer tabular-nums [&>option]:text-slate-900"
                  >
                    {yearOptions.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Bulan berikutnya"
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleJumpToday}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                Hari Ini
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-indigo-100 bg-indigo-50/60">
              {WEEKDAY_HEADERS.map((day, idx) => (
                <div
                  key={day}
                  className={`py-2 text-center text-[11px] sm:text-xs font-extrabold ${
                    idx === 6 ? 'text-rose-700' : 'text-slate-700'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
              {calendarCells.map((cell) => {
                const dayEvents = eventsByDate.get(cell.iso) || [];
                const isToday = cell.iso === todayIso;
                const isSelected = cell.iso === selectedDate;
                const hasHoliday = dayEvents.some(
                  (ev) => ev.isHoliday || ev.category === 'Hari Libur'
                );
                const maxChips = compactMode ? 1 : 2;
                const visibleEvents = dayEvents.slice(0, maxChips);
                const overflowCount = dayEvents.length - visibleEvents.length;

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(cell.iso);
                      setInspectorScope('day');
                      if (!cell.inCurrentMonth) {
                        const parts = parseIsoParts(cell.iso);
                        setViewYear(parts.year);
                        setViewMonth(parts.month - 1);
                      }
                    }}
                    className={`min-h-[70px] sm:min-h-[92px] p-1.5 text-left flex flex-col gap-1 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-500'
                        : hasHoliday && cell.inCurrentMonth
                          ? 'bg-rose-50/45 hover:bg-rose-50/80'
                          : cell.inCurrentMonth
                            ? 'bg-white hover:bg-sky-50/50'
                            : 'bg-slate-50/60 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold font-mono tabular-nums rounded-lg ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : isSelected
                              ? 'bg-indigo-200 text-indigo-950'
                              : hasHoliday || cell.isWeekend
                                ? 'text-rose-700'
                                : 'text-slate-800'
                        }`}
                      >
                        {cell.dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="sm:hidden flex items-center gap-0.5">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className={`w-1.5 h-1.5 rounded-full ${getCategoryStyle(ev.category).dotClass}`}
                            />
                          ))}
                        </span>
                      )}
                    </div>

                    <div className="hidden sm:flex flex-col gap-1 min-w-0">
                      {visibleEvents.map((ev) => {
                        const style = getCategoryStyle(ev.category);
                        return (
                          <span
                            key={ev.id}
                            className={`block truncate px-1.5 py-0.5 rounded-md text-[10px] font-bold leading-tight ${style.chipClass}`}
                            title={`${ev.category}: ${ev.title}`}
                          >
                            {ev.title}
                          </span>
                        );
                      })}
                      {overflowCount > 0 && (
                        <span className="text-[10px] font-bold text-indigo-700 px-1 font-mono tabular-nums">
                          +{overflowCount} agenda
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Category Legend */}
            <div className="px-4 py-3 border-t border-indigo-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-slate-600">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  Kegiatan Sekolah
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Ujian / Asesmen
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Hari Libur Nasional / Sekolah
                </span>
              </div>
              <span className="font-mono tabular-nums text-indigo-700">
                Hari ini: {formatIndoDate(todayIso)}
              </span>
            </div>
          </div>

          {/* Right: Selected Date / Month Detail Panel */}
          <div className="lg:col-span-5 bg-white border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-indigo-100 bg-indigo-50/70 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-indigo-700">
                  {inspectorScope === 'day' ? 'Rincian Tanggal Terpilih' : 'Semua Agenda Bulan Ini'}
                </p>
                <h3 className="text-base font-extrabold text-slate-900 font-display">
                  {inspectorScope === 'day'
                    ? formatIndoDate(selectedDate)
                    : `${MONTH_NAMES[viewMonth]} ${viewYear}`}
                </h3>
              </div>

              <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-indigo-200">
                <button
                  type="button"
                  onClick={() => setInspectorScope('day')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${
                    inspectorScope === 'day'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:text-indigo-800'
                  }`}
                >
                  Tanggal ({selectedDayEvents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorScope('month')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${
                    inspectorScope === 'month'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:text-indigo-800'
                  }`}
                >
                  Bulan Ini ({monthEvents.length})
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 max-h-[540px] overflow-y-auto">
              {inspectorEvents.length === 0 ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center space-y-1.5">
                    <p className="text-sm font-bold text-slate-800">
                      {inspectorScope === 'day'
                        ? 'Tidak ada agenda khusus pada tanggal ini'
                        : `Belum ada agenda untuk ${MONTH_NAMES[viewMonth]} ${viewYear}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      Kegiatan Belajar Mengajar berjalan normal sesuai jadwal kelas masing-masing,
                      atau pilih agenda terdekat di bawah ini.
                    </p>
                  </div>

                  {upcomingEvents.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-xs font-extrabold text-slate-700 font-display">
                        Agenda Terdekat Berikutnya
                      </p>
                      {upcomingEvents.map((ev) => {
                        const style = getCategoryStyle(ev.category);
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => handleJumpToEvent(ev)}
                            className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer hover:border-indigo-400 ${style.surfaceClass}`}
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
                              <span
                                className={`inline-flex items-center gap-1 font-bold ${style.labelClass}`}
                              >
                                <CategoryIcon category={ev.category} className="w-3 h-3" />
                                {ev.category}
                              </span>
                              <span className="font-mono font-bold text-slate-600 tabular-nums">
                                {formatIndoRange(ev.startDate, ev.endDate)}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                              {ev.title}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                inspectorEvents.map((ev) => {
                  const style = getCategoryStyle(ev.category);
                  const singleIcsHref = buildIcsHref([ev]);
                  return (
                    <article
                      key={ev.id}
                      className={`p-4 rounded-xl border-2 space-y-2.5 ${style.surfaceClass}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span
                          className={`inline-flex items-center gap-1.5 font-extrabold ${style.labelClass}`}
                        >
                          <CategoryIcon category={ev.category} className="w-3.5 h-3.5" />
                          {ev.category}
                        </span>
                        <span className="font-mono font-bold text-slate-700 tabular-nums">
                          {formatIndoRange(ev.startDate, ev.endDate)}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 font-display">
                        {ev.title}
                      </h4>

                      <p className="text-xs text-slate-700 leading-relaxed">{ev.description}</p>

                      <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            {ev.targetRombel}
                          </span>
                          {ev.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-600" />
                              {ev.location}
                            </span>
                          )}
                        </div>
                        <a
                          href={singleIcsHref}
                          download={`${ev.id}.ics`}
                          className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:underline"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          Simpan (.ics)
                        </a>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Agenda List View */
        <div className="space-y-6">
          {groupedAgenda.length === 0 ? (
            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-10 text-center text-sm text-slate-500">
              Tidak ada agenda kalender akademik yang sesuai dengan filter pencarian.
            </div>
          ) : (
            groupedAgenda.map(([monthKey, items]) => (
              <div
                key={monthKey}
                className="bg-white border-2 border-indigo-200 rounded-2xl overflow-hidden"
              >
                <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-sky-600 text-white flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-extrabold font-display">
                    {formatMonthYearLabel(monthKey)}
                  </h3>
                  <span className="text-xs font-mono font-bold tabular-nums text-indigo-100">
                    {items.length} agenda
                  </span>
                </div>
                <div className="divide-y divide-indigo-100">
                  {items.map((ev) => {
                    const style = getCategoryStyle(ev.category);
                    return (
                      <div
                        key={ev.id}
                        className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-indigo-50/35 transition-colors"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span
                              className={`inline-flex items-center gap-1 font-extrabold ${style.labelClass}`}
                            >
                              <CategoryIcon category={ev.category} className="w-3.5 h-3.5" />
                              {ev.category}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono font-bold text-slate-700 tabular-nums">
                              {formatIndoRange(ev.startDate, ev.endDate)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-slate-700">{ev.targetRombel}</span>
                            {ev.location && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-rose-600" />
                                  {ev.location}
                                </span>
                              </>
                            )}
                          </div>
                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 font-display">
                            {ev.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {ev.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleJumpToEvent(ev)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl cursor-pointer"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            Lihat di Kalender
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
