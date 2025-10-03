
"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';

type ParticleType = 'circle' | 'heart' | 'bubble';

interface Particle {
  x: number;
  y: number;
  radius: number;
  hue: number;
  alpha: number;
  vx: number;
  vy: number;
  type: ParticleType;
}

const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    // Top left curve
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
    // Bottom left curve
    ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
    // Bottom right curve
    ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
    // Top right curve
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
    ctx.closePath();
    ctx.fill();
};

const drawBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - size, y - size, size * 2, size * 1.5, size * 0.5);
    ctx.closePath();
    ctx.fill();
};


const DynamicCanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const particles = useRef<Particle[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This will run only on the client, after the initial render.
    setIsClient(true);
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.getContext('2d')?.scale(dpr, dpr);
    
    const { clientWidth: w, clientHeight: h } = canvas;
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const numberOfParticles = Math.floor((w * h) / 35000);
    const particleTypes: ParticleType[] = ['heart', 'bubble', 'circle'];
    
    particles.current = [];
    for (let i = 0; i < numberOfParticles; i++) {
        const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        particles.current.push({
            x: rand(0, w),
            y: rand(0, h),
            radius: rand(5, 15),
            hue: rand(200, 300),
            alpha: rand(0.1, 0.4),
            vx: rand(-0.15, 0.15),
            vy: rand(-0.15, 0.15),
            type: type
        });
    }
  }, []);

  const drawScene = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { clientWidth: w, clientHeight: h } = canvas;
    
    ctx.clearRect(0, 0, w, h);

    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "rgba(240, 245, 255, 0.9)");
    g.addColorStop(1, "rgba(230, 235, 250, 0.75)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    particles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x - p.radius > w) p.x = -p.radius;
        if (p.x + p.radius < 0) p.x = w + p.radius;
        if (p.y - p.radius > h) p.y = -p.radius;
        if (p.y + p.radius < 0) p.y = h + p.radius;

        const floatY = Math.sin(time / (1000 + p.radius * 20)) * 5;
        const particleColor = `hsla(${p.hue}, 80%, 70%, ${p.alpha})`;

        ctx.save();
        ctx.translate(p.x, p.y + floatY);
        
        switch (p.type) {
            case 'heart':
                drawHeart(ctx, 0, 0, p.radius, particleColor);
                break;
            case 'bubble':
                drawBubble(ctx, 0, 0, p.radius, particleColor);
                break;
            case 'circle':
            default:
                const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius * 2);
                grd.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${p.alpha})`);
                grd.addColorStop(0.5, `hsla(${(p.hue + 40) % 360}, 70%, 60%, ${p.alpha * 0.5})`);
                grd.addColorStop(1, `rgba(0,0,0,0)`);
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        ctx.restore();
    });
    
    const gridSize = 50;
    const scrollSpeed = 0.04;
    const offsetX = (time * scrollSpeed) % gridSize;
    const offsetY = (time * scrollSpeed) % gridSize;

    ctx.strokeStyle = "hsla(220, 40%, 50%, 0.07)";
    ctx.lineWidth = 1;
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
    if (!isClient) return; // Don't run this effect on the server

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
  }, [isClient, initCanvas, drawScene]);

  // Render nothing on the server, and the canvas on the client
  if (!isClient) {
    return null;
  }

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
