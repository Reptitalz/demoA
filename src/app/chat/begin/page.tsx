
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, UserPlus, ArrowRight, ArrowLeft, AppWindow, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { FaWhatsapp } from 'react-icons/fa';
import Link from 'next/link';
import RegisterAssistantDialog from '@/components/auth/RegisterAssistantDialog';

const BeginPage = () => {
    const { dispatch } = useApp();
    const [step, setStep] = useState(1);
    const [selectedOption, setSelectedOption] = useState<'desktop' | 'whatsapp' | null>(null);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const router = useRouter();

    const [activeIndex, setActiveIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleSelectOption = useCallback((option: 'desktop' | 'whatsapp') => {
        setSelectedOption(option);
        dispatch({ type: 'UPDATE_ASSISTANT_TYPE', payload: option });
        dispatch({ type: 'SET_WIZARD_STEP', payload: 2}); // Set to step 2 for assistant details
        setIsRegisterOpen(true);
    }, [dispatch]);
    
    const handleDialogChange = (open: boolean) => {
        setIsRegisterOpen(open);
        if (!open) {
            dispatch({ type: 'RESET_WIZARD' });
        }
    }

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollLeft = container.scrollLeft;
            const cardWidth = container.offsetWidth;
            const newIndex = Math.round(scrollLeft / cardWidth);
            if (newIndex !== activeIndex) {
                setActiveIndex(newIndex);
            }
        }
    };
    
    const scrollToCard = (index: number) => {
        const container = scrollContainerRef.current;
        if(container) {
            container.scrollTo({
                left: index * container.offsetWidth,
                behavior: 'smooth'
            });
        }
    }

    const cards = [
        {
            type: 'desktop' as const,
            badge: '30 DÍAS GRATIS',
            badgeColor: 'from-yellow-400 to-orange-500',
            image: '/4.jpeg',
            imageHint: 'chatbot browser',
            title: 'Asistente en Navegador',
            icon: AppWindow,
            description: 'Ideal para probar, desarrollar y para uso interno. Sin necesidad de un número de teléfono.',
            features: [
                'Prueba ilimitada por 30 días.',
                'Configuración y acceso instantáneo.'
            ],
            buttonText: 'Comenzar Prueba Gratis'
        },
        {
            type: 'whatsapp' as const,
            badge: 'PAGO POR USO',
            badgeColor: 'primary',
            image: '/1.jpeg',
            imageHint: 'whatsapp chat',
            title: 'Asistente en WhatsApp',
            icon: FaWhatsapp,
            description: 'Automatiza ventas y soporte en la plataforma de mensajería más grande del mundo.',
            features: [
                'Atención al cliente 24/7.',
                'Requiere un número de teléfono nuevo.'
            ],
            buttonText: 'Crear Asistente WhatsApp'
        }
    ];

    const renderStep1 = () => (
        <div className="flex flex-col h-full animate-fadeIn">
            <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                <div className="w-full max-w-2xl">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
                        ¿Qué es Hey Manito?
                    </h1>
                     <p className="text-muted-foreground text-lg">
                        Es una plataforma para crear asistentes de IA para tu negocio. Automatiza ventas, da soporte y gestiona clientes en WhatsApp o en una página web.
                    </p>
                 </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 w-full p-4 border-t border-border bg-card/80 backdrop-blur-sm z-10">
                <div className="flex justify-between items-center max-w-lg mx-auto">
                    <div className="text-sm text-muted-foreground">Paso 1 de 2</div>
                     <Button size="lg" onClick={() => setStep(2)}>
                        Siguiente <ArrowRight className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="animate-fadeIn w-full">
            <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
                    Elige tu Primer <span className="text-brand-gradient">Asistente</span>
                </h1>
                <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Comienza con una prueba gratuita en el navegador o ve directamente a la automatización de WhatsApp.
                </p>
            </div>

            <div className="w-full max-w-sm md:max-w-md mx-auto">
                <div 
                    className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                >
                    {cards.map((card, index) => (
                         <div key={index} className="w-full flex-shrink-0 snap-center p-2">
                             <Card 
                                onClick={() => handleSelectOption(card.type)}
                                className={cn(
                                    "cursor-pointer transition-all border-2 overflow-hidden shadow-lg hover:shadow-primary/20 h-full",
                                    "glow-card"
                                )}
                            >
                                <CardHeader className="p-0">
                                    <div className="relative aspect-video w-full">
                                        <Image
                                            src={card.image}
                                            alt={card.title}
                                            layout="fill"
                                            className="object-cover"
                                            data-ai-hint={card.imageHint}
                                        />
                                        <div className={cn(
                                            "absolute top-3 right-3 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg -rotate-6",
                                            card.badgeColor === 'primary' ? 'bg-primary' : `bg-gradient-to-r ${card.badgeColor}`
                                        )}>
                                            {card.badge}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 text-center">
                                    <CardTitle className="flex items-center justify-center gap-2 text-xl mb-2"><card.icon size={22}/> {card.title}</CardTitle>
                                    <CardDescription className="mb-4 text-sm">{card.description}</CardDescription>
                                    <ul className="text-left text-sm text-muted-foreground space-y-2 mb-6">
                                        {card.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2"><Check size={14} className="text-green-500 mt-1 shrink-0"/><span>{feature}</span></li>
                                        ))}
                                    </ul>
                                    <Button size="lg" className="w-full font-bold">
                                        {card.buttonText} <ArrowRight className="ml-2" size={16}/>
                                    </Button>
                                </CardContent>
                            </Card>
                         </div>
                    ))}
                </div>
                 <div className="flex justify-center mt-4 space-x-2">
                    {cards.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollToCard(index)}
                            className={cn(
                                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                                activeIndex === index ? "bg-primary scale-125" : "bg-muted-foreground/30"
                            )}
                            aria-label={`Ir a la tarjeta ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
             <div className="flex justify-between items-center mt-8 w-full max-w-md mx-auto">
                 <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2" /> Atrás
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                    ¿Ya tienes una cuenta? <Link href="/login" className="font-semibold text-primary hover:underline">Inicia sesión aquí.</Link>
                </p>
             </div>
        </div>
    );

    return (
        <>
        <PageContainer className={cn("flex flex-col", step === 1 ? 'p-0' : 'items-center justify-center')}>
            {step === 1 ? renderStep1() : renderStep2()}
        </PageContainer>
        <RegisterAssistantDialog isOpen={isRegisterOpen} onOpenChange={handleDialogChange} />
        </>
    );
};

export default BeginPage;
