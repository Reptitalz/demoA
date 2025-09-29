
"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';
import { FaCheck, FaArrowRight, FaRobot, FaCog, FaMobileAlt, FaBrain, FaUniversity, FaCreditCard, FaApple, FaDownload, FaSpinner, FaAndroid, FaPaperPlane } from 'react-icons/fa';
import { motion } from "framer-motion";
import AppIcon from '@/components/shared/AppIcon';
import MercadoPagoIcon from '@/components/shared/MercadoPagoIcon';

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
        let currentRotationX = 0;
        let currentRotationY = 0;

        const drawPhone = (rotationX: number, rotationY: number) => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            const phoneW = w * 0.5;
            const phoneH = phoneW * 1.95;
            const x = (w - phoneW) / 2;
            const y = (h - phoneH) / 2;

            ctx.clearRect(0, 0, w, h);

            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.rotate(rotationX * -0.1);
            ctx.translate(-w / 2, -h / 2);
            ctx.translate(0, rotationY * -10);

            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetX = rotationX * -10 + 5;
            ctx.shadowOffsetY = 15;
            
            ctx.fillStyle = '#1C1C1E';
            ctx.beginPath();
            ctx.roundRect(x, y, phoneW, phoneH, 30);
            ctx.fill();

            ctx.shadowColor = 'transparent';

            const screenMargin = 10;
            const screenW = phoneW - screenMargin * 2;
            const screenH = phoneH - screenMargin * 2;
            const screenX = x + screenMargin;
            const screenY = y + screenMargin;
            ctx.fillStyle = '#f0f5ff';
            ctx.beginPath();
            ctx.roundRect(screenX, screenY, screenW, screenH, 20);
            ctx.fill();
            
            ctx.fillStyle = '#1C1C1E';
            ctx.beginPath();
            ctx.roundRect(x + phoneW / 2 - 40, y + screenMargin, 80, 5, 2.5);
            ctx.fill();

            ctx.save();
            ctx.beginPath();
            ctx.rect(screenX, screenY, screenW, screenH);
            ctx.clip();

            const bubblePadding = 10;
            const bubbleW = screenW - bubblePadding * 2;
            
            const drawBubble = (text: string, isUser: boolean, yPos: number, delay: number) => {
                const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
                if (progress === 0) return;

                ctx.font = '10px sans-serif';
                const metrics = ctx.measureText(text);
                const textWidth = metrics.width;
                const bubbleHeight = 24;
                const bubbleContentWidth = textWidth + 20;

                const animatedWidth = bubbleContentWidth * progress;
                const bubbleX = screenX + bubblePadding;

                ctx.globalAlpha = progress;
                ctx.fillStyle = isUser ? 'hsl(var(--primary))' : '#ffffff';
                ctx.beginPath();
                if (isUser) {
                    ctx.roundRect(bubbleX + bubbleW - animatedWidth, yPos, animatedWidth, bubbleHeight, 12);
                } else {
                    ctx.roundRect(bubbleX, yPos, animatedWidth, bubbleHeight, 12);
                }
                ctx.fill();

                if (progress > 0.8) {
                    const textProgress = (progress - 0.8) * 5;
                    ctx.globalAlpha = textProgress;
                    ctx.fillStyle = isUser ? '#ffffff' : '#000000';
                    const textX = isUser ? (bubbleX + bubbleW - animatedWidth + 10) : (bubbleX + 10);
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, textX, yPos + bubbleHeight / 2);
                }
            };
            
            ctx.globalAlpha = 1;

            drawBubble('¡Hola! Soy tu asistente de ventas.', false, screenY + 20, 0);
            drawBubble('Quiero un reporte de ventas.', true, screenY + 50, 60);
            
            const typingProgress = Math.max(0, Math.min(1, (frame - 120) / 20));
            if(typingProgress > 0) {
                 ctx.globalAlpha = typingProgress;
                 ctx.fillStyle = '#ffffff';
                 ctx.beginPath();
                 ctx.roundRect(screenX + bubblePadding, screenY + 80, 50, 24, 12);
                 ctx.fill();
                 
                 const dotProgress = (frame - 130) % 60;
                 ctx.fillStyle = 'hsl(var(--muted-foreground))';
                 if (dotProgress > 10) { ctx.beginPath(); ctx.arc(screenX + bubblePadding + 15, screenY + 92, 2, 0, Math.PI * 2); ctx.fill(); }
                 if (dotProgress > 20) { ctx.beginPath(); ctx.arc(screenX + bubblePadding + 25, screenY + 92, 2, 0, Math.PI * 2); ctx.fill(); }
                 if (dotProgress > 30) { ctx.beginPath(); ctx.arc(screenX + bubblePadding + 35, screenY + 92, 2, 0, Math.PI * 2); ctx.fill(); }
            }

            ctx.restore();
            ctx.restore();
        };

        const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

        const animate = () => {
            frame++;
            const targetRotationX = mousePos.current.x * 0.3;
            const targetRotationY = mousePos.current.y * 0.3;
            
            currentRotationX = lerp(currentRotationX, targetRotationX, 0.05);
            currentRotationY = lerp(currentRotationY, targetRotationY, 0.05);

            drawPhone(currentRotationX, currentRotationY);
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => cancelAnimationFrame(animationFrameId);
    }, [handleMouseMove]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
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

