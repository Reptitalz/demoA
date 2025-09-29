
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, UserPlus, ArrowRight, ArrowLeft, AppWindow, Building, User, Award, Brain, MessageSquare, ShieldCheck, Database, Lock, CircleDollarSign, Newspaper, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { FaWhatsapp } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';
import RegisterAssistantDialog from '@/components/auth/RegisterAssistantDialog';
import AppIcon from '@/components/shared/AppIcon';
import { Slider } from '@/components/ui/slider';
import Step2_UserDetails from '@/components/auth/wizard-steps/Step2_UserDetails';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';


const BeginPage = () => {
    const { toast } = useToast();
    const { state, dispatch } = useApp();
    const { firstName, lastName, imageUrl, accountType: wizardAccountType } = state.wizard;
    const [step, setStep] = useState(1);
    const [selectedOption, setSelectedOption] = useState<'desktop' | 'whatsapp'>('desktop');
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const router = useRouter();

    const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
    const [chatMode, setChatMode] = useState<'me' | 'ia'>('me');
    const [newsIndex, setNewsIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const assistantTypeScrollRef = useRef<HTMLDivElement>(null);
    const chatModeScrollRef = useRef<HTMLDivElement>(null);
    const newsScrollRef = useRef<HTMLDivElement>(null);
    const navCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
            type: 'personal',
            icon: User,
            title: 'Cuenta Personal',
            description: 'Ideal para probar la plataforma, proyectos personales y uso individual.',
            badge: false,
        },
        {
            type: 'business',
            icon: Building,
            title: 'Cuenta de Negocio',
            description: 'Accede a funciones avanzadas, gestión de equipos y soporte prioritario.',
            badge: true,
        },
    ];

    const chatModeCards = [
       {
            type: 'me',
            icon: User,
            title: 'Yo responderé solamente',
            description: 'Tú responderás personalmente a todos los mensajes en tu chat.',
            badge: false,
        },
       {
            type: 'ia',
            icon: Brain,
            title: 'Quiero un Asistente IA',
            description: 'Un asistente inteligente responderá automáticamente en tu chat principal, cuando tú lo desees.',
            badge: true,
        },
    ];
    
    const newsItems = [
        {
            id: 'bank',
            icon: Landmark,
            title: "Gestión de Ganancias",
            description: "En la sección 'Admin', usa el nuevo apartado 'Banco' para gestionar tus ingresos. Aprueba las transferencias que reciban tus asistentes y observa tus ganancias en tiempo real.",
        },
        {
            id: 'database',
            icon: Database,
            title: "Bases de Datos Inteligentes",
            description: "Ahora puedes crear bases de datos que la IA gestiona por sí misma. Añade conocimiento y deja que tu asistente aprenda para dar respuestas más precisas.",
        }
    ];

    const rafRef = useRef<number | null>(null);

    const drawNavPreview = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
        const w = ctx.canvas.width / (window.devicePixelRatio || 1);
        const h = ctx.canvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, w, h);
        
        // Draw Nav bar
        const navHeight = 50;
        const navY = (h - navHeight) / 2;
        ctx.fillStyle = 'hsl(var(--card))';
        ctx.strokeStyle = 'hsl(var(--border))';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(w * 0.1, navY, w * 0.8, navHeight, 25);
        ctx.fill();
        ctx.stroke();

        const icons = ['panel', 'clientes', 'banco', 'perfil'];
        const iconCount = icons.length;
        const iconSpacing = (w * 0.8) / (iconCount);

        const highlightProgress = (Math.sin(t / 1000) + 1) / 2; // 0 to 1 cycle

        icons.forEach((icon, index) => {
            const x = w * 0.1 + iconSpacing * (index + 0.5);
            const y = navY + navHeight / 2;
            const isHighlighted = icon === 'banco';

            ctx.save();
            ctx.font = `12px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (isHighlighted) {
                const radius = 20 * highlightProgress;
                const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
                glow.addColorStop(0, `hsla(262, 80%, 58%, 0.4)`);
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.fillRect(x - 30, y - 30, 60, 60);

                ctx.fillStyle = 'hsl(var(--primary))';
                ctx.beginPath();
                ctx.arc(x, y, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw Bank Icon
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1.5;
                
                const iconSize = 8;
                // Base
                ctx.fillRect(x - iconSize, y + iconSize/2, iconSize * 2, iconSize / 4);
                // Pillars
                ctx.fillRect(x - iconSize * 0.7, y - iconSize/2, iconSize / 3, iconSize);
                ctx.fillRect(x - iconSize * 0.2, y - iconSize/2, iconSize / 3, iconSize);
                ctx.fillRect(x + iconSize * 0.3, y - iconSize/2, iconSize / 3, iconSize);
                // Roof
                ctx.beginPath();
                ctx.moveTo(x - iconSize - 2, y - iconSize/2);
                ctx.lineTo(x, y - iconSize * 1.2);
                ctx.lineTo(x + iconSize + 2, y - iconSize/2);
                ctx.closePath();
                ctx.fill();

            } else {
                ctx.fillStyle = 'hsl(var(--muted-foreground))';
                ctx.fillText(icon.charAt(0).toUpperCase() + icon.slice(1), x, y);
            }
            
            ctx.restore();
        });

    }, []);

    useEffect(() => {
        if (step !== 5 || newsIndex !== 0) {
            if(rafRef.current) cancelAnimationFrame(rafRef.current);
            return;
        }

        const canvas = navCanvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const w = canvas.parentElement!.clientWidth;
        const h = 100;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        const loop = (t: number) => {
            drawNavPreview(ctx, t);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [step, newsIndex, drawNavPreview]);


    useEffect(() => {
        // This effect resets the scroll position of the carousels when the step changes.
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
        if (chatModeScrollRef.current) {
            chatModeScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
        if (newsScrollRef.current) {
            newsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
    }, [step]);


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
                setChatMode(chatModeCards[newIndex].type as 'me' | 'ia');
            }
        };

        const scroller = chatModeScrollRef.current;
        if (scroller) {
            scroller.addEventListener('scroll', handleChatModeScroll, { passive: true });
            return () => scroller.removeEventListener('scroll', handleChatModeScroll);
        }
    }, [chatModeCards]);

    useEffect(() => {
        const handleNewsScroll = () => {
            if (newsScrollRef.current) {
                const scrollLeft = newsScrollRef.current.scrollLeft;
                const cardWidth = newsScrollRef.current.offsetWidth;
                const newIndex = Math.round(scrollLeft / cardWidth);
                setNewsIndex(newIndex);
            }
        };

        const scroller = newsScrollRef.current;
        if (scroller) {
            scroller.addEventListener('scroll', handleNewsScroll, { passive: true });
            return () => scroller.removeEventListener('scroll', handleNewsScroll);
        }
    }, [newsItems]);


    const isStepValid = (currentStep: number) => {
      if (currentStep === 2) {
        return firstName.trim() !== '';
      }
      return true; // Other steps are implicitly valid or handled by button disabled state
    }
    
    const handleGoogleSignIn = () => {
        // Before signing in, save the final user choices to the wizard state
        if (chatMode === 'ia') {
            dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: 'create_smart_db' });
        }
        dispatch({ type: 'UPDATE_ASSISTANT_TYPE', payload: 'desktop' });
        dispatch({ type: 'UPDATE_WIZARD_USER_DETAILS', payload: { field: 'accountType', value: accountType } });

        signIn('google', { callbackUrl: '/chat/dashboard' }).catch(() => {
            toast({
                title: 'Error de Inicio de Sesión',
                description: 'No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.',
                variant: 'destructive'
            });
        });
    };

    const handleNext = () => {
        if (isStepValid(step)) {
            if(step === 6) {
                 handleGoogleSignIn();
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
                <div className="flex flex-col items-center p-4 text-center animate-fadeIn">
                    <div className="w-full max-w-sm mx-auto pt-8 mb-8 px-4">
                        <Slider
                            value={[step * (100 / 6)]}
                            max={100}
                            step={100/6}
                            className="[&>span:first-child]:bg-transparent h-2"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Paso {step} de 6</p>
                    </div>
                     <div className="animate-fadeIn w-full flex flex-col items-center">
                        <div className="w-full max-w-2xl mx-auto">
                            <AppIcon className="h-20 w-20 mb-4 mx-auto" />
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4">
                               ¿Qué es Hey Manito?
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Es una nueva red social, similar a WhatsApp, que te permite tener tu propio asistente inteligente para que responda por ti o por tus clientes.
                            </p>
                        </div>
                    </div>
                </div>
            )
        }
        if (step === 2) {
            return (
                <div className="animate-fadeIn w-full flex flex-col items-center">
                     <div className="w-full max-w-sm mx-auto pt-8 mb-8 px-4">
                        <Slider
                            value={[step * (100 / 6)]}
                            max={100}
                            step={100/6}
                            className="[&>span:first-child]:bg-transparent"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Paso {step} de 6</p>
                    </div>
                     <div className="animate-fadeIn w-full flex flex-col items-center">
                       <Step2_UserDetails />
                    </div>
                </div>
            );
        }
        if (step === 3) {
             return (
                 <div className="animate-fadeIn w-full flex flex-col items-center h-full px-4 sm:px-0">
                    <div className="w-full max-w-sm mx-auto pt-8 mb-4 px-4">
                        <Slider
                            value={[step * (100/6)]}
                            max={100}
                            step={100/6}
                            className="[&>span:first-child]:bg-transparent"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Paso {step} de 6</p>
                    </div>
                     <div className="text-center mb-6">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                            ¿Eres un usuario o un negocio?
                        </h1>
                        <p className="mt-3 max-w-2xl mx-auto text-sm text-muted-foreground">
                            Elige el tipo de cuenta que mejor se adapte a tus necesidades.
                        </p>
                    </div>
                    
                     <div className="w-full max-w-sm mx-auto mb-6">
                      <motion.div
                          key={accountType}
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 100, damping: 10, delay: 0.2 }}
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
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                      </span>
                                      <p className="text-xs text-muted-foreground">en línea</p>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 shrink-0"></p>
                                  </div>
                              </div>
                               
                          </div>
                      </motion.div>
                    </div>

                    <div className="w-full max-w-sm md:max-w-md mx-auto py-4 px-4 sm:px-0">
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
                </div>
            );
        }
        if (step === 4) {
            return (
                 <div className="animate-fadeIn w-full flex flex-col items-center h-full px-4 sm:px-0">
                    <div className="w-full max-w-sm mx-auto pt-8 mb-4 px-4">
                        <Slider
                            value={[step * (100/6)]}
                            max={100}
                            step={100/6}
                            className="[&>span:first-child]:bg-transparent"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Paso {step} de 6</p>
                    </div>

                    <div className="text-center mb-6 px-4">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                           ¿Cómo quieres usar tu chat?
                        </h1>
                        <p className="mt-3 max-w-2xl mx-auto text-sm text-muted-foreground px-4">
                            Elige cómo funcionará tu perfil de chat principal.
                        </p>
                    </div>
                    
                    <div className="w-full max-w-sm mx-auto mb-6">
                      <motion.div
                          key={chatMode}
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 100, damping: 10, delay: 0.2 }}
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
                                  {chatMode === 'ia' && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">IA</Badge>}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                      </span>
                                      <p className="text-xs text-muted-foreground">en línea</p>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 shrink-0"></p>
                                  </div>
                              </div>
                          </div>
                      </motion.div>
                    </div>

                    <div className="w-full max-w-sm md:max-w-md mx-auto py-4 px-4 sm:px-0">
                        <div
                            ref={chatModeScrollRef}
                            className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
                        >
                            {chatModeCards.map((card, index) => {
                                const Icon = card.icon;
                                return (
                                    <div key={index} className="w-full flex-shrink-0 snap-center p-2">
                                        <Card 
                                            className={cn(
                                                "transition-all border-2 overflow-hidden shadow-lg h-full",
                                                chatMode === card.type ? "border-primary shadow-primary/20" : "",
                                                "glow-card"
                                            )}
                                        >
                                            <CardHeader className="p-6 pb-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="p-3 bg-primary/10 rounded-full">
                                                        <Icon className="h-6 w-6 text-primary" />
                                                    </div>
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
                            {chatModeCards.map((_, index) => (
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
                                        chatMode === chatModeCards[index].type ? "w-6 bg-primary" : "bg-muted-foreground/50"
                                    )}
                                    aria-label={`Ir a la tarjeta ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )
        }
        if (step === 5) {
             return (
                <div className="animate-fadeIn w-full flex flex-col items-center px-4">
                    <div className="w-full max-w-sm mx-auto pt-8 mb-4 px-4">
                        <Slider
                            value={[step * (100 / 6)]}
                            max={100}
                            step={100 / 6}
                            className="[&>span:first-child]:bg-transparent"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Paso {step} de 6</p>
                    </div>
                    <div className="text-center mb-6 px-4">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                            Novedades y Anuncios
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-sm text-muted-foreground">
                            Mantente al día con lo último de Hey Manito.
                        </p>
                    </div>
                    <div className="w-full max-w-sm md:max-w-md mx-auto py-4 px-4 sm:px-0">
                        <div
                            ref={newsScrollRef}
                            className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
                        >
                            {newsItems.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div key={index} className="w-full flex-shrink-0 snap-center p-2">
                                        <Card className="p-6 text-center glow-card h-full flex flex-col">
                                            {item.id === 'bank' ? (
                                                <div className="mb-4 h-[100px]">
                                                    <canvas ref={navCanvasRef}/>
                                                </div>
                                            ) : (
                                                <CardHeader className="p-0 mb-4">
                                                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                                                        <Icon className="h-8 w-8 text-primary" />
                                                    </div>
                                                </CardHeader>
                                            )}
                                            <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                                            <CardDescription className="text-sm">{item.description}</CardDescription>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                         <div className="flex justify-center mb-6 space-x-2 mt-4">
                            {newsItems.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (newsScrollRef.current) {
                                            const cardWidth = newsScrollRef.current.offsetWidth;
                                            newsScrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
                                        }
                                    }}
                                    className={cn(
                                        "h-2 w-2 rounded-full transition-all",
                                        newsIndex === index ? "w-6 bg-primary" : "bg-muted-foreground/50"
                                    )}
                                    aria-label={`Ir a la novedad ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        if (step === 6) {
             return (
                <div className="animate-fadeIn w-full flex flex-col items-center px-4">
                    <div className="w-full max-w-sm mx-auto pt-8 mb-4 px-4">
                        <Slider
                            value={[step * (100/6)]}
                            max={100}
                            step={100/6}
                            className="[&>span:first-child]:bg-transparent"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Paso {step} de 6</p>
                    </div>
                    <div className="animate-fadeIn w-full flex flex-col items-center px-4">
                        <div className="text-center mb-6 px-4">
                             <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                               Crea tu cuenta segura
                            </h1>
                            <p className="mt-3 max-w-md mx-auto text-sm text-muted-foreground">
                                Inicia sesión con Google para guardar tu progreso y acceder a todas las funciones.
                            </p>
                        </div>
                        
                        <Card 
                            className="w-full max-w-sm p-6 text-center glow-card"
                         >
                            <CardContent className="p-0 flex flex-col items-center justify-center gap-4">
                                <motion.div
                                    animate={{ y: [-4, 4, -4] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <Brain className="h-20 w-20 text-primary" />
                                </motion.div>
                                <p className="font-semibold text-foreground">Planes y Uso de Asistentes</p>
                            </CardContent>
                        </Card>

                        <div className="mt-8 text-sm text-muted-foreground max-w-md space-y-4">
                           <div className="flex items-start gap-2">
                               <ShieldCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                               <p>Inicialmente, tus asistentes tendrán un límite de mensajes. Para un uso continuo, se requiere un plan mensual.</p>
                           </div>
                            <div className="flex items-start gap-2">
                               <CircleDollarSign className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                               <p>Puedes activar un plan de $179 MXN al mes a través de Mercado Pago para obtener mensajes ilimitados.</p>
                           </div>
                        </div>

                    </div>
                </div>
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
                        {step === 6 ? (
                            <>
                                <FcGoogle className="mr-2" /> Iniciar con Google
                            </>
                        ) : (
                           <> Siguiente <ArrowRight className="ml-2" /> </>
                        )}
                    </Button>
                </div>
            </div>
        </PageContainer>
        <RegisterAssistantDialog isOpen={isRegisterOpen} onOpenChange={handleDialogChange} />
        </>
    );
};

export default BeginPage;

    