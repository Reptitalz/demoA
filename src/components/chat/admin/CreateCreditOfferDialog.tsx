
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, CreditCard as CreditCardIcon, User, Bot, Upload, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
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

const defaultRequiredDocuments: RequiredDocument[] = [
  { id: 'doc_ine', title: 'INE/IFE (Frontal y Trasero)' },
  { id: 'doc_proof_address', title: 'Comprobante de Domicilio' },
];

const CreateCreditOfferDialog = ({ isOpen, onOpenChange, offerToEdit }: CreateCreditOfferDialogProps) => {
  const { state, dispatch } = useApp();
  const { userProfile } = state;
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [offer, setOffer] = useState<Partial<CreditOffer>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [customDocName, setCustomDocName] = useState('');
  const cardIconInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setOffer(offerToEdit || {
        name: '',
        amount: 5000,
        interest: 10,
        profitPerPayment: 15,
        term: 12,
        termUnit: 'weeks',
        customColor: '#3b82f6',
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
  
  const handleDocumentToggle = (docId: string, isCustom: boolean = false) => {
    const currentDocs = offer.requiredDocuments || [];
    const docIndex = currentDocs.findIndex(d => d.id === docId);

    if (docIndex > -1) {
      handleInputChange('requiredDocuments', currentDocs.filter(d => d.id !== docId));
    } else {
      const docToAdd = (isCustom ? { id: docId, title: docId } : defaultRequiredDocuments.find(d => d.id === docId));
      if (docToAdd) {
        handleInputChange('requiredDocuments', [...currentDocs, docToAdd]);
      }
    }
  };

  const handleAddCustomDoc = () => {
    if (!customDocName.trim()) return;
    const docId = `doc_custom_${Date.now()}`;
    const newDoc: RequiredDocument = { id: docId, title: customDocName };
    handleInputChange('requiredDocuments', [...(offer.requiredDocuments || []), newDoc]);
    setCustomDocName('');
  };
  
  const handleRemoveCustomDoc = (docId: string) => {
    handleInputChange('requiredDocuments', (offer.requiredDocuments || []).filter(d => d.id !== docId));
  };
  
  const validateStep = (currentStep: number) => {
    switch(currentStep) {
        case 1: return !!offer.name?.trim();
        case 2: return true; // Color is always set
        case 3: return !!(offer.amount && offer.amount > 0);
        case 4: return !!(offer.interest && offer.profitPerPayment);
        case 5: return !!(offer.term && offer.termUnit);
        case 6: return (offer.requiredDocuments || []).length > 0;
        case 7: return !!(offer.managerType && offer.managerId);
        default: return false;
    }
  }

  const handleNext = () => setStep(prev => prev < totalSteps ? prev + 1 : prev);
  const handleBack = () => setStep(prev => prev > 1 ? prev - 1 : prev);

  const handleSave = () => {
    for (let i = 1; i <= totalSteps; i++) {
        if (!validateStep(i)) {
            toast({ title: 'Campos Incompletos', description: `Por favor, completa la información del paso ${i}.`, variant: 'destructive' });
            setStep(i);
            return;
        }
    }
    
    setIsProcessing(true);

    const finalOffer: CreditOffer = {
      id: offerToEdit?.id || `offer_${Date.now()}`,
      name: offer.name!,
      amount: offer.amount!,
      interest: offer.interest!,
      profitPerPayment: offer.profitPerPayment!,
      term: offer.term!,
      termUnit: offer.termUnit!,
      customColor: offer.customColor,
      cardIconUrl: offer.cardIconUrl,
      managerType: offer.managerType!,
      managerId: offer.managerId!,
      requiredDocuments: offer.requiredDocuments!,
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
  const totalSteps = 7;
  const progress = (step / totalSteps) * 100;
  
  const stepTitles = [
    "Nombre del Crédito",
    "Diseño de Tarjeta",
    "Monto",
    "Intereses y Ganancias",
    "Frecuencia de Pagos",
    "Requisitos",
    "Gestor del Crédito"
  ];

  const renderStepContent = () => {
      switch(step) {
          case 1: return (
            <div className="space-y-2">
                <Label htmlFor="offer-name">Nombre de la Oferta</Label>
                <Input id="offer-name" value={offer.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Ej: Crédito Express" />
            </div>
          );
          case 2: return (
             <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Label>Color Principal</Label>
                    <div 
                        className="w-12 h-12 rounded-full border-2 border-muted cursor-pointer" 
                        style={{ backgroundColor: offer.customColor || '#000000' }}
                        onClick={() => colorInputRef.current?.click()}
                    />
                    <Input ref={colorInputRef} id="custom-color" type="color" value={offer.customColor || '#3b82f6'} onChange={(e) => handleInputChange('customColor', e.target.value)} className="sr-only"/>
                </div>
                <Button variant="outline" size="sm" onClick={() => cardIconInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4"/>Subir Icono
                </Button>
            </div>
          );
          case 3: return (
            <div className="space-y-2">
                <Label htmlFor="offer-amount">Monto Máximo del Crédito</Label>
                <Input id="offer-amount" type="number" value={offer.amount || ''} onChange={(e) => handleInputChange('amount', Number(e.target.value))} placeholder="Ej: 5000" />
            </div>
          );
          case 4: return (
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="offer-interest">Interés Mensual (%)</Label>
                    <Input id="offer-interest" type="number" value={offer.interest || ''} onChange={(e) => handleInputChange('interest', Number(e.target.value))} placeholder="Ej: 10" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="offer-profit">Ganancia por Pago</Label>
                    <Input id="offer-profit" type="number" value={offer.profitPerPayment || ''} onChange={(e) => handleInputChange('profitPerPayment', Number(e.target.value))} placeholder="Ej: 25" />
                </div>
            </div>
          );
           case 5: return (
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="offer-term">Plazo</Label>
                    <Input id="offer-term" type="number" value={offer.term || ''} onChange={(e) => handleInputChange('term', Number(e.target.value))} placeholder="Ej: 12" />
                </div>
                 <div className="space-y-2">
                     <Label htmlFor="offer-term-unit">Frecuencia de Pago</Label>
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
          );
          case 6: return (
             <div className="space-y-4">
                <div>
                    <Label>Documentos Requeridos (Estándar)</Label>
                    <div className="space-y-2 mt-2">
                        {defaultRequiredDocuments.map(doc => (
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
                 <div>
                    <Label>Documentos Personalizados</Label>
                     <div className="flex gap-2 mt-2">
                         <Input value={customDocName} onChange={(e) => setCustomDocName(e.target.value)} placeholder="Ej: Foto del Negocio" />
                         <Button onClick={handleAddCustomDoc} size="sm"><Plus className="h-4 w-4"/></Button>
                     </div>
                     <div className="space-y-1 mt-2">
                        {(offer.requiredDocuments || []).filter(d => d.id.startsWith('doc_custom_')).map(doc => (
                            <div key={doc.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded-md">
                                <span>{doc.title}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveCustomDoc(doc.id)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
          );
          case 7: return (
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
          );
          default: return null;
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCardIcon /> {offerToEdit ? 'Editar Oferta de Crédito' : 'Crear Nueva Oferta de Crédito'}
          </DialogTitle>
          <DialogDescription>
            Diseña y configura tu producto de crédito para que tus asistentes lo ofrezcan.
          </DialogDescription>
           <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Paso {step} de {totalSteps}</span>
                  <span className="font-semibold">{stepTitles[step - 1]}</span>
              </div>
              <Progress value={progress} className="h-1.5" />
          </div>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-8 flex-grow min-h-0">
          <ScrollArea className="md:border-r">
            <div className="p-6">
                {renderStepContent()}
            </div>
          </ScrollArea>
          
          <div className="p-6 space-y-4 flex flex-col justify-center bg-muted/30">
             <CreditCardPreview offer={offer}/>
          </div>
        </div>
        
        <DialogFooter className="p-6 flex justify-between w-full border-t">
            <div>
                {step > 1 && (
                    <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                    </Button>
                )}
            </div>
            <div>
                {step < totalSteps ? (
                    <Button onClick={handleNext} disabled={!validateStep(step)}>
                        Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
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
