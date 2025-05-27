
"use client";

import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';
import { FaRocket, FaWhatsapp, FaBrain, FaUsers, FaCogs, FaShieldAlt, FaChartLine } from 'react-icons/fa';
import Image from 'next/image';

export default function MarketingPage() {
  return (
    <PageContainer className="flex flex-col items-center text-center py-8 sm:py-12 animate-fadeIn">
      {/* Hero Section */}
      <FaRocket size={56} className="text-primary mb-6 sm:mb-8" />
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
        Bienvenido a <span className="text-primary">{APP_NAME}</span>
      </h1>
      <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-xl lg:max-w-2xl">
        La solución definitiva para gestionar tus asistentes de IA de forma inteligente y eficiente, automatizando la comunicación y optimizando tus procesos.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-8 sm:mb-12">
        <Button asChild size="lg" className="text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3 transition-transform transform hover:scale-105">
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
      <div className="my-10 sm:my-16 w-full max-w-2xl aspect-video bg-muted rounded-lg shadow-xl overflow-hidden">
        <Image
            data-ai-hint="app dashboard interface"
            src="https://placehold.co/800x450.png" // Placeholder for an app screenshot or demo
            alt="Demostración de Hey Manito!"
            width={800}
            height={450}
            className="object-cover w-full h-full"
            priority
        />
      </div>

      {/* Features Section */}
      <section id="features" className="w-full mt-12 sm:mt-16 scroll-mt-20">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-8 sm:mb-10">Características Principales</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-left">
          <FeatureCard
            icon={<FaCogs size={24} className="text-primary mb-3" />}
            title="Configuración Sencilla"
            description="Un asistente intuitivo paso a paso para configurar tus agentes virtuales en minutos."
          />
          <FeatureCard
            icon={<FaBrain size={24} className="text-primary mb-3" />}
            title="Integración de Datos Inteligente"
            description="Conecta con Hojas de Google, Excel o crea bases de datos inteligentes con ayuda de IA."
          />
          <FeatureCard
            icon={<FaWhatsapp size={24} className="text-primary mb-3" />}
            title="Comunicación Directa por WhatsApp"
            description="Interactúa con tus asistentes y clientes directamente a través de la plataforma de WhatsApp."
          />
          <FeatureCard
            icon={<FaUsers size={24} className="text-primary mb-3" />}
            title="Gestión de Múltiples Asistentes"
            description="Crea y administra varios asistentes para diferentes propósitos desde un solo lugar."
          />
          <FeatureCard
            icon={<FaShieldAlt size={24} className="text-primary mb-3" />}
            title="Seguridad y Privacidad"
            description="Tus datos y los de tus clientes están protegidos con altos estándares de seguridad."
          />
          <FeatureCard
            icon={<FaChartLine size={24} className="text-primary mb-3" />}
            title="Planes Flexibles"
            description="Elige el plan que mejor se adapte a tus necesidades, desde gratuito hasta opciones empresariales."
          />
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full mt-16 sm:mt-20 py-10 sm:py-12 bg-card rounded-lg shadow-xl">
         <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">¿Listo para Empezar?</h2>
         <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto">
           Únete a {APP_NAME} hoy mismo y transforma la manera en que gestionas tus comunicaciones y tareas.
         </p>
         <Button asChild size="lg" className="text-sm sm:text-base px-8 sm:px-10 py-3 transition-transform transform hover:scale-105">
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
