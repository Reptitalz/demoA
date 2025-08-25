"use client";

import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, BotMessageSquare, Smartphone, WalletCards, UserPlus, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/config/appConfig';

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
    const steps = [
        { icon: <BotMessageSquare />, label: "Elige tu Asistente" },
        { icon: <WalletCards />, label: "Créditos y Pago" },
        { icon: <UserPlus />, label: "Regístrate" }
    ];

    return (
        <div className="flex items-center justify-center w-full max-w-md mx-auto my-8">
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    <div className="flex flex-col items-center text-center">
                        <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                            currentStep > index ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground",
                            currentStep === index + 1 && "border-primary scale-110 shadow-lg"
                        )}>
                            {currentStep > index ? <Check /> : step.icon}
                        </div>
                        <p className={cn(
                            "text-xs mt-2 transition-colors",
                            currentStep >= index + 1 ? "font-semibold text-primary" : "text-muted-foreground"
                        )}>
                            {step.label}
                        </p>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={cn(
                            "flex-1 h-0.5 mx-2 transition-colors duration-500",
                            currentStep > index + 1 ? "bg-primary" : "bg-border"
                        )} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};


const BeginPage = () => {
    const [step, setStep] = useState(1);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const router = useRouter();

    const handleNext = () => {
        if (step === 1 && selectedOption) {
            setStep(2);
        } else if (step === 2) {
            router.push('/login');
        }
    };
    
    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    }

    return (
        <PageContainer>
            <div className="text-center mb-4">
                <h1 className="text-3xl font-extrabold text-brand-gradient">
                    Comienza para Conseguir tu Asistente
                </h1>
            </div>

            <StepIndicator currentStep={step} />

            <div className="relative min-h-[450px]">
                {/* Step 1: Choose Assistant Type */}
                <div className={cn(
                    "transition-opacity duration-300 absolute w-full",
                    step === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <Card 
                            onClick={() => setSelectedOption('browser')}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-primary/20 hover:border-primary/80",
                                selectedOption === 'browser' && "border-primary ring-2 ring-primary shadow-lg"
                            )}
                        >
                            <CardHeader>
                                <div className="relative aspect-video w-full rounded-md overflow-hidden mb-4 border">
                                    <Image
                                        src="https://picsum.photos/600/400"
                                        alt="Asistente en navegador"
                                        width={600}
                                        height={400}
                                        className="w-full h-full object-cover"
                                        data-ai-hint="chatbot browser"
                                    />
                                    <div className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                        30 DÍAS GRATIS
                                    </div>
                                </div>
                                <CardTitle className="flex items-center gap-2"><BotMessageSquare /> Asistente en Chat de Navegador</CardTitle>
                                <CardDescription>Después, $65 MXN por 1,000 mensajes.</CardDescription>
                            </CardHeader>
                        </Card>

                        <Card 
                            onClick={() => setSelectedOption('whatsapp')}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-primary/20 hover:border-primary/80",
                                selectedOption === 'whatsapp' && "border-primary ring-2 ring-primary shadow-lg"
                            )}
                        >
                            <CardHeader>
                                <div className="relative aspect-video w-full rounded-md overflow-hidden mb-4 border">
                                     <Image
                                        src="https://picsum.photos/600/400"
                                        alt="Asistente en WhatsApp"
                                        width={600}
                                        height={400}
                                        className="w-full h-full object-cover"
                                        data-ai-hint="whatsapp chat"
                                    />
                                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                        $65 MXN / 1000 Mensajes
                                    </div>
                                </div>
                                <CardTitle className="flex items-center gap-2"><Smartphone /> Asistente en WhatsApp</CardTitle>
                                <CardDescription>Requiere un número de teléfono sin cuenta de WhatsApp (normal o Business) activa.</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                     <div className="text-center mt-8 text-sm text-muted-foreground max-w-2xl mx-auto bg-muted/50 p-4 rounded-lg">
                        <p>No te preocupes, podrás cambiar de opción o usar ambas más adelante. Los créditos son acumulables y se comparten entre todos tus asistentes.</p>
                    </div>
                </div>

                {/* Step 2: Payment Info */}
                <div className={cn(
                    "transition-opacity duration-300 absolute w-full",
                    step === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}>
                    <Card className="text-center p-8">
                        <CardHeader>
                            <CardTitle>Información de Pagos y Créditos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Aquí irá la información sobre cómo funcionan los créditos y los métodos de pago.</p>
                            <p className="font-bold text-primary mt-4">(Paso informativo, en construcción)</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-4 border-t">
                <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                    <ArrowLeft className="mr-2" />
                    Volver
                </Button>
                <Button onClick={handleNext} disabled={step === 1 && !selectedOption}>
                    {step === 2 ? "Finalizar y Registrarse" : "Siguiente"}
                    <ArrowRight className="ml-2" />
                </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
               &copy; {new Date().getFullYear()} {APP_NAME}
            </p>
        </PageContainer>
    );
};

export default BeginPage;
