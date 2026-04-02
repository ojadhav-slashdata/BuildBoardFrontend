import { useState } from 'react';

const THEMES = [
  {
    name: 'Indigo',
    colors: { primary: '#3525cd', 'primary-container': '#4f46e5', 'primary-light': '#6366f1', secondary: '#525d83', tertiary: '#3a4a54' },
    shadow: 'subtle',
    preview: 'bg-indigo-600',
  },
  {
    name: 'Teal',
    colors: { primary: '#0d9488', 'primary-container': '#14b8a6', 'primary-light': '#2dd4bf', secondary: '#4b7c8a', tertiary: '#3a5454' },
    shadow: 'subtle',
    preview: 'bg-teal-600',
  },
  {
    name: 'Rose',
    colors: { primary: '#e11d48', 'primary-container': '#f43f5e', 'primary-light': '#fb7185', secondary: '#8a4b6b', tertiary: '#543a4a' },
    shadow: 'subtle',
    preview: 'bg-rose-600',
  },
  {
    name: 'Amber',
    colors: { primary: '#d97706', 'primary-container': '#f59e0b', 'primary-light': '#fbbf24', secondary: '#8a6b4b', tertiary: '#54493a' },
    shadow: 'subtle',
    preview: 'bg-amber-600',
  },
  {
    name: 'Violet',
    colors: { primary: '#7c3aed', 'primary-container': '#8b5cf6', 'primary-light': '#a78bfa', secondary: '#6b4b8a', tertiary: '#4a3a54' },
    shadow: 'subtle',
    preview: 'bg-violet-600',
  },
  {
    name: 'Ocean',
    colors: { primary: '#0369a1', 'primary-container': '#0284c7', 'primary-light': '#38bdf8', secondary: '#4b6e8a', tertiary: '#3a4854' },
    shadow: 'glow',
    preview: 'bg-sky-600',
    gradient: true,
  },
  {
    name: 'Sunset',
    colors: { primary: '#ea580c', 'primary-container': '#f97316', 'primary-light': '#fb923c', secondary: '#8a5c4b', tertiary: '#54403a' },
    shadow: 'warm',
    preview: 'bg-orange-600',
    gradient: true,
  },
  {
    name: 'Aurora',
    colors: { primary: '#059669', 'primary-container': '#10b981', 'primary-light': '#34d399', secondary: '#4b8a6b', tertiary: '#3a5449' },
    shadow: 'glow',
    preview: 'bg-emerald-600',
    gradient: true,
  },
  {
    name: 'Forest',
    colors: { primary: '#15803d', 'primary-container': '#16a34a', 'primary-light': '#4ade80', secondary: '#5a7c4b', tertiary: '#3f5434' },
    shadow: 'subtle',
    preview: 'bg-green-700',
    gradient: true,
  },
];

const SHADOW_PRESETS = {
  subtle: {
    tonal: '0 1px 3px 0 rgba(21,28,39,0.04), 0 1px 2px -1px rgba(21,28,39,0.04)',
    'tonal-md': '0 4px 12px -2px rgba(21,28,39,0.06), 0 2px 6px -2px rgba(21,28,39,0.04)',
    'tonal-lg': '0 8px 24px -4px rgba(21,28,39,0.08), 0 4px 8px -4px rgba(21,28,39,0.04)',
  },
  glow: {
    tonal: '0 1px 4px 0 var(--c-primary-alpha, rgba(53,37,205,0.12))',
    'tonal-md': '0 4px 14px -2px var(--c-primary-alpha, rgba(53,37,205,0.18))',
    'tonal-lg': '0 8px 28px -4px var(--c-primary-alpha, rgba(53,37,205,0.22))',
  },
  warm: {
    tonal: '0 1px 4px 0 rgba(234,88,12,0.08)',
    'tonal-md': '0 4px 14px -2px rgba(234,88,12,0.12)',
    'tonal-lg': '0 8px 28px -4px rgba(234,88,12,0.16)',
  },
};

function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--c-${key}`, value);
  });

  // Set alpha version for glow shadows
  if (theme.shadow === 'glow') {
    const hex = theme.colors.primary;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    root.style.setProperty('--c-primary-alpha', `rgba(${r},${g},${b},0.18)`);
  }

  const shadows = SHADOW_PRESETS[theme.shadow] || SHADOW_PRESETS.subtle;
  Object.entries(shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });
}

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('Indigo');

  const handleSelect = (theme) => {
    setActive(theme.name);
    applyTheme(theme);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high text-xs font-semibold text-on-surface-variant transition-all duration-200"
        title="Theme Switcher"
      >
        <span className="material-symbols-outlined text-[16px]">palette</span>
        <span className="hidden sm:inline">Theme</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-surface-container-lowest rounded-2xl shadow-tonal-lg p-4 z-50 min-w-[220px]">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Color Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme.name}
                onClick={() => handleSelect(theme)}
                className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 ${
                  active === theme.name
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'hover:bg-surface-container-high'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full ${theme.preview} shadow-sm`}
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <span className="text-[10px] font-medium text-on-surface-variant">{theme.name}</span>
                {theme.gradient && (
                  <span className="absolute top-1 right-1 text-[8px] font-black bg-surface-container-high text-on-surface-variant rounded px-1">G</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
