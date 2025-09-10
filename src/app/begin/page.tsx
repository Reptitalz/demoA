
"use client";

import React, { useState, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, UserPlus, ArrowRight, Info, AppWindow } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { APP_NAME, PRICE_PER_CREDIT, MESSAGES_PER_CREDIT } from '@/config/appConfig';
import { useApp } from '@/providers/AppProvider';
import { FaWhatsapp } from 'react-icons/fa';
import Link from 'next/link';


const BeginPage = () => {
    const { dispatch } = useApp();
    const [selectedOption, setSelectedOption] = useState<'desktop' | 'whatsapp' | null>(null);
    const router = useRouter();

    const handleSelectOption = useCallback((option: 'desktop' | 'whatsapp') => {
        setSelectedOption(option);
        dispatch({ type: 'UPDATE_ASSISTANT_TYPE', payload: option });
        router.push('/login');
    }, [dispatch, router]);

    return (
        <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] animate-fadeIn">
            <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
                    Elige tu Primer <span className="text-brand-gradient">Asistente</span>
                </h1>
                <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Comienza con una prueba gratuita en el navegador o ve directamente a la automatización de WhatsApp.
                </p>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Desktop Assistant Card */}
                <Card 
                    onClick={() => handleSelectOption('desktop')}
                    className={cn(
                        "cursor-pointer transition-all border-2 overflow-hidden shadow-lg hover:shadow-primary/20",
                        selectedOption === 'desktop' ? "border-primary" : "border-transparent",
                        "glow-card"
                    )}
                >
                    <CardHeader className="p-0">
                        <div className="relative aspect-video w-full">
                            <Image
                                src="/4.jpeg"
                                alt="Asistente en navegador"
                                layout="fill"
                                className="object-cover"
                                data-ai-hint="chatbot browser"
                            />
                            <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg -rotate-6">
                                30 DÍAS GRATIS
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 text-center">
                        <CardTitle className="flex items-center justify-center gap-2 text-xl mb-2"><AppWindow size={22}/> Asistente en Navegador</CardTitle>
                        <CardDescription className="mb-4 text-sm">Ideal para probar, desarrollar y para uso interno. Sin necesidad de un número de teléfono.</CardDescription>
                        <ul className="text-left text-sm text-muted-foreground space-y-2 mb-6">
                            <li className="flex items-start gap-2"><Check size={14} className="text-green-500 mt-1 shrink-0"/><span>Prueba ilimitada por 30 días.</span></li>
                            <li className="flex items-start gap-2"><Check size={14} className="text-green-500 mt-1 shrink-0"/><span>Configuración y acceso instantáneo.</span></li>
                        </ul>
                        <Button size="lg" className="w-full font-bold">
                            Comenzar Prueba Gratis <ArrowRight className="ml-2" size={16}/>
                        </Button>
                    </CardContent>
                </Card>

                {/* WhatsApp Assistant Card */}
                <Card 
                    onClick={() => handleSelectOption('whatsapp')}
                    className={cn(
                        "cursor-pointer transition-all border-2 overflow-hidden shadow-lg hover:shadow-primary/20",
                        selectedOption === 'whatsapp' ? "border-primary" : "border-transparent",
                        "glow-card"
                    )}
                >
                    <CardHeader className="p-0">
                         <div className="relative aspect-video w-full">
                             <Image
                                src="/1.jpeg"
                                alt="Asistente en WhatsApp"
                                layout="fill"
                                className="object-cover"
                                data-ai-hint="whatsapp chat"
                            />
                            <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                PAGO POR USO
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 text-center">
                        <CardTitle className="flex items-center justify-center gap-2 text-xl mb-2"><FaWhatsapp size={22}/> Asistente en WhatsApp</CardTitle>
                        <CardDescription className="mb-4 text-sm">Automatiza ventas y soporte en la plataforma de mensajería más grande del mundo.</CardDescription>
                         <ul className="text-left text-sm text-muted-foreground space-y-2 mb-6">
                            <li className="flex items-start gap-2"><Check size={14} className="text-green-500 mt-1 shrink-0"/><span>Atención al cliente 24/7.</span></li>
                            <li className="flex items-start gap-2"><Check size={14} className="text-green-500 mt-1 shrink-0"/><span>Requiere un número de teléfono nuevo.</span></li>
                        </ul>
                        <Button size="lg" className="w-full font-bold">
                            Crear Asistente WhatsApp <ArrowRight className="ml-2" size={16}/>
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
             <p className="text-center text-sm text-muted-foreground mt-8">
               ¿Ya tienes una cuenta? <Link href="/login" className="font-semibold text-primary hover:underline">Inicia sesión aquí.</Link>
            </p>
        </PageContainer>
    );
};

export default BeginPage;
