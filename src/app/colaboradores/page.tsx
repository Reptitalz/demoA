"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaUserPlus, FaWhatsapp, FaRocket, FaHandshake, FaBullseye, FaChartLine } from 'react-icons/fa';
import { ArrowRight, CircleDollarSign, Target } from 'lucide-react';
import { APP_NAME } from '@/config/appConfig';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const CollaboratorsPage = () => {
    const router = useRouter();

    const steps = [
        {
            icon: <FaUserPlus className="h-8 w-8 text-primary" />,
            title: "1. Registra a tu Cliente",
            description: "Usa tu enlace de referido único para que tus clientes creen su primer asistente. ¡Es el primer paso para empezar a ganar!",
            imageUrl: "https://placehold.co/600x400.png",
            imageHint: "client registration"
        },
        {
            icon: <FaWhatsapp className="h-8 w-8 text-green-500" />,
            title: "2. Ayúdalos a Activar",
            description: "Guía a tus clientes en la vinculación de un número de WhatsApp nuevo. Es crucial para que el asistente funcione.",
            imageUrl: "https://placehold.co/600x400.png",
            imageHint: "whatsapp activation"
        },
        {
            icon: <FaRocket className="h-8 w-8 text-accent" />,
            title: "3. Impulsa sus Recargas",
            description: "Cada vez que tus clientes recarguen créditos para sus asistentes, tú ganas una comisión. ¡Tu éxito es nuestro éxito!",
            imageUrl: "https://placehold.co/600x400.png",
            imageHint: "earnings commission"
        }
    ];

    const benefits = [
        {
            icon: <FaChartLine className="h-6 w-6 text-primary" />,
            title: "Panel Exclusivo",
            description: "Sigue tu progreso en tiempo real. Visualiza tus referidos, ganancias y tasa de conversión desde un solo lugar."
        },
        {
            icon: <CircleDollarSign className="h-6 w-6 text-green-500" />,
            title: "Comisiones Atractivas",
            description: "Gana un porcentaje de cada recarga que realicen tus clientes. Un flujo de ingresos pasivo y escalable."
        },
        {
            icon: <FaHandshake className="h-6 w-6 text-accent" />,
            title: "Relación a Largo Plazo",
            description: "Construye relaciones duraderas con tus clientes y con nosotros. Te damos el soporte que necesitas para crecer."
        }
    ];

    return (
        <PageContainer className="animate-fadeIn">
            <div className="text-center py-12">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-gradient">
                    Conviértete en Aliado de {APP_NAME}
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Genera ingresos pasivos. Gana comisiones recurrentes ayudando a negocios a automatizar su WhatsApp con IA.
                </p>
                <Button 
                    size="lg" 
                    className={cn(
                        "mt-8 text-lg",
                        "bg-brand-gradient text-primary-foreground hover:opacity-90",
                        "shiny-border"
                    )}
                    onClick={() => router.push('/login')}
                >
                    Acceder al Portal de Aliados <ArrowRight className="ml-2" />
                </Button>
            </div>

            <section id="how-it-works" className="py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">Tu Camino al Éxito en 3 Pasos</h2>
                    <p className="mt-3 text-muted-foreground">Es muy sencillo empezar a generar comisiones.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <Card key={index} className="text-center p-6 shadow-lg hover:shadow-primary/20 transition-shadow overflow-hidden">
                             <div className="relative aspect-video mb-4 rounded-md overflow-hidden">
                                <Image
                                    src={step.imageUrl}
                                    alt={step.title}
                                    width={600}
                                    height={400}
                                    className="w-full h-full object-cover transition-transform hover:scale-105"
                                    data-ai-hint={step.imageHint}
                                />
                            </div>
                            <div className="mb-4 inline-block bg-primary/10 p-4 rounded-full">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-semibold">{step.title}</h3>
                            <p className="text-muted-foreground mt-2">{step.description}</p>
                        </Card>
                    ))}
                </div>
            </section>

            <section id="benefits" className="py-16 bg-muted/30 rounded-lg">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">Beneficios de ser Aliado</h2>
                    <p className="mt-3 text-muted-foreground">Te damos las herramientas para que triunfes.</p>
                </div>
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                     {benefits.map((benefit, index) => (
                        <div key={index} className="flex flex-col items-center text-center p-4">
                            <div className="mb-4 text-primary">
                                {benefit.icon}
                            </div>
                            <h3 className="text-lg font-semibold">{benefit.title}</h3>
                            <p className="text-muted-foreground mt-1 text-sm">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </PageContainer>
    );
};

export default CollaboratorsPage;
