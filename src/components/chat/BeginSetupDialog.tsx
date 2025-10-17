
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import { useToast } from "@/hooks/use-toast";
import { FaArrowLeft, FaArrowRight, FaSpinner, FaGoogle, FaRobot, FaCreditCard, FaShoppingBag } from 'react-icons/fa';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { signIn } from 'next-auth/react';
import AppIcon from '../shared/AppIcon';
import { Card } from '../ui/card';

// Simplified step components to be self-contained
import Step2_UserDetails from '../auth/wizard-steps/Step2_UserDetails';
import Step3_UserDetails from '../auth/wizard-steps/Step3_UserDetails';

interface BeginSetupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BeginSetupDialog = ({ isOpen, onOpenChange }: BeginSetupDialogProps) => {
    const { dispatch } = useApp();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    
    // We'll manage a local step counter for this dialog
    const [step, setStep] = useState(1);
    const totalSteps = 6;

    const controls = useAnimation();
    const x = useMotionValue(0);
    const carouselRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            dispatch({ type: 'RESET_WIZARD' });
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        let animation: any;
        if (step === 4 && carouselRef.current) {
            const carouselWidth = carouselRef.current.scrollWidth / 2; // Since we duplicate items
            animation = controls.start({
                x: -carouselWidth,
                transition: {
                    duration: 40,
                    ease: "linear",
                    repeat: Infinity,
                    repeatType: "loop",
                },
            });
        }
        return () => {
            if (animation) {
                controls.stop();
            }
        };
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
                        <div
                            className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-200px),transparent_100%)]"
                            onHoverStart={() => controls.stop()}
                            onHoverEnd={() => controls.start({ x: -carouselRef.current!.scrollWidth / 2, transition: { duration: 40, ease: "linear", repeat: Infinity, repeatType: "loop" } })}
                        >
                             <motion.ul
                                ref={carouselRef}
                                className="flex items-center justify-center md:justify-start [&_li]:mx-4"
                                style={{ x }}
                                animate={controls}
                                drag="x"
                                dragConstraints={{
                                    left: -carouselRef.current!.scrollWidth / 2,
                                    right: 0
                                }}
                                onDragEnd={() => {
                                    controls.start({ x: -carouselRef.current!.scrollWidth / 2, transition: { duration: 40, ease: "linear", repeat: Infinity, repeatType: "loop" } });
                                }}
                            >
                                {[...features, ...features].map((feature, index) => {
                                    const Icon = feature.icon;
                                    return (
                                        <li key={index} className="flex-shrink-0 w-64 p-3">
                                            <Card className="h-full bg-card/50 backdrop-blur-sm border-border/20 shadow-lg p-6 text-center flex flex-col items-center">
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
                        </div>
                   </div>
                );
            case 5:
                return <div>Paso 5: Carrusel</div>;
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
            <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] w-screen h-screen max-w-full flex flex-col sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-xl" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Configura tu Perfil en Hey Manito!</DialogTitle>
                    <DialogDescription>
                        Sigue estos pasos para personalizar tu experiencia. Paso {step} de {totalSteps}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 min-h-[300px] flex-grow flex items-center justify-center">
                    {renderStepContent()}
                </div>
                <DialogFooter className="flex justify-between w-full p-6 border-t">
                    {step > 1 ? (
                        <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
                            <FaArrowLeft className="mr-2" /> Atrás
                        </Button>
                    ) : <div />}
                    
                    {step < totalSteps ? (
                        <Button onClick={handleNext} disabled={isProcessing}>
                            Siguiente <FaArrowRight className="ml-2" />
                        </Button>
                    ) : (
                        // The finish button is now inside the last step's content
                        null 
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BeginSetupDialog;
