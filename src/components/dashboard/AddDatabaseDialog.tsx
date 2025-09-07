
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaArrowRight, FaArrowLeft, FaSitemap, FaStar } from 'react-icons/fa';
import type { AssistantConfig, DatabaseConfig } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Step2DatabaseConfig from '../auth/wizard-steps/Step2_DatabaseConfig';

interface AddDatabaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddDatabaseDialog = ({ isOpen, onOpenChange }: AddDatabaseDialogProps) => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantsWithoutDb, setAssistantsWithoutDb] = useState<AssistantConfig[]>([]);
  
  useEffect(() => {
    // This effect resets and prepares the state whenever the dialog is opened.
    if (isOpen) {
      if (state.userProfile.assistants) {
        const availableAssistants = state.userProfile.assistants.filter(a => !a.databaseId);
        setAssistantsWithoutDb(availableAssistants);
      }
      setCurrentStep(1);
      setSelectedAssistantId(null);
      setIsProcessing(false);
      dispatch({ type: 'RESET_WIZARD' });
    }
  }, [isOpen, dispatch, state.userProfile.assistants]);


  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedAssistantId) {
        toast({ title: "Selección requerida", description: "Por favor, elige un asistente.", variant: "destructive" });
        return;
      }
      setCurrentStep(2);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    const { databaseOption } = state.wizard;
    if (!databaseOption.type || !databaseOption.name) {
       toast({ title: "Configuración Incompleta", description: "Por favor, completa los detalles de la base de datos.", variant: "destructive" });
       return;
    }
     if (databaseOption.type === 'google_sheets' && (!databaseOption.accessUrl || (databaseOption.selectedColumns || []).length === 0)) {
       toast({ title: "Configuración Incompleta", description: "Proporciona la URL de la Hoja de Google y carga las columnas.", variant: "destructive" });
       return;
    }

    setIsProcessing(true);

    const newDb: DatabaseConfig = {
      id: `db_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: databaseOption.name!,
      source: databaseOption.type!,
      details: databaseOption.name!,
      accessUrl: databaseOption.type === 'google_sheets' ? databaseOption.accessUrl : undefined,
      selectedColumns: databaseOption.selectedColumns,
      relevantColumnsDescription: databaseOption.relevantColumnsDescription,
    };
    
    // The AppProvider will now handle saving this to the database
    dispatch({ type: 'ADD_DATABASE_TO_ASSISTANT', payload: { assistantId: selectedAssistantId!, database: newDb }});

    // Toast will be shown from the AppProvider after successful save
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaSitemap /> Asignar Base de Datos
          </DialogTitle>
          <DialogDescription>
            Vincula una fuente de datos a uno de tus asistentes existentes.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {currentStep === 1 && (
            <div className="animate-fadeIn space-y-3">
              <h3 className="font-semibold">Paso 1: Selecciona un Asistente</h3>
              <p className="text-sm text-muted-foreground">Elige el asistente al que quieres añadirle una base de datos.</p>
              <Select onValueChange={setSelectedAssistantId} value={selectedAssistantId || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un asistente..." />
                </SelectTrigger>
                <SelectContent>
                  {assistantsWithoutDb.length > 0 ? (
                    assistantsWithoutDb.map(asst => (
                      <SelectItem key={asst.id} value={asst.id}>
                        {asst.name}
                      </SelectItem>
                    ))
                  ) : (
                     <SelectItem value="no-assistants" disabled>No hay asistentes sin base de datos</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          {currentStep === 2 && (
             <div className="animate-fadeIn space-y-3">
                <h3 className="font-semibold">Paso 2: Configura la Base de Datos</h3>
                <Step2DatabaseConfig />
             </div>
          )}
        </div>
        <DialogFooter className="flex justify-between w-full">
            <div>
            {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevious} disabled={isProcessing}>
                    <FaArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
            )}
            </div>
            <div>
            {currentStep === 1 && (
                <Button onClick={handleNext} disabled={isProcessing || !selectedAssistantId}>
                    Siguiente <FaArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
            {currentStep === 2 && (
                <Button onClick={handleSave} disabled={isProcessing}>
                    {isProcessing ? <FaSpinner className="animate-spin mr-2" /> : null}
                    Guardar y Vincular
                </Button>
            )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddDatabaseDialog;
