
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  hue: number;
  alpha: number;
}

const DynamicCanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const animationFrameId = useRef<number>();
  const particlesArray = useRef<Particle[]>([]);
  const mousePosition = useRef({ x: 0, y: 0 });

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    particlesArray.current = [];
    const numberOfParticles = Math.floor((canvas.clientWidth * canvas.clientHeight) / 25000); 

    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.current.push({
        x: rand(0, canvas.clientWidth),
        y: rand(0, canvas.clientHeight),
        vx: rand(-0.15, 0.15),
        vy: rand(-0.2, 0.2),
        radius: rand(6, 20),
        hue: rand(180, 280),
        alpha: rand(0.15, 0.45),
      });
    }
  }, []);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const gridSize = 48;
    ctx.strokeStyle = "hsla(0, 0%, 100%, 0.06)";
    ctx.lineWidth = 1;
    const time = Date.now() * 0.0006;
    for (let x = 0; x < canvas.clientWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo((x + Math.sin(time + x * 0.01) * 10), 0);
        ctx.lineTo((x + Math.cos(time + x * 0.01) * 10), canvas.clientHeight);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.clientHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, (y + Math.cos(time + y * 0.01) * 10));
        ctx.lineTo(canvas.clientWidth, (y + Math.sin(time + y * 0.01) * 10));
        ctx.stroke();
    }
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // subtle gradient backdrop
    const g = ctx.createLinearGradient(0, 0, canvas.clientWidth, canvas.clientHeight);
    g.addColorStop(0, "rgba(10,12,30,0.9)");
    g.addColorStop(1, "rgba(8,10,20,0.75)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    particlesArray.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -50) p.x = canvas.clientWidth + 50;
      if (p.x > canvas.clientWidth + 50) p.x = -50;
      if (p.y < -50) p.y = canvas.clientHeight + 50;
      if (p.y > canvas.clientHeight + 50) p.y = -50;

      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
      grd.addColorStop(0, `hsla(${p.hue},80%,60%,${p.alpha})`);
      grd.addColorStop(0.4, `hsla(${(p.hue + 60) % 360},70%,40%,${p.alpha * 0.6})`);
      grd.addColorStop(1, `rgba(0,0,0,0)`);

      ctx.beginPath();
      ctx.fillStyle = grd;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    drawGrid(ctx, canvas);

    animationFrameId.current = requestAnimationFrame(animate);
  }, [drawGrid]);

  useEffect(() => {
    initCanvas();
    animate();

    const handleResize = () => {
      initCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [initCanvas, animate, resolvedTheme]);

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
