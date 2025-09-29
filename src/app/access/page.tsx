
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { APP_NAME } from '@/config/appConfig';
import { FaArrowRight, FaDownload } from 'react-icons/fa';

/*
  New AccessPage:
  - Features a single, interactive floating icon on a canvas.
  - Simplified layout focusing on the animation and a single call to action.
  - Allows users to drag the icon. Clicking it proceeds to the next step.
*/

const CANVAS_WIDTH = 920;
const CANVAS_HEIGHT = 420;

export default function AccessPage(): JSX.Element {
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const iconRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    w: 120,
    h: 120,
    vx: 0.5,
    vy: 0.5,
    hover: false,
  });
  const draggingRef = useRef<null | { ox: number; oy: number }>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setIsInstallable(true);
    };
    if (typeof window !== 'undefined' && 'addEventListener' in window) {
      window.addEventListener('beforeinstallprompt', handler);
    }
    return () => {
      if (typeof window !== 'undefined' && 'removeEventListener' in window) {
        window.removeEventListener('beforeinstallprompt', handler);
      }
    };
  }, []);

  const handlePrimaryAction = useCallback(async () => {
    if (isInstallable && deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          toast({ title: 'Instalación completa', description: `${APP_NAME} se ha instalado en tu dispositivo.` });
        }
      } catch (err) {
        window.location.href = '/chat';
      }
    } else {
      window.location.href = '/chat';
    }
  }, [isInstallable, deferredInstallPrompt, toast]);

  const drawIcon = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      // Create a glow effect
      const glow = ctx.createRadialGradient(x, y, size * 0.4, x, y, size * 0.7);
      glow.addColorStop(0, 'hsla(var(--primary), 0.3)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);

      // Draw main body (simulating AppIcon)
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.beginPath();
      ctx.roundRect(x - size/2, y - size/2, size, size, size * 0.2);
      ctx.fill();

      // Simple "H"
      ctx.fillStyle = 'white';
      ctx.fillRect(x - size/4, y - size/4, size/6, size/2);
      ctx.fillRect(x + size/12, y - size/4, size/6, size/2);
      ctx.fillRect(x - size/4, y - size/12, size/2, size/6);
  }, []);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const loop = (t: number) => {
      const icon = iconRef.current;
      const w = CANVAS_WIDTH;
      const h = CANVAS_HEIGHT;

      ctx.clearRect(0, 0, w, h);

      // Background gradient (always light)
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#f0f5ff'); // Light blue start
      bg.addColorStop(1, '#e6ebfa'); // Light blue end
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Draw subtle grid
      ctx.strokeStyle = 'hsla(var(--primary), 0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < w; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      for (let i = 0; i < h; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }

      // Update and draw icon if not dragging
      if (!draggingRef.current) {
        icon.x += icon.vx;
        icon.y += icon.vy;

        if (icon.x < icon.w / 2 || icon.x > w - icon.w / 2) icon.vx *= -1;
        if (icon.y < icon.h / 2 || icon.y > h - icon.h / 2) icon.vy *= -1;
      }
      
      const floatY = Math.sin(t / 800) * 4;
      drawIcon(ctx, icon.x, icon.y + floatY, icon.w / 2);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [drawIcon]); // Re-run effect if theme changes

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (evt: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (evt.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const y = (evt.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      return { x, y };
    };

    const onDown = (evt: PointerEvent) => {
      const pos = getPos(evt);
      const icon = iconRef.current;
      const dist = Math.hypot(pos.x - icon.x, pos.y - icon.y);
      if (dist < icon.w / 2) {
        draggingRef.current = { ox: pos.x - icon.x, oy: pos.y - icon.y };
        canvas.style.cursor = 'grabbing';
      }
    };

    const onMove = (evt: PointerEvent) => {
        const pos = getPos(evt);
        const icon = iconRef.current;
      if (draggingRef.current) {
        icon.x = Math.max(icon.w / 2, Math.min(CANVAS_WIDTH - icon.w / 2, pos.x - draggingRef.current.ox));
        icon.y = Math.max(icon.h / 2, Math.min(CANVAS_HEIGHT - icon.h / 2, pos.y - draggingRef.current.oy));
      } else {
        const dist = Math.hypot(pos.x - icon.x, pos.y - icon.y);
        canvas.style.cursor = dist < icon.w / 2 ? 'grab' : 'default';
      }
    };

    const onUp = (evt: PointerEvent) => {
        if (draggingRef.current) {
            draggingRef.current = null;
            canvas.style.cursor = 'grab';
        } else {
            const pos = getPos(evt);
            const icon = iconRef.current;
            const dist = Math.hypot(pos.x - icon.x, pos.y - icon.y);
            if (dist < icon.w / 2) {
                handlePrimaryAction();
            }
        }
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
    };
  }, [handlePrimaryAction]);


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] p-4">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Bienvenido a <span className="text-brand-gradient">{APP_NAME}</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          La plataforma para crear y gestionar asistentes de IA para tu negocio.
        </p>

        <div className="mt-8 rounded-2xl overflow-hidden shadow-2xl border border-primary/10">
          <canvas ref={canvasRef} />
        </div>
        
        <p className="mt-4 text-sm text-muted-foreground">
          Interactúa con el ícono: arrástralo o haz clic para continuar.
        </p>

        <div className="mt-8">
            <Button size="lg" onClick={handlePrimaryAction}>
              {isInstallable ? (
                <>
                  <FaDownload className="mr-2 h-5 w-5" /> Instalar App
                </>
              ) : (
                <>
                  Continuar a la App <FaArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
        </div>
      </div>
    </div>
  );
}
