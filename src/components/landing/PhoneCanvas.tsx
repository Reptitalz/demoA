
"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { FaPaperPlane, FaPlus, FaRobot, FaUser } from 'react-icons/fa';

// 🎨 Constantes de estilo
const PHONE_COLOR_START = "#2C2C2E";
const PHONE_COLOR_END = "#1C1C1E";
const SCREEN_BG = "#E5E5EA"; // Un gris claro, típico de iOS en modo claro
const BUBBLE_USER_COLOR = "#34B7F1"; // Azul de iMessage
const BUBBLE_BOT_COLOR = "#F0F0F0";
const BUBBLE_HEIGHT = 28;
const PHONE_RATIO = 2.16; // Similar a un iPhone moderno
const SHADOW_INTENSITY = 25;

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

    // ✨ Función para dibujar el teléfono
    const drawPhone = (rotationX: number, rotationY: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const phoneW = w * 0.55;
      const phoneH = phoneW * PHONE_RATIO;
      const x = (w - phoneW) / 2;
      const y = (h - phoneH) / 2;
      const borderRadius = 40;

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rotationX * -0.1);
      ctx.translate(-w / 2, -h / 2);
      ctx.translate(0, rotationY * -10);

      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = SHADOW_INTENSITY;
      ctx.shadowOffsetX = rotationX * -15 + 5;
      ctx.shadowOffsetY = 20;

      const phoneGradient = ctx.createLinearGradient(x, y, x, y + phoneH);
      phoneGradient.addColorStop(0, PHONE_COLOR_START);
      phoneGradient.addColorStop(1, PHONE_COLOR_END);
      ctx.fillStyle = phoneGradient;
      ctx.beginPath();
      ctx.roundRect(x, y, phoneW, phoneH, borderRadius);
      ctx.fill();

      ctx.shadowColor = "transparent";

      // Reflejo dinámico
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, phoneW, phoneH, borderRadius);
      ctx.clip();
      const reflectionGradient = ctx.createLinearGradient(
        x + rotationX * 100,
        y - rotationY * 100,
        x + phoneW,
        y + phoneH
      );
      reflectionGradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
      reflectionGradient.addColorStop(0.3, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = reflectionGradient;
      ctx.fillRect(x, y, phoneW, phoneH);
      ctx.restore();

      const margin = 12;
      const screenW = phoneW - margin * 2;
      const screenH = phoneH - margin * 2;
      const screenX = x + margin;
      const screenY = y + margin;
      
      // Sombra interna de la pantalla
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.roundRect(screenX - 1, screenY - 1, screenW + 2, screenH + 2, 28);
      ctx.fill();

      // Pantalla
      ctx.fillStyle = SCREEN_BG;
      ctx.beginPath();
      ctx.roundRect(screenX, screenY, screenW, screenH, 28);
      ctx.fill();
      
      const notchH = 25;
      ctx.fillStyle = PHONE_COLOR_END;
      ctx.beginPath();
      ctx.roundRect(x + phoneW / 2 - 50, y + margin - 1, 100, notchH, 12);
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
      const targetX = mousePos.current.x * 0.3;
      const targetY = mousePos.current.y * 0.3;

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
    const headerH = 40;
    const footerH = 45;
    const padding = 12;
    
    // Header
    ctx.fillStyle = "#F8F8F8";
    ctx.fillRect(x, y, w, headerH);
    ctx.strokeStyle = "#DCDCDC";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y + headerH);
    ctx.lineTo(x + w, y + headerH);
    ctx.stroke();

    // Avatar y Nombre
    ctx.fillStyle = '#C7C7CC';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 20, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Asistente IA", x + w / 2, y + 35);
    
    // Mensajes
    const contentY = y + headerH;
    const contentH = h - headerH - footerH;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, contentY, w, contentH);
    ctx.clip();

    drawBubble(ctx, "¿Tienes pasteles de chocolate?", true, x, contentY + 20, w, frame, 0, padding);
    drawTypingIndicator(ctx, x, contentY + 55, w, frame, 40, padding);
    drawBubble(ctx, "Sí, para 10 personas cuesta $350.", false, x, contentY + 55, w, frame, 100, padding);
    drawBubble(ctx, "¿Te gustaría ordenar uno?", false, x, contentY + 90, w, frame, 150, padding);
    ctx.restore();

    // Footer (input bar)
    const footerY = y + h - footerH;
    ctx.fillStyle = "#F8F8F8";
    ctx.fillRect(x, footerY, w, footerH);
    ctx.strokeStyle = "#DCDCDC";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, footerY);
    ctx.lineTo(x + w, footerY);
    ctx.stroke();
    
    // Input field
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#EAEAEA";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + padding + 25, footerY + 8, w - (padding * 2) - 55, footerH - 16, 12);
    ctx.fill();
    ctx.stroke();

    // Botones
    ctx.fillStyle = BUBBLE_USER_COLOR;
    ctx.beginPath();
    ctx.arc(x + padding + 10, footerY + footerH / 2, 10, 0, Math.PI * 2);
    ctx.arc(x + w - padding - 35, footerY + footerH / 2, 10, 0, Math.PI * 2);
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

  ctx.font = "10px sans-serif";
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const bubbleWidth = textWidth + 20;
  
  const easedProgress = 1 - Math.pow(1 - progress, 3); // EaseOutCubic
  const animatedWidth = bubbleWidth * easedProgress;
  const animatedHeight = BUBBLE_HEIGHT * easedProgress;

  const bubbleX = isUser
    ? screenX + screenW - animatedWidth - padding
    : screenX + padding;

  ctx.globalAlpha = easedProgress;
  ctx.fillStyle = isUser ? BUBBLE_USER_COLOR : BUBBLE_BOT_COLOR;
  ctx.strokeStyle = isUser ? BUBBLE_USER_COLOR : "#EAEAEA";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.roundRect(bubbleX, yPos, animatedWidth, animatedHeight, 14);
  ctx.fill();
  ctx.stroke();

  if (progress > 0.8) {
    ctx.globalAlpha = (progress - 0.8) * 5;
    ctx.fillStyle = isUser ? "#ffffff" : "#000000";
    ctx.textAlign = isUser ? "right" : "left";
    ctx.textBaseline = "middle";
    const textX = isUser ? bubbleX + animatedWidth - 10 : bubbleX + 10;
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

  const bubbleWidth = 50;
  const yOffset = (1 - startProgress) * 10;
  
  ctx.globalAlpha = alpha;
  ctx.fillStyle = BUBBLE_BOT_COLOR;
  ctx.strokeStyle = "#EAEAEA";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.roundRect(screenX + padding, yPos + yOffset, bubbleWidth, BUBBLE_HEIGHT, 14);
  ctx.fill();
  ctx.stroke();

  for (let i = 0; i < 3; i++) {
    const dotPhase = (frame - (delay + 10 + i * 10)) / 20;
    const dotYOffset = Math.sin(dotPhase * Math.PI) * -2;
    ctx.fillStyle = `rgba(0, 0, 0, 0.4)`;
    ctx.beginPath();
    ctx.arc(screenX + padding + 15 + i * 10, yPos + BUBBLE_HEIGHT / 2 + dotYOffset, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

export default PhoneCanvas;

