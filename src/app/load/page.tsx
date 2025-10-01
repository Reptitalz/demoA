
"use client";

import React, { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaSpinner } from 'react-icons/fa';

const LoadPage = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/chat/dashboard');
        } else if (status === 'unauthenticated') {
            router.replace('/chat');
        }
    }, [status, router]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        
        let animationFrameId: number;
        const iconSize = 80;

        const drawIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            const glow = ctx.createRadialGradient(x, y, size * 0.5, x, y, size);
            glow.addColorStop(0, 'hsla(var(--primary), 0.5)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(x - size * 1.5, y - size * 1.5, size * 3, size * 3);

            ctx.fillStyle = 'hsl(var(--primary))';
            ctx.beginPath();
            ctx.roundRect(x - size/2, y - size/2, size, size, size * 0.2);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.fillRect(x - size/4, y - size/4, size/6, size/2);
            ctx.fillRect(x + size/12, y - size/4, size/6, size/2);
            ctx.fillRect(x - size/4, y - size/12, size/2, size/6);
        };

        const animate = (time: number) => {
            const w = canvas.width / dpr;
            const h = canvas.height / dpr;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const bounceX = Math.sin(time / 500) * (w / 4);
            const jumpY = Math.abs(Math.sin(time / 400)) * 40;

            const iconX = w / 2 + bounceX;
            const iconY = h / 2 - jumpY;

            drawIcon(ctx, iconX, iconY, iconSize);

            animationFrameId = requestAnimationFrame(animate);
        };
        
        animate(0);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
            <canvas ref={canvasRef} className="absolute inset-0" />
            <div className="relative z-10 text-center">
                <p className="text-xl font-semibold text-foreground animate-pulse flex items-center gap-2">
                   Cargando...
                </p>
            </div>
             {status === 'loading' && (
                <div className="absolute bottom-10">
                    <FaSpinner className="animate-spin h-6 w-6 text-primary" />
                </div>
            )}
        </div>
    );
};

export default LoadPage;
