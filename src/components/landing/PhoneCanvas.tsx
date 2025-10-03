"use client";

import React, { useRef, useEffect, useCallback } from "react";

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

    const phoneW = 200;
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

      // sombra general
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 25;
      ctx.shadowOffsetX = rotationX * -10;
      ctx.shadowOffsetY = 20;

      // marco del teléfono
      ctx.fillStyle = "#f5f5f7";
      ctx.beginPath();
      ctx.roundRect(x, y, phoneW, phoneH, 45);
      ctx.fill();

      // bisel negro fino
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 3;
      ctx.roundRect(x, y, phoneW, phoneH, 45);
      ctx.stroke();

      // pantalla
      const margin = 14;
      const screenW = phoneW - margin * 2;
      const screenH = phoneH - margin * 2;
      const screenX = x + margin;
      const screenY = y + margin;

      ctx.shadowColor = "transparent";
      ctx.fillStyle = "hsl(220, 20%, 98%)";
      ctx.beginPath();
      ctx.roundRect(screenX, screenY, screenW, screenH, 30);
      ctx.fill();

      // notch superior
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.roundRect(x + phoneW / 2 - 30, y + 6, 60, 10, 6);
      ctx.fill();

      // cámara frontal (detalle extra)
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(x + phoneW / 2, y + 11, 3, 0, Math.PI * 2);
      ctx.fill();

      // contenido de la pantalla
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(screenX, screenY, screenW, screenH, 30);
      ctx.clip();
      drawScreenContent(ctx, screenX, screenY, screenW, screenH, frame);
      ctx.restore();

      // botón home (detalle inferior)
      ctx.fillStyle = "#ccc";
      ctx.beginPath();
      ctx.arc(x + phoneW / 2, y + phoneH - 12, 6, 0, Math.PI * 2);
      ctx.fill();

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

  const lerp = (start: number, end: number, amt: number) =>
    (1 - amt) * start + amt * end;
  return <canvas ref={canvasRef} className="w-full h-full" />;
};

// --- helpers UI --- //

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" ");
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
  const progress = Math.max(0, Math.min(1, (frame - delay) / 25));
  if (progress === 0) return;

  ctx.font = "11px 'Inter', sans-serif";
  const maxWidth = screenW * 0.65;
  const lines = wrapText(ctx, text, maxWidth);

  const bubblePadding = 10;
  const lineHeight = 14;
  const bubbleHeight = lines.length * lineHeight + bubblePadding * 2;

  let bubbleWidth = 0;
  if (lines.length === 1) {
    bubbleWidth = ctx.measureText(lines[0]).width + bubblePadding * 2;
  } else {
    bubbleWidth = maxWidth + bubblePadding * 2;
  }

  const easedProgress = 1 - Math.pow(1 - progress, 3);
  const animatedWidth = bubbleWidth * easedProgress;
  const avatarSize = 26;
  const avatarMargin = 6;

  const bubbleX = isUser
    ? screenX + screenW - animatedWidth - padding - avatarSize - avatarMargin
    : screenX + padding + avatarSize + avatarMargin;

  ctx.globalAlpha = easedProgress;

  // avatar redondo
  ctx.save();
  ctx.beginPath();
  const avatarX = isUser
    ? screenX + screenW - padding - avatarSize / 2
    : screenX + padding + avatarSize / 2;
  const avatarY = yPos + bubbleHeight - avatarSize / 2;
  ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = isUser ? "#007aff" : "#e0e0e0";
  ctx.fillRect(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
  ctx.restore();

  // burbuja
  const gradient = ctx.createLinearGradient(bubbleX, yPos, bubbleX + animatedWidth, yPos + bubbleHeight);
  if (isUser) {
    gradient.addColorStop(0, "#007aff");
    gradient.addColorStop(1, "#3399ff");
  } else {
    gradient.addColorStop(0, "#f1f1f1");
    gradient.addColorStop(1, "#e5e5e5");
  }

  ctx.fillStyle = gradient;
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bubbleX, yPos, animatedWidth, bubbleHeight, 14);
  ctx.fill();
  ctx.stroke();

  // texto
  if (progress > 0.8) {
    ctx.globalAlpha = (progress - 0.8) * 5;
    ctx.fillStyle = isUser ? "white" : "#111";
    ctx.textAlign = "left";
    const textX = bubbleX + bubblePadding;

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(
        lines[i],
        textX,
        yPos + bubblePadding + i * lineHeight + lineHeight / 1.5
      );
    }
  }
  ctx.globalAlpha = 1;
}

// --- contenido pantalla --- //

function drawScreenContent(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: number) {
  const headerH = 42;
  const footerH = 48;
  const padding = 12;

  // header
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, headerH);
  ctx.strokeStyle = "#e0e0e0";
  ctx.beginPath();
  ctx.moveTo(x, y + headerH);
  ctx.lineTo(x + w, y + headerH);
  ctx.stroke();

  ctx.fillStyle = "#111";
  ctx.font = "bold 12px 'Inter'";
  ctx.fillText("Mi Pizzería", x + padding + 30, y + headerH / 2 + 4);

  // contenido mensajes
  const contentY = y + headerH;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, contentY, w, h - headerH - footerH);
  ctx.clip();

  drawBubble(ctx, "Hola, me interesa una pizza.", true, x, contentY + 12, w, frame, 0, padding);
  drawBubble(ctx, "¡Claro que sí! Tenemos Peperoni, Hawaiana y Mexicana. ¿Cuál te gustaría?", false, x, contentY + 60, w, frame, 120, padding);
  drawBubble(ctx, "Quiero la de peperoni, por favor.", true, x, contentY + 120, w, frame, 220, padding);
  drawBubble(ctx, "Excelente elección. El costo es de $150. ¿Deseas confirmar tu pedido ahora mismo?", false, x, contentY + 170, w, frame, 320, padding);

  ctx.restore();

  // footer input
  const footerY = y + h - footerH;
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(x, footerY, w, footerH);
  ctx.strokeStyle = "#ddd";
  ctx.beginPath();
  ctx.moveTo(x, footerY);
  ctx.lineTo(x + w, footerY);
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.roundRect(x + padding + 28, footerY + 8, w - padding * 2 - 70, footerH - 16, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#007aff";
  ctx.beginPath();
  ctx.arc(x + w - padding - 18, footerY + footerH / 2, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("➤", x + w - padding - 18, footerY + footerH / 2);
}

export default PhoneCanvas;