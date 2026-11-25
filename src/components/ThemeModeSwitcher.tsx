import { Clock3, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '../context/ThemeContext';

interface ThemeModeSwitcherProps {
  variant?: 'compact' | 'full';
}

const OPTIONS: Array<{
  id: ThemePreference;
  label: string;
  shortLabel: string;
  icon: typeof Clock3;
}> = [
  { id: 'auto', label: 'Otomatis', shortLabel: 'Auto', icon: Clock3 },
  { id: 'light', label: 'Siang', shortLabel: 'Siang', icon: Sun },
  { id: 'dark', label: 'Malam', shortLabel: 'Malam', icon: Moon },
];

export function ThemeModeSwitcher({ variant = 'compact' }: ThemeModeSwitcherProps) {
  const { themePreference, resolvedTheme, currentTimeLabel, setThemePreference } =
    useTheme();

  const activeDescription =
    themePreference === 'auto'
      ? `Otomatis (${currentTimeLabel} · ${resolvedTheme === 'dark' ? 'Malam' : 'Siang'})`
      : resolvedTheme === 'dark'
        ? 'Mode Malam (Manual)'
        : 'Mode Siang (Manual)';

  if (variant === 'full') {
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-700">
          <span>Tampilan Siang / Malam</span>
          <span className="font-mono text-sky-700">{activeDescription}</span>
        </div>
        <div
          role="group"
          aria-label="Pilih mode tampilan siang atau malam"
          className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-white border border-sky-200"
        >
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = themePreference === opt.id;
            const activeStyle =
              opt.id === 'auto'
                ? 'bg-sky-600 text-white shadow-xs'
                : opt.id === 'light'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-indigo-600 text-white shadow-xs';
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => setThemePreference(opt.id)}
                className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                  active ? activeStyle : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-500 leading-snug">
          Otomatis: Siang 06.00–17.59 · Malam 18.00–05.59
        </p>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Mode tampilan siang malam"
      title={activeDescription}
      className="inline-flex items-center gap-0.5 p-1 rounded-xl border border-sky-200 bg-sky-50/80 shrink-0"
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = themePreference === opt.id;
        const activeStyle =
          opt.id === 'auto'
            ? 'bg-sky-600 text-white shadow-xs'
            : opt.id === 'light'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'bg-indigo-600 text-white shadow-xs';
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            aria-label={
              opt.id === 'auto'
                ? `Mode otomatis sesuai jam (${activeDescription})`
                : `Mode ${opt.label}`
            }
            title={
              opt.id === 'auto'
                ? `Otomatis sesuai jam (${currentTimeLabel}: ${resolvedTheme === 'dark' ? 'Malam' : 'Siang'})`
                : `Mode ${opt.label} (Manual)`
            }
            onClick={() => setThemePreference(opt.id)}
            className={`inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              active ? activeStyle : 'text-slate-600 hover:bg-white/80'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {opt.id === 'auto' && <span className="hidden sm:inline">{opt.shortLabel}</span>}
          </button>
        );
      })}
    </div>
  );
}
