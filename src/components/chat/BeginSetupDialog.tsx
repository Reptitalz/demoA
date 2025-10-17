
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import { useToast } from "@/hooks/use-toast";
import { FaArrowLeft, FaArrowRight, FaSpinner, FaGoogle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';

// Simplified step components to be self-contained
import Step2_UserDetails from '../auth/wizard-steps/Step2_UserDetails';
import Step3_UserDetails from '../auth/wizard-steps/Step3_UserDetails';

interface BeginSetupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BeginSetupDialog = ({ isOpen, onOpenChange }: BeginSetupDialogProps) => {
    const { state, dispatch } = useApp();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    
    // We'll manage a local step counter for this dialog
    const [step, setStep] = useState(1);
    const totalSteps = 6;

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            dispatch({ type: 'RESET_WIZARD' });
        }
    }, [isOpen, dispatch]);

    const handleNext = () => {
        if (step < totalSteps) setStep(s => s + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(s => s - 1);
    };

    const handleFinish = () => {
        // Here you would normally gather all data from the wizard state
        // and then initiate the sign-in process.
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

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return <div>Paso 1: Bienvenida</div>;
            case 2:
                return <Step2_UserDetails />;
            case 3:
                return <Step3_UserDetails />;
            case 4:
                return <div>Paso 4: Tipo de Cuenta</div>;
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
            <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
                <DialogHeader>
                    <DialogTitle>Configura tu Perfil en Hey Manito!</DialogTitle>
                    <DialogDescription>
                        Sigue estos pasos para personalizar tu experiencia. Paso {step} de {totalSteps}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 min-h-[300px] flex items-center justify-center">
                    {renderStepContent()}
                </div>
                <DialogFooter className="flex justify-between w-full">
                    <Button variant="outline" onClick={handleBack} disabled={step === 1 || isProcessing}>
                        <FaArrowLeft className="mr-2" /> Atrás
                    </Button>
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
