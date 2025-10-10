
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { FaWhatsapp, FaRobot } from 'react-icons/fa';

const DualPhoneMockup = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | null>(null);

    const drawPhoneFrame = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, time: number, rotation: number) => {
        const floatY = Math.sin((time + x) / 500) * 3;
        
        ctx.save();
        ctx.translate(x, y + floatY);
        ctx.rotate(rotation);

        // Frame
        ctx.fillStyle = '#1a1a1a'; // Dark grey for phone body
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.roundRect(-width / 2, -height / 2, width, height, 30);
        ctx.stroke();
        ctx.fill();

        // Screen
        ctx.fillStyle = '#f0f2f5'; // Light grey for screen
        ctx.beginPath();
        ctx.roundRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, 22);
        ctx.fill();
        
        // Notch
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.roundRect(-30, -height/2 + 8, 60, 20, 10);
        ctx.fill();

        ctx.restore();
    };
    
    const drawDashboardScreen = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, time: number, rotation: number) => {
        ctx.save();
        const floatY = Math.sin((time + x) / 500) * 3;
        ctx.translate(x, y + floatY);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.roundRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, 22);
        ctx.clip();

        // Header
        ctx.fillStyle = '#fff';
        ctx.fillRect(-width / 2 + 8, -height / 2 + 8, width - 16, 50);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText("Mis Asistentes", -width / 2 + 20, -height / 2 + 38);

        // Assistant Cards
        const cardWidth = width - 48;
        const cardHeight = 60;
        for (let i = 0; i < 3; i++) {
            const cardY = -height / 2 + 70 + i * (cardHeight + 10);
            
            // Card background
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.roundRect(-width/2 + 24, cardY, cardWidth, cardHeight, 10);
            ctx.fill();
            
            // Icon
            ctx.fillStyle = '#8B5CF6'; // primary
            ctx.beginPath();
            ctx.arc(-width / 2 + 50, cardY + cardHeight / 2, 16, 0, Math.PI * 2);
            ctx.fill();
            
            // Text
            ctx.fillStyle = '#111827';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`Asistente ${i === 0 ? 'Ventas' : i === 1 ? 'Soporte' : 'Citas'}`, -width / 2 + 80, cardY + 25);
            ctx.fillStyle = '#6B7280';
            ctx.font = '10px sans-serif';
            ctx.fillText(i === 1 ? 'Inactivo' : 'Activo', -width / 2 + 80, cardY + 40);
        }
        ctx.restore();
    }

    const drawWhatsAppScreen = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, time: number, rotation: number) => {
        ctx.save();
        const floatY = Math.sin((time + x) / 500) * 3;
        ctx.translate(x, y + floatY);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.roundRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, 22);
        ctx.clip();

        // Background
        ctx.fillStyle = '#e5ddd5';
        ctx.fillRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16);

        const headerHeight = 50;
        const footerHeight = 45;
        const chatAreaHeight = height - 16 - headerHeight - footerHeight;

        // Header
        ctx.fillStyle = '#075E54'; // WhatsApp Green
        ctx.fillRect(-width / 2 + 8, -height / 2 + 8, width - 16, headerHeight);
        ctx.fillStyle = '#fff';
        // Draw avatar circle
        ctx.beginPath();
        ctx.arc(-width/2 + 35, -height/2 + 33, 15, 0, 2 * Math.PI);
        ctx.fillStyle = '#ccc';
        ctx.fill();
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText("Cliente", -width / 2 + 60, -height / 2 + 38);

        // Chat Bubbles
        const messages = [
            { from: 'user', text: 'Hola, ¿tienen pizzas?' },
            { from: 'bot', text: '¡Hola! Sí, tenemos de...' },
            { from: 'user', text: 'Una de peperoni, porfa.' },
            { from: 'bot', text: 'Claro, son $150. ¿Confirmo?' },
        ];
        
        let messageY = -height / 2 + headerHeight + 20;
        messages.forEach((msg) => {
             const bubbleWidth = ctx.measureText(msg.text).width + 20;
             const bubbleHeight = 30;
             const isUser = msg.from === 'user';
             
             ctx.fillStyle = isUser ? '#dcf8c6' : '#fff'; // WhatsApp bubble colors
             const bubbleX = isUser ? width/2 - bubbleWidth - 20 : -width/2 + 20;
             
             ctx.beginPath();
             ctx.roundRect(bubbleX, messageY, bubbleWidth, bubbleHeight, 8);
             ctx.fill();
             
             ctx.fillStyle = '#111';
             ctx.font = '11px sans-serif';
             ctx.fillText(msg.text, bubbleX + 10, messageY + 19);
             
             messageY += bubbleHeight + 10;
        });

        // Footer Input
        const footerY = height/2 - footerHeight - 8;
        ctx.fillStyle = '#f0f2f5';
        ctx.fillRect(-width/2 + 8, footerY, width - 16, footerHeight);

        // Input field
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.roundRect(-width/2 + 18, footerY + 7, width - 80, footerHeight - 14, 15);
        ctx.fill();

        // Send button
        ctx.fillStyle = '#075E54';
        ctx.beginPath();
        ctx.arc(width/2 - 32, footerY + footerHeight/2, 16, 0, Math.PI * 2);
        ctx.fill();


        ctx.restore();
    }

    const animate = useCallback((time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.parentElement!.clientWidth * dpr;
        canvas.height = canvas.parentElement!.clientHeight * dpr;
        ctx.scale(dpr, dpr);
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;

        ctx.clearRect(0, 0, w, h);

        const phoneWidth = 220;
        const phoneHeight = 450;
        const gap = -40;
        
        const totalWidth = phoneWidth * 2 + gap;
        const startX = (w - totalWidth) / 2;

        const rotation1 = -0.05 + Math.sin(time / 1000) * 0.01;
        const rotation2 = 0.05 + Math.cos(time / 1000) * 0.01;

        // Phone 1 (Dashboard)
        const x1 = startX + phoneWidth / 2;
        drawPhoneFrame(ctx, x1, h / 2, phoneWidth, phoneHeight, time, rotation1);
        drawDashboardScreen(ctx, x1, h / 2, phoneWidth, phoneHeight, time, rotation1);
        
        // Phone 2 (WhatsApp Chat)
        const x2 = startX + phoneWidth + gap + phoneWidth / 2;
        drawPhoneFrame(ctx, x2, h / 2, phoneWidth, phoneHeight, time, rotation2);
        drawWhatsAppScreen(ctx, x2, h / 2, phoneWidth, phoneHeight, time, rotation2);


        animationFrameId.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        animationFrameId.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [animate]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default DualPhoneMockup;
