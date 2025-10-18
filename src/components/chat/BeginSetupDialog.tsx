
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import { useToast } from "@/hooks/use-toast";
import { FaArrowLeft, FaArrowRight, FaSpinner, FaGoogle, FaRobot, FaCreditCard, FaShoppingBag, FaCheck } from 'react-icons/fa';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { signIn } from 'next-auth/react';
import AppIcon from '../shared/AppIcon';
import { Card } from '../ui/card';

// Simplified step components to be self-contained
import Step2_UserDetails from '../auth/wizard-steps/Step2_UserDetails';
import Step3_UserDetails from '../auth/wizard-steps/Step3_UserDetails';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';

interface BeginSetupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PlanComparison = ({ onUpgrade }: { onUpgrade: () => void }) => {
    const planControls = useAnimation();
    const planCarouselRef = useRef<HTMLUListElement>(null);
    const [planDragConstraints, setPlanDragConstraints] = useState<null | { left: number; right: number }>(null);

    useEffect(() => {
        const calculateConstraints = () => {
            if (planCarouselRef.current) {
                const carouselWidth = planCarouselRef.current.scrollWidth / 2;
                setPlanDragConstraints({ left: -carouselWidth, right: 0 });
                planControls.start({
                    x: -carouselWidth,
                    transition: {
                        duration: 30, // Slower duration for fewer items
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "loop",
                    },
                });
            }
        };
        // Timeout to ensure layout is calculated
        const timer = setTimeout(calculateConstraints, 100);
        return () => clearTimeout(timer);

    }, [planControls]);

    const plans = [
        {
            name: "Gratuito",
            description: "Para empezar a explorar",
            price: "$0",
            priceDetails: "/siempre",
            features: [
                'Máximo 100 mensajes por día para todos los bots.',
                'Autorización en banco limitada a 100 transacciones diarias.',
                'Catálogo de solo 5 artículos para la venta.',
                'Solo se puede ofrecer una línea de crédito.',
            ],
            button: <Button size="sm" className="w-full text-xs mt-2" disabled>Actualmente Activo</Button>
        },
        {
            name: "Ilimitado",
            description: "Desbloquea todo el potencial",
            price: "$179",
            priceDetails: "/al mes",
            features: [
                'Mensajes ilimitados para todos tus asistentes.',
                'Transacciones bancarias sin restricciones.',
                'Catálogo de productos ilimitado.',
                'Múltiples líneas de crédito para tus clientes.',
            ],
            button: <Button onClick={onUpgrade} size="sm" className="w-full bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border text-xs mt-2">
                        <Crown className="mr-2 h-3 w-3"/>
                        Obtener Plan
                    </Button>
        }
    ];

    return (
        <div className="space-y-6">
             <div className="text-center">
                <h3 className="text-xl font-semibold">Elige tu Plan</h3>
                <p className="text-sm text-muted-foreground">Comienza gratis y crece sin límites cuando estés listo.</p>
            </div>
            <motion.div
                className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-200px),transparent_100%)]"
                onHoverStart={() => planControls.stop()}
                onHoverEnd={() => { if (planCarouselRef.current) { planControls.start({ x: -planCarouselRef.current.scrollWidth / 2, transition: { duration: 30, ease: "linear", repeat: Infinity, repeatType: "loop" } }) } }}
            >
                <motion.ul
                    ref={planCarouselRef}
                    className="flex items-stretch justify-center md:justify-start [&_li]:mx-2"
                    style={{ x: useMotionValue(0) }}
                    animate={planControls}
                    drag="x"
                    dragConstraints={planDragConstraints}
                    onDragEnd={() => {
                        if (planCarouselRef.current) {
                            planControls.start({ x: -planCarouselRef.current.scrollWidth / 2, transition: { duration: 30, ease: "linear", repeat: Infinity, repeatType: "loop" } });
                        }
                    }}
                >
                    {[...plans, ...plans].map((plan, index) => (
                        <li key={index} className="flex-shrink-0 w-64 p-1">
                            <div className={cn(
                                "rounded-xl p-6 flex flex-col border h-full",
                                plan.name === "Ilimitado" ? "border-primary/50 bg-primary/5" : "bg-muted/30"
                            )}>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                                
                                <div className="mb-6">
                                    <span className="text-4xl font-extrabold">{plan.price}</span>
                                    <span className="text-muted-foreground">{plan.priceDetails}</span>
                                </div>

                                <ul className="space-y-3 text-sm flex-grow">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <FaCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5"/>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-auto pt-6">
                                    {plan.button}
                                </div>
                            </div>
                        </li>
                    ))}
                </motion.ul>
            </motion.div>
        </div>
    );
};


