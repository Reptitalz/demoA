
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';

interface Particle {
  x: number;
  y: number;
  radius: number;
  hue: number;
  alpha: number;
}

const DynamicCanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    
    const { clientWidth: w, clientHeight: h } = canvas;
    const isDark = resolvedTheme === 'dark';

    // Theme-aware gradient backdrop
    const g = ctx.createLinearGradient(0, 0, w, h);
    if (isDark) {
        g.addColorStop(0, "rgba(10,12,30,0.9)");
        g.addColorStop(1, "rgba(8,10,20,0.75)");
    } else {
        g.addColorStop(0, "rgba(240, 245, 255, 0.9)");
        g.addColorStop(1, "rgba(230, 235, 250, 0.75)");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const numberOfParticles = Math.floor((w * h) / (isDark ? 25000 : 35000)); 

    // Draw static particles with theme-aware colors
    for (let i = 0; i < numberOfParticles; i++) {
        const p = {
            x: rand(0, w),
            y: rand(0, h),
            radius: rand(6, isDark ? 20 : 15),
            hue: rand(isDark ? 180 : 200, isDark ? 280 : 260),
            alpha: rand(isDark ? 0.15 : 0.2, isDark ? 0.45 : 0.5),
        };
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
        if (isDark) {
            grd.addColorStop(0, `hsla(${p.hue},80%,60%,${p.alpha})`);
            grd.addColorStop(0.4, `hsla(${(p.hue + 60) % 360},70%,40%,${p.alpha * 0.6})`);
        } else {
            grd.addColorStop(0, `hsla(${p.hue},80%,70%,${p.alpha})`);
            grd.addColorStop(0.4, `hsla(${(p.hue + 40) % 360},70%,60%,${p.alpha * 0.5})`);
        }
        grd.addColorStop(1, `rgba(0,0,0,0)`);
        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw static grid with theme-aware colors
    const gridSize = 48;
    ctx.strokeStyle = isDark ? "hsla(0, 0%, 100%, 0.06)" : "hsla(220, 40%, 50%, 0.08)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

  }, [resolvedTheme]);

  useEffect(() => {
    drawScene();
    window.addEventListener('resize', drawScene);
    return () => {
      window.removeEventListener('resize', drawScene);
    };
  }, [drawScene, resolvedTheme]);

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
