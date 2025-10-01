
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
            <div className="relative z-10 text-center flex flex-col items-center">
                 <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-lg animate-pulse" style={{ animationDuration: '3s' }}>
                  <style>
                    {`
                      @keyframes float {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                        100% { transform: translateY(0px); }
                      }
                      .icon-float {
                        animation: float 4s ease-in-out infinite;
                      }
                    `}
                  </style>
                  <g className="icon-float">
                    <defs>
                        <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 1}} />
                            <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity: 1}} />
                        </linearGradient>
                         <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <path 
                      d="M20,10 C14.477,10 10,14.477 10,20 L10,80 C10,85.523 14.477,90 20,90 L80,90 C85.523,90 90,85.523 90,80 L90,20 C90,14.477 85.523,10 80,10 L20,10 Z" 
                      fill="url(#icon-gradient)"
                      filter="url(#glow)"
                    />
                    <path 
                      d="M35,30 L35,70 M65,30 L65,70 M35,48 L65,48" 
                      stroke="white" 
                      strokeWidth="8" 
                      strokeLinecap="round"
                    />
                  </g>
                </svg>
                <p className="text-xl font-semibold text-foreground mt-4 animate-pulse flex items-center gap-2">
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
