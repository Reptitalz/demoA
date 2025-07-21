
"use client";

import { useState, useRef, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';
import { FaWhatsapp, FaBrain, FaCogs, FaShieldAlt, FaSitemap, FaMoneyBillWave } from 'react-icons/fa';
import { MessagesSquare, CircleDollarSign, Coins, Send, ArrowRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import React from 'react';
import { Input } from '@/components/ui/input';

const PayAsYouGoCalculator = () => {
  const MESSAGES_PER_CREDIT = 1000;
  const PRICE_PER_CREDIT_MXN = 50;
  const MAX_MESSAGES = 50000;
  const IVA_RATE = 1.16; // 16% IVA

  const [messages, setMessages] = useState(1000);

  const credits = Math.ceil(messages / MESSAGES_PER_CREDIT);
  const price = credits * PRICE_PER_CREDIT_MXN;
  const priceWithIva = price * IVA_RATE;

  const handleSliderChange = (value: number[]) => {
    setMessages(value[0]);
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border border-border/20 shadow-xl hover:shadow-primary/20 transition-all duration-300 text-left p-6 sm:p-8">
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
            min={1000}
            max={MAX_MESSAGES}
            step={1000}
            aria-label="Calculadora de mensajes"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1,000</span>
            <span>{MAX_MESSAGES.toLocaleString()}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total de Créditos</p>
                <p className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Coins className="text-accent"/> {credits.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">(1 crédito = 1,000 mensajes)</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Costo Estimado (MXN)</p>
                 <p className="text-2xl font-bold flex items-center justify-center gap-2">
                    <CircleDollarSign className="text-green-500"/> ${priceWithIva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">(50 MXN por crédito + IVA)</p>
            </div>
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

    return (
        <div 
            ref={ref}
            className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[8px] rounded-[2.5rem] h-[550px] w-[270px] shadow-xl"
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
    <div ref={containerRef} className="relative w-full text-center py-20 sm:py-28 md:py-36 lg:py-40 overflow-hidden">
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
                    <Link href="/app">Empezar Ahora <ArrowRight className="ml-2"/></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-3 transition-transform transform hover:scale-105 bg-background/50 backdrop-blur-sm">
                    <Link href="#features">Ver características</Link>
                </Button>
            </div>
        </div>
    </div>
  )
}

export default function MarketingPage() {
  return (
    <PageContainer className="flex flex-col items-center py-0 animate-fadeIn" fullWidth={true}>
      <HeroSection />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-fadeIn" style={{animationDelay: '0.5s'}}>
        <PhoneChatMockup />
      </div>

      <section id="features" className="w-full mt-20 sm:mt-28 scroll-mt-20 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Potencia sin Complejidad</h2>
                <p className="mt-4 text-muted-foreground">Herramientas diseñadas para ser poderosas y fáciles de usar.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <p className="mt-4 text-muted-foreground">Elige un plan que se ajuste a tus necesidades, sin compromisos a largo plazo.</p>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <PayAsYouGoCalculator />
        </div>
      </section>


      <section className="w-full mt-20 sm:mt-28 py-16">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
             <h2 className="text-3xl sm:text-4xl font-bold mb-6">¿Listo para Empezar?</h2>
             <p className="text-lg text-muted-foreground mb-8">
               Únete a {APP_NAME} hoy mismo y transforma la manera en que gestionas tus comunicaciones y tareas.
             </p>
             <div className="flex flex-col items-center gap-4">
               <Button 
                 asChild 
                 size="lg" 
                 className={cn("w-full sm:w-auto text-base px-8 py-3 transition-transform transform hover:scale-105 bg-green-500 hover:bg-green-600 text-white shadow-lg")}
               >
                 <Link href="https://wa.me/5213350474005" target="_blank" rel="noopener noreferrer">
                   <FaWhatsapp className="mr-2 h-5 w-5" />
                   Contactar por WhatsApp
                 </Link>
               </Button>
               <p className="text-xs text-muted-foreground mt-2">
                 ¿Tienes dudas? Hablarás con mi asistente de Hey Manito.
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

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border border-border/10 transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10">
      <div className="mb-4 inline-block bg-primary/10 p-3 rounded-lg border border-primary/20">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
  </div>
);
