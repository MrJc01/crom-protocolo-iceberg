/**
 * ThemeToggle Component - Enhanced with animation and dropdown
 */

import { useState } from "react";
import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const themes = [
    { id: "dark", label: "Escuro", icon: "🌙" },
    { id: "light", label: "Claro", icon: "☀️" },
    { id: "system", label: "Sistema", icon: "💻" },
  ];

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-surface rounded-lg transition-all"
        title="Mudar tema"
        aria-label="Toggle theme"
      >
        <span className="text-lg">{currentTheme.icon}</span>
        <span className="hidden sm:inline text-xs text-secondary">{currentTheme.label}</span>
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)} 
          />
          <div className="absolute right-0 mt-2 w-36 bg-surface border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id as any);
                  setShowDropdown(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
                  theme === t.id
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-background"
                }`}
              >
                <span>{t.icon}</span>
                <span className="text-sm">{t.label}</span>
                {theme === t.id && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
