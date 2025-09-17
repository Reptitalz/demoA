
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaCrown, FaStar } from 'react-icons/fa';
import { MONTHLY_PLAN_CREDIT_COST, PRICE_PER_CREDIT } from '@/config/appConfig';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { Loader2 } from 'lucide-react';
import PersonalInfoDialog from './PersonalInfoDialog';

interface PlansDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PlansDialog = ({ isOpen, onOpenChange }: PlansDialogProps) => {
  const { state, dispatch } = useApp();
  const { userProfile } = state;
  const { toast } = useToast();
  
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isPersonalInfoDialogOpen, setIsPersonalInfoDialogOpen] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  if (publicKey) {
    initMercadoPago(publicKey, { locale: 'es-MX' });
  }

  const hasUsedFreeTrial = useMemo(() => {
    return userProfile.assistants.some(a => a.isFirstDesktopAssistant);
  }, [userProfile.assistants]);
  
  const availableAssistantsToAssign = useMemo(() => {
    return userProfile.assistants.filter(a => a.type === 'desktop' && !a.isPlanActive && !(a.isFirstDesktopAssistant && (30 - (a.trialStartDate ? new Date().getDate() - new Date(a.trialStartDate).getDate() : 31)) > 0));
  }, [userProfile.assistants]);
  
  useEffect(() => {
    if (!isOpen) {
        setPreferenceId(null);
        setIsProcessing(false);
        setIsAssigning(false);
        setSelectedAssistantId(null);
    }
  }, [isOpen]);


  const handlePurchasePlan = async () => {
     if (!userProfile.firstName || !userProfile.lastName) {
      toast({
        title: "Información Requerida",
        description: "Completa tu información personal para poder comprar.",
        variant: "default",
      });
      setIsPersonalInfoDialogOpen(true);
      return;
    }

    setIsProcessing(true);
    setPreferenceId(null);
    try {
        const response = await fetch('/api/create-mercadopago-preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                purchaseType: 'plan', 
                userDbId: userProfile._id?.toString() 
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo iniciar el pago.');
        if (data.preferenceId) setPreferenceId(data.preferenceId);

    } catch (error: any) {
        toast({ title: 'Error al iniciar pago', description: error.message, variant: 'destructive' });
        setIsProcessing(false);
    }
    // isProcessing will be set to false by the component rendering Wallet
  };
  
   const handleAssignPlan = async () => {
    if (!selectedAssistantId) {
        toast({ title: "Error", description: "Por favor, selecciona un asistente para asignar el plan.", variant: "destructive" });
        return;
    }
    setIsAssigning(true);
    try {
      const response = await fetch('/api/assistants/activate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile._id,
          assistantId: selectedAssistantId,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'No se pudo asignar el plan.');
      }
      
      dispatch({ type: 'UPDATE_ASSISTANT', payload: result.updatedAssistant });
      dispatch({ type: 'UPDATE_USER_PROFILE', payload: { purchasedUnlimitedPlans: result.newPurchasedPlans } });

      toast({
        title: "¡Plan Asignado!",
        description: `El plan se ha asignado a tu asistente.`,
      });
      setSelectedAssistantId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAssigning(false);
    }
  };


  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaStar /> Gestionar Planes
          </DialogTitle>
          <DialogDescription>
            Compra o asigna planes de mensajes ilimitados para tus asistentes de escritorio.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FaCrown className="text-yellow-500" />
                        Prueba Gratuita
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {hasUsedFreeTrial ? (
                        <p className="text-sm text-muted-foreground">Ya has utilizado tu prueba gratuita de 30 días para un asistente de escritorio.</p>
                    ) : (
                        <p className="text-sm text-muted-foreground">Obtén 30 días de mensajes ilimitados al crear tu primer asistente de escritorio. ¡Sin costo!</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FaStar className="text-primary" />
                        Plan Mensual Ilimitado
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Desbloquea mensajes ilimitados para un asistente de escritorio. Compra un plan y asígnalo cuando quieras.</p>
                     {preferenceId ? (
                        <div className="animate-fadeIn flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50">
                            <Wallet 
                                initialization={{ preferenceId: preferenceId }}
                                customization={{ texts: { valueProp: 'smart_option'}}}
                                onReady={() => setIsProcessing(false)}
                            />
                        </div>
                    ) : (
                        <Button onClick={handlePurchasePlan} disabled={isProcessing} className="w-full">
                            {isProcessing ? <FaSpinner className="animate-spin mr-2" /> : null}
                            Comprar Plan por ${Math.round(MONTHLY_PLAN_CREDIT_COST * PRICE_PER_CREDIT)} MXN
                        </Button>
                    )}
                </CardContent>
            </Card>

            {(userProfile.purchasedUnlimitedPlans || 0) > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Asignar Plan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">Tienes <span className="font-bold text-primary">{userProfile.purchasedUnlimitedPlans}</span> plan(es) ilimitado(s) disponible(s). Asigna uno a un asistente de escritorio.</p>
                        <div className="flex gap-2">
                            <Select onValueChange={setSelectedAssistantId} value={selectedAssistantId || undefined} disabled={availableAssistantsToAssign.length === 0}>
                                <SelectTrigger className="flex-grow">
                                    <SelectValue placeholder="Selecciona un asistente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableAssistantsToAssign.length > 0 ? (
                                        availableAssistantsToAssign.map(asst => (
                                        <SelectItem key={asst.id} value={asst.id}>
                                            {asst.name}
                                        </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no-assistants" disabled>No hay asistentes elegibles</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleAssignPlan} disabled={isAssigning || !selectedAssistantId}>
                                {isAssigning ? <FaSpinner className="animate-spin" /> : "Asignar"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <PersonalInfoDialog
        isOpen={isPersonalInfoDialogOpen}
        onOpenChange={setIsPersonalInfoDialogOpen}
    />
    </>
  );
};

export default PlansDialog;
