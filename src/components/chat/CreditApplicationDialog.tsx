
// src/components/chat/CreditApplicationDialog.tsx
"use client";

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { FaCreditCard, FaSpinner, FaIdCard, FaFileAlt, FaCheckCircle, FaArrowLeft, FaArrowRight, FaCamera, FaUpload, FaTimes } from 'react-icons/fa';
import type { AssistantConfig } from '@/types';
import { Progress } from '../ui/progress';
import { Card, CardContent } from '../ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from '@/components/ui/label';

interface CreditApplicationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: AssistantConfig;
}

interface ImageUploadProps {
  id: string;
  label: string;
  onImageSelect: (file: File) => void;
  previewUrl: string | null;
  onClear: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ id, label, onImageSelect, previewUrl, onClear }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageSelect(file);
        }
    };
    
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
            <Card className={cn("overflow-hidden w-full", previewUrl && "border-primary")}>
                <CardContent className="p-2">
                    <div 
                        className="aspect-video w-full border-2 border-dashed rounded-md flex items-center justify-center relative cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                            <>
                                <Image src={previewUrl} alt="Vista previa" layout="fill" objectFit="contain" className="p-1" />
                                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={(e) => { e.stopPropagation(); onClear(); }}>
                                    <FaTimes size={12}/>
                                </Button>
                            </>
                        ) : (
                            <div className="text-muted-foreground text-center p-2">
                                <FaIdCard className="mx-auto h-6 w-6 mb-1" />
                                <p className="text-xs">Subir o tomar foto</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
    );
};

const CreditApplicationDialog = ({ isOpen, onOpenChange, assistant }: CreditApplicationDialogProps) => {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    const [ineFront, setIneFront] = useState<File | null>(null);
    const [ineBack, setIneBack] = useState<File | null>(null);
    const [proofOfAddress, setProofOfAddress] = useState<File | null>(null);

    const [ineFrontPreview, setIneFrontPreview] = useState<string | null>(null);
    const [ineBackPreview, setIneBackPreview] = useState<string | null>(null);
    const [proofOfAddressPreview, setProofOfAddressPreview] = useState<string | null>(null);
    
    const handleImageSelection = (file: File, setter: React.Dispatch<React.SetStateAction<File | null>>, previewSetter: React.Dispatch<React.SetStateAction<string | null>>) => {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast({ title: "Archivo muy grande", description: "Elige una imagen de menos de 10MB.", variant: "destructive" });
            return;
        }
        setter(file);
        previewSetter(URL.createObjectURL(file));
    };

    const handleNext = () => {
        if (step === 1 && (!ineFront || !ineBack)) {
            toast({ title: "Archivos Faltantes", description: "Por favor, sube ambos lados de tu INE.", variant: "destructive" });
            return;
        }
        if (step === 2 && !proofOfAddress) {
            toast({ title: "Archivo Faltante", description: "Por favor, sube tu comprobante de domicilio.", variant: "destructive" });
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);
    
    const handleSubmit = () => {
        setIsProcessing(true);
        // Simulate API call to submit documents
        setTimeout(() => {
            toast({ title: "Solicitud Enviada", description: "Tus documentos han sido enviados para revisión." });
            setStep(4);
            setIsProcessing(false);
        }, 2000);
    }
    
    const resetAndClose = () => {
        onOpenChange(false);
        // Delay reset to allow closing animation
        setTimeout(() => {
            setStep(1);
            setIneFront(null);
            setIneBack(null);
            setProofOfAddress(null);
            setIneFrontPreview(null);
            setIneBackPreview(null);
            setProofOfAddressPreview(null);
        }, 300);
    }
    
    const progress = Math.round((step / 4) * 100);

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="w-screen h-screen max-w-full flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FaCreditCard /> Solicitud de Crédito
                    </DialogTitle>
                    <DialogDescription>
                        Completa los siguientes pasos para solicitar tu línea de crédito.
                    </DialogDescription>
                </DialogHeader>
                
                <Progress value={progress} className="w-full h-2" />

                <div className="py-4 space-y-4 flex-grow min-h-[400px]">
                    {step === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                             <Alert>
                                <AlertTitle>Paso 1: Identificación Oficial (INE)</AlertTitle>
                                <AlertDescription>Sube una foto clara de la parte frontal y trasera de tu INE.</AlertDescription>
                            </Alert>
                            <div className="grid grid-cols-2 gap-4">
                                <ImageUpload id="ine-front" label="Parte Frontal" onImageSelect={(f) => handleImageSelection(f, setIneFront, setIneFrontPreview)} previewUrl={ineFrontPreview} onClear={() => { setIneFront(null); setIneFrontPreview(null); }}/>
                                <ImageUpload id="ine-back" label="Parte Trasera" onImageSelect={(f) => handleImageSelection(f, setIneBack, setIneBackPreview)} previewUrl={ineBackPreview} onClear={() => { setIneBack(null); setIneBackPreview(null); }} />
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                         <div className="space-y-4 animate-fadeIn">
                             <Alert>
                                <AlertTitle>Paso 2: Comprobante de Domicilio</AlertTitle>
                                <AlertDescription>Sube un comprobante de domicilio no mayor a 3 meses (luz, agua, teléfono).</AlertDescription>
                            </Alert>
                            <ImageUpload id="proof-address" label="Comprobante" onImageSelect={(f) => handleImageSelection(f, setProofOfAddress, setProofOfAddressPreview)} previewUrl={proofOfAddressPreview} onClear={() => { setProofOfAddress(null); setProofOfAddressPreview(null); }} />
                        </div>
                    )}
                    {step === 3 && (
                         <div className="space-y-4 animate-fadeIn text-center p-4">
                             <FaCheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4"/>
                            <h3 className="text-lg font-semibold">Todo Listo para Enviar</h3>
                            <p className="text-sm text-muted-foreground">Revisa que tus documentos sean correctos antes de enviar tu solicitud. Este proceso es seguro y tu información está protegida.</p>
                        </div>
                    )}
                     {step === 4 && (
                         <div className="space-y-4 animate-fadeIn text-center p-4 flex flex-col items-center justify-center h-full">
                             <FaSpinner className="mx-auto h-16 w-16 text-primary animate-spin mb-4"/>
                            <h3 className="text-lg font-semibold">Solicitud en Revisión</h3>
                            <p className="text-sm text-muted-foreground">Hemos recibido tus documentos. Te notificaremos en este chat en un plazo de 24 horas cuando tu línea de crédito preaprobada esté lista.</p>
                        </div>
                    )}
                </div>

                {step < 4 && (
                    <DialogFooter className="flex justify-between w-full">
                        {step > 1 ? (
                            <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
                                <FaArrowLeft className="mr-2"/> Atrás
                            </Button>
                        ) : ( <div></div> )}

                        {step < 3 ? (
                            <Button onClick={handleNext} disabled={isProcessing}>
                                Siguiente <FaArrowRight className="ml-2"/>
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={isProcessing}>
                                {isProcessing ? <FaSpinner className="animate-spin mr-2" /> : null}
                                Enviar Solicitud
                            </Button>
                        )}
                    </DialogFooter>
                )}
                 {step === 4 && (
                    <DialogFooter>
                         <Button onClick={resetAndClose} className="w-full">
                            Entendido
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CreditApplicationDialog;
