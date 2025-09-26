
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, UserPlus, ArrowRight, ArrowLeft, AppWindow, Building, User, Award, Brain, MessageSquare } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

const BeginPage = () => {
    const { state, dispatch } = useApp();
    const { firstName, lastName, imageUrl } = state.wizard;
    const [step, setStep] = useState(1);
    const [selectedOption, setSelectedOption] = useState<'desktop' | 'whatsapp'>('desktop');
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const router = useRouter();

    const [accountType, setAccountType] = useState<'business' | 'personal'>('business');
    const [chatMode, setChatMode] = useState<'me' | 'ia' | 'separate'>('ia');
    const scrollRef = useRef<HTMLDivElement>(null);
    const assistantTypeScrollRef = useRef<HTMLDivElement>(null);
    const chatModeScrollRef = useRef<HTMLDivElement>(null);

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

    const accountTypeCards = [
        {
            type: 'business',
            icon: Building,
            title: 'Cuenta de Negocio',
            description: 'Accede a funciones avanzadas, gestión de equipos y soporte prioritario.',
            badge: true,
        },
        {
            type: 'personal',
            icon: User,
            title: 'Cuenta Personal',
            description: 'Ideal para probar la plataforma, proyectos personales y uso individual.',
            badge: false,
        },
    ];

    const chatModeCards = [
        {
            type: 'ia',
            icon: Brain,
            title: 'Quiero un Asistente IA',
            description: 'Un asistente inteligente responderá automáticamente en tu chat principal, cuando tú lo desees.',
            badge: true,
        },
        {
            type: 'me',
            icon: User,
            title: 'Yo seré el Asistente',
            description: 'Tú responderás personalmente a todos los mensajes en tu chat.',
            badge: false,
        },
        {
            type: 'separate',
            icon: UserPlus,
            title: 'Crear un Asistente Aparte',
            description: 'Mantén tu chat personal y crea un asistente separado con su propio chat.',
            badge: true,
        }
    ];
    
    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                const scrollLeft = scrollRef.current.scrollLeft;
                const cardWidth = scrollRef.current.offsetWidth;
                const newIndex = Math.round(scrollLeft / cardWidth);
                setAccountType(accountTypeCards[newIndex].type as 'business' | 'personal');
            }
        };

        const scroller = scrollRef.current;
        if (scroller) {
            scroller.addEventListener('scroll', handleScroll);
            return () => scroller.removeEventListener('scroll', handleScroll);
        }
    }, [accountTypeCards]);
    
    useEffect(() => {
        const handleChatModeScroll = () => {
            if (chatModeScrollRef.current) {
                const scrollLeft = chatModeScrollRef.current.scrollLeft;
                const cardWidth = chatModeScrollRef.current.offsetWidth;
                const newIndex = Math.round(scrollLeft / cardWidth);
                setChatMode(chatModeCards[newIndex].type as 'me' | 'ia' | 'separate');
            }
        };

        const scroller = chatModeScrollRef.current;
        if (scroller) {
            scroller.addEventListener('scroll', handleChatModeScroll, { passive: true });
            return () => scroller.removeEventListener('scroll', handleChatModeScroll);
        }
    }, [chatModeCards]);

    const isStepValid = (currentStep: number) => {
      if (currentStep === 2) {
        return firstName.trim() !== '';
      }
      return true; // Other steps are implicitly valid or handled by button disabled state
    }

    const handleNext = () => {
        if (isStepValid(step)) {
            if(step === 4) {
                handleSelectOption('desktop');
            } else {
                setStep(step + 1);
            }
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
                            value={[step * 25]}
                            max={100}
                            step={25}
                            className="[&>span:first-child]:bg-transparent"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Paso {step} de 4</p>
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
                            value={[step * 25]}
                            max={100}
                            step={25}
                            className="[&>span:first-child]:bg-transparent"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Paso {step} de 4</p>
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
                            value={[step * 25]}
                            max={100}
                            step={25}
                            className="[&>span:first-child]:bg-transparent"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Paso {step} de 4</p>
                    </div>
                    <div className="animate-fadeIn w-full flex-grow flex flex-col items-center justify-center">
                         <div className="text-center mb-6">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                ¿Eres un usuario o un negocio?
                            </h1>
                            <p className="mt-3 max-w-2xl mx-auto text-sm text-muted-foreground">
                                Elige el tipo de cuenta que mejor se adapte a tus necesidades.
                            </p>
                        </div>
                        <div className="w-full max-w-sm md:max-w-md mx-auto">
                           <div
                                ref={scrollRef}
                                className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
                            >
                                {accountTypeCards.map((card, index) => {
                                    const Icon = card.icon;
                                    return (
                                        <div key={index} className="w-full flex-shrink-0 snap-center p-2">
                                            <Card 
                                                className={cn(
                                                    "transition-all border-2 overflow-hidden shadow-lg h-full",
                                                    accountType === card.type ? "border-primary shadow-primary/20" : "",
                                                    "glow-card"
                                                )}
                                            >
                                                <CardHeader className="p-6 pb-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="p-3 bg-primary/10 rounded-full">
                                                            <Icon className="h-6 w-6 text-primary"/>
                                                        </div>
                                                        {card.badge && (
                                                            <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 !p-0 !w-6 !h-6 flex items-center justify-center">
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M12 2L14.09 8.26L20.36 9.27L15.23 13.91L16.42 20.09L12 16.77L7.58 20.09L8.77 13.91L3.64 9.27L9.91 8.26L12 2Z" fill="#0052FF"/>
                                                                    <path d="M12 2L9.91 8.26L3.64 9.27L8.77 13.91L7.58 20.09L12 16.77L16.42 20.09L15.23 13.91L20.36 9.27L14.09 8.26L12 2Z" fill="#388BFF"/>
                                                                    <path d="m10.5 13.5-2-2-1 1 3 3 6-6-1-1-5 5Z" fill="#fff"/>
                                                                </svg>
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-6 pt-0">
                                                    <CardTitle className="text-lg mb-1">{card.title}</CardTitle>
                                                    <CardDescription className="text-sm">{card.description}</CardDescription>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="flex justify-center mb-6 space-x-2 mt-4">
                                {accountTypeCards.map((_, index) => (
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
                                            accountType === accountTypeCards[index].type ? "w-6 bg-primary" : "bg-muted-foreground/50"
                                        )}
                                        aria-label={`Ir a la tarjeta ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <motion.div
                            key={accountType}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 100, damping: 10, delay: 0.2 }}
                            className="mt-4"
                        >
                            <div className="bg-card p-4 rounded-xl shadow-lg border border-border/50 flex items-center gap-4 relative overflow-hidden glow-card">
                                <motion.div
                                    animate={{ y: [-2, 2, -2] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <Avatar className="h-14 w-14 border-2 border-primary/30">
                                        <AvatarImage src={imageUrl} alt={firstName || 'Avatar'} />
                                        <AvatarFallback className="text-xl bg-muted">
                                            {firstName ? firstName.charAt(0) : <User />}
                                        </AvatarFallback>
                                    </Avatar>
                                </motion.div>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-semibold text-foreground truncate">{firstName || 'Tu Nombre'}</p>
                                      {accountType === 'business' && (
                                         <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 !p-0 !w-4 !h-4 flex items-center justify-center -translate-y-1/2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2L14.09 8.26L20.36 9.27L15.23 13.91L16.42 20.09L12 16.77L7.58 20.09L8.77 13.91L3.64 9.27L9.91 8.26L12 2Z" fill="#0052FF"/>
                                                <path d="M12 2L9.91 8.26L3.64 9.27L8.77 13.91L7.58 20.09L12 16.77L16.42 20.09L15.23 13.91L20.36 9.27L14.09 8.26L12 2Z" fill="#388BFF"/>
                                                <path d="m10.5 13.5-2-2-1 1 3 3 6-6-1-1-5 5Z" fill="#fff"/>
                                            </svg>
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <p className="text-xs text-muted-foreground">en línea</p>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <p>Ahora</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            );
        }
        if (step === 4) {
             return (
                <>
                    <div className="w-full max-w-sm mx-auto pt-8 mb-4 px-4">
                        <Slider
                            value={[step * 25]}
                            max={100}
                            step={25}
                            className="[&>span:first-child]:bg-transparent"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Paso {step} de 4</p>
                    </div>
                    <div className="animate-fadeIn w-full flex-grow flex flex-col items-center justify-center">
                        <div className="text-center mb-6 px-4">
                             <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                               ¿Cómo quieres usar tu chat?
                            </h1>
                            <p className="mt-3 max-w-2xl mx-auto text-sm text-muted-foreground">
                                Elige cómo funcionará tu perfil de chat principal.
                            </p>
                        </div>
                         <div className="w-full max-w-sm md:max-w-md mx-auto">
                           <div
                                ref={chatModeScrollRef}
                                className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
                            >
                                {chatModeCards.map((card, index) => {
                                    const Icon = card.icon;
                                    return (
                                        <div key={index} className="w-full flex-shrink-0 snap-center p-2">
                                            <Card 
                                                onClick={() => {
                                                    if (chatModeScrollRef.current) {
                                                        const cardWidth = chatModeScrollRef.current.offsetWidth;
                                                        chatModeScrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
                                                    }
                                                }}
                                                className={cn(
                                                    "transition-all border-2 overflow-hidden shadow-lg h-full cursor-pointer",
                                                    chatMode === card.type ? "border-primary shadow-primary/20" : "",
                                                    "glow-card"
                                                )}
                                            >
                                                <CardHeader className="p-6 pb-4">
                                                    <div className="p-3 bg-primary/10 rounded-full w-fit">
                                                        <Icon className="h-6 w-6 text-primary"/>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-6 pt-0">
                                                    <CardTitle className="text-lg mb-1">{card.title}</CardTitle>
                                                    <CardDescription className="text-sm">{card.description}</CardDescription>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="flex justify-center mb-6 space-x-2 mt-4">
                                {chatModeCards.map((card, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (chatModeScrollRef.current) {
                                                const cardWidth = chatModeScrollRef.current.offsetWidth;
                                                chatModeScrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
                                            }
                                        }}
                                        className={cn(
                                            "h-2 w-2 rounded-full transition-all",
                                            chatMode === card.type ? "w-6 bg-primary" : "bg-muted-foreground/50"
                                        )}
                                        aria-label={`Ir a la tarjeta ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <motion.div
                            key={chatMode}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 100, damping: 10, delay: 0.2 }}
                            className="mt-4"
                        >
                            <div className="bg-card p-4 rounded-xl shadow-lg border border-border/50 flex items-center gap-4 relative overflow-hidden glow-card">
                                 <motion.div
                                    animate={{ y: [-2, 2, -2] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <Avatar className="h-14 w-14 border-2 border-primary/30">
                                        <AvatarImage src={imageUrl} alt={firstName || 'Avatar'} />
                                        <AvatarFallback className="text-xl bg-muted">
                                            {firstName ? firstName.charAt(0) : <User />}
                                        </AvatarFallback>
                                    </Avatar>
                                </motion.div>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-semibold text-foreground truncate">{firstName || 'Tu Nombre'}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <p className="text-xs text-muted-foreground">en línea</p>
                                    </div>
                                </div>
                                {chatMode !== 'me' && (
                                    <Badge className="bg-green-100 text-green-800 border border-green-200">IA</Badge>
                                )}
                                <div className="text-xs text-muted-foreground">
                                    <p>Ahora</p>
                                </div>
                            </div>
                        </motion.div>
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
                        disabled={!isStepValid(step)}
                        className="bg-brand-gradient text-primary-foreground hover:opacity-90"
                    >
                        {step === 4 ? "Finalizar" : "Siguiente"} <ArrowRight className="ml-2" />
                    </Button>
                </div>
            </div>
        </PageContainer>
        <RegisterAssistantDialog isOpen={isRegisterOpen} onOpenChange={handleDialogChange} />
        </>
    );
};

export default BeginPage;

    