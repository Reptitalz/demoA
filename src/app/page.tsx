
"use client";

import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { APP_NAME, subscriptionPlansConfig, planIcons } from '@/config/appConfig';
import type { SubscriptionPlanDetails } from '@/types';
import Link from 'next/link'; // Ensure Link is imported
import { FaWhatsapp, FaBrain, FaUsers, FaCogs, FaShieldAlt, FaChartLine, FaCheckCircle } from 'react-icons/fa';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import AppIcon from '@/components/shared/AppIcon'; // Import the new AppIcon component

export default function MarketingPage() {
  return (
    <PageContainer className="flex flex-col items-center text-center py-8 sm:py-12 animate-fadeIn" fullWidth={true}>
      {/* Hero Section */}
      {/* Replace FaRocket with the AppIcon component */}
      <AppIcon
        className="h-14 w-14 text-foreground mb-6 sm:mb-8" // text-foreground will handle theme color
        aria-label={`${APP_NAME} Icon`}
      />
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
        Bienvenido a <span className="text-brand-gradient">{APP_NAME}</span>
      </h1>
      <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-xl lg:max-w-2xl mx-auto">
        La solución definitiva para gestionar tus asistentes de IA de forma inteligente y eficiente, automatizando la comunicación y optimizando tus procesos.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-8 sm:mb-12">
        <Button asChild size="lg" className={cn("text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3 transition-transform transform hover:scale-105 bg-brand-gradient text-primary-foreground hover:opacity-90")}>
          <Link href="/app">Acceder a la Aplicación</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3 transition-transform transform hover:scale-105">
          <Link href="#features">Conocer Más</Link>
        </Button>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Potencia tu comunicación y automatiza tareas con {APP_NAME}.
      </p>

      {/* Placeholder Image Section */}
      <div className="my-10 sm:my-16 w-full max-w-2xl lg:max-w-3xl aspect-video bg-muted rounded-lg shadow-xl overflow-hidden mx-auto">
        <Image
            data-ai-hint="app dashboard interface"
            src="https://placehold.co/800x450.png" 
            alt={`Demostración de ${APP_NAME}`}
            width={800}
            height={450}
            className="object-cover w-full h-full"
            priority
        />
      </div>

      {/* Features Section */}
      <section id="features" className="w-full mt-12 sm:mt-16 scroll-mt-20">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-8 sm:mb-10">Características Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-left max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeatureCard
            icon={<FaCogs size={24} className="text-brand-gradient mb-3" />}
            title="Configuración Sencilla"
            description="Un asistente intuitivo paso a paso para configurar tus agentes virtuales en minutos."
          />
          <FeatureCard
            icon={<FaBrain size={24} className="text-brand-gradient mb-3" />}
            title="Integración de Datos Inteligente"
            description="Conecta con Hojas de Google, Excel o crea bases de datos inteligentes con ayuda de IA."
          />
          <FeatureCard
            icon={<FaWhatsapp size={24} className="text-brand-gradient mb-3" />}
            title="Comunicación Directa por WhatsApp"
            description="Interactúa con tus asistentes y clientes directamente a través de la plataforma de WhatsApp."
          />
          <FeatureCard
            icon={<FaUsers size={24} className="text-brand-gradient mb-3" />}
            title="Gestión de Múltiples Asistentes"
            description="Crea y administra varios asistentes para diferentes propósitos desde un solo lugar."
          />
          <FeatureCard
            icon={<FaShieldAlt size={24} className="text-brand-gradient mb-3" />}
            title="Seguridad y Privacidad"
            description="Tus datos y los de tus clientes están protegidos con altos estándares de seguridad."
          />
          <FeatureCard
            icon={<FaChartLine size={24} className="text-brand-gradient mb-3" />}
            title="Planes Flexibles"
            description="Elige el plan que mejor se adapte a tus necesidades, desde gratuito hasta opciones empresariales."
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full mt-16 sm:mt-20 scroll-mt-20">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-8 sm:mb-10">Planes y Precios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {subscriptionPlansConfig.map((plan) => {
            const Icon = planIcons[plan.id] || AppIcon; // Fallback icon can be AppIcon or FaRocket
            return <PricingPlanCard key={plan.id} plan={plan} icon={<Icon size={28} className="text-brand-gradient mb-2" />} />;
          })}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full mt-16 sm:mt-20 py-10 sm:py-12 bg-card rounded-lg shadow-xl max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
         <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">¿Listo para Empezar?</h2>
         <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto">
           Únete a {APP_NAME} hoy mismo y transforma la manera en que gestionas tus comunicaciones y tareas.
         </p>
         <Button asChild size="lg" className={cn("text-sm sm:text-base px-8 sm:px-10 py-3 transition-transform transform hover:scale-105 bg-brand-gradient text-primary-foreground hover:opacity-90")}>
           <Link href="/app">Crear mi Primer Asistente</Link>
         </Button>
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
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="pb-3">
      {icon}
      <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

interface PricingPlanCardProps {
  plan: SubscriptionPlanDetails;
  icon: React.ReactNode;
}

const PricingPlanCard = ({ plan, icon }: PricingPlanCardProps) => (
  <Card className="shadow-lg hover:shadow-primary/20 hover:border-primary transition-all duration-300 flex flex-col text-left">
    <CardHeader className="p-6 items-start"> {/* Increased padding for more whitespace */}
      <div className="flex items-center gap-3 w-full">
        {icon}
        <CardTitle className="text-lg sm:text-xl">{plan.name}</CardTitle>
      </div>
      <p className="text-3xl sm:text-4xl font-bold text-brand-gradient pt-3"> {/* Increased top padding, apply gradient to price */}
        ${plan.priceMonthly}
        <span className="text-xs font-normal text-muted-foreground ml-1">/mes</span> {/* Made '/mes' smaller and added margin */}
      </p>
    </CardHeader>
    <CardContent className="flex-grow space-y-3">
      <p className="text-sm font-semibold text-foreground">
        {plan.assistantLimit === "unlimited" ? "Asistentes Ilimitados" : `${plan.assistantLimit} ${plan.assistantLimit === 1 ? 'Asistente' : 'Asistentes'}`}
      </p>
      <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start">
            <FaCheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 mt-0.5 shrink-0 text-green-500" /> {/* Keeping checkmark green for universal "good" indication */}
            {feature}
          </li>
        ))}
      </ul>
    </CardContent>
    <CardFooter className="pt-4">
      <Button asChild size="lg" className={cn("w-full text-sm sm:text-base transition-transform transform hover:scale-105 bg-brand-gradient text-primary-foreground hover:opacity-90")}>
        <Link href="/app">Elegir Plan</Link>
      </Button>
    </CardFooter>
  </Card>
);
