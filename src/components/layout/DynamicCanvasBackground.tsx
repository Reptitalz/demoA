
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';

interface Particle {
  x: number;
  y: number;
  radius: number;
  hue: number;
  alpha: number;
  vx: number;
  vy: number;
}

const DynamicCanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const particles = useRef<Particle[]>([]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.getContext('2d')?.scale(dpr, dpr);
    
    const { clientWidth: w, clientHeight: h } = canvas;
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const numberOfParticles = Math.floor((w * h) / 45000);
    
    particles.current = [];
    for (let i = 0; i < numberOfParticles; i++) {
        particles.current.push({
            x: rand(0, w),
            y: rand(0, h),
            radius: rand(8, 20),
            hue: rand(200, 260),
            alpha: rand(0.1, 0.4),
            vx: rand(-0.1, 0.1),
            vy: rand(-0.1, 0.1),
        });
    }
  }, []);

  const drawScene = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { clientWidth: w, clientHeight: h } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Theme-aware gradient backdrop
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "rgba(240, 245, 255, 0.9)");
    g.addColorStop(1, "rgba(230, 235, 250, 0.75)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Draw and update particles
    particles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x - p.radius > w) p.x = -p.radius;
        if (p.x + p.radius < 0) p.x = w + p.radius;
        if (p.y - p.radius > h) p.y = -p.radius;
        if (p.y + p.radius < 0) p.y = h + p.radius;

        const floatY = Math.sin(time / (1000 + p.radius * 20)) * 2;
        
        const grd = ctx.createRadialGradient(p.x, p.y + floatY, 0, p.x, p.y + floatY, p.radius * 2);
        grd.addColorStop(0, `hsla(${p.hue},80%,70%,${p.alpha})`);
        grd.addColorStop(0.4, `hsla(${(p.hue + 40) % 360},70%,60%,${p.alpha * 0.5})`);
        grd.addColorStop(1, `rgba(0,0,0,0)`);
        
        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.arc(p.x, p.y + floatY, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw animated grid
    const gridSize = 48;
    const scrollSpeed = 0.05;
    const offsetX = (time * scrollSpeed) % gridSize;
    const offsetY = (time * scrollSpeed) % gridSize;

    ctx.strokeStyle = "hsla(220, 40%, 50%, 0.08)";
    ctx.lineWidth = 0.5;
    for (let x = -offsetX; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = -offsetY; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

  }, []);

  useEffect(() => {
    initCanvas();

    const animate = (time: number) => {
        drawScene(time);
        animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);
    
    const handleResize = () => {
        initCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [initCanvas, drawScene]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden
    />
  );
};

export default DynamicCanvasBackground;
