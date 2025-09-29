
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';
import { FaAndroid, FaApple, FaGlobe, FaMoneyBillWave, FaShoppingCart, FaCreditCard } from 'react-icons/fa';
import { Bot, CheckCircle } from 'lucide-react';
import { motion } from "framer-motion";

const PhoneCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const drawPhone = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
        const phoneW = w * 0.7;
        const phoneH = h * 0.8;
        const phoneX = (w - phoneW) / 2;
        const phoneY = (h - phoneH) / 2;
        const borderRadius = 40;

        // 3D-like rotation effect
        const rotateX = Math.sin(t / 2000) * 0.1;
        const rotateY = Math.cos(t / 1500) * 0.15;
        
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.transform(1, rotateX, rotateY, 1, 0, 0); // Apply skew for 3D effect
        ctx.translate(-w / 2, -h / 2);
        
        // Phone shadow
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 20;

        // Phone body
        ctx.fillStyle = '#1C1C1E'; // Almost black
        ctx.beginPath();
        ctx.roundRect(phoneX, phoneY, phoneW, phoneH, borderRadius);
        ctx.fill();

        ctx.shadowColor = 'transparent'; // Reset shadow

        // Screen
        const screenMargin = 15;
        const screenX = phoneX + screenMargin;
        const screenY = phoneY + screenMargin;
        const screenW = phoneW - screenMargin * 2;
        const screenH = phoneH - screenMargin * 2;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, screenW, screenH, borderRadius - 10);
        ctx.fill();

        // Draw Chat inside the screen
        drawChat(ctx, screenX, screenY, screenW, screenH, t);

        // Notch
        const notchW = screenW * 0.3;
        const notchH = 10;
        ctx.fillStyle = '#1C1C1E';
        ctx.beginPath();
        ctx.roundRect(screenX + (screenW - notchW) / 2, screenY, notchW, notchH, 5);
        ctx.fill();

        ctx.restore();
    }, []);

    const drawChat = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        
        // Chat Header
        ctx.fillStyle = '#1F1F1F';
        ctx.fillRect(x, y, w, 50);
        ctx.fillStyle = 'white';
        ctx.font = '14px sans-serif';
        ctx.fillText('Asistente de Ventas', x + 50, y + 30);
        ctx.fillStyle = '#4CAF50'; // Green circle for avatar
        ctx.beginPath();
        ctx.arc(x + 25, y + 25, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('AV', x+19, y+29);

        // Chat Bubbles (animated)
        const messages = [
            { text: '¡Hola! Quiero un pastel.', user: true, delay: 500 },
            { text: 'Claro, ¿de qué sabor?', user: false, delay: 1500 },
            { text: 'Chocolate. ¿Cuál es el precio?', user: true, delay: 2500 },
            { text: 'El pastel de chocolate cuesta $350. ¿Deseas confirmar?', user: false, delay: 4000 },
        ];
        
        const loopDuration = 6000;
        const timeInLoop = t % loopDuration;

        messages.forEach(msg => {
            if (timeInLoop > msg.delay) {
                const animProgress = Math.min(1, (timeInLoop - msg.delay) / 500);
                const bubbleY = y + 70 + (messages.indexOf(msg) * 50);
                const bubbleW = ctx.measureText(msg.text).width + 20;
                const bubbleH = 30;

                ctx.globalAlpha = animProgress;
                
                if (msg.user) {
                    const bubbleX = x + w - bubbleW - 20;
                    ctx.fillStyle = '#005C4B';
                    ctx.beginPath();
                    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 15);
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.fillText(msg.text, bubbleX + 10, bubbleY + 20);
                } else {
                    const bubbleX = x + 20;
                    ctx.fillStyle = '#2A2A2A';
                    ctx.beginPath();
                    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 15);
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.fillText(msg.text, bubbleX + 10, bubbleY + 20);
                }
                ctx.globalAlpha = 1;
            }
        });

        ctx.restore();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = (time: number) => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawPhone(ctx, rect.width, rect.height, time);
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [drawPhone, drawChat]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};


