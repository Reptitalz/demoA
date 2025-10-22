
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, CreditCard as CreditCardIcon, User, Bot, Upload, ArrowLeft } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { CreditOffer, RequiredDocument, AssistantConfig } from '@/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface CreateCreditOfferDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  offerToEdit?: CreditOffer;
}

const CreditCardPreview = ({ offer }: { offer: Partial<CreditOffer> }) => {
  const gradientStyle = {
    background: `linear-gradient(45deg, rgba(0,0,0,0.7), rgba(0,0,0,0.4)), ${offer.customColor || '#1f2937'}`
  };
    
  return (
    <div 
      className="w-full aspect-[1.586] rounded-xl p-4 flex flex-col justify-between text-white shadow-lg transition-all duration-300"
      style={gradientStyle}
    >
      <div className="flex justify-between items-start">
        <p className="font-semibold text-lg opacity-90">{offer.name || 'Nombre del Crédito'}</p>
        {offer.cardIconUrl ? 
            <Image src={offer.cardIconUrl} alt="logo" width={40} height={40} className="rounded-md object-contain" />
            : <CreditCardIcon className="w-8 h-8 opacity-50" />
        }
      </div>
      <div className="text-right">
        <p className="text-sm opacity-80">Monto Máximo</p>
        <p className="text-2xl font-bold">${(offer.amount || 0).toLocaleString()}</p>
      </div>
    </div>
  );
};


const availableDocuments: RequiredDocument[] = [
  { id: 'doc_ine', title: 'INE/IFE (Frontal y Trasero)' },
  { id: 'doc_proof_address', title: 'Comprobante de Domicilio' },
  { id: 'doc_proof_income', title: 'Comprobante de Ingresos' },
];

