
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';
import { Check, ArrowRight, Bot, Settings, Smartphone, Cpu, Bank, CreditCard, Apple, CaseSensitive, AppWindow, Download } from 'lucide-react';
import { motion } from "framer-motion";
import AppIcon from '@/components/shared/AppIcon';

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
        let animationFrameId: number;

        const drawPhone = (rotationX: number, rotationY: number) => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            const phoneW = w * 0.5;
            const phoneH = phoneW * 1.95;
            const x = (w - phoneW) / 2;
            const y = (h - phoneH) / 2;

            ctx.clearRect(0, 0, w, h);

            // 3D transform based on rotation
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.rotate(rotationX * -0.1);
            ctx.translate(-w / 2, -h / 2);
            ctx.translate(0, rotationY * -10);

            // Shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetX = rotationX * -10 + 5;
            ctx.shadowOffsetY = 15;
            
            // Phone Body
            ctx.fillStyle = '#1C1C1E';
            ctx.beginPath();
            ctx.roundRect(x, y, phoneW, phoneH, 30);
            ctx.fill();

            ctx.shadowColor = 'transparent'; // Reset shadow

            // Screen
            const screenMargin = 10;
            const screenW = phoneW - screenMargin * 2;
            const screenH = phoneH - screenMargin * 2;
            const screenX = x + screenMargin;
            const screenY = y + screenMargin;
            ctx.fillStyle = '#f0f5ff';
            ctx.beginPath();
            ctx.roundRect(screenX, screenY, screenW, screenH, 20);
            ctx.fill();
            
            // Notch
            ctx.fillStyle = '#1C1C1E';
            ctx.beginPath();
            ctx.roundRect(x + phoneW / 2 - 40, y + screenMargin, 80, 5, 2.5);
            ctx.fill();

            // Draw chat bubbles
            ctx.save();
            ctx.beginPath();
            ctx.rect(screenX, screenY, screenW, screenH);
            ctx.clip();

            const bubblePadding = 10;
            const bubbleW = screenW - bubblePadding * 2;
            
            const drawBubble = (text: string, isUser: boolean, yPos: number, delay: number) => {
                const bubbleX = screenX + bubblePadding;
                const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
                if (progress === 0) return;

                ctx.font = '10px sans-serif';
                const metrics = ctx.measureText(text);
                const textWidth = metrics.width;
                const bubbleHeight = 24;

                ctx.globalAlpha = progress;
                ctx.fillStyle = isUser ? 'hsl(var(--primary))' : '#ffffff';
                ctx.beginPath();
                if (isUser) {
                    ctx.roundRect(bubbleX + bubbleW - (textWidth + 20) * progress, yPos, textWidth + 20, bubbleHeight, 12);
                } else {
                    ctx.roundRect(bubbleX, yPos, (textWidth + 20) * progress, bubbleHeight, 12);
                }
                ctx.fill();

                ctx.fillStyle = isUser ? '#ffffff' : '#000000';
                if(progress > 0.8) {
                    ctx.globalAlpha = (progress - 0.8) / 0.2;
                    ctx.fillText(text, isUser ? bubbleX + bubbleW - textWidth - 10 : bubbleX + 10, yPos + bubbleHeight / 2 + 3);
                }
            };
            
            ctx.globalAlpha = 1;

            drawBubble('¡Hola! Soy tu asistente de ventas.', false, screenY + 20, 0);
            drawBubble('Quiero un reporte de ventas.', true, screenY + 50, 60);
            drawBubble('Claro, consultando la base de datos...', false, screenY + 80, 120);
            
            ctx.restore();
            ctx.restore();
        };

        const animate = () => {
            frame++;
            const targetRotationX = mousePos.current.x * 0.3;
            const targetRotationY = mousePos.current.y * 0.3;
            
            // Lerp for smooth rotation
            let currentRotationX = 0;
            let currentRotationY = 0;

            const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

            currentRotationX = lerp(currentRotationX, targetRotationX, 0.05);
            currentRotationY = lerp(currentRotationY, targetRotationY, 0.05);

            drawPhone(targetRotationX, targetRotationY);
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => cancelAnimationFrame(animationFrameId);
    }, [handleMouseMove]);


    return <canvas ref={canvasRef} className="w-full h-full" />;
};


