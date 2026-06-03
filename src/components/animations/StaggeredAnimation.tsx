"use client";

import { ReactNode } from "react";

interface StaggeredListProps {
  children: ReactNode[];
  baseDelay?: number;
  staggerDelay?: number;
  className?: string;
}

/**
 * Wrapper for staggered entrance animations on list items.
 * Respects reduced motion preferences via CSS.
 */
export function StaggeredList({
  children,
  baseDelay = 0,
  staggerDelay = 0.05,
  className = "",
}: StaggeredListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className="animate-stagger-item motion-reduce:animate-none"
          style={{
            animationDelay: `${baseDelay + index * staggerDelay}s`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

interface StaggeredGridProps {
  children: ReactNode[];
  columns?: number;
  baseDelay?: number;
  staggerDelay?: number;
  className?: string;
}

/**
 * Grid layout with staggered entrance animations.
 */
export function StaggeredGrid({
  children,
  columns = 3,
  baseDelay = 0,
  staggerDelay = 0.08,
  className = "",
}: StaggeredGridProps) {
  return (
    <div className={`grid gap-4 ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {children.map((child, index) => (
        <div
          key={index}
          className="animate-stagger-item motion-reduce:animate-none"
          style={{
            animationDelay: `${baseDelay + index * staggerDelay}s`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
