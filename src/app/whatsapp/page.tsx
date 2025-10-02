
"use client";

import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';
import { FaCheck, FaArrowRight, FaRobot, FaCog, FaMobileAlt, FaBrain, FaUniversity, FaCreditCard, FaWhatsapp } from 'react-icons/fa';
import { motion } from "framer-motion";
import AppIcon from '@/components/shared/AppIcon';

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
    </PageContainer>
  );
};

export default WhatsAppPage;
