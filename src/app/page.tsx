

"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { APP_NAME, PRICE_PER_CREDIT, MESSAGES_PER_CREDIT, MAX_CUSTOM_CREDITS, CREDIT_PACKAGES } from '@/config/appConfig';
import Link from 'next/link';
import { FaWhatsapp, FaBrain, FaCogs, FaShieldAlt, FaSitemap, FaMoneyBillWave, FaUserEdit, FaSimCard, FaCheckCircle, FaGoogle, FaArrowLeft, FaArrowRight, FaEnvelope, FaTiktok, FaSpinner, FaQuestionCircle, FaUser } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { MessagesSquare, CircleDollarSign, Coins, Send, ArrowRight, UserCog, Download, AppWindow, Code } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import React from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import AppIcon from '@/components/shared/AppIcon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const HowItWorksDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      num: "1",
      icon: <UserCog size={32} className="text-primary" />,
      title: "Crea tu Asistente",
      description: "Define el nombre, la personalidad y los objetivos de tu asistente a través de nuestro sencillo asistente de configuración. No se requiere código."
    },
    {
      num: "2",
      icon: <FaSimCard size={32} className="text-primary" />,
      title: "Vincula un Número",
      description: "Adquiere una SIM nueva (sin WhatsApp previo) y vincúlala a tu asistente para que pueda empezar a comunicarse."
    },
    {
      num: "3",
      icon: <FaCheckCircle size={32} className="text-primary" />,
      title: "Activa y Disfruta",
      description: "Recibirás un código de verificación de Facebook por SMS. Ingrésalo para activar tu asistente y deja que empiece a trabajar para ti."
    },
    {
      num: "4",
      icon: <Coins size={32} className="text-primary" />,
      title: "Recarga Créditos",
      description: "Añade saldo a tu cuenta de forma segura con Mercado Pago para que tu asistente nunca deje de operar."
    }
  ];

  const currentStepData = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(s => s - 1);
    }
  };
  
  // Reset step when dialog is closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => setStep(0), 200); // Delay to allow animation
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Vertical Stepper - Hidden on mobile */}
          <div className="hidden sm:flex w-1/3 bg-muted/50 p-6 flex-col justify-center border-r">
              <DialogHeader className="mb-8 text-left">
                <DialogTitle className="text-2xl">Cómo Funciona</DialogTitle>
                <DialogDescription>
                  Configurar tu asistente es rápido e intuitivo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1 relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border -z-10" />
                  {steps.map((s, index) => (
                      <button 
                          key={s.num} 
                          onClick={() => setStep(index)}
                          className={cn(
                              "w-full text-left p-3 flex items-center gap-4 rounded-lg transition-all",
                              step === index 
                                ? "bg-primary/10 text-primary font-bold border-l-4 border-primary"
                                : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                          )}
                      >
                          <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0 border-2",
                              step === index ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
                          )}>
                              {s.num}
                          </div>
                          <span>{s.title}</span>
                      </button>
                  ))}
              </div>
          </div>
          
          {/* Step Content - Full width on mobile */}
          <div className="w-full sm:w-2/3 p-6 sm:p-8 flex flex-col">
              <DialogHeader className="sm:hidden mb-4 text-center">
                 <DialogTitle className="text-xl">Cómo Funciona</DialogTitle>
              </DialogHeader>
              <div className="flex-grow min-h-[280px] flex items-center justify-center animate-fadeIn">
                  {currentStepData && (
                      <div className="text-center space-y-4">
                          <div className="inline-block bg-primary/10 p-4 rounded-full border border-primary/20 shadow-inner">
                              {currentStepData.icon}
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold">{currentStepData.title}</h3>
                          <p className="text-muted-foreground px-4 max-w-sm mx-auto">{currentStepData.description}</p>
                      </div>
                  )}
              </div>
              <DialogFooter className="flex justify-between w-full mt-8">
                  <Button variant="outline" onClick={handlePrev} disabled={step === 0}>
                      <FaArrowLeft className="mr-2" /> Anterior
                  </Button>
                  <Button onClick={handleNext}>
                      {step === steps.length - 1 ? "Finalizar" : "Siguiente"}
                      {step < steps.length - 1 && <FaArrowRight className="ml-2" />}
                  </Button>
              </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


