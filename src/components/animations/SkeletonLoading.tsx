"use client";

import React from "react";

interface SkeletonCardProps {
  className?: string;
}

/**
 * Skeleton loading card with shimmer effect.
 * Respects reduced motion preference.
 */
export function SkeletonCard({ className = "" }: SkeletonCardProps) {
  return (
    <div 
      className={`glass-card p-6 ${className}`}
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="animate-pulse motion-reduce:animate-none">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-8 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg skeleton-shimmer" />
          <div className="h-6 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full skeleton-shimmer" />
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-3/4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded skeleton-shimmer" />
          <div className="h-4 w-1/2 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded skeleton-shimmer" />
        </div>

        {/* Badges skeleton */}
        <div className="flex gap-2 mt-4">
          <div className="h-6 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full skeleton-shimmer" />
          <div className="h-6 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

interface SkeletonStatsProps {
  className?: string;
}

/**
 * Skeleton for stats cards with shimmer effect.
 */
export function SkeletonStats({ className = "" }: SkeletonStatsProps) {
  return (
    <div 
      className={`glass-card p-6 ${className}`}
      aria-busy="true"
      aria-label="Loading statistics"
    >
      <div className="animate-pulse motion-reduce:animate-none">
        <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded mb-4 mx-auto skeleton-shimmer" />
        <div className="h-12 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg mx-auto skeleton-shimmer" />
      </div>
    </div>
  );
}

interface SkeletonDashboardProps {
  cardCount?: number;
}

/**
 * Full dashboard skeleton with multiple cards.
 */
export function SkeletonDashboard({ cardCount = 3 }: SkeletonDashboardProps) {
  return (
    <div className="space-y-8" role="status" aria-label="Loading dashboard">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <SkeletonStats key={i} />
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-6">
        {[...Array(cardCount)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
