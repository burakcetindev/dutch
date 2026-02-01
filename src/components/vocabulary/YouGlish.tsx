"use client";

import { useState } from "react";
import { PlayCircle, X } from "lucide-react";

interface YouGlishProps {
  word: string;
  language?: string;
}

export function YouGlish({ word, language = "dutch" }: YouGlishProps) {
  const [isOpen, setIsOpen] = useState(false);

  // YouGlish widget URL format - use widget instead of iframe to avoid CORS
  const youglishUrl = `https://youglish.com/widget?v=${encodeURIComponent(word)}&lang=dutch`;

  const handleOpenYouGlish = () => {
    // Open in new window instead of iframe to avoid connection refused
    window.open(
      `https://youglish.com/pronounce/${encodeURIComponent(word)}/dutch`,
      '_blank',
      'width=1200,height=800'
    );
  };

  return (
    <button
      onClick={handleOpenYouGlish}
      className="flex items-center gap-2 px-4 py-2 glass rounded-xl hover:scale-105 transition-all duration-300 group"
    >
      <PlayCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        See Examples in YouGlish
      </span>
    </button>
  );
}
