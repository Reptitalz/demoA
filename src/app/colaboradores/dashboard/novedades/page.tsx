
"use client";

import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import React, { useRef, useEffect } from 'react';
import { FaBullhorn, FaLightbulb, FaRocket } from "react-icons/fa";

const drawNavPreview = (ctx: CanvasRenderingContext2D, t: number) => {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);
    const floatY = Math.sin(t / 600) * 5;
    const y = h / 2 + floatY;
    const x = w / 2;
    const size = 20;
    const highlightProgress = (Math.sin(t / 800) + 1) / 2;
    const radius = size * 1.2 + 4 * highlightProgress;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
    glow.addColorStop(0, `hsla(262, 80%, 58%, ${0.3 + highlightProgress * 0.2})`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 80, y - 80, 160, 160);
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    const iconSize = 7;
    const iconY = y - 5;
    ctx.fillRect(x - iconSize, iconY + iconSize/2, iconSize * 2, iconSize / 4);
    ctx.fillRect(x - iconSize * 0.7, iconY - iconSize/2, iconSize / 3, iconSize);
    ctx.fillRect(x - iconSize * 0.2, iconY - iconSize/2, iconSize / 3, iconSize);
    ctx.fillRect(x + iconSize * 0.3, iconY - iconSize/2, iconSize / 3, iconSize);
    ctx.beginPath();
    ctx.moveTo(x - iconSize - 2, iconY - iconSize/2);
    ctx.lineTo(x, iconY - iconSize * 1.2);
    ctx.lineTo(x + iconSize + 2, iconY - iconSize/2);
    ctx.closePath();
    ctx.fill();
};

const drawDbPreview = (ctx: CanvasRenderingContext2D, t: number) => {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);
    const x = w / 2;
    const floatY = Math.sin(t / 600) * 5;
    const y = h / 2 + floatY;
    const size = 20;
    const highlightProgress = (Math.sin(t / 800) + 1) / 2;
    const radius = size * 1.2 + 4 * highlightProgress;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
    glow.addColorStop(0, `hsla(210, 80%, 58%, ${0.3 + highlightProgress * 0.2})`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 80, y - 80, 160, 160);
    ctx.fillStyle = 'hsl(210, 80%, 58%)';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2.5;
    const dbSize = 10;
    ctx.beginPath();
    ctx.ellipse(x, y - dbSize / 2, dbSize, dbSize / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - dbSize, y - dbSize / 2);
    ctx.lineTo(x - dbSize, y + dbSize / 2);
    ctx.ellipse(x, y + dbSize / 2, dbSize, dbSize / 2, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(x + dbSize, y - dbSize / 2);
    ctx.stroke();
};

const drawCreditPreview = (ctx: CanvasRenderingContext2D, t: number) => {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);
    const x = w / 2;
    const floatY = Math.sin(t / 600) * 5;
    const y = h / 2 + floatY;
    const size = 20;
    const highlightProgress = (Math.sin(t / 800) + 1) / 2;
    const radius = size * 1.2 + 4 * highlightProgress;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
    glow.addColorStop(0, `hsla(120, 60%, 45%, ${0.3 + highlightProgress * 0.2})`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 80, y - 80, 160, 160);
    ctx.fillStyle = 'hsl(120, 60%, 45%)';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', x, y);
};

const AnimatedCanvas = ({ newsId }: { newsId: string }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.parentElement!.clientWidth;
        const h = 140; // Fixed height for the canvas area in the card
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        let animationFrameId: number;
        const loop = (t: number) => {
            if (newsId === 'database') drawDbPreview(ctx, t);
            else if (newsId === 'announcement') drawNavPreview(ctx, t);
            else if (newsId === 'pro-tip') drawCreditPreview(ctx, t); // Using credit preview as an example for pro-tip
            animationFrameId = requestAnimationFrame(loop);
        };
        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [newsId]);

    return <canvas ref={canvasRef} />;
};


const newsItems = [
    {
        category: "Nueva Función",
        id: "database",
        title: "¡Bases de Datos Inteligentes ya están aquí!",
        description: "Ahora puedes crear bases de datos que la IA gestiona por sí misma. Añade conocimiento y deja que tu asistente aprenda y responda con mayor precisión.",
        icon: FaRocket,
        date: "29 de Julio, 2024"
    },
    {
        category: "Consejo Pro",
        id: "pro-tip",
        title: "Mejora tus Prompts para Mejores Ventas",
        description: "Un prompt bien definido es la clave del éxito. Incluye ejemplos claros de conversación, define la personalidad y establece reglas estrictas para maximizar la efectividad.",
        icon: FaLightbulb,
        date: "25 de Julio, 2024"
    },
    {
        category: "Anuncio",
        id: "announcement",
        title: "Expansión del Programa de Colaboradores",
        description: "Estamos buscando nuevos aliados para llevar la automatización con IA a más negocios. ¡Invita a otros y gana comisiones por sus referidos!",
        icon: FaBullhorn,
        date: "20 de Julio, 2024"
    }
];

const categoryColors = {
    "Nueva Función": "bg-blue-500",
    "Consejo Pro": "bg-yellow-500",
    "Anuncio": "bg-green-500"
};

const CollaboratorNewsPage = () => {
    return (
        <PageContainer className="space-y-6">
            <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Novedades y Anuncios
                </h2>
                <p className="text-sm text-muted-foreground">
                    Mantente al día con las últimas noticias y consejos para maximizar tus ganancias.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsItems.map((item, index) => (
                    <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn flex flex-col" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
                        <CardHeader className="p-0">
                            <div className="relative h-[140px] flex items-center justify-center">
                                <AnimatedCanvas newsId={item.id} />
                                <Badge className={`absolute top-3 right-3 ${categoryColors[item.category as keyof typeof categoryColors]}`}>
                                    <item.icon className="mr-1.5" />
                                    {item.category}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 flex-grow flex flex-col">
                            <p className="text-xs text-muted-foreground mb-1">{item.date}</p>
                            <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                            <CardDescription className="text-sm flex-grow">{item.description}</CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
}

export default CollaboratorNewsPage;
