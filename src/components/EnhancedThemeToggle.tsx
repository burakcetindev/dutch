"use client";

import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

/**
 * Enhanced animated theme toggle with sun/moon morph effect.
 * Includes glow and rotation animations.
 */
export function EnhancedThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 600);
  };

  if (!mounted) {
    return (
      <button className="glass-card p-3 w-14 h-14 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={handleToggle}
      className={`
        glass-card p-3 w-14 h-14 flex items-center justify-center
        hover:scale-110 active:scale-95 transition-all duration-300
        relative overflow-hidden group
        ${isAnimating ? "animate-theme-toggle" : ""}
      `}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Glow effect */}
      <div
        className={`
          absolute inset-0 transition-opacity duration-500
          ${isDark ? "opacity-100" : "opacity-0"}
        `}
        style={{
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)",
        }}
      />

      {/* Sun/Moon container */}
      <div
        className={`
          relative w-7 h-7 transition-transform duration-500 ease-out
          ${isAnimating ? (isDark ? "rotate-[360deg]" : "-rotate-[360deg]") : ""}
        `}
      >
        {/* Sun */}
        <div
          className={`
            absolute inset-0 transition-all duration-500
            ${isDark ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"}
          `}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            {/* Sun center */}
            <circle
              cx="12"
              cy="12"
              r="4"
              className="fill-yellow-500"
            />
            {/* Sun rays */}
            {[...Array(8)].map((_, i) => (
              <line
                key={i}
                x1="12"
                y1="2"
                x2="12"
                y2="5"
                className="stroke-yellow-500"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${i * 45} 12 12)`}
              />
            ))}
          </svg>
        </div>

        {/* Moon */}
        <div
          className={`
            absolute inset-0 transition-all duration-500
            ${isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"}
          `}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              className="fill-purple-400 stroke-purple-300"
              strokeWidth="1"
            />
            {/* Stars */}
            <circle cx="18" cy="6" r="1" className="fill-purple-300 animate-pulse" />
            <circle cx="20" cy="10" r="0.5" className="fill-purple-200 animate-pulse" style={{ animationDelay: "0.3s" }} />
            <circle cx="16" cy="4" r="0.5" className="fill-purple-200 animate-pulse" style={{ animationDelay: "0.6s" }} />
          </svg>
        </div>
      </div>

      {/* Sparkle particles on toggle */}
      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-yellow-400 dark:bg-purple-400 animate-sparkle"
              style={{
                left: "50%",
                top: "50%",
                transform: `rotate(${i * 60}deg) translateY(-20px)`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
