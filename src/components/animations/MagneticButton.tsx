"use client";

import { useRef, useState, useCallback, ReactNode } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  disabled?: boolean;
  onClick?: () => void;
}

/**
 * Button with magnetic cursor attraction effect.
 * Automatically disabled on touch devices and reduced motion.
 */
export function MagneticButton({
  children,
  className = "",
  strength = 0.3,
  disabled = false,
  onClick,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    
    if (prefersReducedMotion || disabled) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    setTransform({ x: deltaX, y: deltaY });
  }, [strength, disabled]);

  const handleMouseLeave = useCallback(() => {
    setTransform({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  return (
    <button
      ref={buttonRef}
      className={`transition-transform duration-200 ease-out motion-reduce:transform-none ${className}`}
      style={{
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${isHovered ? 1.02 : 1})`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
