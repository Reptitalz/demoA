
"use client";

import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';
import { Check, ArrowRight, Bot, Settings, Smartphone, Zap, Apple, Globe } from 'lucide-react';
import { FaAndroid } from 'react-icons/fa';
import { motion } from "framer-motion";
import AppIcon from '@/components/shared/AppIcon';
import Image from 'next/image';

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
      <section className="relative text-center pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
          <div 
            className="absolute inset-0 z-0 opacity-20"
            style={{
                backgroundImage: 'radial-gradient(circle, hsl(var(--primary) / 0.1), transparent 60%), radial-gradient(circle, hsl(var(--accent) / 0.05), transparent 70%)',
            }}
          />
          <div className="container max-w-4xl mx-auto px-4 relative z-10">
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
              >
                  <AppIcon className="h-20 w-20 mx-auto mb-4" />
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                      Automatiza tu Negocio con <span className="text-brand-gradient">Asistentes Inteligentes</span>
                  </h1>
                  <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                      Crea, gestiona y despliega asistentes de IA para tu negocio. Automatiza ventas, soporte y más. Todo desde una PWA ligera y potente.
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button asChild size="lg" className="w-full sm:w-auto bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border">
                          <Link href="/begin"><Bot className="mr-2"/>Crear Asistente Gratis</Link>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                          <Link href="#features">Ver Funciones</Link>
                      </Button>
                  </div>
                  <div className="mt-6 flex justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> Prueba gratuita</span>
                      <span className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> Sin tarjeta requerida</span>
                  </div>
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
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mb-2">1</div>
                  <p className="font-semibold">Describe tu Asistente</p>
                  <p className="text-sm text-muted-foreground">Usa el prompt para darle instrucciones.</p>
              </div>
              <ArrowRight className="text-primary opacity-50 hidden md:block" />
               <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mb-2">2</div>
                  <p className="font-semibold">Conecta tus Datos</p>
                  <p className="text-sm text-muted-foreground">Vincula una Hoja de Google o crea una BD.</p>
              </div>
               <ArrowRight className="text-primary opacity-50 hidden md:block" />
              <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mb-2">3</div>
                  <p className="font-semibold">Lanza y Automatiza</p>
                  <p className="text-sm text-muted-foreground">Chatea con tu asistente y compártelo.</p>
              </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/50">
        <div className="container max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">¿Listo para Probar {APP_NAME}?</h2>
            <p className="mt-3 text-muted-foreground">
                Instala la PWA en tu dispositivo y comienza a automatizar tus ventas con asistentes inteligentes.
            </p>
            <Button asChild size="lg" className="mt-8 bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border">
                <Link href="/begin">Crear mi Primer Asistente</Link>
            </Button>
            <div className="mt-8 flex justify-center items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Apple className="h-5 w-5" />
                    <span className="text-sm">iPhone</span>
                </div>
                 <div className="flex items-center gap-2">
                    <FaAndroid className="h-5 w-5" />
                    <span className="text-sm">Android</span>
                </div>
                 <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    <span className="text-sm">Web</span>
                </div>
            </div>
        </div>
      </section>

    </PageContainer>
  );
};

export default NewHomepage;
