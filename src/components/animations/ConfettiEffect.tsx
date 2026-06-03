"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
}

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
  colors?: string[];
  particleCount?: number;
  originX?: number;
  originY?: number;
}

/**
 * Canvas-based confetti celebration effect.
 * Respects reduced motion preferences and manages RAF lifecycle.
 */
export function ConfettiEffect({
  trigger,
  onComplete,
  colors = ["#a855f7", "#ec4899", "#3b82f6", "#22c55e", "#f59e0b", "#06b6d4"],
  particleCount = 50,
  originX,
  originY,
}: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const hasTriggeredRef = useRef(false);

  const createParticles = useCallback((x: number, y: number) => {
    const particles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const velocity = 8 + Math.random() * 8;
      
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        life: 0,
        maxLife: 60 + Math.random() * 40,
      });
    }
    
    return particles;
  }, [colors, particleCount]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeParticles = 0;

    particlesRef.current.forEach((particle) => {
      if (particle.life >= particle.maxLife) return;

      particle.life++;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.3; // gravity
      particle.vx *= 0.99; // air resistance
      particle.rotation += particle.rotationSpeed;

      const alpha = 1 - particle.life / particle.maxLife;
      
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        -particle.size / 2,
        -particle.size / 2,
        particle.size,
        particle.size * 0.6
      );
      ctx.restore();

      activeParticles++;
    });

    if (activeParticles > 0) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      particlesRef.current = [];
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      if (trigger && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        onComplete?.();
      }
      if (!trigger) {
        hasTriggeredRef.current = false;
      }
      return;
    }

    if (trigger && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set canvas size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Create particles at origin or center-top
      const x = originX ?? window.innerWidth / 2;
      const y = originY ?? window.innerHeight / 3;
      
      particlesRef.current = createParticles(x, y);
      rafRef.current = requestAnimationFrame(animate);
    }

    if (!trigger) {
      hasTriggeredRef.current = false;
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [trigger, originX, originY, createParticles, animate, onComplete]);

  // Handle visibility change to pause animation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  );
}
