
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
        let particles: any[] = [];
        const numParticles = 50;
        const iconSize = 60;
        let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX * dpr;
            mouse.y = e.clientY * dpr;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < numParticles; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 3 + 1,
                    baseX: Math.random() * canvas.width,
                    baseY: Math.random() * canvas.height,
                    density: (Math.random() * 30) + 1,
                    color: `hsla(${Math.random() * 50 + 240}, 80%, 60%, ${Math.random() * 0.5 + 0.2})`
                });
            }
        };

        const drawIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, time: number) => {
            const floatY = Math.sin(time / 800) * 8;
            const glowSize = size + Math.sin(time / 600) * 5;

            const glow = ctx.createRadialGradient(x, y + floatY, size * 0.4, x, y + floatY, glowSize);
            glow.addColorStop(0, 'hsla(262, 80%, 58%, 0.4)'); 
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);

            ctx.fillStyle = 'hsl(262, 80%, 58%)';
            ctx.beginPath();
            ctx.roundRect(x - size/2, y - size/2 + floatY, size, size, size * 0.2);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.fillRect(x - size/4, y - size/4 + floatY, size/6, size/2);
            ctx.fillRect(x + size/12, y - size/4 + floatY, size/6, size/2);
            ctx.fillRect(x - size/4, y - size/12 + floatY, size/2, size/6);
        };

        const animate = (time: number) => {
            const w = canvas.width;
            const h = canvas.height;

            ctx.clearRect(0, 0, w, h);

            particles.forEach(p => {
                let dx = mouse.x - p.x;
                let dy = mouse.y - p.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let maxDistance = 200 * dpr;
                let force = (maxDistance - distance) / maxDistance;
                
                let directionX = forceDirectionX * force * p.density;
                let directionY = forceDirectionY * force * p.density;
                
                if (distance < maxDistance) {
                    p.x -= directionX;
                    p.y -= directionY;
                } else {
                    if (p.x !== p.baseX) {
                        let dx = p.x - p.baseX;
                        p.x -= dx / 10;
                    }
                    if (p.y !== p.baseY) {
                        let dy = p.y - p.baseY;
                        p.y -= dy / 10;
                    }
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });
            
            drawIcon(ctx, w / 2 / dpr, h / 2 / dpr, iconSize, time);

            animationFrameId = requestAnimationFrame(animate);
        };
        
        initParticles();
        animate(0);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
            <canvas ref={canvasRef} className="absolute inset-0 z-0" />
            <div className="relative z-10 text-center">
                <p className="text-xl font-semibold text-foreground animate-pulse flex items-center gap-2">
                   Cargando...
                </p>
            </div>
             {status === 'loading' && (
                <div className="absolute bottom-10 z-10">
                    <FaSpinner className="animate-spin h-6 w-6 text-primary" />
                </div>
            )}
        </div>
    );
};

export default LoadPage;
