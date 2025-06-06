
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from "@/providers/AppProvider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaFileExcel, FaBrain, FaUpload, FaGoogle, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import type { DatabaseSource } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase'; // Import Firebase auth

interface DatabaseOptionConfig {
  id: DatabaseSource;
  name: string;
  icon: React.ElementType;
  inputNameLabel?: string;
  inputNamePlaceholder?: string;
  requiresAccessUrlInput?: boolean;
  accessUrlLabel?: string;
  accessUrlPlaceholder?: string;
  requiresFileUpload?: boolean;
  description?: string;
}

const allDatabaseOptionsConfig: DatabaseOptionConfig[] = [
  {
    id: "google_sheets" as DatabaseSource,
    name: "Vincular Hoja de Google existente",
    icon: FaGoogle,
    inputNameLabel: "Nombre Descriptivo",
    inputNamePlaceholder: "Ej: CRM Clientes Activos",
    requiresAccessUrlInput: true,
    accessUrlLabel: "URL de la Hoja de Google",
    accessUrlPlaceholder: "https://docs.google.com/spreadsheets/d/...",
    description: "Asegúrate de que esta Hoja de Google sea pública y editable por cualquiera con el enlace para que tu asistente pueda acceder y (si es necesario) modificar los datos."
  },
  {
    id: "excel" as DatabaseSource,
    name: "Importar desde Excel y crear Google Sheet",
    icon: FaFileExcel,
    requiresFileUpload: true,
    inputNameLabel: "Nombre para el Nuevo Google Sheet",
    inputNamePlaceholder: "Ej: Reporte de Ventas Q1 (desde Excel)",
    // accessUrl will be populated by the API
  },
  {
    id: "smart_db" as DatabaseSource,
    name: "Crear Base de Datos Inteligente",
    icon: FaBrain,
    inputNameLabel: "Nombre para tu Base de Datos Inteligente",
    inputNamePlaceholder: "Ej: Base de Conocimiento Producto X",
  },
];