const AnimatedStepCircle = ({ number }: { number: number }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 64 * dpr;
        canvas.height = 64 * dpr;
        canvas.style.width = '64px';
        canvas.style.height = '64px';
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.scale(dpr, dpr);

        let frame = 0;
        let animationFrameId: number;
        
        const draw = () => {
            frame++;
            ctx.clearRect(0, 0, 64, 64);

            // Draw outer circle
            ctx.strokeStyle = 'hsl(var(--primary))';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(32, 32, 30, 0, Math.PI * 2);
            ctx.stroke();

            // Draw liquid
            ctx.save();
            ctx.beginPath();
            ctx.arc(32, 32, 28, 0, Math.PI * 2);
            ctx.clip();
            
            ctx.fillStyle = 'hsl(var(--primary) / 0.5)';
            ctx.beginPath();
            const waveHeight = 4;
            const waveSpeed = 0.05;
            const waveFrequency = 0.1;
            
            ctx.moveTo(0, 64);
            ctx.lineTo(0, 32);

            for (let x = 0; x < 64; x++) {
                const y = 32 + Math.sin(x * waveFrequency + frame * waveSpeed) * waveHeight;
                ctx.lineTo(x, y);
            }
            
            ctx.lineTo(64, 64);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();

            // Draw number
            ctx.fillStyle = 'hsl(var(--primary))';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Create a text fill with a slight shadow for depth
            ctx.shadowColor = 'hsla(var(--primary-foreground), 0.5)';
            ctx.shadowBlur = 4;
            ctx.fillText(number.toString(), 32, 32);
            ctx.shadowBlur = 0; // Reset shadow

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [number]);

    return <canvas ref={canvasRef} />;
};


const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => {
    return (
        <div className="text-center p-4">
            <div className="mb-4 inline-block bg-primary/10 p-4 rounded-full">
                <Icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
    );
};

