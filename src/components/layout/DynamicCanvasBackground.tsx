
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
}

const DynamicCanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const animationFrameId = useRef<number>();
  const particlesArray = useRef<Particle[]>([]);
  const mousePosition = useRef({ x: 0, y: 0 });

  const getThemeColors = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        primary: 'hsl(260 70% 60%)', // Default Purple
        accent: 'hsl(30 100% 55%)',  // Default Orange
        grid: resolvedTheme === 'dark' ? 'hsla(0, 0%, 100%, 0.05)' : 'hsla(0, 0%, 0%, 0.05)',
      };
    }
    const rootStyle = getComputedStyle(document.documentElement);
    return {
      primary: `hsl(${rootStyle.getPropertyValue('--primary').trim()})`,
      accent: `hsl(${rootStyle.getPropertyValue('--accent').trim()})`,
      grid: resolvedTheme === 'dark' ? 'hsla(210, 30%, 95%, 0.07)' : 'hsla(220, 10%, 10%, 0.07)',
    };
  }, [resolvedTheme]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const themeColors = getThemeColors();
    const particleColors = [themeColors.primary, themeColors.accent];
    
    particlesArray.current = [];
    const numberOfParticles = Math.floor((canvas.width * canvas.height) / 25000); // Adjust density

    for (let i = 0; i < numberOfParticles; i++) {
      const radius = Math.random() * 1.5 + 0.5; // Smaller particles
      const x = Math.random() * (canvas.width - radius * 2) + radius;
      const y = Math.random() * (canvas.height - radius * 2) + radius;
      const vx = (Math.random() - 0.5) * 0.3; // Slower movement
      const vy = (Math.random() - 0.5) * 0.3;
      const color = particleColors[Math.floor(Math.random() * particleColors.length)];
      particlesArray.current.push({ x, y, radius, vx, vy, color });
    }
  }, [getThemeColors]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const gridSize = 40;
    const themeColors = getThemeColors();
    ctx.strokeStyle = themeColors.grid;
    ctx.lineWidth = 0.5;

    // Calculate grid offset based on mouse position for parallax effect
    const offsetX = (mousePosition.current.x / canvas.width - 0.5) * gridSize * 0.5;
    const offsetY = (mousePosition.current.y / canvas.height - 0.5) * gridSize * 0.5;

    for (let x = -offsetX % gridSize; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = -offsetY % gridSize; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
  }, [getThemeColors]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas);

    particlesArray.current.forEach(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Boundary check (bounce)
      if (particle.x + particle.radius > canvas.width || particle.x - particle.radius < 0) {
        particle.vx = -particle.vx;
      }
      if (particle.y + particle.radius > canvas.height || particle.y - particle.radius < 0) {
        particle.vy = -particle.vy;
      }

      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2, false);
      ctx.fillStyle = particle.color;
      ctx.fill();
    });

    animationFrameId.current = requestAnimationFrame(animate);
  }, [drawGrid]);

  useEffect(() => {
    initCanvas();
    animate();

    const handleResize = () => {
      initCanvas(); // Re-initialize particles and canvas size
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [initCanvas, animate, resolvedTheme]); // Re-run on theme change to pick up new grid color

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1, // Ensure it's behind all content
        pointerEvents: 'none', // Allow clicks to pass through
      }}
    />
  );
};

export default DynamicCanvasBackground;