const Step2DatabaseConfig = () => {
  const { state, dispatch } = useApp();
  const { databaseOption, selectedPurposes } = state.wizard;
  const { toast } = useToast();

  const [dbNameValue, setDbNameValue] = useState('');
  const [accessUrlValue, setAccessUrlValue] = useState('');
  const [fileNameForDisplay, setFileNameForDisplay] = useState(''); // Only for displaying original excel name
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);

  const [availableOptions, setAvailableOptions] = useState<DatabaseOptionConfig[]>([]);

  useEffect(() => {
    let currentAvailableOptions: DatabaseOptionConfig[] = [];
    if (selectedPurposes.has("import_spreadsheet")) {
      currentAvailableOptions = allDatabaseOptionsConfig.filter(opt => opt.id === "google_sheets" || opt.id === "excel");
    } else if (selectedPurposes.has("create_smart_db")) {
      currentAvailableOptions = allDatabaseOptionsConfig.filter(opt => opt.id === "smart_db");
    }
    setAvailableOptions(currentAvailableOptions);

    if (databaseOption.type && !currentAvailableOptions.some(opt => opt.id === databaseOption.type)) {
      dispatch({
        type: 'SET_DATABASE_OPTION',
        payload: { type: null, name: '', accessUrl: '', file: null }
      });
    }
  }, [selectedPurposes, dispatch, databaseOption.type]);

  useEffect(() => {
    setDbNameValue(databaseOption.name || '');
    setAccessUrlValue(databaseOption.accessUrl || '');
    setFileNameForDisplay(databaseOption.file?.name || '');
  }, [databaseOption.type, databaseOption.name, databaseOption.accessUrl, databaseOption.file]);

  const handleOptionChange = (value: string) => {
    const selectedConfig = availableOptions.find(opt => opt.id === value);
    if (selectedConfig) {
      dispatch({
        type: 'SET_DATABASE_OPTION',
        payload: {
          type: value as DatabaseSource,
          name: '', // Reset name, will be filled by user or API
          accessUrl: '', // Reset accessUrl
          file: databaseOption.type === value ? databaseOption.file : null // Preserve file if type doesn't change
        }
      });
    }
  };

  const handleDbNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setDbNameValue(newName);
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { ...databaseOption, name: newName } });
  };

  const handleAccessUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setAccessUrlValue(newUrl);
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { ...databaseOption, accessUrl: newUrl } });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const processUploadedExcel = useCallback(async (file: File, targetSheetName: string) => {
    if (!auth.currentUser) {
      toast({ title: "Error de Autenticación", description: "Debes estar autenticado para procesar archivos. Por favor, completa el paso de autenticación si lo omitiste.", variant: "destructive" });
      setIsProcessingExcel(false);
      return;
    }

    setIsProcessingExcel(true);
    toast({ title: "Procesando Excel...", description: `Creando Google Sheet "${targetSheetName}". Esto puede tardar un momento.` });

    try {
      const fileData = await fileToBase64(file);
      const token = await auth.currentUser.getIdToken();

      const response = await fetch('/api/sheets-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileData,
          fileName: targetSheetName, // API uses this as the desired Google Sheet name
          firebaseUid: auth.currentUser.uid
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Error del servidor: ${response.status}`);
      }

      dispatch({
        type: 'SET_DATABASE_OPTION',
        payload: {
          type: 'google_sheets', // Update type to Google Sheets
          name: result.spreadsheetName, // Use name from API
          accessUrl: result.spreadsheetUrl, // Use URL from API
          file: null, // Clear the original Excel file from wizard state
        }
      });
      setFileNameForDisplay(''); // Clear displayed original excel name
      toast({ title: "¡Éxito!", description: `Google Sheet "${result.spreadsheetName}" creado y vinculado.` });
      if (result.warning) {
        toast({ title: "Advertencia", description: result.warning, variant: "default", duration: 7000 });
      }

    } catch (error: any) {
      console.error("Error processing Excel to Sheet:", error);
      toast({ title: "Error al Procesar Excel", description: error.message || "No se pudo generar el Google Sheet.", variant: "destructive" });
      // Optionally reset parts of the state if processing fails and user might want to try again
      // For now, keeps the file selected and name potentially, so user can retry or adjust.
      // dispatch({ type: 'SET_DATABASE_OPTION', payload: { ...databaseOption, file: file, name: targetSheetName } });
    } finally {
      setIsProcessingExcel(false);
    }
  }, [dispatch, toast]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && databaseOption.type === "excel") {
      setFileNameForDisplay(file.name); // Display original Excel file name
      
      // Use current dbNameValue as targetSheetName, or default to file.name if empty
      const targetSheetNameForAPI = dbNameValue.trim() || file.name;
      if (!dbNameValue.trim()) {
        setDbNameValue(file.name); // Pre-fill the input if it was empty
      }

      // Update global state with the file object for now, processing will clear it
      dispatch({
        type: 'SET_DATABASE_OPTION',
        payload: {
          ...databaseOption,
          name: targetSheetNameForAPI, // This will be the name for the new GSheet
          file: file, // Keep file temporarily until processed
          accessUrl: '', // Will be filled by API
        }
      });
      
      // Automatically start processing
      processUploadedExcel(file, targetSheetNameForAPI);
    }
  };


  const selectedDbConfig = availableOptions.find(opt => opt.id === databaseOption.type);

  return (
    <Card className="w-full shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle>Configura tu Base de Datos</CardTitle>
        <CardDescription>
          {selectedPurposes.has("import_spreadsheet") && "Elige cómo importar datos desde una hoja de cálculo. Las Hojas de Google creadas desde Excel serán públicas y editables por cualquiera con el enlace."}
          {selectedPurposes.has("create_smart_db") && "Proporciona un nombre para tu nueva Base de Datos Inteligente."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {availableOptions.length > 0 ? (
          <RadioGroup
            value={databaseOption.type || ""}
            onValueChange={handleOptionChange}
            className="space-y-3"
            aria-label="Opciones de Base de Datos"
          >
            {availableOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Label
                  key={option.id}
                  htmlFor={`db-option-${option.id}`}
                  className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary has-[input:checked]:ring-1 has-[input:checked]:ring-primary"
                >
                  <RadioGroupItem value={option.id} id={`db-option-${option.id}`} />
                  <Icon className="h-5 w-5 text-primary" />
                  <span>{option.name}</span>
                </Label>
              );
            })}
          </RadioGroup>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            <p>No hay opciones de base de datos disponibles para el propósito seleccionado en el paso anterior.</p>
            <p>Por favor, vuelve al Paso 1 y selecciona un propósito que requiera una base de datos.</p>
          </div>
        )}

        {selectedDbConfig && (selectedDbConfig.inputNameLabel || selectedDbConfig.requiresAccessUrlInput || selectedDbConfig.requiresFileUpload) && (
          <div className="space-y-4 pt-4 border-t mt-4">

            {selectedDbConfig.inputNameLabel && (
              <div className="space-y-2">
                <Label htmlFor="dbNameInput" className="text-base">
                  {selectedDbConfig.inputNameLabel}
                </Label>
                <Input
                  id="dbNameInput"
                  type="text"
                  placeholder={selectedDbConfig.inputNamePlaceholder}
                  value={dbNameValue}
                  onChange={handleDbNameChange}
                  className="text-base"
                  aria-required={!!selectedDbConfig.inputNameLabel}
                  disabled={isProcessingExcel && databaseOption.type === 'excel'}
                />
              </div>
            )}

            {selectedDbConfig.requiresFileUpload && databaseOption.type === "excel" && (
              <div className="space-y-2">
                <Label htmlFor="fileUpload" className="text-base">
                  Archivo Excel (.xlsx, .xls, .csv)
                </Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" asChild size="sm" disabled={isProcessingExcel}>
                    <Label htmlFor="fileUpload" className="cursor-pointer">
                      <FaUpload className="mr-2 h-4 w-4" /> Elegir Archivo
                    </Label>
                  </Button>
                  <Input id="fileUpload" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" aria-describedby="fileNameDisplay" disabled={isProcessingExcel || !dbNameValue.trim()}/>
                  {fileNameForDisplay && !isProcessingExcel && <span id="fileNameDisplay" className="text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]">{fileNameForDisplay}</span>}
                  {isProcessingExcel && <FaSpinner className="animate-spin h-5 w-5 text-primary" />}
                </div>
                 {!dbNameValue.trim() && databaseOption.type === "excel" && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                        <FaExclamationTriangle/> Por favor, primero asigna un nombre al nuevo Google Sheet.
                    </p>
                )}
                {isProcessingExcel && <p className="text-xs text-muted-foreground">Procesando archivo y creando Google Sheet...</p>}
              </div>
            )}
            
            {selectedDbConfig.requiresAccessUrlInput && (
              <div className="space-y-2">
                <Label htmlFor="accessUrlInput" className="text-base">
                  {selectedDbConfig.accessUrlLabel || "URL de Acceso"}
                </Label>
                <Input
                  id="accessUrlInput"
                  type="url"
                  placeholder={selectedDbConfig.accessUrlPlaceholder}
                  value={accessUrlValue}
                  onChange={handleAccessUrlChange}
                  className="text-base"
                  aria-required={selectedDbConfig.requiresAccessUrlInput}
                  readOnly={databaseOption.type === 'excel' && !!accessUrlValue} // Make read-only if excel generated it
                />
                {selectedDbConfig.description && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
                    <FaExclamationTriangle className="h-3 w-3 mt-0.5 shrink-0 text-orange-500" />
                    {selectedDbConfig.description}
                  </p>
                )}
              </div>
            )}
            
            {/* Removed manual "Procesar Excel" button */}

          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Step2DatabaseConfig;

