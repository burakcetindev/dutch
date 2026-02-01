"use client";

import { ThemeProvider } from "./ThemeProvider";
import { CursorGlow } from "./CursorGlow";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CursorGlow />
      {children}
      <footer className="fixed bottom-0 left-0 right-0 py-3 text-center bg-gradient-to-t from-white/80 to-transparent dark:from-black/80 backdrop-blur-sm z-40">
        <p className="text-sm font-mono tracking-wider bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent font-bold animate-pulse-glow">
          Designed & Created by Burak Cetin
        </p>
      </footer>
    </ThemeProvider>
  );
}
