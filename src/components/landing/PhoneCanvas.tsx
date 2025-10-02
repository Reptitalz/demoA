"use client";

import React, { useRef, useEffect, useCallback } from "react";

// 🎨 Constantes de estilo
const PHONE_COLOR = "#1C1C1E";
const SCREEN_COLOR = "#f0f5ff";
const PRIMARY_COLOR = "hsl(var(--primary))";
const BUBBLE_USER_COLOR = PRIMARY_COLOR;
const BUBBLE_BOT_COLOR = "#ffffff";
const BUBBLE_HEIGHT = 24;
const PHONE_RATIO = 1.95; // relación de alto del teléfono
const SHADOW_INTENSITY = 30;

// 🔧 Utilidad: interpolación suave
const lerp = (start: number, end: number, amt: number) =>
  (1 - amt) * start + amt * end;

const PhoneCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  // 🖱️ Guardar posición relativa del mouse
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
      const phoneW = w * 0.5;
      const phoneH = phoneW * PHONE_RATIO;
      const x = (w - phoneW) / 2;
      const y = (h - phoneH) / 2;

      ctx.save();

      // 📱 Rotación ligera según el mouse
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rotationX * -0.1);
      ctx.translate(-w / 2, -h / 2);
      ctx.translate(0, rotationY * -10);

      // 📱 Teléfono
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = SHADOW_INTENSITY;
      ctx.shadowOffsetX = rotationX * -10 + 5;
      ctx.shadowOffsetY = 15;

      ctx.fillStyle = PHONE_COLOR;
      ctx.beginPath();
      ctx.roundRect(x, y, phoneW, phoneH, 30);
      ctx.fill();

      ctx.shadowColor = "transparent";

      // 📲 Pantalla
      const margin = 10;
      const SCREEN_PADDING = 16; // 👈 Nuevo padding interno
      const screenW = phoneW - margin * 2;
      const screenH = phoneH - margin * 2;
      const screenX = x + margin;
      const screenY = y + margin;
      ctx.fillStyle = SCREEN_COLOR;
      ctx.beginPath();
      ctx.roundRect(screenX, screenY, screenW, screenH, 20);
      ctx.fill();

      // 🔳 Notch
      ctx.fillStyle = PHONE_COLOR;
      ctx.beginPath();
      ctx.roundRect(x + phoneW / 2 - 40, y + margin, 80, 5, 2.5);
      ctx.fill();

      // ✉️ Mensajes dentro de la pantalla
      ctx.save();
      ctx.beginPath();
      ctx.rect(screenX, screenY, screenW, screenH);
      ctx.clip();

      drawBubble(ctx, "¿Tienes pasteles de chocolate?", true, screenX, screenY + 20, screenW, frame, 0, SCREEN_PADDING);
      drawTypingIndicator(ctx, screenX, screenY + 50, frame, 40, SCREEN_PADDING);
      drawBubble(ctx, "Sí, para 10 personas cuesta $350.", false, screenX, screenY + 50, screenW, frame, 100, SCREEN_PADDING);
      drawBubble(ctx, "¿Te gustaría ordenar uno?", false, screenX, screenY + 80, screenW, frame, 150, SCREEN_PADDING);

      ctx.restore();
      ctx.restore();
    };

    // 🎬 Animación
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

// 🔹 Función auxiliar: dibujar burbuja
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
  const textWidth = ctx.measureText(text).width;
  const bubbleWidth = textWidth + 20;
  const animatedWidth = bubbleWidth * progress;

  const bubbleX = isUser
    ? screenX + screenW - animatedWidth - padding
    : screenX + padding;

  ctx.globalAlpha = progress;
  ctx.fillStyle = isUser ? BUBBLE_USER_COLOR : BUBBLE_BOT_COLOR;
  ctx.beginPath();
  ctx.roundRect(bubbleX, yPos, animatedWidth, BUBBLE_HEIGHT, 12);
  ctx.fill();

  // ✍️ Texto aparece más tarde
  if (progress > 0.8) {
    ctx.globalAlpha = (progress - 0.8) * 5;
    ctx.fillStyle = isUser ? "#ffffff" : "#000000";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bubbleX + 10, yPos + BUBBLE_HEIGHT / 2);
  }

  ctx.globalAlpha = 1;
}

// 🔹 Función auxiliar: indicador de escritura
function drawTypingIndicator(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  yPos: number,
  frame: number,
  delay: number,
  padding: number
) {
  const startProgress = Math.max(0, Math.min(1, (frame - delay) / 20));
  if (startProgress === 0) return;

  const endProgress = Math.max(0, Math.min(1, (frame - (delay + 60)) / 20));

  const bubbleWidth = 40;
  const yOffset = (1 - startProgress) * 10;

  ctx.globalAlpha = startProgress * (1 - endProgress);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(
    screenX + padding,
    yPos + yOffset,
    bubbleWidth,
    BUBBLE_HEIGHT,
    12
  );
  ctx.fill();

  for (let i = 0; i < 3; i++) {
    const dotProgress = Math.max(
      0,
      Math.min(1, (frame - (delay + 10 + i * 15)) / 15)
    );
    const dotYOffset = Math.sin(dotProgress * Math.PI) * -2;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.2 + dotProgress * 0.3})`;
    ctx.beginPath();
    ctx.arc(screenX + padding + 12 + i * 8, yPos + BUBBLE_HEIGHT / 2 + dotYOffset, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

export default PhoneCanvas;
