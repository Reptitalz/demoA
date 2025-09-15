
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaCrown, FaStar } from 'react-icons/fa';
import { MONTHLY_PLAN_CREDIT_COST } from '@/config/appConfig';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

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

  const hasUsedFreeTrial = useMemo(() => {
    return userProfile.assistants.some(a => a.isFirstDesktopAssistant);
  }, [userProfile.assistants]);
  
  const availableAssistantsToAssign = useMemo(() => {
    return userProfile.assistants.filter(a => a.type === 'desktop' && !a.isPlanActive && !(a.isFirstDesktopAssistant && (30 - (a.trialStartDate ? new Date().getDate() - new Date(a.trialStartDate).getDate() : 31)) > 0));
  }, [userProfile.assistants]);

  const handlePurchasePlan = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/assistants/purchase-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userProfile._id }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'No se pudo comprar el plan.');
      }
      
      dispatch({ type: 'UPDATE_USER_PROFILE', payload: { 
          credits: result.newCreditBalance, 
          purchasedUnlimitedPlans: result.newPurchasedPlans 
      }});
      toast({
        title: "¡Compra Exitosa!",
        description: `Has comprado un plan ilimitado. Ahora puedes asignarlo a un asistente.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };
  
   const handleAssignPlan = async () => {
    if (!selectedAssistantId) {
        toast({ title: "Error", description: "Por favor, selecciona un asistente para asignar el plan.", variant: "destructive" });
        return;
    }
    setIsProcessing(true);
    try {
      const response = await fetch('/api/assistants/activate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile._id,
          assistantId: selectedAssistantId,
          action: 'assign_existing',
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
      setSelectedAssistantId(null); // Reset selection
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };


  return (
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
                    <Button onClick={handlePurchasePlan} disabled={isProcessing || userProfile.credits < MONTHLY_PLAN_CREDIT_COST} className="w-full">
                        {isProcessing ? <FaSpinner className="animate-spin mr-2" /> : null}
                        Comprar por {MONTHLY_PLAN_CREDIT_COST} créditos (${(MONTHLY_PLAN_CREDIT_COST * 65).toFixed(0)} MXN)
                    </Button>
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
                            <Button onClick={handleAssignPlan} disabled={isProcessing || !selectedAssistantId}>
                                {isProcessing ? <FaSpinner className="animate-spin" /> : "Asignar"}
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
  );
};

export default PlansDialog;
