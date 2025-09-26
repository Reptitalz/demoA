
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, UserPlus, ArrowRight, ArrowLeft, AppWindow } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { FaWhatsapp } from 'react-icons/fa';
import Link from 'next/link';
import RegisterAssistantDialog from '@/components/auth/RegisterAssistantDialog';
import AppIcon from '@/components/shared/AppIcon';
import { Slider } from '@/components/ui/slider';
import Step2_UserDetails from '@/components/auth/wizard-steps/Step2_UserDetails';

const BeginPage = () => {
    const { state, dispatch } = useApp();
    const { firstName, lastName } = state.wizard;
    const [step, setStep] = useState(1);
    const [selectedOption, setSelectedOption] = useState<'desktop' | 'whatsapp' | null>(null);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const router = useRouter();

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
                'Prueba ilimitada por 30 días, después $179 MXN/mes.',
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

    const isStepValid = (currentStep: number) => {
      if (currentStep === 2) {
        return firstName.trim() !== '' && lastName.trim() !== '';
      }
      return true; // Other steps are implicitly valid or handled by button disabled state
    }

    const handleNext = () => {
        if (isStepValid(step)) {
            setStep(step + 1);
        } else {
            // Optionally, show a toast message for invalid fields.
        }
    };


    const renderStepContent = () => {
        if (step === 1) {
            return (
                <>
                    <div className="w-full max-w-sm mx-auto pt-8 mb-8 px-4">
                        <Slider
                            value={[step * 33.3]}
                            max={100}
                            step={33.3}
                            className="[&>span:first-child]:bg-transparent"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Paso {step} de 3</p>
                    </div>
                    <div className="flex-grow flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
                        <div className="w-full max-w-2xl">
                            <AppIcon className="h-20 w-20 mb-4 mx-auto" />
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4">
                                ¿Qué es Hey Manito?
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Es una nueva red social, similar a WhatsApp, que te permite tener tu propio asistente inteligente para que responda por ti o por tus clientes.
                            </p>
                        </div>
                    </div>
                </>
            )
        }
        if (step === 2) {
            return (
                <>
                     <div className="w-full max-w-sm mx-auto pt-8 mb-8 px-4">
                        <Slider
                            value={[step * 33.3]}
                            max={100}
                            step={33.3}
                            className="[&>span:first-child]:bg-transparent"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Paso {step} de 3</p>
                    </div>
                     <div className="animate-fadeIn w-full flex-grow flex flex-col items-center justify-center">
                       <Step2_UserDetails />
                    </div>
                </>
            );
        }
        if (step === 3) {
             return (
                <>
                    <div className="w-full max-w-sm mx-auto pt-8 mb-4 px-4">
                        <Slider
                            value={[step * 33.3]}
                            max={100}
                            step={33.3}
                            className="[&>span:first-child]:bg-transparent"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Paso {step} de 3</p>
                    </div>
                    <div className="animate-fadeIn w-full flex-grow flex flex-col">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                ¿Quieres tener tu primer asistente?
                            </h1>
                            <p className="mt-3 max-w-2xl mx-auto text-sm text-muted-foreground">
                                Elige una opción para crear un asistente que responda a tus clientes de manera inteligente, 24/7, y automatice tus ventas.
                            </p>
                        </div>

                         <div className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {cards.map((card, index) => (
                                    <Card 
                                        key={index}
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
                                            <CardDescription className="text-sm">{card.description}</CardDescription>
                                            <ul className="text-left text-sm text-muted-foreground space-y-2 mt-4 mb-6">
                                                {card.features.map((feature, i) => (
                                                    <li key={i} className="flex items-start gap-2"><Check size={14} className="text-green-500 mt-1 shrink-0"/><span>{feature}</span></li>
                                                ))}
                                            </ul>
                                            <Button size="lg" className="w-full font-bold">
                                                {card.buttonText} <ArrowRight className="ml-2" size={16}/>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            );
        }
        return null;
    }

    return (
        <>
        <PageContainer className="flex flex-col h-full items-center p-0 sm:p-6 sm:pt-8 sm:pb-24 overflow-y-auto">
            
            {renderStepContent()}

            <div className="fixed bottom-0 left-0 right-0 w-full p-4 border-t border-border bg-card/80 backdrop-blur-sm z-10">
                <div className="flex justify-between items-center max-w-lg mx-auto">
                    <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}>
                        <ArrowLeft className="mr-2" /> Atrás
                    </Button>
                    <Button 
                        size="lg" 
                        onClick={handleNext} 
                        disabled={step === 3 || !isStepValid(step)}
                        className="bg-brand-gradient text-primary-foreground hover:opacity-90"
                    >
                        Siguiente <ArrowRight className="ml-2" />
                    </Button>
                </div>
            </div>
        </PageContainer>
        <RegisterAssistantDialog isOpen={isRegisterOpen} onOpenChange={handleDialogChange} />
        </>
    );
};

export default BeginPage;