const CreateCreditOfferDialog = ({ isOpen, onOpenChange, offerToEdit }: CreateCreditOfferDialogProps) => {
  const { state, dispatch } = useApp();
  const { userProfile } = state;
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [offer, setOffer] = useState<Partial<CreditOffer>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const cardIconInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setOffer(offerToEdit || {
        name: '',
        amount: 5000,
        interest: 10,
        term: 12,
        termUnit: 'weeks',
        customColor: '#3b82f6', // default to blue
        managerType: 'user',
        managerId: userProfile._id?.toString(),
        requiredDocuments: [{id: 'doc_ine', title: 'INE/IFE (Frontal y Trasero)'}],
      });
    }
  }, [isOpen, offerToEdit, userProfile._id]);
  
  const handleInputChange = (field: keyof CreditOffer, value: any) => {
    setOffer(prev => ({...prev, [field]: value}));
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'cardIconUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }
  
  const handleDocumentToggle = (docId: string) => {
    const currentDocs = offer.requiredDocuments || [];
    const docIndex = currentDocs.findIndex(d => d.id === docId);
    if (docIndex > -1) {
        handleInputChange('requiredDocuments', currentDocs.filter(d => d.id !== docId));
    } else {
        const docToAdd = availableDocuments.find(d => d.id === docId);
        if (docToAdd) {
            handleInputChange('requiredDocuments', [...currentDocs, docToAdd]);
        }
    }
  }
  
  const validateStep = (currentStep: number) => {
    switch(currentStep) {
        case 1:
            return !!offer.name?.trim();
        case 2:
            return !!(offer.amount && offer.interest && offer.term && offer.termUnit);
        case 3:
             return !!(offer.managerType && offer.managerId);
        default:
            return false;
    }
  }

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSave = () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
        toast({ title: 'Campos Incompletos', description: 'Por favor, completa todos los campos antes de guardar.', variant: 'destructive' });
        return;
    }
    
    setIsProcessing(true);

    const finalOffer: CreditOffer = {
      id: offerToEdit?.id || `offer_${Date.now()}`,
      name: offer.name!,
      amount: offer.amount!,
      interest: offer.interest!,
      term: offer.term!,
      termUnit: offer.termUnit!,
      customColor: offer.customColor,
      cardIconUrl: offer.cardIconUrl,
      managerType: offer.managerType!,
      managerId: offer.managerId!,
      requiredDocuments: offer.requiredDocuments || [],
    };
    
    const existingOffers = userProfile.creditOffers || [];
    const newOffers = offerToEdit
        ? existingOffers.map(o => o.id === offerToEdit.id ? finalOffer : o)
        : [...existingOffers, finalOffer];
        
    dispatch({ type: 'UPDATE_USER_PROFILE', payload: { creditOffers: newOffers }});

    toast({ title: 'Éxito', description: `La oferta de crédito "${finalOffer.name}" ha sido guardada.` });
    setIsProcessing(false);
    onOpenChange(false);
  };
  
  const assistants = userProfile.assistants || [];
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const renderStepContent = () => {
      switch(step) {
          case 1: return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="offer-name">Nombre de la Oferta</Label>
                    <Input id="offer-name" value={offer.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Ej: Crédito Express" />
                </div>
                <div className="flex items-center justify-between">
                     <div className="space-y-2">
                        <Label htmlFor="custom-color">Color de la Tarjeta</Label>
                        <div 
                            className="w-12 h-12 rounded-full border-2 border-muted cursor-pointer" 
                            style={{ backgroundColor: offer.customColor || '#000000' }}
                            onClick={() => colorInputRef.current?.click()}
                        />
                        <Input ref={colorInputRef} id="custom-color" type="color" value={offer.customColor || '#3b82f6'} onChange={(e) => handleInputChange('customColor', e.target.value)} className="sr-only"/>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => cardIconInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4"/>Subir Icono (Logo)
                    </Button>
                </div>
            </div>
          );
          case 2: return (
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="offer-amount">Monto Máximo</Label>
                        <Input id="offer-amount" type="number" value={offer.amount || ''} onChange={(e) => handleInputChange('amount', Number(e.target.value))} placeholder="Ej: 5000" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="offer-interest">Interés Mensual (%)</Label>
                        <Input id="offer-interest" type="number" value={offer.interest || ''} onChange={(e) => handleInputChange('interest', Number(e.target.value))} placeholder="Ej: 10" />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="offer-term">Plazo</Label>
                        <Input id="offer-term" type="number" value={offer.term || ''} onChange={(e) => handleInputChange('term', Number(e.target.value))} placeholder="Ej: 12" />
                    </div>
                     <div className="space-y-2">
                         <Label htmlFor="offer-term-unit">Unidad de Plazo</Label>
                        <Select value={offer.termUnit} onValueChange={(v) => handleInputChange('termUnit', v as CreditOffer['termUnit'])}>
                            <SelectTrigger id="offer-term-unit"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weeks">Semanas</SelectItem>
                                <SelectItem value="fortnights">Quincenas</SelectItem>
                                <SelectItem value="months">Meses</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                </div>
            </div>
          );
          case 3: return (
             <div className="space-y-6">
                 <div className="space-y-3">
                    <Label>Gestor del Crédito</Label>
                    <RadioGroup value={offer.managerType} onValueChange={(v) => handleInputChange('managerType', v as CreditOffer['managerType'])} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                           <RadioGroupItem value="user" id="manager-user" />
                           <Label htmlFor="manager-user" className="flex items-center gap-2"><User/>Tú mismo</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                           <RadioGroupItem value="assistant" id="manager-assistant" />
                           <Label htmlFor="manager-assistant" className="flex items-center gap-2"><Bot/>Un Asistente</Label>
                        </div>
                    </RadioGroup>
                    {offer.managerType === 'assistant' && (
                         <Select value={offer.managerId} onValueChange={(v) => handleInputChange('managerId', v)}>
                            <SelectTrigger><SelectValue placeholder="Selecciona un asistente..." /></SelectTrigger>
                            <SelectContent>
                                {assistants.map(asst => <SelectItem key={asst.id} value={asst.id}>{asst.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div className="space-y-3">
                    <Label>Documentos Requeridos</Label>
                    {availableDocuments.map(doc => (
                        <div key={doc.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`doc-${doc.id}`} 
                                checked={offer.requiredDocuments?.some(d => d.id === doc.id)}
                                onCheckedChange={() => handleDocumentToggle(doc.id)}
                            />
                            <Label htmlFor={`doc-${doc.id}`} className="font-normal">{doc.title}</Label>
                        </div>
                    ))}
                </div>
            </div>
          );
          default: return null;
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCardIcon /> {offerToEdit ? 'Editar Oferta de Crédito' : 'Crear Nueva Oferta de Crédito'}
          </DialogTitle>
          <DialogDescription>
            Diseña y configura tu producto de crédito para que tus asistentes lo ofrezcan.
          </DialogDescription>
           <Progress value={progress} className="mt-2 h-1.5" />
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-8 flex-grow min-h-0">
          {/* Left Side - Form */}
          <ScrollArea className="pr-4 -mr-4">
            {renderStepContent()}
          </ScrollArea>
          
          {/* Right Side - Preview */}
          <div className="space-y-4 flex flex-col justify-center">
             <CreditCardPreview offer={offer}/>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between w-full">
            <div>
                {step > 1 && (
                    <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                    </Button>
                )}
            </div>
            <div>
                {step < totalSteps ? (
                    <Button onClick={handleNext} disabled={!validateStep(step)}>Siguiente</Button>
                ) : (
                    <Button onClick={handleSave} disabled={isProcessing || !validateStep(step)}>
                        {isProcessing && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                        {offerToEdit ? 'Guardar Cambios' : 'Crear Oferta'}
                    </Button>
                )}
            </div>
        </DialogFooter>

        <input type="file" ref={cardIconInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cardIconUrl')} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateCreditOfferDialog;
