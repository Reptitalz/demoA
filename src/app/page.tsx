
"use client";

import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';
import { FaRocket } from 'react-icons/fa';

export default function MarketingPage() {
  return (
    <PageContainer className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-200px)] py-8 sm:py-12">
      <FaRocket size={56} className="text-primary mb-6 sm:mb-8" />
      <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Bienvenido a {APP_NAME}</h1>
      <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-xl">
        La solución definitiva para gestionar tus asistentes de IA de forma inteligente y eficiente.
      </p>
      <div className="space-y-3 sm:space-y-4">
        <Button asChild size="lg" className="text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3">
          <Link href="/app">Acceder a la Aplicación</Link>
        </Button>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Potencia tu comunicación y automatiza tareas con {APP_NAME}.
        </p>
      </div>
      
      <section className="mt-12 sm:mt-16 w-full">
        <h2 className="text-xl sm:text-2xl font-semibold mb-5 sm:mb-6">Características Principales</h2>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 text-left">
          <div className="p-4 sm:p-6 bg-card rounded-lg shadow-md">
            <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Configuración Sencilla</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Un asistente paso a paso para configurar tus agentes virtuales.</p>
          </div>
          <div className="p-4 sm:p-6 bg-card rounded-lg shadow-md">
            <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Integración de Datos</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Conecta con Hojas de Google, Excel o crea bases de datos inteligentes.</p>
          </div>
          <div className="p-4 sm:p-6 bg-card rounded-lg shadow-md">
            <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Comunicación Directa</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Interactúa con tus asistentes y clientes a través de WhatsApp.</p>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