const BeginSetupDialog = ({ isOpen, onOpenChange }: BeginSetupDialogProps) => {
    const { dispatch } = useApp();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    
    // We'll manage a local step counter for this dialog
    const [step, setStep] = useState(1);
    const totalSteps = 6;

    const controls = useAnimation();
    const carouselRef = useRef<HTMLUListElement>(null);
    const [dragConstraints, setDragConstraints] = useState<{left: number, right: number} | null>(null);
    const x = useMotionValue(0);


    useEffect(() => {
        if (isOpen) {
            setStep(1);
            dispatch({ type: 'RESET_WIZARD' });
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        const calculateConstraints = () => {
             if (carouselRef.current) {
                const carouselWidth = carouselRef.current.scrollWidth / 2; // Since we duplicate items
                setDragConstraints({ left: -carouselWidth, right: 0 });
                controls.start({
                    x: -carouselWidth,
                    transition: {
                        duration: 30, // Slower duration for fewer items
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "loop",
                    },
                });
            }
        };
        if (step === 4) {
            const timer = setTimeout(calculateConstraints, 100);
            return () => clearTimeout(timer);
        }
    }, [step, controls]);

    const handleNext = () => {
        if (step < totalSteps) setStep(s => s + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(s => s - 1);
    };

    const handleFinish = () => {
        setIsProcessing(true);
        signIn('google', { callbackUrl: '/chat/dashboard' }).catch(() => {
            toast({
                title: "Error de Inicio de Sesión",
                description: "No se pudo iniciar sesión con Google.",
                variant: "destructive",
            });
            setIsProcessing(false);
        });
    };
    
    const features = [
      {
        icon: FaRobot,
        title: "Bots Inteligentes",
        description: "Crea asistentes que responden, venden y gestionan por ti.",
      },
      {
        icon: FaCreditCard,
        title: "Líneas de Crédito",
        description: "Ofrece financiamiento a tus clientes y gestiona la cobranza.",
      },
      {
        icon: FaShoppingBag,
        title: "Productos y Servicios",
        description: "Muestra tu catálogo y permite que tus bots tomen pedidos.",
      },
    ];
    
     const handleCardClick = (index: number) => {
        controls.stop();
        if (carouselRef.current) {
            const cardWidth = 256; // w-64
            const gap = 16; // mx-2 (8*2)
            const targetScroll = (cardWidth + gap) * index - (carouselRef.current.offsetWidth / 2) + (cardWidth / 2);
            controls.start({ x: -targetScroll, transition: { type: 'spring', stiffness: 200, damping: 30 } });
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="text-center animate-fadeIn flex flex-col items-center justify-center">
                        <motion.div
                            animate={{ y: [-10, 10, -10] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <AppIcon className="h-24 w-24 mb-6 drop-shadow-2xl" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-brand-gradient">¡Bienvenido a Hey Manito!</h3>
                        <p className="mt-2 text-muted-foreground">La red social con superpoderes de IA.</p>
                    </div>
                );
            case 2:
                return <Step2_UserDetails />;
            case 3:
                return <Step3_UserDetails />;
            case 4:
                return (
                   <div className="animate-fadeIn w-full overflow-hidden">
                        <div className="text-center mb-8">
                           <h3 className="text-xl font-semibold">Descubre lo que Puedes Hacer</h3>
                           <p className="text-sm text-muted-foreground">Hey Manito! te da herramientas para potenciar tu negocio.</p>
                        </div>
                        <motion.div
                            className="w-full inline-flex flex-nowrap"
                            onHoverStart={() => controls.stop()}
                            onHoverEnd={() => { if (carouselRef.current) { controls.start({ x: -carouselRef.current.scrollWidth / 2, transition: { duration: 30, ease: "linear", repeat: Infinity, repeatType: "loop" } }) } }}
                        >
                             <motion.ul
                                ref={carouselRef}
                                className="flex items-center justify-start [&_li]:mx-2"
                                style={{ x }}
                                animate={controls}
                                drag="x"
                                dragConstraints={dragConstraints}
                                onDragEnd={() => {
                                    if (carouselRef.current) {
                                        controls.start({ x: -carouselRef.current.scrollWidth / 2, transition: { duration: 30, ease: "linear", repeat: Infinity, repeatType: "loop" } });
                                    }
                                }}
                            >
                                {[...features, ...features].map((feature, index) => {
                                    const Icon = feature.icon;
                                    return (
                                        <li key={index} className="flex-shrink-0 w-64 p-3 group snap-center" onClick={() => handleCardClick(index)}>
                                            <Card className="h-full bg-card/50 backdrop-blur-sm border-border/20 shadow-lg group-hover:scale-105 group-hover:shadow-primary/20 transition-all duration-300 p-6 text-center flex flex-col items-center">
                                                <div className="p-4 bg-primary/10 rounded-full mb-4">
                                                    <Icon className="h-8 w-8 text-primary" />
                                                </div>
                                                <h4 className="font-bold text-lg">{feature.title}</h4>
                                                <p className="text-sm text-muted-foreground mt-2">{feature.description}</p>
                                            </Card>
                                        </li>
                                    );
                                })}
                            </motion.ul>
                        </motion.div>
                   </div>
                );
            case 5:
                return <PlanComparison onUpgrade={() => setStep(6)} />;
            case 6:
                return (
                    <div className="text-center space-y-4">
                        <h3 className="text-xl font-bold">¡Casi listo!</h3>
                        <p className="text-muted-foreground">Crea tu cuenta para guardar tu perfil.</p>
                        <Button onClick={handleFinish} disabled={isProcessing} className="w-full">
                            {isProcessing ? <FaSpinner className="animate-spin" /> : <FaGoogle className="mr-2" />}
                            Crear Cuenta con Google
                        </Button>
                    </div>
                );
            default:
                return <div>Paso Desconocido</div>;
        }
    };
    
    const handleDialogClose = (open: boolean) => {
        if (!isProcessing) {
            onOpenChange(open);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogContent showCloseButton={false} className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl w-screen h-screen max-w-full flex flex-col sm:max-w-lg sm:h-auto sm:max-h-[90vh]" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
                <DialogHeader className="p-4 pb-2 border-b">
                    <DialogTitle>Configura tu Perfil en Hey Manito!</DialogTitle>
                    <DialogDescription>Sigue estos pasos para personalizar tu experiencia.</DialogDescription>
                     <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Progreso</span>
                            <span>Paso {step} de {totalSteps}</span>
                        </div>
                        <Progress value={(step / totalSteps) * 100} className="h-1.5" />
                    </div>
                </DialogHeader>
                <div className="py-4 min-h-[400px] flex-grow flex items-center justify-center overflow-hidden">
                    {renderStepContent()}
                </div>
                <DialogFooter className="flex justify-between w-full p-4 border-t">
                    {step > 1 ? (
                        <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
                            <FaArrowLeft className="mr-2" /> Atrás
                        </Button>
                    ) : <div></div>}
                    
                    {step < totalSteps ? (
                        <Button onClick={handleNext} disabled={isProcessing}>
                           Siguiente <FaArrowRight className="ml-2" />
                        </Button>
                    ) : (
                        null
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BeginSetupDialog;
 
    



