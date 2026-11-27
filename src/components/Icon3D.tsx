import React from 'react';

export type Icon3DName =
  | 'school'
  | 'students'
  | 'rombel'
  | 'teacher'
  | 'curriculum'
  | 'bell'
  | 'news'
  | 'gallery'
  | 'pkks'
  | 'ekskul'
  | 'siloka'
  | 'users'
  | 'dashboard'
  | 'calendar';

interface Icon3DProps {
  name: Icon3DName;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-8 h-8',
  md: 'w-11 h-11',
  lg: 'w-14 h-14',
};

const BG_MAP: Record<Icon3DName, string> = {
  school: 'from-sky-400 to-blue-600 shadow-[0_4px_0_#1d4ed8]',
  students: 'from-amber-400 to-orange-500 shadow-[0_4px_0_#c2410c]',
  rombel: 'from-rose-400 to-pink-600 shadow-[0_4px_0_#be185d]',
  teacher: 'from-emerald-400 to-teal-600 shadow-[0_4px_0_#0f766e]',
  curriculum: 'from-violet-400 to-purple-600 shadow-[0_4px_0_#6d28d9]',
  bell: 'from-yellow-400 to-amber-500 shadow-[0_4px_0_#b45309]',
  news: 'from-cyan-400 to-sky-600 shadow-[0_4px_0_#0369a1]',
  gallery: 'from-pink-400 to-rose-500 shadow-[0_4px_0_#be123c]',
  pkks: 'from-amber-300 to-yellow-600 shadow-[0_4px_0_#a16207]',
  ekskul: 'from-lime-400 to-emerald-600 shadow-[0_4px_0_#047857]',
  siloka: 'from-indigo-400 to-violet-600 shadow-[0_4px_0_#5b21b6]',
  users: 'from-fuchsia-400 to-purple-600 shadow-[0_4px_0_#7e22ce]',
  dashboard: 'from-teal-400 to-cyan-600 shadow-[0_4px_0_#0e7490]',
  calendar: 'from-indigo-400 to-sky-600 shadow-[0_4px_0_#0369a1]',
};