type DeviceType = 'ios' | 'android' | 'web' | 'loading';

const NewHomepage = () => {
  const [device, setDevice] = useState<DeviceType>('loading');

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setDevice('ios');
    } else if (/android/i.test(userAgent)) {
      setDevice('android');
    } else {
      setDevice('web');
    }
  }, []);

  const downloadConfig = {
    ios: {
      icon: <FaApple className="mr-2" />,
      text: 'Descargar para iPhone',
      href: '/app.ipa',
      download: true,
    },
    android: {
      icon: <FaAndroid className="mr-2" />,
      text: 'Descargar para Android',
      href: '/app.apk',
      download: true,
    },
    web: {
      icon: <FaDownload className="mr-2" />,
      text: 'Instalar App',
      href: '/access',
      download: false,
    },
    loading: {
      icon: <FaSpinner className="mr-2 animate-spin" />,
      text: 'Detectando...',
      href: '#',
      download: false,
    },
  };

  const currentDownload = downloadConfig[device];

  return (
    <PageContainer className="p-0" fullWidth={true}>
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
                      La Red Social con <span className="text-brand-gradient">Superpoderes de IA.</span> Gratis.
                  </h1>
                  <p className="mt-4 max-w-xl mx-auto md:mx-0 text-lg text-muted-foreground">
                      Hey Manito! es la evolución del chat. Chatea, vende, y automatiza tu negocio con asistentes de IA, todo desde una plataforma gratuita.
                  </p>
                  <div className="mt-8 flex items-center justify-center md:justify-start">
                    <Button asChild size="lg" className="w-full sm:w-auto bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border">
                        <Link href={"/begin"}>
                            <FaRobot className="mr-2" />
                            Crear Asistente Gratis
                        </Link>
                    </Button>
                  </div>
                  <div className="mt-6 flex justify-center md:justify-start gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><FaCheck size={14} className="text-green-500" /> Sin tarjeta requerida</span>
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

      <section id="features" className="py-20 bg-muted/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Una Plataforma, Todas las Soluciones</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Hey Manito centraliza la inteligencia, la gestión y la comunicación de tu negocio.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                  icon={FaRobot}
                  title="Asistentes por Prompt"
                  description="Define el comportamiento de tu IA con lenguaje natural. Crea personalidades, establece reglas y guíalos hacia el éxito."
              />
              <FeatureCard 
                  icon={FaCog}
                  title="Gestión Centralizada"
                  description="Administra tus asistentes, bases de datos, clientes y finanzas desde un panel de control unificado e intuitivo."
              />
              <FeatureCard 
                  icon={FaMobileAlt}
                  title="Experiencia PWA"
                  description="Instala la app en cualquier dispositivo para una experiencia nativa, notificaciones push y acceso sin conexión."
              />
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Empieza en Minutos</h2>
            <p className="mt-3 text-muted-foreground">Crea y gestiona tu negocio en 3 simples pasos.</p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-center">
              <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 mb-2">
                        <FaRobot className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-semibold">Crea y Supervisa tus Bots</p>
                  <p className="text-sm text-muted-foreground">Chatea y gestiona tus asistentes desde un panel centralizado.</p>
              </div>
              <FaArrowRight className="text-primary opacity-50 hidden md:block" />
               <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 mb-2">
                        <FaCreditCard className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-semibold">Gestiona Productos y Créditos</p>
                  <p className="text-sm text-muted-foreground">Usa el catálogo de productos y administra líneas de crédito para clientes.</p>
              </div>
               <FaArrowRight className="text-primary opacity-50 hidden md:block" />
              <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 mb-2">
                        <FaUniversity className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-semibold">Controla tus Finanzas</p>
                  <p className="text-sm text-muted-foreground">Revisa y autoriza los pagos que reciben tus asistentes en la sección 'Banco'.</p>
              </div>
          </div>
        </div>
      </section>
      
       <section className="py-20 bg-muted/50">
          <div className="container max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Planes Simples y Flexibles</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Comienza gratis. Crece sin complicaciones.</p>
              
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <div className="border border-border rounded-lg p-8 flex flex-col">
                      <h3 className="text-2xl font-semibold">Plan Gratuito</h3>
                      <p className="mt-2 text-muted-foreground">Perfecto para empezar a explorar.</p>
                      <div className="my-8">
                          <span className="text-5xl font-extrabold">$0</span>
                          <span className="text-muted-foreground"> /siempre</span>
                      </div>
                      <ul className="space-y-3 text-left">
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Asistentes Ilimitados</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> 100 mensajes por día (total)</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Acceso a todas las funciones de gestión</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Instalación como PWA</li>
                      </ul>
                      <Button variant="outline" asChild className="mt-auto">
                          <Link href="/begin">Comenzar Gratis</Link>
                      </Button>
                  </div>

                  <div className="relative border-2 border-primary rounded-lg p-8 flex flex-col shadow-2xl shadow-primary/20">
                       <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                          <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">Recomendado</div>
                      </div>
                      <h3 className="text-2xl font-semibold">Plan miembro</h3>
                      <p className="mt-2 text-muted-foreground">Desbloquea todo el potencial para tu negocio.</p>
                       <div className="my-8">
                          <span className="text-5xl font-extrabold">$179</span>
                          <span className="text-muted-foreground"> /mes</span>
                      </div>
                      <ul className="space-y-3 text-left">
                           <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Todo lo del Plan Gratuito, y además:</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Mensajes Ilimitados</li>
                           <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Transacciones Ilimitadas</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Soporte Prioritario</li>
                      </ul>
                       <Button asChild className="mt-auto bg-blue-500 text-white hover:bg-blue-600 shiny-border">
                          <Link href="/begin">
                            <MercadoPagoIcon className="h-5 w-auto mr-2" />
                            Pagar con Mercado Pago
                          </Link>
                      </Button>
                  </div>
              </div>
          </div>
      </section>

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
                  <FaApple className="h-8 w-8" />
                  <span className="text-sm">iPhone</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FaAndroid className="h-8 w-8" />
                  <span className="text-sm">Android</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FaMobileAlt className="h-8 w-8" />
                  <span className="text-sm">Web</span>
                </div>
              </div>
          </div>
      </section>
    </PageContainer>
  );
};

export default NewHomepage;
