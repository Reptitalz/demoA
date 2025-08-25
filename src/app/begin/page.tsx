
"use client";

import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, BotMessageSquare, WalletCards, UserPlus, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { APP_NAME, CREDIT_PACKAGES, MESSAGES_PER_CREDIT, PRICE_PER_CREDIT } from '@/config/appConfig';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
    const steps = [
        { icon: <BotMessageSquare size={14} />, label: "Elige" },
        { icon: <WalletCards size={14} />, label: "Entiende" },
        { icon: <UserPlus size={14} />, label: "Regístrate" }
    ];

    return (
        <div className="flex items-center justify-center w-full max-w-xs mx-auto mb-2 mt-1">
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    <div className="flex flex-col items-center text-center">
                        <div className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                            currentStep > index ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground",
                            currentStep === index + 1 && "border-primary scale-110 shadow-lg"
                        )}>
                            {currentStep > index ? <Check size={14} /> : step.icon}
                        </div>
                        <p className={cn(
                            "text-xs mt-1 transition-colors",
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
        <PageContainer className="flex flex-col h-[calc(100vh-80px)]">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-gradient">
                    Comienza para Conseguir tu Asistente
                </h1>
            </div>

            <StepIndicator currentStep={step} />

            <div className="relative flex-grow overflow-y-auto mt-2 p-1">
                {/* Step 1: Choose Assistant Type */}
                <div className={cn(
                    "transition-opacity duration-300 absolute w-full",
                    step === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card 
                            onClick={() => setSelectedOption('browser')}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-primary/20 hover:border-primary/80",
                                selectedOption === 'browser' && "border-primary ring-2 ring-primary shadow-lg"
                            )}
                        >
                            <CardHeader className="p-4">
                                <div className="relative aspect-video w-full rounded-md overflow-hidden mb-3 border">
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
                                <CardTitle className="flex items-center gap-2 text-sm"><BotMessageSquare size={16}/> Asistente en Navegador</CardTitle>
                                <CardDescription className="text-xs">Después, ${PRICE_PER_CREDIT.toFixed(2)} MXN por {MESSAGES_PER_CREDIT.toLocaleString()} mensajes.</CardDescription>
                            </CardHeader>
                        </Card>

                        <Card 
                            onClick={() => setSelectedOption('whatsapp')}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-primary/20 hover:border-primary/80",
                                selectedOption === 'whatsapp' && "border-primary ring-2 ring-primary shadow-lg"
                            )}
                        >
                            <CardHeader className="p-4">
                                <div className="relative aspect-video w-full rounded-md overflow-hidden mb-3 border">
                                     <Image
                                        src="https://picsum.photos/600/400"
                                        alt="Asistente en WhatsApp"
                                        width={600}
                                        height={400}
                                        className="w-full h-full object-cover"
                                        data-ai-hint="whatsapp chat"
                                    />
                                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                        ${PRICE_PER_CREDIT.toFixed(2)} MXN / {MESSAGES_PER_CREDIT.toLocaleString()} Mensajes
                                    </div>
                                </div>
                                <CardTitle className="flex items-center gap-2 text-sm"><WalletCards size={16}/> Asistente en WhatsApp</CardTitle>
                                <CardDescription className="text-xs">Requiere un número de teléfono sin cuenta de WhatsApp activa.</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                     <div className="text-center mt-3 text-xs text-muted-foreground max-w-2xl mx-auto bg-muted/50 p-2 rounded-lg">
                        <p>No te preocupes, podrás cambiar de opción o usar ambas más adelante. Los créditos son acumulables y se comparten entre todos tus asistentes.</p>
                    </div>
                </div>

                {/* Step 2: Payment Info */}
                <div className={cn(
                    "transition-opacity duration-300 absolute w-full",
                    step === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}>
                    <Card className="p-4">
                        <div className="relative aspect-video w-full rounded-md overflow-hidden mb-3 border">
                            <Image
                                src="https://picsum.photos/600/400"
                                alt="Pagos seguros con Mercado Pago"
                                width={600}
                                height={400}
                                className="w-full h-full object-cover"
                                data-ai-hint="secure payment"
                            />
                        </div>
                        <CardHeader className="p-0 text-center mb-2">
                            <CardTitle className="text-base">Paga por lo que Usas</CardTitle>
                            <CardDescription className="text-xs">
                                Los pagos son mediante Mercado Pago. Primero pagas y recibes tus créditos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 text-sm">
                            <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
                                {CREDIT_PACKAGES.slice(0, 2).map(pkg => (
                                    <div key={pkg.credits} className="bg-muted/50 p-2 rounded-md">
                                        <p className="font-bold text-primary">{pkg.credits} Crédito</p>
                                        <p className="text-muted-foreground">({(pkg.credits * MESSAGES_PER_CREDIT).toLocaleString()} mensajes)</p>
                                        <p className="font-semibold">${pkg.price.toFixed(2)} MXN</p>
                                    </div>
                                ))}
                            </div>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger className="text-xs py-2">¿Cómo se cuentan los mensajes?</AccordionTrigger>
                                    <AccordionContent className="text-xs text-muted-foreground space-y-1">
                                       <p>• Cada respuesta que envía tu asistente.</p>
                                       <p>• Cada pregunta de un cliente que tu asistente procesa.</p>
                                       <p>• Cada notificación que el asistente te envía a tu WhatsApp personal.</p>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex justify-between items-center mt-auto pt-2 border-t">
                <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                    <ArrowLeft className="mr-2" size={16} />
                    Volver
                </Button>
                <Button onClick={handleNext} disabled={step === 1 && !selectedOption}>
                    {step === 2 ? "Finalizar y Registrarse" : "Siguiente"}
                    <ArrowRight className="ml-2" size={16} />
                </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-1">
               &copy; {new Date().getFullYear()} {APP_NAME}
            </p>
        </PageContainer>
    );
};

export default BeginPage;
