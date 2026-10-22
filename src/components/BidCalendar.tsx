import { useState, useMemo } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Plus, ChevronLeft, ChevronRight, MapPin, Building2, X } from 'lucide-react';

interface CalendarEntry {
  id: string;
  title: string;
  date: string;
  type: 'deadline' | 'review' | 'meeting' | 'submission';
  portal?: string;
  value?: string;
}

interface BidCalendarProps {
  deadline: string | null;
  fileName: string;
}

const TYPE_STYLES: Record<CalendarEntry['type'], { color: string; bg: string; border: string; dot: string; label: string }> = {
  deadline: { color: 'text-bad', bg: 'bg-bad/10', border: 'border-bad/30', dot: 'bg-bad', label: 'Deadline' },
  review: { color: 'text-warn', bg: 'bg-warn/10', border: 'border-warn/30', dot: 'bg-warn', label: 'Review' },
  meeting: { color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30', dot: 'bg-accent', label: 'Meeting' },
  submission: { color: 'text-ok', bg: 'bg-ok/10', border: 'border-ok/30', dot: 'bg-ok', label: 'Submission' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BidCalendar({ deadline, fileName }: BidCalendarProps) {
  const [initialDate] = useState(() => deadline ? new Date(deadline) : new Date());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: '', date: '', type: 'meeting' as CalendarEntry['type'], portal: '' });

  const entries = useMemo<CalendarEntry[]>(() => {
    if (!deadline) return [];
    return [{ id: 'cal-deadline', title: `Submission deadline - ${fileName}`, date: deadline, type: 'deadline', value: 'Primary' }];
  }, [deadline, fileName]);

  const [customEntries, setCustomEntries] = useState<CalendarEntry[]>([]);
  const allEntries = [...entries, ...customEntries];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const entriesByDate = useMemo(() => {
    const map: Record<string, CalendarEntry[]> = {};
    allEntries.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [allEntries]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const handleAdd = () => {
    if (!newEntry.title || !newEntry.date) return;
    const id = `cal-custom-${Date.now()}`;
    setCustomEntries((prev) => [...prev, { ...newEntry, id }]);
    setNewEntry({ title: '', date: '', type: 'meeting', portal: '' });
    setShowAdd(false);
  };

  const upcoming = allEntries
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              {MONTHS[currentMonth]} {currentYear}
            </h3>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-800 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={nextMonth} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-800 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => setShowAdd(!showAdd)} className="ml-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Event
              </button>
            </div>
          </div>

          {showAdd && (
            <div className="mb-4 p-3 rounded-lg bg-ink-850/60 border border-ink-700 space-y-2.5">
              <input
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                placeholder="Event title"
                className="w-full bg-ink-900/60 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="bg-ink-900/60 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
                />
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as CalendarEntry['type'] })}
                  className="bg-ink-900/60 border border-ink-700 rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent/50"
                >
                  {(Object.keys(TYPE_STYLES) as CalendarEntry['type'][]).map((t) => (
                    <option key={t} value={t} className="bg-ink-850">{TYPE_STYLES[t].label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg text-xs text-ink-300 border border-ink-700 hover:bg-ink-800 transition-colors">Cancel</button>
                <button onClick={handleAdd} disabled={!newEntry.title || !newEntry.date} className="flex-1 py-2 rounded-lg text-xs font-medium bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors disabled:opacity-50">Add Event</button>
              </div>
            </div>
          )}

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] uppercase tracking-wider text-ink-400 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const key = `${currentYear}-${currentMonth}-${day}`;
              const dayEntries = entriesByDate[key] || [];
              const isToday = key === todayKey;
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg border p-1 flex flex-col items-center transition-colors ${
                    isToday ? 'border-accent/50 bg-accent/5' : 'border-ink-700 bg-ink-850/40 hover:border-ink-600'
                  }`}
                >
                  <span className={`text-xs ${isToday ? 'text-accent font-bold' : 'text-ink-300'}`}>{day}</span>
                  {dayEntries.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 justify-center mt-auto mb-0.5">
                      {dayEntries.slice(0, 3).map((e) => (
                        <div key={e.id} className={`w-1.5 h-1.5 rounded-full ${TYPE_STYLES[e.type].dot}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-ink-700">
            {(Object.keys(TYPE_STYLES) as CalendarEntry['type'][]).map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${TYPE_STYLES[t].dot}`} />
                <span className="text-xs text-ink-400">{TYPE_STYLES[t].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-accent" />
            Upcoming Events
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-xs text-ink-400 text-center py-8">No upcoming events.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((e) => {
                const style = TYPE_STYLES[e.type];
                const days = Math.ceil((new Date(e.date).getTime() - Date.now()) / 86400000);
                return (
                  <div key={e.id} className={`p-3 rounded-lg ${style.bg} border ${style.border}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">{e.title}</p>
                        <p className="text-xs text-ink-400 mt-0.5">
                          {new Date(e.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-xs font-mono shrink-0 ${style.color}`}>
                        {days === 0 ? 'Today' : days === 1 ? '1d' : `${days}d`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