const NewHomepage = () => {
  return (
    <PageContainer className="p-0" fullWidth={true}>
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
          <div 
            className="absolute inset-0 z-0 opacity-20"
            style={{
                backgroundImage: 'radial-gradient(circle, hsl(var(--primary) / 0.1), transparent 60%), radial-gradient(circle, hsl(var(--accent) / 0.05), transparent 70%)',
            }}
          />
          <div className="container mx-auto px-4 relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center md:text-left"
              >
                  <AppIcon className="h-20 w-20 mx-auto md:mx-0 mb-4" />
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                      Automatiza tu Negocio con <span className="text-brand-gradient">Asistentes Inteligentes</span>
                  </h1>
                  <p className="mt-4 max-w-xl mx-auto md:mx-0 text-lg text-muted-foreground">
                      Crea, gestiona y despliega asistentes de IA para tu negocio. Automatiza ventas, soporte y más. Todo desde una PWA ligera y potente.
                  </p>
                  <div className="mt-8 flex items-center justify-center md:justify-start">
                    <Button asChild size="lg" className="w-full sm:w-auto bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border">
                        <Link href="/access"><Download className="mr-2"/>Instalar App</Link>
                    </Button>
                  </div>
                  <div className="mt-6 flex justify-center md:justify-start gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> Prueba gratuita</span>
                      <span className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> Sin tarjeta requerida</span>
                  </div>
              </motion.div>
              <motion.div 
                className="h-[500px] w-full max-w-sm mx-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
               >
                  <PhoneCanvas />
              </motion.div>
          </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Una Plataforma, Todas las Soluciones</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Hey Manito centraliza la inteligencia, la gestión y la comunicación de tu negocio.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                  icon={Bot}
                  title="Asistentes por Prompt"
                  description="Define el comportamiento de tu IA con lenguaje natural. Crea personalidades, establece reglas y guíalos hacia el éxito."
              />
              <FeatureCard 
                  icon={Settings}
                  title="Gestión Centralizada"
                  description="Administra tus asistentes, bases de datos, clientes y finanzas desde un panel de control unificado e intuitivo."
              />
              <FeatureCard 
                  icon={Smartphone}
                  title="Experiencia PWA"
                  description="Instala la app en cualquier dispositivo para una experiencia nativa, notificaciones push y acceso sin conexión."
              />
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-20 bg-background">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Empieza en Minutos</h2>
            <p className="mt-3 text-muted-foreground">Crea y despliega tu primer asistente en 3 simples pasos.</p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-center">
              <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 mb-2">
                        <AnimatedStepCircle number={1} />
                  </div>
                  <p className="font-semibold">Describe tu Asistente</p>
                  <p className="text-sm text-muted-foreground">Usa el prompt para darle instrucciones.</p>
              </div>
              <ArrowRight className="text-primary opacity-50 hidden md:block" />
               <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 mb-2">
                        <AnimatedStepCircle number={2} />
                  </div>
                  <p className="font-semibold">Conecta tus Datos</p>
                  <p className="text-sm text-muted-foreground">Vincula una Hoja de Google o crea una BD.</p>
              </div>
               <ArrowRight className="text-primary opacity-50 hidden md:block" />
              <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 mb-2">
                        <AnimatedStepCircle number={3} />
                  </div>
                  <p className="font-semibold">Lanza y Automatiza</p>
                  <p className="text-sm text-muted-foreground">Chatea con tu asistente y compártelo.</p>
              </div>
          </div>
        </div>
      </section>
      
       {/* Plans Section */}
      <section className="py-20 bg-muted/50">
          <div className="container max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Planes Simples y Flexibles</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Comienza gratis. Crece sin complicaciones.</p>
              
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {/* Free Plan */}
                  <div className="border border-border rounded-lg p-8 flex flex-col">
                      <h3 className="text-2xl font-semibold">Plan Gratuito</h3>
                      <p className="mt-2 text-muted-foreground">Perfecto para empezar a explorar.</p>
                      <div className="my-8">
                          <span className="text-5xl font-extrabold">$0</span>
                          <span className="text-muted-foreground"> /siempre</span>
                      </div>
                      <ul className="space-y-3 text-left">
                          <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" /> 1 Asistente de Escritorio</li>
                          <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" /> Prueba de 30 días con mensajes ilimitados</li>
                          <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" /> Acceso a todas las funciones de gestión</li>
                          <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" /> Instalación como PWA</li>
                      </ul>
                      <Button variant="outline" asChild className="mt-auto">
                          <Link href="/begin">Comenzar Gratis</Link>
                      </Button>
                  </div>

                  {/* Unlimited Plan */}
                  <div className="relative border-2 border-primary rounded-lg p-8 flex flex-col shadow-2xl shadow-primary/20">
                       <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                          <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">Recomendado</div>
                      </div>
                      <h3 className="text-2xl font-semibold">Plan Ilimitado</h3>
                      <p className="mt-2 text-muted-foreground">Desbloquea todo el potencial para tu negocio.</p>
                       <div className="my-8">
                          <span className="text-5xl font-extrabold">$179</span>
                          <span className="text-muted-foreground"> /mes</span>
                      </div>
                      <ul className="space-y-3 text-left">
                           <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" /> Todo lo del Plan Gratuito, y además:</li>
                          <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" /> Mensajes Ilimitados por Asistente</li>
                           <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" /> Múltiples Asistentes de Escritorio</li>
                          <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-500" /> Soporte Prioritario</li>
                      </ul>
                       <Button asChild className="mt-auto bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border">
                          <Link href="/begin">Obtener Plan Ilimitado</Link>
                      </Button>
                  </div>
              </div>
          </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-background">
          <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold tracking-tight">¿Listo para Probar {APP_NAME}?</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                  Instala la PWA en tu dispositivo y comienza a automatizar tus ventas con asistentes inteligentes.
              </p>
              <Button size="lg" asChild className="mt-8 bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border">
                  <Link href="/begin">Crear mi Primer Asistente</Link>
              </Button>
               <div className="mt-8 flex justify-center items-center gap-6">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Apple className="h-8 w-8" />
                  <span className="text-sm">iPhone</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <CaseSensitive className="h-8 w-8" />
                  <span className="text-sm">Android</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <AppWindow className="h-8 w-8" />
                  <span className="text-sm">Web</span>
                </div>
              </div>
          </div>
      </section>
    </PageContainer>
  );
};

export default NewHomepage;

    