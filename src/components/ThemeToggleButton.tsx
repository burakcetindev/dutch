"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggleButton() {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="glass-card px-6 py-3">
        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold">
          <Moon className="w-5 h-5" />
          Night Mode
        </div>
      </button>
    );
  }

  return (
    <button onClick={toggleTheme} className="glass-card px-6 py-3 hover:scale-105">
      <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold">
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        Night Mode
      </div>
    </button>
  );
}
