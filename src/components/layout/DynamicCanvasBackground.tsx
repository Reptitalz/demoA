
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

    // Static gradient backdrop
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "rgba(10,12,30,0.9)");
    g.addColorStop(1, "rgba(8,10,20,0.75)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const numberOfParticles = Math.floor((w * h) / 25000); 

    // Draw static particles
    for (let i = 0; i < numberOfParticles; i++) {
        const p = {
            x: rand(0, w),
            y: rand(0, h),
            radius: rand(6, 20),
            hue: rand(180, 280),
            alpha: rand(0.15, 0.45),
        };
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
        grd.addColorStop(0, `hsla(${p.hue},80%,60%,${p.alpha})`);
        grd.addColorStop(0.4, `hsla(${(p.hue + 60) % 360},70%,40%,${p.alpha * 0.6})`);
        grd.addColorStop(1, `rgba(0,0,0,0)`);
        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw static grid
    const gridSize = 48;
    ctx.strokeStyle = "hsla(0, 0%, 100%, 0.06)";
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

  }, []);

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
