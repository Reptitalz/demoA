
"use client";

import { useState, useRef, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { APP_NAME, PRICE_PER_CREDIT, MESSAGES_PER_CREDIT, MAX_CUSTOM_CREDITS, CREDIT_PACKAGES } from '@/config/appConfig';
import Link from 'next/link';
import { FaWhatsapp, FaBrain, FaCogs, FaShieldAlt, FaSitemap, FaMoneyBillWave, FaUserEdit, FaSimCard, FaCheckCircle, FaGoogle, FaArrowLeft, FaArrowRight, FaEnvelope } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { MessagesSquare, CircleDollarSign, Coins, Send, ArrowRight, UserCog } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import React from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

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
            className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[8px] rounded-[2.5rem] h-[550px] w-[270px] shadow-xl animate-float"
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

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const { left, top, width, height } = container.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      container.style.setProperty('--mouse-x', `${x}px`);
      container.style.setProperty('--mouse-y', `${y}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
    <div ref={containerRef} className="relative w-full text-center py-20 sm:py-28 md:py-32 lg:py-36 overflow-hidden">
        <div 
          className="absolute inset-0 z-0 opacity-0 dark:opacity-100 transition-opacity duration-500" 
          style={{
            background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), hsla(var(--primary), 0.15), transparent 80%)'
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground animate-fadeIn" style={{animationDelay: '0.1s'}}>
                Crea Asistentes de IA para <span className="text-brand-gradient">WhatsApp</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto animate-fadeIn" style={{animationDelay: '0.2s'}}>
               Automatiza conversaciones, gestiona datos y optimiza tus procesos de negocio con asistentes inteligentes directamente en la app de mensajería más popular.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeIn" style={{animationDelay: '0.3s'}}>
                <Button asChild size="lg" className={cn("w-full sm:w-auto text-base px-8 py-3 transition-transform transform hover:scale-105 bg-brand-gradient text-primary-foreground hover:opacity-90 shadow-lg")}>
                    <Link href="/login">Empezar Ahora <ArrowRight className="ml-2"/></Link>
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-3 transition-transform transform hover:scale-105 bg-background/50 backdrop-blur-sm" onClick={() => setIsHowItWorksOpen(true)}>
                    Cómo Funciona
                </Button>
            </div>
             <div className="mt-8 animate-fadeIn" style={{animationDelay: '0.4s'}}>
                <div className="inline-flex items-center gap-2 bg-muted/50 border border-border/20 shadow-sm rounded-full px-4 py-2">
                    <FcGoogle className="h-4 w-4" />
                    <span className="text-xs text-foreground/80">Autenticación segura con Google</span>
                </div>
            </div>
             <p className="text-sm text-muted-foreground mt-4 animate-fadeIn" style={{animationDelay: '0.5s'}}>
                <span className="font-bold text-brand-gradient">Registro Gratis</span>. Recarga cuando quieras.
            </p>
        </div>
    </div>
    <HowItWorksDialog open={isHowItWorksOpen} onOpenChange={setIsHowItWorksOpen} />
    </>
  )
}

const StepCard = ({ num, icon, title, description, imageUrl, imageHint, children }: { num: string, icon: React.ReactNode, title: string, description: string, imageUrl: string, imageHint: string, children?: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '0px',
        threshold: 0.1
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "relative p-6 rounded-lg border border-border/10 transition-all duration-300 glow-card opacity-0",
        isVisible && "animate-scroll-in"
      )}
    >
        <div className="relative space-y-4">
            <div className="mb-4 inline-block bg-primary/10 p-3 rounded-lg border border-primary/20">
                {icon}
            </div>
             <div className="relative aspect-video w-full rounded-md overflow-hidden border">
              <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-1 rounded-full z-10">
                Paso {num}
              </div>
              <Image
                src={imageUrl}
                alt={title}
                width={300}
                height={169}
                className="w-full h-full object-cover"
                data-ai-hint={imageHint}
              />
            </div>
            <h3 className="text-xl font-semibold mb-2 pt-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </div>
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
  
  const setupMouseEvent = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <PageContainer className="flex flex-col items-center py-0 animate-fadeIn" fullWidth={true}>
      <HeroSection />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20 animate-fadeIn" style={{animationDelay: '0.5s', perspective: '1000px'}}>
        <PhoneChatMockup />
      </div>

       <section id="how-it-works" className="w-full mt-20 sm:mt-28 scroll-mt-20 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Empieza en 3 Sencillos Pasos</h2>
            <p className="mt-4 text-muted-foreground">Configurar tu asistente de IA para WhatsApp es rápido e intuitivo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12" onMouseMove={setupMouseEvent}>
            <StepCard
              num="1"
              icon={<UserCog size={28} className="text-primary" />}
              title="Crea tu Asistente"
              description="Define el nombre, la personalidad y los objetivos de tu asistente a través de nuestro sencillo asistente de configuración. No se requiere código."
              imageUrl="/1.jpeg"
              imageHint="AI assistant setup"
            />
            <StepCard
              num="2"
              icon={<FaSimCard size={28} className="text-primary" />}
              title="Vincula un Número"
              description="Adquiere una SIM nueva (sin WhatsApp previo) y vincúlala a tu asistente para que pueda empezar a comunicarse."
              imageUrl="/2.jpeg"
              imageHint="SIM card linking"
            />
            <StepCard
              num="3"
              icon={<FaCheckCircle size={28} className="text-primary" />}
              title="Activa y Disfruta"
              description="Recibirás un código de verificación de Facebook por SMS. Ingrésalo para activar tu asistente y deja que empiece a trabajar para ti."
              imageUrl="/3.jpeg"
              imageHint="success activation"
            />
          </div>
        </div>
      </section>

      <section id="features" className="w-full mt-20 sm:mt-28 scroll-mt-20 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Potencia tus Asistentes de IA sin Complejidad</h2>
                <p className="mt-4 text-muted-foreground">Herramientas diseñadas para ser poderosas y fáciles de usar en WhatsApp.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" onMouseMove={setupMouseEvent}>
              <FeatureCard
                icon={<FaCogs size={24} className="text-primary" />}
                title="Configuración Intuitiva"
                description="Lanza tus asistentes en minutos con nuestro asistente guiado paso a paso. Sin necesidad de código."
              />
              <FeatureCard
                icon={<FaBrain size={24} className="text-primary" />}
                title="Conexión de Datos Flexible"
                description="Vincula Hojas de Google o crea bases de datos inteligentes que la IA gestiona por ti."
              />
              <FeatureCard
                icon={<FaWhatsapp size={24} className="text-primary" />}
                title="Automatización en WhatsApp"
                description="Despliega tus asistentes directamente en WhatsApp para interactuar con clientes y recibir notificaciones."
              />
              <FeatureCard
                icon={<FaSitemap size={24} className="text-primary" />}
                title="Gestión Centralizada"
                description="Crea y administra múltiples asistentes para diferentes propósitos desde un único panel de control."
              />
              <FeatureCard
                icon={<FaShieldAlt size={24} className="text-primary" />}
                title="Seguridad y Confianza"
                description="Construido con la seguridad como prioridad para proteger tus datos y los de tus clientes."
              />
               <FeatureCard
                icon={<FaMoneyBillWave size={24} className="text-primary" />}
                title="Paga por lo que Usas"
                description="Sin suscripciones ni sorpresas. Nuestro modelo de créditos te da control total sobre tus costos."
              />
            </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full mt-16 sm:mt-20 scroll-mt-20 py-16 bg-card/50">
        <div className="text-center mb-12 max-w-3xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Precios Flexibles y Transparentes</h2>
            <p className="mt-4 text-muted-foreground">Elige un plan de créditos que se ajuste a tus necesidades, sin compromisos a largo plazo.</p>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8" onMouseMove={setupMouseEvent}>
            <PayAsYouGoCalculator />
        </div>
      </section>


      <section className="w-full mt-20 sm:mt-28 py-16">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
             <h2 className="text-3xl sm:text-4xl font-bold mb-6">¿Listo para Empezar a Automatizar?</h2>
             <p className="text-lg text-muted-foreground mb-8">
               Únete a {APP_NAME} hoy mismo y transforma la manera en que gestionas tus comunicaciones y tareas por WhatsApp.
             </p>
             <div className="flex flex-col items-center gap-4">
               <Button 
                 onClick={handleCopyEmail}
                 size="lg" 
                 className={cn("w-full sm:w-auto text-base px-8 py-3 transition-transform transform hover:scale-105 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg")}
               >
                 <FaEnvelope className="mr-2 h-5 w-5" />
                 Contactar por Correo
               </Button>
               <p className="text-xs text-muted-foreground mt-2">
                 ¿Tienes dudas? Da clic para copiar nuestro correo de soporte.
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '0px',
        threshold: 0.1
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative p-6 rounded-lg border border-border/10 transition-all duration-300 glow-card opacity-0",
        isVisible && "animate-scroll-in"
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
    

    