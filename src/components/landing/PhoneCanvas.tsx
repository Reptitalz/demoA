
"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { FaPaperPlane, FaPlus, FaRobot, FaUser } from 'react-icons/fa';

// 🎨 Constantes de estilo
const PHONE_COLOR_START = "#F7F7F7";
const PHONE_COLOR_END = "#EAEAEA";
const SCREEN_BG = "#FFFFFF";
const BUBBLE_USER_COLOR = "#34B7F1";
const BUBBLE_BOT_COLOR = "#E5E5EA";
const BUBBLE_HEIGHT = 32; // Aumentado para más espacio
const PHONE_RATIO = 2.16;
const SHADOW_INTENSITY = 20;

// 🔧 Utilidad: interpolación suave
const lerp = (start: number, end: number, amt: number) =>
  (1 - amt) * start + amt * end;

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

    const drawPhone = (rotationX: number, rotationY: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const phoneH = h * 0.9; // Ocupa el 90% de la altura
      const phoneW = phoneH / PHONE_RATIO;
      const x = (w - phoneW) / 2;
      const y = (h - phoneH) / 2;
      const borderRadius = 45;

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rotationX * -0.08); // Reducir rotación
      ctx.translate(-w / 2, -h / 2);
      ctx.translate(0, rotationY * -8);

      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = SHADOW_INTENSITY;
      ctx.shadowOffsetX = rotationX * -10 + 4;
      ctx.shadowOffsetY = 15;

      const phoneGradient = ctx.createLinearGradient(x, y, x, y + phoneH);
      phoneGradient.addColorStop(0, PHONE_COLOR_START);
      phoneGradient.addColorStop(1, PHONE_COLOR_END);
      ctx.fillStyle = phoneGradient;
      ctx.beginPath();
      ctx.roundRect(x, y, phoneW, phoneH, borderRadius);
      ctx.fill();

      ctx.shadowColor = "transparent";

      const margin = 14;
      const screenW = phoneW - margin * 2;
      const screenH = phoneH - margin * 2;
      const screenX = x + margin;
      const screenY = y + margin;
      
      ctx.fillStyle = SCREEN_BG;
      ctx.beginPath();
      ctx.roundRect(screenX, screenY, screenW, screenH, 30);
      ctx.fill();
      
      const notchH = 28;
      ctx.fillStyle = "#1C1C1E";
      ctx.beginPath();
      ctx.roundRect(x + phoneW / 2 - 55, y + margin - 1, 110, notchH, 14);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(screenX, screenY, screenW, screenH, 30);
      ctx.clip();
      
      drawScreenContent(ctx, screenX, screenY, screenW, screenH, frame);

      ctx.restore();
      ctx.restore();
    };

    const animate = () => {
      frame++;
      const targetX = mousePos.current.x * 0.2;
      const targetY = mousePos.current.y * 0.2;

      tiltX = lerp(tiltX, targetX, 0.05);
      tiltY = lerp(tiltY, targetY, 0.05);

      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      drawPhone(tiltX, tiltY);

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};


