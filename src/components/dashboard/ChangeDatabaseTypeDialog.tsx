
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaExchangeAlt, FaExclamationTriangle } from 'react-icons/fa';
import type { DatabaseConfig, DatabaseSource } from '@/types';
import Step2DatabaseConfig from '../auth/wizard-steps/Step2_DatabaseConfig';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

interface ChangeDatabaseTypeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  database: DatabaseConfig;
}

const ChangeDatabaseTypeDialog = ({ isOpen, onOpenChange, database }: ChangeDatabaseTypeDialogProps) => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmAlertOpen, setIsConfirmAlertOpen] = useState(false);

  useEffect(() => {
    // When the dialog opens, load the current DB's data into the wizard state for editing
    if (isOpen) {
      dispatch({ type: 'RESET_WIZARD' }); // Clear previous wizard state
      dispatch({
        type: 'SET_DATABASE_OPTION',
        payload: {
          type: database.source,
          name: database.name,
          accessUrl: database.accessUrl,
          selectedColumns: database.selectedColumns,
          relevantColumnsDescription: database.relevantColumnsDescription,
        }
      });
    }
  }, [isOpen, database, dispatch]);

  const handleSave = () => {
    const { databaseOption } = state.wizard;
    
    // Basic validation
    if (!databaseOption.type || !databaseOption.name) {
       toast({ title: "Configuración Incompleta", description: "Por favor, completa los detalles de la base de datos.", variant: "destructive" });
       return;
    }
    if (databaseOption.type === 'google_sheets' && (!databaseOption.accessUrl || (databaseOption.selectedColumns || []).length === 0)) {
       toast({ title: "Configuración Incompleta", description: "Proporciona la URL y carga las columnas.", variant: "destructive" });
       return;
    }

    // If type hasn't changed, just update info without alert
    if (databaseOption.type === database.source) {
       performUpdate();
    } else {
       setIsConfirmAlertOpen(true);
    }
  };

  const performUpdate = () => {
    setIsProcessing(true);
    const { databaseOption } = state.wizard;
    
    const updatedDb: DatabaseConfig = {
      ...database,
      name: databaseOption.name!,
      source: databaseOption.type!,
      accessUrl: databaseOption.type === 'google_sheets' ? databaseOption.accessUrl : undefined,
      selectedColumns: databaseOption.type === 'google_sheets' ? databaseOption.selectedColumns : [],
      relevantColumnsDescription: databaseOption.type === 'google_sheets' ? databaseOption.relevantColumnsDescription : '',
    };
    
    dispatch({ type: 'UPDATE_DATABASE', payload: updatedDb });

    toast({ title: "Base de Datos Actualizada", description: `La base de datos "${database.name}" ha sido actualizada.` });
    
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaExchangeAlt /> Cambiar Tipo de Base de Datos
            </DialogTitle>
            <DialogDescription>
              Modifica la configuración de "{database.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <Step2DatabaseConfig />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isProcessing}>
              {isProcessing ? <FaSpinner className="animate-spin mr-2" /> : null}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isConfirmAlertOpen} onOpenChange={setIsConfirmAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FaExclamationTriangle className="text-orange-500" />
              ¿Confirmar cambio de tipo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cambiar el tipo de base de datos. La fuente de datos anterior se desvinculará. Si cambias de una Hoja de Google, los datos en esa hoja no se verán afectados.
              <br/><br/>
              <span className="font-bold">Esta acción no se puede deshacer.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={performUpdate} className="bg-primary hover:bg-primary/90">
              Sí, cambiar tipo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChangeDatabaseTypeDialog;
