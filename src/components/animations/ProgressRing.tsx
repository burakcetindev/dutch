"use client";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  colorFrom?: string;
  colorTo?: string;
  label?: string;
}

/**
 * Animated circular progress indicator with SVG.
 * Respects reduced motion and includes accessible labels.
 */
export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  className = "",
  colorFrom = "#a855f7",
  colorTo = "#ec4899",
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const gradientId = `progress-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${progress}% complete`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorFrom} />
            <stop offset="100%" stopColor={colorTo} />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out motion-reduce:transition-none"
          style={{
            filter: "drop-shadow(0 0 6px rgba(168, 85, 247, 0.4))",
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
