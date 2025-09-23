"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import AppIcon from '@/components/shared/AppIcon';
import { UserCog } from 'lucide-react';

/*
  Fixed AccessPage
  - Rewritten to be self-contained and defensively coded to avoid runtime errors.
  - Ensures all JSX tags are properly closed (fixes Unterminated JSX contents error).
  - Avoids attaching custom properties to DOM nodes (no canvas._dragging).
  - Uses refs for mutable tray state and dragging state to prevent stale closures.
  - Guards against missing browser APIs (beforeinstallprompt) and null contexts.
*/

type AppType = 'admin' | 'chat';
const CANVAS_WIDTH = 920;
const CANVAS_HEIGHT = 420;

export default function AccessPage(): JSX.Element {
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [toast, setToast] = useState<{ title: string; description?: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // traysRef keeps mutable state of trays so animation loop can read/write without re-rendering
  const traysRef = useRef([
    {
      id: 'admin',
      title: 'Hey Manito Admin',
      description: 'Gestiona asistentes y configuraciones',
      color: 'hsl(var(--primary))', // --primary
      x: CANVAS_WIDTH * 0.22,
      y: CANVAS_HEIGHT * 0.5,
      w: 300,
      h: 260,
      hover: false,
    },
    {
      id: 'chat',
      title: 'Hey Manito Chat',
      description: 'Chatea y crea conversaciones',
      color: 'hsl(var(--accent))', // --accent
      x: CANVAS_WIDTH * 0.78,
      y: CANVAS_HEIGHT * 0.5,
      w: 300,
      h: 260,
      hover: false,
    },
  ] as any[]);

  // draggingRef stores current drag info if any
  const draggingRef = useRef<null | { id: string; ox: number; oy: number }>(null);

  useEffect(() => {
    const handler = (e: any) => {
      try { e.preventDefault(); } catch (err) {}
      setDeferredInstallPrompt(e);
      setIsInstallable(true);
    };
    if (typeof window !== 'undefined' && 'addEventListener' in window) {
      window.addEventListener('beforeinstallprompt', handler);
    }

    try {
      if (typeof window !== 'undefined' && (window as any).matchMedia && (window as any).matchMedia('(display-mode: standalone)').matches) {
        setIsInstallable(false);
      }
    } catch (err) {
      // ignore
    }

    return () => {
      if (typeof window !== 'undefined' && 'removeEventListener' in window) {
        window.removeEventListener('beforeinstallprompt', handler);
      }
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (title: string, description?: string) => setToast({ title, description });

  const handleInstall = useCallback(async (appType: AppType) => {
    if (deferredInstallPrompt && typeof deferredInstallPrompt.prompt === 'function') {
      try {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          showToast('Aplicación instalada', `${appType === 'admin' ? 'Admin' : 'Chat'} instalado.`);
        } else {
          showToast('Instalación cancelada', 'El usuario rechazó o cerró el diálogo.');
        }
      } catch (err) {
        showToast('Error', 'No fue posible iniciar la instalación.');
      } finally {
        setDeferredInstallPrompt(null);
        setIsInstallable(false);
      }
    } else {
      // fallback: navigate to route
      window.location.href = appType === 'admin' ? '/dashboard' : '/chat';
    }
  }, [deferredInstallPrompt]);

  // Helper to draw rounded rect
  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 12) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // device pixel ratio handling
    const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    let last = 0;
    const loop = (t: number) => {
      const trays = traysRef.current;
      const w = CANVAS_WIDTH;
      const h = CANVAS_HEIGHT;

      ctx.clearRect(0, 0, w, h);

      // background
      const bg = ctx.createLinearGradient(0, 0, w, 0);
      bg.addColorStop(0, '#071029');
      bg.addColorStop(1, '#031225');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // subtle particles
      for (let i = 0; i < 28; i++) {
        const px = ((i * 67) % w) + Math.sin(t / (700 + i * 10)) * 6;
        const py = ((i * 53) % h) + Math.cos(t / (900 + i * 7)) * 6;
        ctx.fillStyle = `rgba(255,255,255,${0.01 + Math.abs(Math.sin(t / 800 + i)) * 0.03})`;
        ctx.fillRect(px, py, 1.2, 1.2);
      }

      // draw trays
      trays.forEach((tray) => {
        const float = Math.sin(t / 600 + (tray.id === 'admin' ? 0 : 1.3)) * 6;
        const tilt = Math.sin(t / 900 + (tray.id === 'admin' ? 0 : 1.3)) * 0.02;
        const x = tray.x - tray.w / 2;
        const y = tray.y - tray.h / 2 + float;

        ctx.save();
        ctx.translate(tray.x, tray.y + float);
        ctx.rotate(tilt);
        ctx.translate(-tray.x, -(tray.y + float));

        // shadow
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.24)';
        drawRoundedRect(ctx, x + 6, y + 12, tray.w - 12, tray.h - 20, 20);
        ctx.fill();
        ctx.restore();

        // phone body
        drawRoundedRect(ctx, x, y, tray.w, tray.h, 20);
        ctx.fillStyle = '#0d1b26';
        ctx.fill();

        // screen
        drawRoundedRect(ctx, x + 12, y + 14, tray.w - 24, tray.h - 44, 14);
        const sg = ctx.createLinearGradient(x + 12, y + 14, x + tray.w - 12, y + tray.h - 34);
        sg.addColorStop(0, '#04141b');
        sg.addColorStop(1, '#062230');
        ctx.fillStyle = sg;
        ctx.fill();

        // colored header
        ctx.fillStyle = tray.color;
        drawRoundedRect(ctx, x + 22, y + 26, tray.w - 64, 36, 8);
        ctx.fill();

        // title
        ctx.font = '600 14px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(tray.title, x + 36, y + 50);

        // mock bubbles
        const itemY = y + 84;
        for (let i = 0; i < 4; i++) {
          const bubbleW = 40 + ((i + 2) * 30) % (tray.w - 110);
          const bubbleX = i % 2 === 0 ? x + 28 : x + tray.w - 28 - bubbleW;
          const bubbleH = 16 + ((i * 7) % 22);
          ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)';
          drawRoundedRect(ctx, bubbleX, itemY + i * 36, bubbleW, bubbleH, 8);
          ctx.fill();
        }

        // install pill
        const pillX = x + 22;
        const pillY = y + tray.h - 68;
        drawRoundedRect(ctx, pillX, pillY, 140, 36, 36);
        ctx.fillStyle = tray.hover ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)';
        ctx.fill();
        ctx.font = '700 13px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(isInstallable ? 'Instalar PWA' : 'Abrir', pillX + 18, pillY + 24);

        // small badge
        ctx.beginPath();
        ctx.arc(x + tray.w - 42, y + 44, 16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fill();
        ctx.fillStyle = tray.color;
        ctx.font = '700 16px sans-serif';
        ctx.fillText(tray.id === 'admin' ? 'A' : 'C', x + tray.w - 46, y + 50);

        ctx.restore();
      });

      // hint text
      ctx.font = '600 15px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillText('Interactúa con las bandejas — arrastra, pasa el cursor y haz clic para instalar / abrir', 20, 34);

      last = t;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isInstallable]);

  // interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (evt: PointerEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = (evt as any).clientX ?? 0;
      const clientY = (evt as any).clientY ?? 0;
      return { x: (clientX - rect.left) * (CANVAS_WIDTH / rect.width), y: (clientY - rect.top) * (CANVAS_HEIGHT / rect.height) };
    };

    const onMove = (evt: PointerEvent) => {
      const pos = getPos(evt);
      const trays = traysRef.current;
      trays.forEach((tray) => {
        const tx = tray.x - tray.w / 2;
        const ty = tray.y - tray.h / 2;
        tray.hover = pos.x >= tx && pos.x <= tx + tray.w && pos.y >= ty && pos.y <= ty + tray.h;
      });
    };

    const onDown = (evt: PointerEvent) => {
      const pos = getPos(evt);
      const trays = traysRef.current;
      for (const tray of trays) {
        const tx = tray.x - tray.w / 2;
        const ty = tray.y - tray.h / 2;
        if (pos.x >= tx && pos.x <= tx + tray.w && pos.y >= ty && pos.y <= ty + tray.h) {
          draggingRef.current = { id: tray.id, ox: pos.x - tray.x, oy: pos.y - tray.y };
          break;
        }
      }
    };

    const onUp = (evt: PointerEvent) => {
      const pos = getPos(evt);
      const trays = traysRef.current;
      for (const tray of trays) {
        const tx = tray.x - tray.w / 2;
        const ty = tray.y - tray.h / 2;
        if (pos.x >= tx && pos.x <= tx + tray.w && pos.y >= ty && pos.y <= ty + tray.h) {
          handleInstall(tray.id as AppType);
          break;
        }
      }
      draggingRef.current = null;
    };

    const onMoveDrag = (evt: PointerEvent) => {
      const d = draggingRef.current;
      if (!d) return;
      const pos = getPos(evt);
      const trays = traysRef.current;
      const tray = trays.find((t) => t.id === d.id);
      if (!tray) return;
      tray.x = pos.x - d.ox;
      tray.y = pos.y - d.oy;
      tray.x = Math.max(tray.w / 2 + 24, Math.min(CANVAS_WIDTH - tray.w / 2 - 24, tray.x));
      tray.y = Math.max(tray.h / 2 + 24, Math.min(CANVAS_HEIGHT - tray.h / 2 - 24, tray.y));
    };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointermove', onMoveDrag);

    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointermove', onMoveDrag);
    };
  }, [handleInstall]);

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-xl bg-brand-gradient flex items-center justify-center text-white p-2">
            <AppIcon className="text-white"/>
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-extrabold">Bienvenido a <span className="text-brand-gradient">Hey Manito</span></h1>
          <p className="text-sm text-muted-foreground">Instala las apps PWA o ábrelas directamente desde la web</p>
        </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/5">
            <canvas ref={canvasRef} />
          </div>

          <div className="mt-3 flex gap-3">
            <button
              className="flex-1 py-2 px-3 rounded-md border border-white/6 bg-transparent text-sm"
              onClick={() => showToast('Tip', 'Arrastra las bandejas y haz clic para instalar o abrir.')}
            >
              ¿Cómo funciona?
            </button>

            <button
              className="flex-1 py-2 px-3 rounded-md border border-white/6 text-sm"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            >
              Ver más opciones
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl border border-white/6 shadow-md bg-gradient-to-b from-slate-900 to-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <UserCog stroke="hsl(var(--primary))" strokeWidth="1.5" />
                </div>
                <div>
                  <div className="font-semibold">Hey Manito Admin</div>
                  <div className="text-xs text-muted-foreground">Gestiona asistentes, bases de datos y configuraciones.</div>
                </div>
              </div>
              <div>
                <button className="py-2 px-3 rounded-md bg-primary text-primary-foreground text-sm" onClick={() => handleInstall('admin')}>
                  {isInstallable ? 'Instalar' : 'Abrir'}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/6 shadow-md bg-gradient-to-b from-slate-900 to-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-accent/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="hsl(var(--accent))" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div className="font-semibold">Hey Manito Chat</div>
                  <div className="text-xs text-muted-foreground">Chatea con tus asistentes o inicia nuevas conversaciones.</div>
                </div>
              </div>
              <div>
                <button className="py-2 px-3 rounded-md bg-accent text-accent-foreground text-sm" onClick={() => handleInstall('chat')}>
                  {isInstallable ? 'Instalar' : 'Abrir'}
                </button>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400">Consejo: Si usas Chrome/Edge en móvil, verás la opción "Añadir a pantalla de inicio" cuando la PWA esté lista para instalar.</div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800/90 text-white p-3 rounded-md shadow-xl">
          <div className="font-semibold">{toast.title}</div>
          {toast.description && <div className="text-sm text-slate-200">{toast.description}</div>}
        </div>
      )}
    </div>
  );
}
