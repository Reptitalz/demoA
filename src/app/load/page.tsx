
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaSpinner } from 'react-icons/fa';
import AppIcon from '@/components/shared/AppIcon';
import { motion } from 'framer-motion';

const LoadPage = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { status } = useSession();
    const router = useRouter();
    const [isMinTimePassed, setIsMinTimePassed] = useState(false);

    useEffect(() => {
        // Set a minimum display time of 3 seconds
        const timer = setTimeout(() => {
            setIsMinTimePassed(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);


    useEffect(() => {
        // Only redirect when both conditions are met:
        // 1. The minimum time has passed.
        // 2. The session status has been determined.
        if (isMinTimePassed && status !== 'loading') {
            if (status === 'authenticated') {
                router.replace('/chat/dashboard');
            } else if (status === 'unauthenticated') {
                router.replace('/chat');
            }
        }
    }, [status, router, isMinTimePassed]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        
        let animationFrameId: number;
        let particles: any[] = [];
        const numParticles = 50;
        let mouse = { x: w / 2, y: h / 2 };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < numParticles; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    radius: Math.random() * 3 + 1,
                    baseX: Math.random() * w,
                    baseY: Math.random() * h,
                    density: (Math.random() * 30) + 1,
                    color: `hsla(${Math.random() * 50 + 240}, 80%, 60%, ${Math.random() * 0.5 + 0.2})`
                });
            }
        };

        const animate = (time: number) => {
            ctx.clearRect(0, 0, w, h);

            particles.forEach(p => {
                let dx = mouse.x - p.x;
                let dy = mouse.y - p.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let maxDistance = 100;
                let force = (maxDistance - distance) / maxDistance;
                
                let directionX = forceDirectionX * force * p.density;
                let directionY = forceDirectionY * force * p.density;
                
                if (distance < maxDistance) {
                    p.x -= directionX;
                    p.y -= directionY;
                } else {
                    if (p.x !== p.baseX) {
                        let dx_base = p.x - p.baseX;
                        p.x -= dx_base / 10;
                    }
                    if (p.y !== p.baseY) {
                        let dy_base = p.y - p.baseY;
                        p.y -= dy_base / 10;
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
            if(animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
            <canvas ref={canvasRef} className="absolute inset-0 z-0" />
            <div className="relative z-10 text-center flex flex-col items-center">
                 <motion.div
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 >
                    <AppIcon className="h-24 w-24 drop-shadow-2xl" />
                 </motion.div>
                <p className="text-xl font-semibold text-foreground mt-4 animate-pulse flex items-center gap-2">
                   Cargando...
                </p>
            </div>
             {status === 'loading' && (
                <div className="absolute bottom-10 z-10 flex flex-col items-center gap-2 text-center">
                    <FaSpinner className="animate-spin h-6 w-6 text-primary" />
                    <p className="text-xs text-muted-foreground">Hey Manito App</p>
                </div>
            )}
        </div>
    );
};

export default LoadPage;
