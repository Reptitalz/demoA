
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

const PhoneCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mousePos = useRef({ x: 0, y: 0 });

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        mousePos.current = {
            x: (e.clientX - rect.left - rect.width / 2) / (rect.width / 2),
            y: (e.clientY - rect.top - rect.height / 2) / (rect.height / 2),
        };
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        let frame = 0;
        let currentRotationX = 0;
        let currentRotationY = 0;

        const drawPhone = (
            rotationX: number,
            rotationY: number
        ) => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            const phoneW = w * 0.5;
            const phoneH = phoneW * 1.95;
            const x = (w - phoneW) / 2;
            const y = (h - phoneH) / 2;

            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.rotate(rotationX * -0.1);
            ctx.translate(-w / 2, -h / 2);
            ctx.translate(0, rotationY * -10);

            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetX = rotationX * -10 + 5;
            ctx.shadowOffsetY = 15;
            
            ctx.fillStyle = '#1C1C1E';
            ctx.beginPath();
            ctx.roundRect(x, y, phoneW, phoneH, 30);
            ctx.fill();

            ctx.shadowColor = 'transparent';

            const screenMargin = 10;
            const screenW = phoneW - screenMargin * 2;
            const screenH = phoneH - screenMargin * 2;
            const screenX = x + screenMargin;
            const screenY = y + screenMargin;
            ctx.fillStyle = '#f0f5ff';
            ctx.beginPath();
            ctx.roundRect(screenX, screenY, screenW, screenH, 20);
            ctx.fill();
            
            ctx.fillStyle = '#1C1C1E';
            ctx.beginPath();
            ctx.roundRect(x + phoneW / 2 - 40, y + screenMargin, 80, 5, 2.5);
            ctx.fill();

            ctx.save();
            ctx.beginPath();
            ctx.rect(screenX, screenY, screenW, screenH);
            ctx.clip();

            const bubblePadding = 10;
            const bubbleW = screenW - bubblePadding * 2;
            
            const drawBubble = (text: string, isUser: boolean, yPos: number, delay: number) => {
                const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
                if (progress === 0) return;

                ctx.font = '10px sans-serif';
                const metrics = ctx.measureText(text);
                const textWidth = metrics.width;
                const bubbleHeight = 24;
                const bubbleContentWidth = textWidth + 20;

                const animatedWidth = bubbleContentWidth * progress;
                const bubbleX = screenX + bubblePadding;

                ctx.globalAlpha = progress;
                ctx.fillStyle = isUser ? 'hsl(var(--primary))' : '#ffffff';
                ctx.beginPath();
                if (isUser) {
                    ctx.roundRect(bubbleX + bubbleW - animatedWidth, yPos, animatedWidth, bubbleHeight, 12);
                } else {
                    ctx.roundRect(bubbleX, yPos, animatedWidth, bubbleHeight, 12);
                }
                ctx.fill();

                if (progress > 0.8) {
                    const textProgress = (progress - 0.8) * 5;
                    ctx.globalAlpha = textProgress;
                    ctx.fillStyle = isUser ? '#ffffff' : '#000000';
                    const textX = isUser ? (bubbleX + bubbleW - bubbleContentWidth + 10) : (bubbleX + 10);
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, textX, yPos + bubbleHeight / 2);
                }
            };

            const drawTypingIndicator = (yPos: number, delay: number) => {
                const startProgress = Math.max(0, Math.min(1, (frame - delay) / 20));
                if (startProgress === 0) return;

                const endProgress = Math.max(0, Math.min(1, (frame - (delay + 60)) / 20));

                const bubbleHeight = 24;
                const bubbleWidth = 40;
                
                const yOffset = (1 - startProgress) * 10;
                ctx.globalAlpha = startProgress * (1 - endProgress);


                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.roundRect(screenX + bubblePadding, yPos + yOffset, bubbleWidth, bubbleHeight, 12);
                ctx.fill();

                for (let i = 0; i < 3; i++) {
                    const dotProgress = Math.max(0, Math.min(1, (frame - (delay + 10 + i * 15)) / 15));
                    const dotYOffset = Math.sin(dotProgress * Math.PI) * -2;
                    ctx.fillStyle = `rgba(0, 0, 0, ${0.2 + dotProgress * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(screenX + bubblePadding + 12 + i * 8, yPos + bubbleHeight/2 + dotYOffset, 2, 0, Math.PI * 2);
                    ctx.fill();
                }

            }
            
            ctx.globalAlpha = 1;

            drawBubble('¿Tienes pasteles de chocolate?', true, screenY + 20, 0);
            drawTypingIndicator(screenY + 50, 40);
            drawBubble('Sí, para 10 personas cuesta $350.', false, screenY + 50, 100);
            drawBubble('¿Te gustaría ordenar uno?', false, screenY + 80, 150);
            
            ctx.restore();
            ctx.restore();
        };

        const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

        let animationFrameId: number;
        const animate = () => {
            frame++;
            const targetRotationX = mousePos.current.x * 0.3;
            const targetRotationY = mousePos.current.y * 0.3;
            
            currentRotationX = lerp(currentRotationX, targetRotationX, 0.05);
            currentRotationY = lerp(currentRotationY, targetRotationY, 0.05);

            ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

            drawPhone(currentRotationX, currentRotationY);

            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => cancelAnimationFrame(animationFrameId);
    }, [handleMouseMove]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default PhoneCanvas;
