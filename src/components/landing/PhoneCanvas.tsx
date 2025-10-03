
"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { FaPaperPlane, FaPlus, FaRobot, FaUser, FaPaperclip } from 'react-icons/fa';

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
        const y = (h - phoneH) / 2;

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(rotationX * 0.1);
        ctx.translate(-w / 2, -h / 2);

        ctx.shadowColor = "rgba(0,0,0,0.2)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = rotationX * -15 + 5;
        ctx.shadowOffsetY = 15;
        
        // Phone Body
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.roundRect(x, y, phoneW, phoneH, 40);
        ctx.fill();

        // Reflective glare
        ctx.save();
        ctx.clip(new Path2D(ctx.roundRect(x,y, phoneW, phoneH, 40).roundRect));
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.ellipse(x + phoneW * 0.8 + (tiltX * -40), y + phoneH * 0.2 + (tiltY * -40), 100, 200, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Screen
        ctx.shadowColor = "transparent";
        const margin = 12;
        const screenW = phoneW - margin * 2;
        const screenH = phoneH - margin * 2;
        const screenX = x + margin;
        const screenY = y + margin;
        
        ctx.fillStyle = "hsl(220, 20%, 98%)"; // background
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, screenW, screenH, 28);
        ctx.fill();

        // Notch
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.roundRect(x + phoneW / 2 - 25, y + 5, 50, 8, 5);
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

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = context.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

function drawBubble(ctx: CanvasRenderingContext2D, text: string, isUser: boolean, screenX: number, yPos: number, screenW: number, frame: number, delay: number, padding: number) {
    const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
    if (progress === 0) return;

    ctx.font = "10px sans-serif";
    const maxWidth = screenW * 0.7;
    const lines = wrapText(ctx, text, maxWidth);
    
    const bubblePadding = 8;
    const lineHeight = 12;
    const bubbleHeight = (lines.length * lineHeight) + (bubblePadding * 2) - 4;
    
    let bubbleWidth = 0;
    if (lines.length === 1) {
        bubbleWidth = ctx.measureText(lines[0]).width + (bubblePadding * 2);
    } else {
        bubbleWidth = maxWidth + (bubblePadding * 2);
    }
    
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const animatedWidth = bubbleWidth * easedProgress;
    const avatarSize = 24;
    const avatarMargin = 5;

    const bubbleX = isUser 
        ? screenX + screenW - animatedWidth - padding - avatarSize - avatarMargin
        : screenX + padding + avatarSize + avatarMargin;
    
    ctx.globalAlpha = easedProgress;

    // Draw Avatar
    ctx.fillStyle = isUser ? "hsl(var(--secondary))" : "hsl(var(--muted))";
    const avatarX = isUser ? screenX + screenW - padding - avatarSize / 2 : screenX + padding + avatarSize / 2;
    ctx.beginPath();
    ctx.arc(avatarX, yPos + bubbleHeight - avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw Bubble
    ctx.fillStyle = isUser ? "hsl(var(--primary))" : "hsl(var(--card))";
    ctx.strokeStyle = isUser ? "hsl(var(--primary))" : "hsl(var(--border))";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bubbleX, yPos, animatedWidth, bubbleHeight, 12);
    ctx.fill();
    ctx.stroke();
    
    if (progress > 0.8) {
        ctx.globalAlpha = (progress - 0.8) * 5;
        ctx.fillStyle = isUser ? "hsl(var(--primary-foreground))" : "hsl(var(--card-foreground))";
        ctx.textAlign = "left";
        const textX = bubbleX + bubblePadding;
        
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], textX, yPos + bubblePadding + (i * lineHeight));
        }
    }
    ctx.globalAlpha = 1;
}