const FeatureShowcaseCard = ({ icon: Icon, title, description, badge }: { icon: React.ElementType, title: string, description: string, badge: string }) => {
    return (
        <Card className="p-6 text-left glow-card h-full flex flex-col bg-card/50 backdrop-blur-sm border-border/20">
             <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-primary/10 rounded-full">
                    <Icon className="h-6 w-6 text-primary" />
                 </div>
                 <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">{badge}</span>
             </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2 flex-grow">{description}</p>
        </Card>
    );
};


export default function NewMarketingHomePage() {
  return (
    <PageContainer className="p-0 animate-fadeIn overflow-hidden" fullWidth={true}>
        <main className="relative z-10 w-full text-foreground">
            
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/50 to-background" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.1),transparent_50%)]" />

                <div className="relative z-10 px-4">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-6xl font-extrabold tracking-tight"
                    >
                        La nueva era de la <span className="text-brand-gradient">comunicación inteligente</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground"
                    >
                        {APP_NAME} transforma tu manera de interactuar, vender y gestionar. Todo desde una PWA ligera y potente.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Button asChild size="lg" className="w-full sm:w-auto bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border">
                            <Link href="/begin"><Bot className="mr-2"/>Crear Asistente Gratis</Link>
                        </Button>
                         <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                            <a href="#features">Ver Funciones</a>
                         </Button>
                    </motion.div>

                    <div className="mt-8 flex justify-center gap-4 text-xs text-muted-foreground">
                         <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> Prueba gratuita</span>
                         <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> Sin tarjeta requerida</span>
                    </div>

                    <div className="mt-12 h-[60vh] max-h-[700px] w-full max-w-4xl mx-auto">
                        <PhoneCanvas />
                    </div>
                </div>
            </section>

             {/* Features Section */}
            <section id="features" className="py-20 px-4 max-w-6xl mx-auto">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">Todo lo que tu negocio necesita</h2>
                    <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Desde la gestión de pagos hasta el control de tu inventario, todo en un solo lugar.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureShowcaseCard
                        icon={FaMoneyBillWave}
                        title="Gestión de Banco"
                        description="Autoriza pagos recibidos por tus asistentes, revisa comprobantes y lleva un control total de tus ingresos en tiempo real."
                        badge="Finanzas"
                    />
                    <FeatureShowcaseCard
                        icon={FaShoppingCart}
                        title="Catálogo de Productos"
                        description="Crea y administra un catálogo de productos ilimitado. Tu asistente podrá tomar pedidos y responder consultas con total precisión."
                        badge="Ventas"
                    />
                     <FeatureShowcaseCard
                        icon={FaCreditCard}
                        title="Líneas de Crédito"
                        description="Define y gestiona líneas de crédito para tus clientes. Ideal para modelos de negocio basados en préstamos o ventas a crédito."
                        badge="Crédito"
                    />
                </div>
            </section>
            
            {/* Download Section */}
            <section className="py-20 bg-muted/30">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-3xl font-bold tracking-tight">Accede Desde Cualquier Lugar</h2>
                    <p className="mt-3 text-muted-foreground">
                        Instala {APP_NAME} como una aplicación en tu dispositivo favorito para una experiencia más rápida y notificaciones push.
                    </p>
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Button size="lg" variant="outline" className="py-8 text-lg" onClick={() => window.open('/access', '_self')}>
                            <FaApple className="mr-3" /> iPhone
                        </Button>
                        <Button size="lg" variant="outline" className="py-8 text-lg" onClick={() => window.open('/access', '_self')}>
                            <FaAndroid className="mr-3" /> Android
                        </Button>
                        <Button size="lg" variant="outline" className="py-8 text-lg" onClick={() => window.open('/access', '_self')}>
                            <FaGlobe className="mr-3" /> Navegador
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    </PageContainer>
  );
}

    