const PayAsYouGoCalculator = () => {
  const [messages, setMessages] = useState(MESSAGES_PER_CREDIT);
  
  const credits = Math.ceil(messages / MESSAGES_PER_CREDIT);
  const price = credits * PRICE_PER_CREDIT;
  
  const handleSliderChange = (value: number[]) => {
    setMessages(value[0]);
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border border-border/20 shadow-xl hover:shadow-primary/20 transition-all duration-300 text-left p-6 sm:p-8 glow-card">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-2xl sm:text-3xl">Paga Solo Por Lo Que Usas</CardTitle>
        <CardDescription className="text-sm sm:text-base pt-2 text-muted-foreground">
          Sin suscripciones ni compromisos. Ajusta tu consumo según tus necesidades y obtén siempre el mejor precio.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center font-semibold text-lg">
            <span className="flex items-center gap-2"><MessagesSquare className="h-5 w-5 text-primary" /> Número de Mensajes</span>
            <span className="text-primary">{messages.toLocaleString()}</span>
          </div>
          <Slider
            value={[messages]}
            onValueChange={handleSliderChange}
            min={MESSAGES_PER_CREDIT}
            max={MAX_CUSTOM_CREDITS * MESSAGES_PER_CREDIT}
            step={MESSAGES_PER_CREDIT}
            aria-label="Calculadora de mensajes"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{MESSAGES_PER_CREDIT.toLocaleString()}</span>
            <span>{(MAX_CUSTOM_CREDITS * MESSAGES_PER_CREDIT).toLocaleString()}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total de Créditos</p>
                <p className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Coins className="text-accent"/> {credits.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">({MESSAGES_PER_CREDIT.toLocaleString()} mensajes por crédito)</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Costo Estimado (MXN)</p>
                 <p className="text-2xl font-bold flex items-center justify-center gap-2">
                    <CircleDollarSign className="text-green-500"/> ${price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">(${PRICE_PER_CREDIT.toFixed(2)} MXN por crédito)</p>
            </div>
        </div>
        <div className="pt-4 border-t border-border/20 text-center">
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs text-muted-foreground">Pagos seguros a través de Mercado Pago</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Aceptamos tarjetas de crédito, débito, SPEI, OXXO y todos los métodos de pago disponibles a través de Mercado Pago.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const ChatBubble = ({ text, isUser, time }: { text: string; isUser: boolean; time: string }) => (
  <div className={cn("flex mb-2 animate-fadeIn", isUser ? "justify-end" : "justify-start")}>
    <div
      className={cn(
        "rounded-lg px-3 py-2 max-w-[80%] shadow-md",
        isUser
          ? "bg-[#dcf8c6] dark:bg-[#054740] text-black dark:text-white"
          : "bg-white dark:bg-slate-700 text-black dark:text-white"
      )}
    >
      <p className="text-sm">{text}</p>
      <p className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">{time}</p>
    </div>
  </div>
);


const PhoneChatMockup = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState({});

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!ref.current) return;

            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;

            const x = (clientX / innerWidth - 0.5) * 2; // -1 to 1
            const y = (clientY / innerHeight - 0.5) * 2; // -1 to 1

            const rotateY = x * 10; // Max rotation 10deg
            const rotateX = -y * 10; // Max rotation 10deg

            setStyle({
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`,
                transition: 'transform 0.1s ease-out'
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div 
            ref={ref}
            className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[8px] rounded-[2.5rem] h-[550px] w-[270px] shadow-xl"
            style={style}
        >
            <div className="w-[120px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
            <div className="h-[40px] w-[3px] bg-gray-800 absolute -left-[11px] top-[60px] rounded-l-lg"></div>
            <div className="h-[40px] w-[3px] bg-gray-800 absolute -left-[11px] top-[120px] rounded-l-lg"></div>
            <div className="h-[60px] w-[3px] bg-gray-800 absolute -right-[11px] top-[140px] rounded-r-lg"></div>
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-[#ECE5DD] dark:bg-slate-900">
                <div 
                  className="bg-repeat bg-center h-full"
                  style={{ backgroundImage: "url('/whatsapp_bg.png')" }}
                >
                    <div className="h-full flex flex-col">
                        <header className="bg-[#008069] dark:bg-slate-800 text-white p-2 flex items-center shadow-md z-10">
                            <FaWhatsapp className="h-8 w-8 mr-2"/>
                            <div>
                                <h3 className="font-semibold text-base">Asistente de Pastelería</h3>
                                <p className="text-xs opacity-80">en línea</p>
                            </div>
                        </header>
                        <div className="flex-1 p-3 overflow-y-auto">
                           <ChatBubble text="Hola, quisiera un pastel para un cumpleaños." isUser={true} time="4:20 PM" />
                           <ChatBubble text="¡Claro que sí! Con gusto. ¿Qué sabor te gustaría y para cuántas personas sería?" isUser={false} time="4:21 PM" />
                           <ChatBubble text="Chocolate, para 10 personas." isUser={true} time="4:21 PM" />
                           <ChatBubble text="Perfecto. Tengo un pastel de chocolate para 12 personas en $550 MXN. ¿Te gustaría agendarlo?" isUser={false} time="4:22 PM" />
                        </div>
                         <footer className="p-2 bg-transparent flex items-center">
                            <Input 
                                type="text"
                                placeholder="Escribe un mensaje..."
                                className="bg-white dark:bg-slate-700 rounded-full flex-1 border-none focus-visible:ring-1 focus-visible:ring-primary"
                            />
                            <Button size="icon" className="rounded-full ml-2 bg-[#008069] dark:bg-primary hover:bg-[#006a58] dark:hover:bg-primary/90">
                                <Send className="h-5 w-5"/>
                            </Button>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    )
}

const DesktopChatMockup = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState({});

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!ref.current) return;
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            const x = (clientX / innerWidth - 0.5) * 2;
            const y = (clientY / innerHeight - 0.5) * 2;
            const rotateY = x * 8;
            const rotateX = -y * 8;
            setStyle({
                transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(0.9, 0.9, 0.9)`,
                transition: 'transform 0.1s ease-out'
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div 
            ref={ref}
            className="relative mx-auto border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 border-4 rounded-xl h-[550px] w-full max-w-2xl shadow-2xl overflow-hidden"
            style={style}
        >
            <div className="absolute top-2 left-2 flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="w-full h-full flex pt-8">
                <div className="w-1/3 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col">
                    <header className="p-3 bg-slate-200 dark:bg-slate-800 flex-shrink-0">
                        <Input placeholder="Buscar chat..." className="bg-white dark:bg-slate-700 h-8 text-xs" />
                    </header>
                    <div className="flex-grow overflow-y-auto">
                        <div className="flex items-center gap-3 p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800/50">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src="https://picsum.photos/seed/asst1/100" />
                                <AvatarFallback>AV</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow overflow-hidden">
                                <p className="font-semibold truncate text-sm">Asistente de Ventas</p>
                                <p className="text-xs text-muted-foreground truncate">Perfecto, tu pedido ha sido...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-2/3 flex flex-col bg-slate-200 dark:bg-slate-800/50">
                    <header className="bg-white dark:bg-slate-900/80 p-3 flex items-center shadow-sm z-10 shrink-0 border-b border-slate-200 dark:border-slate-700">
                        <Avatar className="h-9 w-9 mr-3 border">
                            <AvatarImage src="https://picsum.photos/seed/asst1/100" />
                            <AvatarFallback>AV</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-sm">Asistente de Ventas</h3>
                            <p className="text-xs text-green-500">en línea</p>
                        </div>
                    </header>
                    <main className="flex-1 p-4 overflow-y-auto">
                       <ChatBubble text="Hola, ¿tienen servicio de catering?" isUser={true} time="2:30 PM" />
                       <ChatBubble text="¡Hola! Sí, ofrecemos servicio de catering para eventos. ¿Para qué tipo de evento y cuántas personas sería?" isUser={false} time="2:31 PM" />
                    </main>
                    <footer className="p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center gap-3 shrink-0 border-t border-slate-200 dark:border-slate-700">
                        <Input placeholder="Escribe un mensaje..." className="h-9 text-sm" />
                        <Button size="sm" className="h-9">Enviar</Button>
                    </footer>
                </div>
            </div>
        </div>
    );
}

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const { toast } = useToast();
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top } = container.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      container.style.setProperty('--mouse-x', `${x}px`);
      container.style.setProperty('--mouse-y', `${y}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleDownloadClick = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({
          title: "Aplicación Instalada",
          description: "¡Gracias por instalar Hey Manito!",
        });
      } else {
         toast({
          title: "Instalación Cancelada",
          description: "Puedes instalar la aplicación en cualquier momento desde el menú de tu navegador.",
          variant: "default"
        });
      }
      setDeferredInstallPrompt(null);
    } else {
       toast({
        title: "Instalación no disponible",
        description: "Tu navegador no es compatible o la aplicación ya está instalada.",
      });
    }
  };
  
  const StoreButton = ({ icon, title, subtitle, className, onClick }: { icon: React.ReactNode, title: string, subtitle: string, className?: string, onClick?: () => void }) => (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-auto px-4 py-2 rounded-lg border border-border/20 shadow-sm hover:bg-muted/80 flex items-center gap-3 w-48 text-left transition-transform transform hover:scale-105",
        className
      )}
    >
      {icon}
      <div>
        <p className="text-xs font-normal leading-none">{title}</p>
        <p className="text-base font-bold leading-tight">{subtitle}</p>
      </div>
    </Button>
  );

  return (
    <>
    <div ref={containerRef} className="relative w-full text-center lg:text-left py-20 sm:py-28 md:py-32 lg:py-36 overflow-hidden">
        <div 
          className="absolute inset-0 z-0 opacity-0 dark:opacity-100 transition-opacity duration-500" 
          style={{
            background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), hsla(var(--primary), 0.15), transparent 80%)'
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-1/2 z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 100%, hsla(var(--primary), 0.2), transparent 80%)',
             maskImage: 'linear-gradient(to top, black 20%, transparent 100%)',
             transform: 'scaleX(1.5)',
             opacity: 0.7
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            {/* Left Column - Text Content */}
            <div className="lg:w-1/2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground animate-fadeIn" style={{animationDelay: '0.1s'}}>
                    Crea Asistentes de IA para <span className="text-brand-gradient">WhatsApp y Desktop</span>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 animate-fadeIn" style={{animationDelay: '0.2s'}}>
                Automatiza tus ventas y atención al cliente con asistentes de IA que trabajan para ti 24/7 en WhatsApp y en tu propia web.
                </p>
                <div className="mt-10 flex flex-col items-center lg:items-start justify-center gap-4 animate-fadeIn" style={{animationDelay: '0.3s'}}>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                        <Button asChild size="lg" className={cn("w-full sm:w-auto text-base px-8 py-3 transition-transform transform hover:scale-105 bg-brand-gradient text-primary-foreground hover:opacity-90 shadow-lg", "shiny-border")}>
                            <Link href="/begin">Iniciar Gratis 30 Días</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-3 transition-transform transform hover:scale-105 bg-background/50 backdrop-blur-sm" onClick={() => setIsHowItWorksOpen(true)}>
                            cómo funciona
                        </Button>
                    </div>
                     <Button asChild variant="link" className="text-muted-foreground hover:text-primary">
                        <Link href="/login">¿Ya tienes una cuenta? Inicia sesión</Link>
                    </Button>
                </div>
                 <div className="mt-8 flex flex-col items-center lg:items-start gap-3 animate-fadeIn" style={{animationDelay: '0.4s'}}>
                    <div className="inline-flex items-center gap-2 bg-muted/50 border border-border/20 shadow-sm rounded-full px-4 py-2">
                        <FcGoogle className="h-4 w-4" />
                        <span className="text-xs text-foreground/80">Autenticación segura con Google</span>
                    </div>
                     <div className="flex flex-col sm:flex-row items-center gap-4">
                        <StoreButton
                            onClick={handleDownloadClick}
                            icon={<AppIcon className="h-8 w-8 text-foreground" />}
                            title="Consíguelo en"
                            subtitle="Nuestra App"
                            className="bg-black text-white hover:bg-black/80"
                         />
                         <Link href="/chat">
                             <StoreButton
                                icon={<AppIcon className="h-8 w-8 text-white" />}
                                title="Disponible en"
                                subtitle="Hey Manito Chat"
                                className="bg-brand-gradient text-white hover:opacity-90 shiny-border"
                             />
                         </Link>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 animate-fadeIn" style={{animationDelay: '0.5s'}}>
                    <span className="font-bold text-brand-gradient">Registro Gratis</span>. Recarga cuando quieras.
                </p>
            </div>
            
            {/* Right Column - Mockups */}
            <div className="lg:w-1/2 w-full max-w-2xl lg:max-w-none relative mt-10 lg:mt-0 h-[550px]">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 lg:-translate-y-1/3 w-full max-w-[270px] lg:right-10 z-10">
                    <PhoneChatMockup />
                </div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 lg:left-0 lg:-translate-y-2/3 w-full lg:w-[calc(100%-80px)]">
                    <DesktopChatMockup />
                </div>
            </div>
        </div>
    </div>
    <HowItWorksDialog open={isHowItWorksOpen} onOpenChange={setIsHowItWorksOpen} />
    </>
  )
}

const features = [
  {
    icon: <FaCogs size={24} className="text-primary" />,
    title: "Configuración Intuitiva",
    description: "Lanza tus asistentes en minutos con nuestro asistente guiado paso a paso. Sin necesidad de código."
  },
  {
    icon: <FaBrain size={24} className="text-primary" />,
    title: "Conexión de Datos Flexible",
    description: "Vincula Hojas de Google o crea bases de datos inteligentes que la IA gestiona por ti."
  },
  {
    icon: <FaWhatsapp size={24} className="text-primary" />,
    title: "Automatización en WhatsApp",
    description: "Despliega tus asistentes directamente en WhatsApp para interactuar con clientes y recibir notificaciones."
  },
  {
    icon: <FaSitemap size={24} className="text-primary" />,
    title: "Gestión Centralizada",
    description: "Crea y administra múltiples asistentes para diferentes propósitos desde un único panel de control."
  },
  {
    icon: <FaShieldAlt size={24} className="text-primary" />,
    title: "Seguridad y Confianza",
    description: "Construido con la seguridad como prioridad para proteger tus datos y los de tus clientes."
  },
  {
    icon: <FaMoneyBillWave size={24} className="text-primary" />,
    title: "Paga por lo que Usas",
    description: "Sin suscripciones ni sorpresas. Nuestro modelo de créditos te da control total sobre tus costos."
  }
];

const FeaturesCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swipeHandled = useRef(false);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % features.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + features.length) % features.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    swipeHandled.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (swipeHandled.current) return;
    
    const swipeDistance = touchStartX.current - touchEndX.current;
    
    // Check for significant swipe
    if (Math.abs(swipeDistance) > 50) { 
      if (swipeDistance > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      swipeHandled.current = true;
    }
  };


  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div 
        className="relative h-72 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {features.map((feature, index) => {
          const offset = index - currentIndex;
          let style = {
            transform: `translateX(${offset * 100}%) scale(0.8)`,
            opacity: 0.4,
            zIndex: features.length - Math.abs(offset),
            transition: 'transform 0.4s ease-out, opacity 0.4s ease-out',
          };
          if (offset === 0) {
            style = {
              ...style,
              transform: 'translateX(0) scale(1)',
              opacity: 1,
            };
          } else if (offset === 1 || (offset < -1 && offset + features.length === 1) ) {
             style = {
              ...style,
              transform: 'translateX(50%) scale(0.85)',
              opacity: 0.6
            }
          } else if (offset === -1 || (offset > 1 && offset - features.length === -1)) {
             style = {
              ...style,
              transform: 'translateX(-50%) scale(0.85)',
              opacity: 0.6
            }
          }

          return (
            <div
              key={index}
              className="absolute top-0 left-0 w-full h-full p-4"
              style={style}
            >
              <FeatureCard {...feature} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-center items-center mt-6 gap-4">
        <Button onClick={handlePrev} variant="outline" size="icon">
          <FaArrowLeft />
        </Button>
        <div className="flex gap-2">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                currentIndex === index ? "bg-primary scale-125" : "bg-muted-foreground/50 hover:bg-muted-foreground"
              )}
              aria-label={`Ir a la característica ${index + 1}`}
            />
          ))}
        </div>
        <Button onClick={handleNext} variant="outline" size="icon">
          <FaArrowRight />
        </Button>
      </div>
    </div>
  );
};

const faqItems = [
    {
        question: "¿Qué necesito para empezar a usar mi asistente de WhatsApp?",
        answer: "¡Es muy sencillo! Para un asistente de WhatsApp, necesitas una nueva tarjeta SIM (chip) que nunca se haya registrado en WhatsApp y una cuenta de correo electrónico para crear tu perfil. Nuestra guía de configuración te llevará paso a paso."
    },
    {
        question: "¿Para qué sirve un asistente de escritorio si no usa WhatsApp?",
        answer: "Un asistente de escritorio es perfecto para pruebas, desarrollo y uso interno. Vive en una página web con un chat dedicado. Puedes usarlo para perfeccionar tus prompts, integrarlo en tus propias aplicaciones a través de una API, o usarlo como una base de conocimiento interna para tu equipo, todo sin necesidad de un número de teléfono."
    },
    {
        question: "¿Puedo usar mi número de WhatsApp personal o de negocio actual?",
        answer: "No. Para garantizar una integración correcta y cumplir con las políticas de WhatsApp, es indispensable usar un número de teléfono completamente nuevo. Esto asegura que tu asistente tenga una línea dedicada y estable para operar sin conflictos."
    },
    {
        question: "¿Cómo funcionan los créditos y el conteo de mensajes?",
        answer: "Funciona con un sistema de pago por uso. Compras créditos, y cada crédito te otorga una cantidad de mensajes (ej. 1,000). Se cuenta como 'un mensaje' cada interacción, tanto los mensajes que tu asistente envía como los que recibe y procesa. Así, solo pagas por el uso real."
    },
    {
        question: "¿Es segura la información de mi negocio y mis clientes?",
        answer: "La seguridad es nuestra prioridad. Nosotros no almacenamos el contenido de tus conversaciones. La información de tu negocio (como productos o servicios) que vinculas a través de Hojas de Google permanece bajo tu control y se rige por las políticas de seguridad de Google."
    },
    {
        question: "¿Qué pasa si mi asistente no sabe cómo responder algo?",
        answer: "Puedes configurar tu asistente para que, en caso de no saber una respuesta o cuando un cliente necesite atención especializada, te notifique directamente a tu número personal de WhatsApp para que puedas intervenir en la conversación."
    },
     {
        question: "¿Puedo personalizar la personalidad de mi asistente?",
        answer: "¡Totalmente! El corazón de tu asistente es el 'prompt' que tú defines. Puedes instruirlo para que sea formal, amigable, divertido o muy técnico, y darle reglas específicas sobre cómo debe interactuar, qué información puede dar y cómo debe manejar diferentes situaciones."
    },
];

const FaqSection = () => {
    return (
        <section id="faq" className="w-full mt-20 sm:mt-28 scroll-mt-20 py-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Preguntas Frecuentes</h2>
                    <p className="mt-4 text-muted-foreground">Aquí resolvemos tus dudas más comunes.</p>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    {faqItems.map((item, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger className="text-left text-base">{item.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
};


export default function MarketingHomePage() {
  const { toast } = useToast();
  
  const handleCopyEmail = () => {
    const email = 'contacto@heymanito.com';
    navigator.clipboard.writeText(email).then(() => {
        toast({
            title: 'Correo Copiado',
            description: 'La dirección de correo de soporte ha sido copiada a tu portapapeles.',
        });
    }, (err) => {
        toast({
            title: 'Error al Copiar',
            description: 'No se pudo copiar la dirección de correo.',
            variant: 'destructive',
        });
        console.error('Could not copy text: ', err);
    });
  };

  return (
    <PageContainer className="flex flex-col items-center py-0 animate-fadeIn" fullWidth={true}>
      <HeroSection />

      <section id="assistant-types" className="w-full mt-20 sm:mt-28 scroll-mt-20 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Dos Tipos de Asistentes, Infinitas Posibilidades</h2>
            <p className="mt-4 text-muted-foreground max-w-3xl mx-auto">
              Elige la herramienta perfecta para tu necesidad. Ya sea para interactuar con clientes en WhatsApp o para potenciar tus herramientas internas, tenemos la solución ideal.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Asistente Desktop */}
             <div className="p-1 rounded-lg bg-brand-gradient shiny-border transition-all duration-300">
              <Card className="flex flex-col text-center p-6 shadow-lg h-full preserve-3d chroma-card">
                <div className="chroma-card-glow" />
                <div className="mb-4 inline-block bg-primary/10 p-4 rounded-full self-center">
                  <AppWindow size={32} className="text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Asistente en Navegador</h3>
                <p className="text-muted-foreground mt-2 mb-4 flex-grow">
                  Un asistente que vive en una página web, ideal para pruebas, desarrollo y uso interno.
                </p>
                <ul className="space-y-3 text-left text-sm text-muted-foreground mb-6">
                  <li className="flex items-start gap-3"><FaCheckCircle className="text-green-500 mt-1 shrink-0" /><span>Prueba prompts y lógica de IA sin costo inicial.</span></li>
                  <li className="flex items-start gap-3"><FaCheckCircle className="text-green-500 mt-1 shrink-0" /><span>Acceso inmediato con 30 días de prueba ilimitada.</span></li>
                  <li className="flex items-start gap-3"><Code className="text-blue-400 mt-1 shrink-0 h-4 w-4" /><span>Potenciado por Gemini AI para respuestas inteligentes.</span></li>
                </ul>
                <Button asChild className={cn("mt-auto bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border")}>
                  <Link href="/begin">Prueba Gratis</Link>
                </Button>
              </Card>
            </div>


            {/* Asistente WhatsApp */}
            <div className="transition-all duration-300">
              <Card className="flex flex-col text-center p-6 shadow-lg h-full preserve-3d">
                <div className="mb-4 inline-block bg-primary/10 p-4 rounded-full self-center">
                  <FaWhatsapp size={32} className="text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Asistente en WhatsApp</h3>
                <p className="text-muted-foreground mt-2 mb-4 flex-grow">
                  La solución completa para automatizar la comunicación con tus clientes 24/7.
                </p>
                <ul className="space-y-3 text-left text-sm text-muted-foreground mb-6">
                    <li className="flex items-start gap-3"><FaCheckCircle className="text-green-500 mt-1 shrink-0" /><span>Atiende a tus clientes y vende en la plataforma que más usan.</span></li>
                    <li className="flex items-start gap-3"><FaCheckCircle className="text-green-500 mt-1 shrink-0" /><span>Requiere un número de teléfono nuevo para una integración estable.</span></li>
                    <li className="flex items-start gap-3"><FaCheckCircle className="text-green-500 mt-1 shrink-0" /><span>Conexión directa con la API oficial de WhatsApp.</span></li>
                </ul>
                <Button asChild className="mt-auto">
                  <Link href="/begin">Crear Asistente WhatsApp</Link>
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="w-full mt-20 sm:mt-28 scroll-mt-20 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">¿Qué puede hacer tu asistente?</h2>
            <p className="mt-4 text-muted-foreground">Herramientas diseñadas para ser poderosas y fáciles de usar en WhatsApp.</p>
          </div>
          <FeaturesCarousel />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full mt-16 sm:mt-20 scroll-mt-20 py-16 bg-card/50">
        <div className="text-center mb-12 max-w-3xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Precios Flexibles y Transparentes</h2>
            <p className="mt-4 text-muted-foreground">Elige un plan de créditos que se ajuste a tus necesidades, sin compromisos a largo plazo.</p>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <PayAsYouGoCalculator />
        </div>
      </section>

      <FaqSection />

      <section className="w-full mt-20 sm:mt-28 py-16">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
             <h2 className="text-3xl sm:text-4xl font-bold mb-6">¿Listo para Empezar a Automatizar?</h2>
             <p className="text-lg text-muted-foreground mb-8">
               Únete a {APP_NAME} hoy mismo y transforma la manera en que gestionas tus comunicaciones y tareas por WhatsApp.
             </p>
             <div className="flex flex-col items-center gap-4">
                 <Button asChild size="lg" className={cn("w-full sm:w-auto text-base px-8 py-3 transition-transform transform hover:scale-105 bg-brand-gradient text-primary-foreground hover:opacity-90 shadow-lg", "shiny-border")}>
                    <Link href="/begin">Iniciar Gratis 30 Días</Link>
                </Button>
               <p className="text-xs text-muted-foreground mt-2">
                 Crea tu cuenta y configura tu primer asistente en minutos.
               </p>
             </div>
        </div>
      </section>
      
    </PageContainer>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true); // Always visible in carousel

  return (
    <div
      ref={ref}
      className={cn(
        "relative p-6 rounded-lg border border-border/10 transition-all duration-300 glow-card text-center h-full flex flex-col justify-center items-center",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="relative z-10">
        <div className="mb-4 inline-block bg-primary/10 p-3 rounded-lg border border-primary/20">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};
    

    

    



    

    














    









