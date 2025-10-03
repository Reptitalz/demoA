
"use client";

import React, { useRef, useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { APP_NAME, CREDIT_PACKAGES, MESSAGES_PER_CREDIT } from '@/config/appConfig';
import Link from 'next/link';
import { FaCheck, FaArrowRight, FaRobot, FaCog, FaMobileAlt, FaBrain, FaUniversity, FaCreditCard, FaWhatsapp, FaCoins } from 'react-icons/fa';
import { FaCcVisa, FaCcMastercard, FaCcAmex } from 'react-icons/fa';
import { motion } from "framer-motion";
import AppIcon from '@/components/shared/AppIcon';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const CreditPackagesCarousel = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                const scrollLeft = scrollRef.current.scrollLeft;
                const cardWidth = scrollRef.current.offsetWidth;
                if (cardWidth > 0) {
                    const newIndex = Math.round(scrollLeft / cardWidth);
                    setActiveIndex(newIndex);
                }
            }
        };

        const scroller = scrollRef.current;
        if (scroller) {
            scroller.addEventListener('scroll', handleScroll, { passive: true });
            return () => scroller.removeEventListener('scroll', handleScroll);
        }
    }, []);

    return (
        <div className="w-full">
            <div
                ref={scrollRef}
                className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide -m-2 p-2"
            >
                {CREDIT_PACKAGES.map((pkg, index) => {
                    const messages = Math.floor(pkg.credits * MESSAGES_PER_CREDIT);
                    return (
                        <div key={index} className="w-full flex-shrink-0 snap-center p-2">
                             <Card className="text-center shadow-lg bg-gradient-to-br from-primary/10 to-transparent glow-card h-full flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                                    <CardDescription>{pkg.credits} crédito{pkg.credits > 1 ? 's' : ''}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col justify-center items-center">
                                    <div className="my-4">
                                        <span className="text-5xl font-extrabold">${pkg.price.toLocaleString('es-MX')}</span>
                                        <span className="text-muted-foreground"> MXN</span>
                                    </div>
                                    <div className="text-lg font-semibold flex items-center gap-2 text-primary">
                                       <FaCoins /> {messages.toLocaleString()} mensajes
                                    </div>
                                </CardContent>
                                <CardFooter className="flex-col gap-2 pt-4">
                                    <p className="text-xs text-muted-foreground">Ideal para empezar a automatizar.</p>
                                </CardFooter>
                            </Card>
                        </div>
                    );
                })}
            </div>
             <div className="flex justify-center mt-4 space-x-2">
                {CREDIT_PACKAGES.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            if (scrollRef.current) {
                                const cardWidth = scrollRef.current.offsetWidth;
                                scrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
                            }
                        }}
                        className={cn(
                            "h-2 w-2 rounded-full transition-all",
                            activeIndex === index ? "w-6 bg-primary" : "bg-muted-foreground/50"
                        )}
                        aria-label={`Ir al paquete ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};


const WhatsAppPage = () => {

  const features = [
    { text: 'Responde preguntas 24/7.', icon: FaRobot },
    { text: 'Captura clientes potenciales.', icon: FaCog },
    { text: 'Agenda citas automáticamente.', icon: FaMobileAlt },
    { text: 'Conecta con tus bases de datos.', icon: FaBrain },
  ];

  return (
    <PageContainer>
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden text-center">
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10"
          >
              <div className="inline-block p-4 bg-green-500/10 rounded-full mb-4">
                  <FaWhatsapp className="h-12 w-12 text-green-500" />
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                  Automatiza tu <span className="text-green-500">WhatsApp</span> con IA
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                  Crea un asistente inteligente que trabaje para ti directamente en WhatsApp. Atiende a tus clientes, vende y gestiona tu negocio, todo de forma automática.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border">
                    <Link href={"/login"}>
                        <FaRobot className="mr-2" />
                        Crear Asistente de WhatsApp
                    </Link>
                </Button>
              </div>
          </motion.div>
      </section>

      <section id="features" className="py-20 bg-muted/50">
        <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight">Todo lo que tu negocio necesita en WhatsApp</h2>
                <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Capacidades de nivel empresarial para llevar tus ventas y atención al cliente al siguiente nivel.</p>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
                                <feature.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{feature.text}</h3>
                            <p className="mt-1 text-muted-foreground">
                                {
                                    [
                                        'Tu asistente se encarga de las tareas repetitivas para que tú te enfoques en crecer.',
                                        'Nunca pierdas una oportunidad. Tu asistente captura la información de contacto y califica a los leads por ti.',
                                        'Permite que tus clientes agenden directamente desde WhatsApp, sincronizado con tu calendario.',
                                        'Conecta Hojas de Google o crea bases de conocimiento para que tu asistente siempre tenga la respuesta correcta.'
                                    ][index]
                                }
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      <section className="py-20 bg-background">
          <div className="container max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Planes para WhatsApp</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Elige el plan que se adapte al tamaño y las necesidades de tu negocio.</p>
              
              <div className="mt-10 max-w-lg mx-auto">
                <CreditPackagesCarousel />
                 <div className="mt-8 text-center">
                      <p className="text-xs text-muted-foreground mb-2">Paga de forma segura con Mercado Pago.</p>
                       <div className="flex justify-center items-center gap-3">
                              <FaCcVisa className="h-6 w-6 text-muted-foreground" />
                              <FaCcMastercard className="h-6 w-6 text-muted-foreground" />
                              <FaCcAmex className="h-6 w-6 text-muted-foreground" />
                       </div>
                  </div>
              </div>
          </div>
      </section>

    </PageContainer>
  );
};

export default WhatsAppPage;