export function Icon3D({ name, size = 'md', className = '' }: Icon3DProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${BG_MAP[name]} ${SIZE_MAP[size]} shrink-0 select-none ring-2 ring-white/80 ${className}`}
    >
      {/* Glossy 3D top specular highlight */}
      <span className="pointer-events-none absolute inset-x-1.5 top-1 h-1/3 rounded-full bg-gradient-to-b from-white/55 to-transparent" />
      <svg
        viewBox="0 0 48 48"
        className="w-[68%] h-[68%] drop-shadow-[0_2px_2px_rgba(15,23,42,0.3)] relative z-10"
        fill="none"
      >
        <defs>
          <linearGradient id="gWhite" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="gCoral" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDA4AF" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
          <linearGradient id="gSky" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="gMint" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {name === 'school' && (
          <g>
            <path d="M24 6L6 18H42L24 6Z" fill="url(#gCoral)" />
            <rect x="9" y="18" width="30" height="22" rx="3" fill="url(#gWhite)" />
            <rect x="20" y="27" width="8" height="13" rx="2" fill="url(#gGold)" />
            <rect x="12" y="22" width="5" height="5" rx="1.2" fill="url(#gSky)" />
            <rect x="31" y="22" width="5" height="5" rx="1.2" fill="url(#gSky)" />
            <circle cx="24" cy="13" r="2.2" fill="url(#gGold)" />
          </g>
        )}

        {name === 'students' && (
          <g>
            <path d="M24 9L6 18L24 27L42 18L24 9Z" fill="url(#gWhite)" />
            <path d="M13 23V32C13 35.5 18 38 24 38C30 38 35 35.5 35 32V23L24 28.5L13 23Z" fill="url(#gSky)" />
            <rect x="37" y="19" width="3" height="14" rx="1.5" fill="url(#gGold)" />
            <circle cx="38.5" cy="34" r="2.5" fill="url(#gCoral)" />
          </g>
        )}

        {name === 'rombel' && (
          <g>
            <path d="M24 7L39 15.5V32.5L24 41L9 32.5V15.5L24 7Z" fill="url(#gWhite)" />
            <path d="M24 7L39 15.5L24 24L9 15.5L24 7Z" fill="url(#gGold)" />
            <path d="M24 24L39 15.5V32.5L24 41V24Z" fill="url(#gSky)" fillOpacity="0.85" />
          </g>
        )}

        {name === 'teacher' && (
          <g>
            <rect x="7" y="10" width="34" height="23" rx="4" fill="url(#gWhite)" />
            <rect x="10" y="13" width="28" height="17" rx="2" fill="url(#gMint)" />
            <path d="M15 19H28M15 24H23" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="33" cy="24" r="3" fill="url(#gGold)" />
            <path d="M16 37L24 33L32 37" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {name === 'curriculum' && (
          <g>
            <path
              d="M24 6L29.2 16.6L41 18.3L32.5 26.6L34.5 38.3L24 32.8L13.5 38.3L15.5 26.6L7 18.3L18.8 16.6L24 6Z"
              fill="url(#gGold)"
            />
            <circle cx="24" cy="23" r="5" fill="url(#gWhite)" />
          </g>
        )}

        {name === 'bell' && (
          <g>
            <path
              d="M24 8C17.5 8 13 13 13 19.5V27L9.5 32.5H38.5L35 27V19.5C35 13 30.5 8 24 8Z"
              fill="url(#gWhite)"
            />
            <circle cx="24" cy="36.5" r="4" fill="url(#gCoral)" />
            <circle cx="35" cy="12" r="4.5" fill="url(#gCoral)" />
          </g>
        )}

        {name === 'news' && (
          <g>
            <rect x="8" y="9" width="26" height="30" rx="4" fill="url(#gWhite)" />
            <rect x="12" y="14" width="18" height="9" rx="2" fill="url(#gGold)" />
            <path d="M12 28H28M12 33H24" stroke="#0284C7" strokeWidth="2.8" strokeLinecap="round" />
            <rect x="34" y="15" width="6" height="24" rx="2.5" fill="url(#gCoral)" />
          </g>
        )}

        {name === 'gallery' && (
          <g>
            <rect x="7" y="13" width="34" height="25" rx="5" fill="url(#gWhite)" />
            <path d="M17 13L19.5 9H28.5L31 13H17Z" fill="url(#gGold)" />
            <circle cx="24" cy="25.5" r="7.5" fill="url(#gSky)" />
            <circle cx="24" cy="25.5" r="3.5" fill="#FFFFFF" />
            <circle cx="34.5" cy="18.5" r="2" fill="url(#gCoral)" />
          </g>
        )}

        {name === 'pkks' && (
          <g>
            <circle cx="24" cy="20" r="11" fill="url(#gWhite)" />
            <circle cx="24" cy="20" r="7" fill="url(#gGold)" />
            <path d="M17 29L14 41L24 36L34 41L31 29" fill="url(#gCoral)" />
          </g>
        )}

        {name === 'ekskul' && (
          <g>
            <path d="M14 10H34V21C34 26.5 29.5 31 24 31C18.5 31 14 26.5 14 21V10Z" fill="url(#gWhite)" />
            <path d="M14 13H9C9 19 11 22 14 22M34 13H39C39 19 37 22 34 22" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" />
            <rect x="21" y="30" width="6" height="7" fill="url(#gGold)" />
            <rect x="16" y="36" width="16" height="4.5" rx="2" fill="url(#gGold)" />
          </g>
        )}

        {name === 'siloka' && (
          <g>
            <path
              d="M9 12C9 9.8 10.8 8 13 8H35C37.2 8 39 9.8 39 12V28C39 30.2 37.2 32 35 32H21L13 39V32H13C10.8 32 9 30.2 9 28V12Z"
              fill="url(#gWhite)"
            />
            <circle cx="18" cy="20" r="2.6" fill="url(#gCoral)" />
            <circle cx="24" cy="20" r="2.6" fill="url(#gGold)" />
            <circle cx="30" cy="20" r="2.6" fill="url(#gSky)" />
          </g>
        )}

        {name === 'users' && (
          <g>
            <circle cx="19" cy="17" r="6" fill="url(#gWhite)" />
            <path d="M9 36C9 30.5 13.5 26 19 26C24.5 26 29 30.5 29 36H9Z" fill="url(#gWhite)" />
            <circle cx="32" cy="19" r="4.5" fill="url(#gGold)" />
            <path d="M27 36C27 31.8 30 28.5 34 28.5C37.5 28.5 40 31.8 40 36H27Z" fill="url(#gSky)" />
          </g>
        )}

        {name === 'dashboard' && (
          <g>
            <rect x="8" y="8" width="14" height="14" rx="4" fill="url(#gWhite)" />
            <rect x="26" y="8" width="14" height="10" rx="3.5" fill="url(#gGold)" />
            <rect x="26" y="22" width="14" height="18" rx="4" fill="url(#gWhite)" />
            <rect x="8" y="26" width="14" height="14" rx="4" fill="url(#gCoral)" />
          </g>
        )}

        {name === 'calendar' && (
          <g>
            <rect x="8" y="11" width="32" height="29" rx="5" fill="url(#gWhite)" />
            <path d="M8 16C8 13.2 10.2 11 13 11H35C37.8 11 40 13.2 40 16V20H8V16Z" fill="url(#gCoral)" />
            <rect x="15" y="7" width="4" height="7" rx="2" fill="url(#gGold)" />
            <rect x="29" y="7" width="4" height="7" rx="2" fill="url(#gGold)" />
            <rect x="13" y="24" width="6" height="5" rx="1.5" fill="url(#gSky)" />
            <rect x="21" y="24" width="6" height="5" rx="1.5" fill="url(#gMint)" />
            <rect x="29" y="24" width="6" height="5" rx="1.5" fill="url(#gGold)" />
            <rect x="13" y="31" width="6" height="5" rx="1.5" fill="url(#gSky)" />
            <rect x="21" y="31" width="6" height="5" rx="1.5" fill="url(#gCoral)" />
          </g>
        )}
      </svg>
    </div>
  );
}