function drawTypingIndicator(ctx: CanvasRenderingContext2D, screenX: number, yPos: number, screenW: number, frame: number, delay: number, padding: number) {
    const startProgress = Math.max(0, Math.min(1, (frame - delay) / 20));
    if (startProgress === 0) return;

    const endProgress = Math.max(0, Math.min(1, (frame - (delay + 80)) / 20));
    const alpha = startProgress * (1 - endProgress);
    if (alpha <= 0) return;

    const bubbleWidth = 50;
    const bubbleHeight = 26;
    const avatarSize = 24;
    const avatarMargin = 5;
    const yOffset = (1 - startProgress) * 10;
    
    ctx.globalAlpha = alpha;

    // Avatar
    ctx.fillStyle = "hsl(var(--muted))";
    ctx.beginPath();
    ctx.arc(screenX + padding + avatarSize / 2, yPos + bubbleHeight - avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Bubble
    ctx.fillStyle = "hsl(var(--card))";
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(screenX + padding + avatarSize + avatarMargin, yPos + yOffset, bubbleWidth, bubbleHeight, 12);
    ctx.fill();
    ctx.stroke();
    
    for (let i = 0; i < 3; i++) {
        const dotPhase = (frame - (delay + 15 + i * 10)) / 20;
        const dotYOffset = Math.sin(dotPhase * Math.PI) * -2;
        ctx.fillStyle = `rgba(0, 0, 0, 0.4)`;
        ctx.beginPath();
        ctx.arc(screenX + padding + avatarSize + avatarMargin + 15 + i * 10, yPos + bubbleHeight / 2 + dotYOffset, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.globalAlpha = 1;
}


function drawScreenContent(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: number) {
    const headerH = 40;
    const footerH = 45;
    const padding = 10;
    
    // Header
    ctx.fillStyle = "hsl(var(--card))";
    ctx.fillRect(x, y, w, headerH);
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.beginPath();
    ctx.moveTo(x, y + headerH);
    ctx.lineTo(x + w, y + headerH);
    ctx.stroke();

    // Avatar in header
    ctx.fillStyle = "hsl(var(--muted))";
    ctx.beginPath();
    ctx.arc(x + padding + 12, y + headerH / 2, 12, 0, Math.PI * 2);
    ctx.fill();

    // Bot name in header
    ctx.fillStyle = "hsl(var(--card-foreground))";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Mi Pizzería", x + padding + 30, y + headerH / 2 + 4);

    // Messages
    const contentY = y + headerH;
    const contentH = h - headerH - footerH;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, contentY, w, contentH);
    ctx.clip();
    
    drawBubble(ctx, "Hola, me interesa una pizza.", true, x, contentY + 10, w, frame, 0, padding);
    drawTypingIndicator(ctx, x, contentY + 50, w, frame, 60, padding);
    drawBubble(ctx, "¡Claro que sí! Tenemos Peperoni, Hawaiana y Mexicana. ¿Cuál te gustaría?", false, x, contentY + 50, w, frame, 160, padding);
    drawBubble(ctx, "Quiero la de peperoni, por favor.", true, x, contentY + 110, w, frame, 220, padding);
    drawTypingIndicator(ctx, x, contentY + 150, w, frame, 280, padding);
    drawBubble(ctx, "Excelente elección. El costo es de $150. ¿Deseas confirmar tu pedido ahora mismo?", false, x, contentY + 150, w, frame, 380, padding);

    ctx.restore();

    // Footer
    const footerY = y + h - footerH;
    ctx.fillStyle = "hsl(var(--muted))";
    ctx.fillRect(x, footerY, w, footerH);
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.beginPath();
    ctx.moveTo(x, footerY);
    ctx.lineTo(x + w, footerY);
    ctx.stroke();
    
    // Input field
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.roundRect(x + padding + 30, footerY + 8, w - (padding * 2) - 70, footerH - 16, 15);
    ctx.stroke();
    
    // Paperclip icon
    ctx.fillStyle = "hsl(var(--muted-foreground))";
    ctx.font = "12px sans-serif";
    ctx.fillText("📎", x + padding, footerY + footerH / 2 + 4);

    // Send button
    ctx.fillStyle = "hsl(var(--primary))";
    ctx.beginPath();
    ctx.arc(x + w - padding - 18, footerY + footerH / 2, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "hsl(var(--primary-foreground))";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("➤", x + w - padding - 18, footerY + footerH / 2);
}


export default PhoneCanvas;
