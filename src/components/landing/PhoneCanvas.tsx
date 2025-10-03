
"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { FaPaperPlane, FaPlus, FaRobot, FaUser } from 'react-icons/fa';

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
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    let frame = 0;
    let tiltX = 0;
    let tiltY = 0;
    let animationFrameId: number;
    
    const phoneW = 180;
    const phoneH = phoneW * 2.1;

    const drawPhone = (rotationX: number, rotationY: number) => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const x = (w - phoneW) / 2;
        const y = (h - phoneH) / 2 - 20; // Adjusted for better centering
        const borderRadius = 40;

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(rotationX * 0.1);
        ctx.translate(-w / 2, -h / 2);

        ctx.shadowColor = "rgba(0,0,0,0.2)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = rotationX * -15 + 5;
        ctx.shadowOffsetY = 15;
        
        // Phone Body
        const phoneGradient = ctx.createLinearGradient(x, y, x, y + phoneH);
        phoneGradient.addColorStop(0, '#f0f0f0');
        phoneGradient.addColorStop(1, '#e0e0e0');
        ctx.fillStyle = phoneGradient;
        ctx.beginPath();
        ctx.roundRect(x, y, phoneW, phoneH, borderRadius);
        ctx.fill();
        
        // Screen
        ctx.shadowColor = "transparent";
        const margin = 12;
        const screenW = phoneW - margin * 2;
        const screenH = phoneH - margin * 2;
        const screenX = x + margin;
        const screenY = y + margin;
        
        ctx.fillStyle = "#E0F2E0"; // WhatsApp-like background
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, screenW, screenH, 28);
        ctx.fill();

        // Notch
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.roundRect(x + phoneW / 2 - 25, y, 50, 8, 5);
        ctx.fill();
        
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, screenW, screenH, 28);
        ctx.clip();
        drawScreenContent(ctx, screenX, screenY, screenW, screenH, frame);
        ctx.restore();
        
        ctx.restore();
    };

    const animate = () => {
      frame++;
      const targetX = mousePos.current.x;
      const targetY = mousePos.current.y;

      tiltX = lerp(tiltX, targetX, 0.05);
      tiltY = lerp(tiltY, targetY, 0.05);

      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      drawPhone(tiltX, tiltY);

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

function drawScreenContent(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: number) {
    const headerH = 40;
    const footerH = 45;
    const padding = 10;
    
    // Header
    ctx.fillStyle = "#075E54";
    ctx.fillRect(x, y, w, headerH);
    ctx.fillStyle = "white";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Mi Pizzería", x + padding + 30, y + headerH / 2 + 4);
    
    // Avatar in header
    ctx.fillStyle = "#ccc";
    ctx.beginPath();
    ctx.arc(x + padding + 12, y + headerH / 2, 12, 0, Math.PI * 2);
    ctx.fill();

    // Messages
    const contentY = y + headerH;
    const contentH = h - headerH - footerH;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, contentY, w, contentH);
    ctx.clip();
    
    drawBubble(ctx, "Hola, me interesa una pizza.", true, x, contentY + 20, w, frame, 0, padding);
    drawTypingIndicator(ctx, x, contentY + 70, w, frame, 60, padding);
    drawBubble(ctx, "¡Claro! La de peperoni cuesta $150.", false, x, contentY + 70, w, frame, 140, padding);

    ctx.restore();

    // Footer
    const footerY = y + h - footerH;
    ctx.fillStyle = "#F0F0F0";
    ctx.fillRect(x, footerY, w, footerH);
    
    // Input field
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.roundRect(x + padding, footerY + 8, w - (padding * 2) - 40, footerH - 16, 15);
    ctx.fill();
    
    // Send button
    ctx.fillStyle = "#128C7E";
    ctx.beginPath();
    ctx.arc(x + w - padding - 18, footerY + footerH / 2, 16, 0, Math.PI * 2);
    ctx.fill();
}

function drawBubble(ctx: CanvasRenderingContext2D, text: string, isUser: boolean, screenX: number, yPos: number, screenW: number, frame: number, delay: number, padding: number) {
    const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
    if (progress === 0) return;

    ctx.font = "11px sans-serif";
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const bubbleWidth = textWidth + 16;
    const bubbleHeight = 30;
    
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const animatedWidth = bubbleWidth * easedProgress;
    
    const bubbleX = isUser ? screenX + screenW - animatedWidth - padding : screenX + padding;
    
    ctx.globalAlpha = easedProgress;
    ctx.fillStyle = isUser ? "#DCF8C6" : "#FFFFFF";
    
    ctx.beginPath();
    ctx.roundRect(bubbleX, yPos, animatedWidth, bubbleHeight, 8);
    ctx.fill();
    
    if (progress > 0.8) {
        ctx.globalAlpha = (progress - 0.8) * 5;
        ctx.fillStyle = "#111";
        ctx.textAlign = isUser ? "right" : "left";
        const textX = isUser ? bubbleX + animatedWidth - 8 : bubbleX + 8;
        ctx.fillText(text, textX, yPos + bubbleHeight / 2 + 4);
    }
    ctx.globalAlpha = 1;
}

function drawTypingIndicator(ctx: CanvasRenderingContext2D, screenX: number, yPos: number, screenW: number, frame: number, delay: number, padding: number) {
    const startProgress = Math.max(0, Math.min(1, (frame - delay) / 20));
    if (startProgress === 0) return;

    const endProgress = Math.max(0, Math.min(1, (frame - (delay + 60)) / 20));
    const alpha = startProgress * (1 - endProgress);
    if (alpha <= 0) return;

    const bubbleWidth = 50;
    const bubbleHeight = 30;
    const yOffset = (1 - startProgress) * 10;
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#FFFFFF";
    
    ctx.beginPath();
    ctx.roundRect(screenX + padding, yPos + yOffset, bubbleWidth, bubbleHeight, 8);
    ctx.fill();
    
    for (let i = 0; i < 3; i++) {
        const dotPhase = (frame - (delay + 15 + i * 10)) / 20;
        const dotYOffset = Math.sin(dotPhase * Math.PI) * -2;
        ctx.fillStyle = `rgba(0, 0, 0, 0.4)`;
        ctx.beginPath();
        ctx.arc(screenX + padding + 15 + i * 10, yPos + bubbleHeight / 2 + dotYOffset, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.globalAlpha = 1;
}

export default PhoneCanvas;
