import React from 'react';

interface SocialContactIconsProps {
  variant?: 'footer' | 'card';
}

const SOCIAL_ITEMS = [
  {
    name: 'TikTok',
    label: 'TikTok SDN Cikawao',
    href: 'https://www.tiktok.com',
    footerClass:
      'bg-white/10 text-white border-white/15 hover:bg-slate-950 hover:border-cyan-400 hover:text-cyan-300',
    cardClass:
      'bg-slate-900 text-white border-slate-800 hover:bg-slate-800 dark:bg-slate-800 dark:border-slate-700',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="w-4 h-4"
      >
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2 6.34 6.34 0 0 0 9.49 21.5a6.34 6.34 0 0 0 6.34-6.34V8.76a8.16 8.16 0 0 0 4.76 1.52V6.84a4.86 4.86 0 0 1-1-.15Z" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp',
    label: 'WhatsApp SDN Cikawao',
    href: 'https://web.whatsapp.com',
    footerClass:
      'bg-white/10 text-emerald-300 border-white/15 hover:bg-emerald-500 hover:border-emerald-400 hover:text-white',
    cardClass:
      'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="w-4 h-4"
      >
        <path d="M12.04 2a9.93 9.93 0 0 0-8.57 14.95L2 22l5.2-1.36A9.94 9.94 0 1 0 12.04 2Zm5.8 14.08c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.14.11-1.84-.11-.43-.14-.98-.32-1.69-.63-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.76-2.18 1.03-2.48.27-.3.59-.37.79-.37h.57c.18 0 .43-.07.67.51.24.6.84 2.06.91 2.21.08.15.13.33.03.53-.1.2-.15.33-.3.5-.15.18-.32.4-.45.53-.15.15-.3.31-.13.61.18.3.78 1.29 1.67 2.09 1.15 1.02 2.12 1.34 2.42 1.49.3.15.48.13.65-.08.18-.2.75-.88.95-1.18.2-.3.4-.25.67-.15.27.1 1.74.82 2.04.97.3.15.5.22.57.35.08.13.08.73-.17 1.41Z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    label: 'YouTube SDN Cikawao',
    href: 'https://www.youtube.com',
    footerClass:
      'bg-white/10 text-rose-300 border-white/15 hover:bg-red-600 hover:border-red-500 hover:text-white',
    cardClass:
      'bg-red-600 text-white border-red-700 hover:bg-red-700',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="w-4 h-4"
      >
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.54 12 3.54 12 3.54s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    label: 'Instagram SDN Cikawao',
    href: 'https://www.instagram.com',
    footerClass:
      'bg-white/10 text-pink-300 border-white/15 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:border-pink-400 hover:text-white',
    cardClass:
      'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white border-rose-500 hover:opacity-90',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="w-4 h-4"
      >
        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      </svg>
    ),
  },
];

export function SocialContactIcons({ variant = 'footer' }: SocialContactIconsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {SOCIAL_ITEMS.map((item) => (
        <a
          key={item.name}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          title={item.label}
          className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
            variant === 'footer' ? item.footerClass : item.cardClass
          }`}
        >
          {item.icon}
          <span>{item.name}</span>
        </a>
      ))}
    </div>
  );
}
