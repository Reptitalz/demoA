
"use client";

import React, { useState, useRef, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, UserPlus, ArrowRight, ArrowLeft, Info, AppWindow } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { APP_NAME, CREDIT_PACKAGES, MESSAGES_PER_CREDIT, PRICE_PER_CREDIT } from '@/config/appConfig';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FaWhatsapp, FaGoogle } from 'react-icons/fa';
import { useApp } from '@/providers/AppProvider';
import { signIn } from 'next-auth/react';
import RegisterAssistantDialog from '@/components/auth/RegisterAssistantDialog';

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
    const steps = [
        { icon: <AppWindow size={14} />, label: "Elige" },
        { icon: <Check size={14} />, label: "Entiende" },
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

const AssistantDetailsDialog = ({ open, onOpenChange, type }: { open: boolean; onOpenChange: (open: boolean) => void; type: 'browser' | 'whatsapp' | null }) => {
    if (!type) return null;

    const details = {
        browser: {
            title: "Asistente en Navegador",
            description: "Ideal para pruebas rápidas, desarrollo y uso interno. Tu asistente vivirá en una página web, accesible a través de un enlace único, donde podrás interactuar con él directamente.",
            points: [
                "Perfecto para probar prompts y lógica sin costo inicial.",
                "No requiere vincular un número de teléfono.",
                "Acceso inmediato después del registro.",
                "Incluye 30 días de prueba con créditos para que experimentes."
            ]
        },
        whatsapp: {
            title: "Asistente en WhatsApp",
            description: "La solución completa para automatizar la comunicación con tus clientes directamente en la plataforma que más usan.",
            points: [
                "Interactúa con tus clientes 24/7.",
                "Requiere un número de teléfono nuevo (sin WhatsApp previo).",
                "Se integra con la API oficial de WhatsApp para máxima estabilidad.",
                "Ideal para ventas, soporte, agendamiento y más."
            ]
        }
    };

    const currentDetails = details[type];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{currentDetails.title}</DialogTitle>
                    <DialogDescription>{currentDetails.description}</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <ul className="space-y-2">
                        {currentDetails.points.map((point, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                                <span className="text-sm text-muted-foreground">{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Entendido</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const BeginPage = () => {
    const { dispatch } = useApp();
    const [step, setStep] = useState(1);
    const [selectedOption, setSelectedOption] = useState<'desktop' | 'whatsapp' | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [detailsType, setDetailsType] = useState<'browser' | 'whatsapp' | null>(null);
    const router = useRouter();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [step]);
    
    const handleSelectOption = (option: 'desktop' | 'whatsapp') => {
        setSelectedOption(option);
        dispatch({ type: 'UPDATE_ASSISTANT_TYPE', payload: option });
    }

    const handleNext = () => {
        if (step < 3) {
            if (step === 1 && !selectedOption) return;
            setStep(s => s + 1);
        }
    };
    
    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    }

    const handleGoogleSignIn = () => {
        const callbackUrl = `/dashboard?newUserFlow=${selectedOption}`;
        signIn('google', { callbackUrl });
    }
    
    const handleEmailRegister = () => {
        if (!selectedOption) return;
        setIsRegisterOpen(true);
    };

    const showDetails = (type: 'browser' | 'whatsapp') => {
        setDetailsType(type);
        setIsDetailsOpen(true);
    };

    return (
        <>
        <PageContainer className="flex flex-col h-[calc(100vh-80px)]">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-gradient">
                    Comienza para Conseguir tu Asistente
                </h1>
            </div>

            <StepIndicator currentStep={step} />

            <div ref={scrollContainerRef} className="relative flex-grow overflow-y-auto mt-2 p-1">
                {/* Step 1: Choose Assistant Type */}
                <div className={cn(
                    "transition-opacity duration-300 absolute w-full",
                    step === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card 
                            onClick={() => handleSelectOption('desktop')}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-primary/20 hover:border-primary/80",
                                selectedOption === 'desktop' && "border-primary ring-2 ring-primary shadow-lg"
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
                                <CardTitle className="flex items-center gap-2 text-sm"><AppWindow size={16}/> Asistente en Navegador</CardTitle>
                                <CardDescription className="text-xs">Después, ${PRICE_PER_CREDIT.toFixed(2)} MXN por {MESSAGES_PER_CREDIT.toLocaleString()} mensajes.</CardDescription>
                            </CardHeader>
                             <CardContent className="p-4 pt-0">
                                <Button 
                                    size="sm" 
                                    className={cn(
                                        "w-full",
                                        "bg-brand-gradient text-primary-foreground hover:opacity-90",
                                        "shiny-border"
                                    )} 
                                    onClick={(e) => { e.stopPropagation(); showDetails('browser'); }}
                                >
                                    <Info className="mr-2" size={14} /> Ver detalles
                                </Button>
                            </CardContent>
                        </Card>

                        <Card 
                            onClick={() => handleSelectOption('whatsapp')}
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
                                <CardTitle className="flex items-center gap-2 text-sm"><FaWhatsapp size={16}/> Asistente en WhatsApp</CardTitle>
                                <CardDescription className="text-xs">Requiere un número de teléfono sin cuenta de WhatsApp activa.</CardDescription>
                            </CardHeader>
                             <CardContent className="p-4 pt-0">
                                <Button 
                                    size="sm" 
                                    className={cn(
                                        "w-full",
                                        "bg-brand-gradient text-primary-foreground hover:opacity-90",
                                        "shiny-border"
                                    )} 
                                    onClick={(e) => { e.stopPropagation(); showDetails('whatsapp'); }}
                                >
                                    <Info className="mr-2" size={14} /> Ver detalles
                                </Button>
                            </CardContent>
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

                 {/* Step 3: Register */}
                <div className={cn(
                    "transition-opacity duration-300 absolute w-full",
                    step === 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}>
                    <div className="space-y-4">
                        <Card 
                            onClick={handleGoogleSignIn}
                            className="cursor-pointer transition-all hover:shadow-primary/20 hover:border-primary/80"
                        >
                            <CardHeader className="p-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-sm"><FaGoogle size={16} /> Regístrate con Google</CardTitle>
                                    <div className="bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                        RECOMENDADO
                                    </div>
                                </div>
                                <CardDescription className="text-xs">La forma más rápida y segura de crear tu cuenta.</CardDescription>
                            </CardHeader>
                             <CardContent className="p-4 pt-0">
                                <Button size="sm" className={cn("w-full bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border")}>
                                    Continuar con Google <ArrowRight className="ml-2" size={14} />
                                </Button>
                            </CardContent>
                        </Card>

                         <Card 
                            onClick={handleEmailRegister}
                            className="cursor-pointer transition-all hover:shadow-primary/20 hover:border-primary/80"
                        >
                            <CardHeader className="p-4">
                                <CardTitle className="flex items-center gap-2 text-sm"><UserPlus size={16} /> Regístrate con Correo</CardTitle>
                                <CardDescription className="text-xs">Usa tu correo electrónico y una contraseña para registrarte.</CardDescription>
                            </CardHeader>
                             <CardContent className="p-4 pt-0">
                                 <Button size="sm" variant="secondary" className="w-full">
                                    Continuar con Correo <ArrowRight className="ml-2" size={14} />
                                 </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>

            <div className="flex justify-between items-center mt-auto pt-2 border-t">
                <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                    <ArrowLeft className="mr-2" size={16} />
                    Volver
                </Button>
                {step < 3 && (
                    <Button onClick={handleNext} disabled={step === 1 && !selectedOption}>
                        Siguiente
                        <ArrowRight className="ml-2" size={16} />
                    </Button>
                )}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-1">
               &copy; {new Date().getFullYear()} {APP_NAME}
            </p>
        </PageContainer>
        <AssistantDetailsDialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen} type={detailsType} />
        <RegisterAssistantDialog isOpen={isRegisterOpen} onOpenChange={setIsRegisterOpen} />
        </>
    );
};

export default BeginPage;
