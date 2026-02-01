"use client";

import { useState, useEffect } from "react";
import { Menu, X, Moon, Sun, User } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import Link from "next/link";

export function HamburgerMenu() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <HamburgerMenuContent />;
}

function HamburgerMenuContent() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 glass rounded-2xl hover:scale-110 transition-all duration-300 group"
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        ) : (
          <Menu className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        )}
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 glass z-40 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-8 pt-20">
          {/* Menu Items */}
          <div className="space-y-4">
            {/* About Me Link */}
            <Link
              href="/about"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-4 glass rounded-2xl hover:scale-105 transition-all duration-300 group"
            >
              <User className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-lg font-medium text-gray-800 dark:text-gray-200">
                About Me
              </span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={() => {
                toggleTheme();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 p-4 glass rounded-2xl hover:scale-105 transition-all duration-300 group w-full"
            >
              {theme === "light" ? (
                <>
                  <Moon className="w-5 h-5 text-purple-600 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-lg font-medium text-gray-800">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-5 h-5 text-yellow-400 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-lg font-medium text-gray-200">Light Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
