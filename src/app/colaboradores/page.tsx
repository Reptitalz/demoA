
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaUserPlus, FaWhatsapp, FaRocket, FaHandshake, FaChartLine, FaUsers } from 'react-icons/fa';
import { ArrowRight, CircleDollarSign, Target, Coins } from 'lucide-react';
import { APP_NAME } from '@/config/appConfig';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

const CommissionCalculator = () => {
    const [users, setUsers] = useState(10);
    const [credits, setCredits] = useState(5);
    const commissionPerCredit = 15;
    const earnings = users * credits * commissionPerCredit;

    return (
        <Card className="bg-card/80 backdrop-blur-sm border-border/20 shadow-xl hover:shadow-primary/20 transition-all duration-300 text-left p-6 sm:p-8 glow-card mt-8">
            <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl sm:text-3xl">Calcula tus Ganancias</CardTitle>
                <CardDescription className="text-sm sm:text-base pt-2 text-muted-foreground">
                    Usa los deslizadores para estimar tus comisiones potenciales. Ganas por cada crédito que tus clientes recargan.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center font-semibold text-lg">
                        <span className="flex items-center gap-2"><FaUsers className="h-5 w-5 text-primary" /> Número de Clientes</span>
                        <span className="text-primary">{users.toLocaleString()}</span>
                    </div>
                    <Slider
                        value={[users]}
                        onValueChange={(value) => setUsers(value[0])}
                        min={1}
                        max={100}
                        step={1}
                        aria-label="Número de clientes"
                    />
                </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center font-semibold text-lg">
                        <span className="flex items-center gap-2"><Coins className="h-5 w-5 text-primary" /> Recarga Promedio (Créditos)</span>
                        <span className="text-primary">{credits.toLocaleString()}</span>
                    </div>
                    <Slider
                        value={[credits]}
                        onValueChange={(value) => setCredits(value[0])}
                        min={1}
                        max={50}
                        step={1}
                        aria-label="Recarga promedio en créditos"
                    />
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Ganancia Estimada (MXN)</p>
                    <p className="text-3xl font-bold flex items-center justify-center gap-2 text-green-500">
                        <CircleDollarSign className="h-7 w-7"/> ${earnings.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">($15 MXN de comisión por cada crédito recargado)</p>
                </div>
            </CardContent>
        </Card>
    );
};


const CollaboratorsPage = () => {
    const router = useRouter();

    const steps = [
        {
            icon: <FaUserPlus className="h-8 w-8 text-primary" />,
            title: "1. Registra a tu Cliente",
            description: "Usa tu enlace de referido único para que tus clientes creen su primer asistente. ¡Es el primer paso para empezar a ganar!",
        },
        {
            icon: <FaWhatsapp className="h-8 w-8 text-green-500" />,
            title: "2. Ayúdalos a Activar",
            description: "Guía a tus clientes en la vinculación de un número de WhatsApp nuevo. Es crucial para que el asistente funcione.",
        },
        {
            icon: <FaRocket className="h-8 w-8 text-accent" />,
            title: "3. Impulsa sus Recargas",
            description: "Cada vez que tus clientes recarguen créditos para sus asistentes, tú ganas una comisión. ¡Tu éxito es nuestro éxito!",
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
                <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground">
                    Conviértete en Aliado de{' '}
                    <span className="text-brand-gradient">{APP_NAME}</span>
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
                    onClick={() => router.push('/colaboradores/login')}
                >
                    Acceder al portal
                </Button>
                <CommissionCalculator />
            </div>

            <section id="how-it-works" className="py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">Tu Camino al Éxito en 3 Pasos</h2>
                    <p className="mt-3 text-muted-foreground">Es muy sencillo empezar a generar comisiones.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <Card key={index} className="text-center p-6 shadow-lg hover:shadow-primary/20 transition-shadow overflow-hidden">
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
