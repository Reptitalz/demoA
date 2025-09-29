
"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';
import { FaCheck, FaArrowRight, FaRobot, FaCog, FaMobileAlt, FaBrain, FaUniversity, FaCreditCard, FaApple, FaDownload, FaSpinner, FaAndroid, FaPaperPlane } from 'react-icons/fa';
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
            
            // Chat Header
            const headerH = 40;
            ctx.fillStyle = 'hsl(var(--card) / 0.8)';
            ctx.beginPath();
            ctx.roundRect(screenX, screenY, screenW, headerH, [20, 20, 0, 0]);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(screenX, screenY + headerH);
            ctx.lineTo(screenX + screenW, screenY + headerH);
            ctx.strokeStyle = 'hsl(var(--border))';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Header Content
            const avatarRadius = 14;
            ctx.fillStyle = 'hsl(var(--primary))';
            ctx.beginPath();
            ctx.arc(screenX + 25, screenY + headerH / 2, avatarRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('A', screenX + 25, screenY + headerH / 2);
            
            ctx.fillStyle = 'hsl(var(--foreground))';
            ctx.textAlign = 'left';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('Asistente de Ventas', screenX + 50, screenY + headerH / 2 - 5);
            ctx.font = '9px sans-serif';
            ctx.fillStyle = 'hsl(var(--muted-foreground))';
            ctx.fillText('en línea', screenX + 50, screenY + headerH / 2 + 8);


            // Notch
            ctx.fillStyle = '#1C1C1E';
            ctx.beginPath();
            ctx.roundRect(x + phoneW / 2 - 40, y + screenMargin, 80, 5, 2.5);
            ctx.fill();

            // Chat Input Footer
            const footerH = 45;
            ctx.fillStyle = 'hsl(var(--background))';
            ctx.fillRect(screenX, screenY + screenH - footerH, screenW, footerH);
            ctx.beginPath();
            ctx.moveTo(screenX, screenY + screenH - footerH);
            ctx.lineTo(screenX + screenW, screenY + screenH - footerH);
            ctx.stroke();
            
            // Input field
            ctx.fillStyle = 'hsl(var(--card))';
            ctx.beginPath();
            ctx.roundRect(screenX + 10, screenY + screenH - footerH + 8, screenW - 60, footerH - 16, 12);
            ctx.fill();
            ctx.fillStyle = 'hsl(var(--muted-foreground))';
            ctx.font = '10px sans-serif';
            ctx.fillText('Escribe un mensaje...', screenX + 20, screenY + screenH - footerH/2 + 5);

            // Send button
            ctx.fillStyle = 'hsl(var(--primary))';
            ctx.beginPath();
            ctx.arc(screenX + screenW - 28, screenY + screenH - footerH / 2, 14, 0, 2 * Math.PI);
            ctx.fill();
            ctx.save();
            ctx.translate(screenX + screenW - 28, screenY + screenH - footerH/2);
            ctx.rotate( -Math.PI / 4);
            ctx.fillStyle = 'white';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('➢', 0, 1);
            ctx.restore();


            // Draw chat bubbles
            ctx.save();
            ctx.beginPath();
            ctx.rect(screenX, screenY + headerH, screenW, screenH - headerH - footerH);
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

                const animatedWidth = (textWidth + 20) * progress;
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

                if (progress > 0.5) {
                    const textProgress = (progress - 0.5) * 2;
                    ctx.globalAlpha = textProgress;
                    ctx.fillStyle = isUser ? '#ffffff' : '#000000';
                    const textX = isUser ? (bubbleX + bubbleW - animatedWidth + 10 + (animatedWidth - 20 - textWidth) / 2) : (bubbleX + 10);
                    ctx.fillText(text, textX , yPos + bubbleHeight / 2 + 5); // Adjusted for better vertical alignment
                }
            };
            
            ctx.globalAlpha = 1;

            drawBubble('¡Hola! Soy tu asistente de ventas.', false, screenY + headerH + 10, 0);
            drawBubble('Quiero un reporte de ventas.', true, screenY + headerH + 40, 60);
            drawBubble('Claro, consultando la base de datos...', false, screenY + headerH + 70, 120);
            
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
                      La Red Social con <span className="text-brand-gradient">Superpoderes de IA.</span> Gratis.
                  </h1>
                  <p className="mt-4 max-w-xl mx-auto md:mx-0 text-lg text-muted-foreground">
                      Hey Manito! es la evolución del chat. Chatea, vende, y automatiza tu negocio con asistentes de IA, todo desde una plataforma gratuita.
                  </p>
                  <div className="mt-8 flex items-center justify-center md:justify-start">
                    <Button asChild size="lg" className="w-full sm:w-auto bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border">
                        <Link href={currentDownload.href} download={currentDownload.download}>
                            {currentDownload.icon}
                            {currentDownload.text}
                        </Link>
                    </Button>
                  </div>
                  <div className="mt-6 flex justify-center md:justify-start gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><FaCheck size={14} className="text-green-500" /> Prueba gratuita</span>
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

      {/* Features Section */}
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
              <FaArrowRight className="text-primary opacity-50 hidden md:block" />
               <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 mb-2">
                        <AnimatedStepCircle number={2} />
                  </div>
                  <p className="font-semibold">Conecta tus Datos</p>
                  <p className="text-sm text-muted-foreground">Vincula una Hoja de Google o crea una BD.</p>
              </div>
               <FaArrowRight className="text-primary opacity-50 hidden md:block" />
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
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> 1 Asistente de Escritorio</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Prueba de 30 días con mensajes ilimitados</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Acceso a todas las funciones de gestión</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Instalación como PWA</li>
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
                           <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Todo lo del Plan Gratuito, y además:</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Mensajes Ilimitados por Asistente</li>
                           <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Múltiples Asistentes de Escritorio</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Soporte Prioritario</li>
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

    