function drawScreenContent(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: number) {
    const headerH = 45;
    const footerH = 50;
    const padding = 15;
    
    // Header
    ctx.fillStyle = "#F7F7F7";
    ctx.fillRect(x, y, w, headerH);
    ctx.strokeStyle = "#D1D1D6";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y + headerH);
    ctx.lineTo(x + w, y + headerH);
    ctx.stroke();

    // Avatar y Nombre
    ctx.fillStyle = '#D8D8D8';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 22, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = "bold 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Asistente de Ventas", x + w / 2, y + 38);
    
    // Mensajes
    const contentY = y + headerH;
    const contentH = h - headerH - footerH;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, contentY, w, contentH);
    ctx.clip();

    drawBubble(ctx, "¿Tienes pasteles de chocolate?", true, x, contentY + 25, w, frame, 0, padding);
    drawTypingIndicator(ctx, x, contentY + 70, w, frame, 60, padding);
    drawBubble(ctx, "¡Hola! Sí, el de chocolate para 10 personas cuesta $350.", false, x, contentY + 70, w, frame, 140, padding);
    ctx.restore();

    // Footer
    const footerY = y + h - footerH;
    ctx.fillStyle = "#F7F7F7";
    ctx.fillRect(x, footerY, w, footerH);
    ctx.strokeStyle = "#D1D1D6";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, footerY);
    ctx.lineTo(x + w, footerY);
    ctx.stroke();
    
    // Input field
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#E0E0E0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + padding, footerY + 8, w - (padding * 2) - 35, footerH - 16, 15);
    ctx.fill();
    ctx.stroke();

    // Botón de Enviar
    ctx.fillStyle = BUBBLE_USER_COLOR;
    ctx.beginPath();
    ctx.arc(x + w - padding - 15, footerY + footerH / 2, 13, 0, Math.PI * 2);
    ctx.fill();
}


function drawBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  isUser: boolean,
  screenX: number,
  yPos: number,
  screenW: number,
  frame: number,
  delay: number,
  padding: number
) {
  const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
  if (progress === 0) return;

  ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const bubbleWidth = textWidth + 24;
  
  const easedProgress = 1 - Math.pow(1 - progress, 3);
  const animatedWidth = bubbleWidth * easedProgress;
  const animatedHeight = BUBBLE_HEIGHT * easedProgress;

  const bubbleX = isUser
    ? screenX + screenW - animatedWidth - padding
    : screenX + padding;

  ctx.globalAlpha = easedProgress;
  ctx.fillStyle = isUser ? BUBBLE_USER_COLOR : BUBBLE_BOT_COLOR;
  ctx.strokeStyle = isUser ? BUBBLE_USER_COLOR : "#D1D1D6";
  ctx.lineWidth = 0.5;

  ctx.beginPath();
  ctx.roundRect(bubbleX, yPos, animatedWidth, animatedHeight, 16);
  ctx.fill();

  if (progress > 0.8) {
    ctx.globalAlpha = (progress - 0.8) * 5;
    ctx.fillStyle = isUser ? "#ffffff" : "#000000";
    ctx.textAlign = isUser ? "right" : "left";
    ctx.textBaseline = "middle";
    const textX = isUser ? bubbleX + animatedWidth - 12 : bubbleX + 12;
    ctx.fillText(text, textX, yPos + animatedHeight / 2);
  }
  ctx.globalAlpha = 1;
}

function drawTypingIndicator(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  yPos: number,
  screenW: number,
  frame: number,
  delay: number,
  padding: number
) {
  const startProgress = Math.max(0, Math.min(1, (frame - delay) / 20));
  if (startProgress === 0) return;

  const endProgress = Math.max(0, Math.min(1, (frame - (delay + 60)) / 20));
  const alpha = startProgress * (1 - endProgress);
  if (alpha <= 0) return;

  const bubbleWidth = 60;
  const yOffset = (1 - startProgress) * 10;
  
  ctx.globalAlpha = alpha;
  ctx.fillStyle = BUBBLE_BOT_COLOR;
  ctx.strokeStyle = "#D1D1D6";
  ctx.lineWidth = 0.5;

  ctx.beginPath();
  ctx.roundRect(screenX + padding, yPos + yOffset, bubbleWidth, BUBBLE_HEIGHT, 16);
  ctx.fill();

  for (let i = 0; i < 3; i++) {
    const dotPhase = (frame - (delay + 15 + i * 10)) / 20;
    const dotYOffset = Math.sin(dotPhase * Math.PI) * -2.5;
    ctx.fillStyle = `rgba(0, 0, 0, 0.4)`;
    ctx.beginPath();
    ctx.arc(screenX + padding + 18 + i * 12, yPos + BUBBLE_HEIGHT / 2 + dotYOffset, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

export default PhoneCanvas;
