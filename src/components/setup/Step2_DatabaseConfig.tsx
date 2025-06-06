
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
import { auth } from '@/lib/firebase';

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
    inputNameLabel: "Nombre Descriptivo de la Hoja",
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileNameForDisplay, setFileNameForDisplay] = useState('');
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
        payload: { type: null, name: '', accessUrl: '', file: null, originalFileName: '' }
      });
      setSelectedFile(null);
      setFileNameForDisplay('');
    }
  }, [selectedPurposes, dispatch, databaseOption.type]);

  useEffect(() => {
    setDbNameValue(databaseOption.name || '');
    setAccessUrlValue(databaseOption.accessUrl || '');
    // No resetear selectedFile o fileNameForDisplay aquí para que persistan si el usuario cambia de opción y vuelve
  }, [databaseOption.type, databaseOption.name, databaseOption.accessUrl]);


  const handleOptionChange = (value: string) => {
    const valueAsDbSource = value as DatabaseSource;
    dispatch({
      type: 'SET_DATABASE_OPTION',
      payload: {
        type: valueAsDbSource,
        name: '', // Reset name for the new type
        accessUrl: '', // Reset accessUrl for the new type
        file: databaseOption.type === valueAsDbSource ? databaseOption.file : null,
        originalFileName: databaseOption.type === valueAsDbSource ? databaseOption.originalFileName : '',
      }
    });
    if (valueAsDbSource !== 'excel') {
        setSelectedFile(null);
        setFileNameForDisplay('');
    }
  };

  const handleDbNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setDbNameValue(newName);
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { name: newName } });
  };

  const handleAccessUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setAccessUrlValue(newUrl);
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { accessUrl: newUrl } });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const processUploadedExcel = useCallback(async (fileToProcess: File, targetSheetName: string) => {
    if (!auth.currentUser) {
      toast({ title: "Error de Autenticación", description: "Debes estar autenticado para procesar archivos. Por favor, completa el paso de autenticación.", variant: "destructive" });
      setIsProcessingExcel(false);
      return;
    }

    setIsProcessingExcel(true);
    toast({ title: "Procesando Excel...", description: `Creando Google Sheet "${targetSheetName}". Esto puede tardar un momento.` });

    try {
      const fileData = await fileToBase64(fileToProcess);
      const token = await auth.currentUser.getIdToken();

      const response = await fetch('/api/sheets-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileData,
          fileName: targetSheetName,
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
          type: 'google_sheets',
          name: result.spreadsheetName,
          accessUrl: result.spreadsheetUrl,
          file: null, // Clear original file from wizard state
          originalFileName: fileToProcess.name, // Store original Excel filename
        }
      });
      setSelectedFile(null); // Clear local file state
      setFileNameForDisplay(''); // Clear displayed original excel name
      setDbNameValue(result.spreadsheetName); // Update local dbNameValue to reflect GSheet name
      setAccessUrlValue(result.spreadsheetUrl); // Update local accessUrlValue

      toast({ title: "¡Éxito!", description: `Google Sheet "${result.spreadsheetName}" creado y vinculado.` });
      if (result.warning) {
        toast({ title: "Advertencia", description: result.warning, variant: "default", duration: 7000 });
      }

    } catch (error: any) {
      console.error("Error processing Excel to Sheet:", error);
      toast({ title: "Error al Procesar Excel", description: error.message || "No se pudo generar el Google Sheet.", variant: "destructive" });
      // Keep file and name so user doesn't have to re-select/re-type if they want to retry
      // Potentially clear accessUrl if a previous attempt (manual) had one
      dispatch({ type: 'SET_DATABASE_OPTION', payload: { accessUrl: '' } });
    } finally {
      setIsProcessingExcel(false);
    }
  }, [dispatch, toast]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && databaseOption.type === "excel") {
      if (!dbNameValue.trim()) {
        toast({
          title: "Nombre Requerido",
          description: "Por favor, primero asigna un nombre para el Google Sheet que se generará.",
          variant: "destructive",
        });
        e.target.value = ''; // Clear the file input
        return;
      }
      setSelectedFile(file);
      setFileNameForDisplay(file.name);
      dispatch({
        type: 'SET_DATABASE_OPTION',
        payload: { file: file, name: dbNameValue, originalFileName: file.name } // keep target name, store original
      });
      processUploadedExcel(file, dbNameValue);
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
                  <Button variant="outline" asChild size="sm" disabled={isProcessingExcel || !dbNameValue.trim()}>
                    <Label htmlFor="fileUpload" className={`cursor-pointer ${(!dbNameValue.trim() || isProcessingExcel) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <FaUpload className="mr-2 h-4 w-4" /> Elegir Archivo
                    </Label>
                  </Button>
                  <Input id="fileUpload" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" aria-describedby="fileNameDisplay" disabled={isProcessingExcel || !dbNameValue.trim()}/>
                  {(fileNameForDisplay && !isProcessingExcel) && <span id="fileNameDisplay" className="text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]">{fileNameForDisplay}</span>}
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
                  readOnly={databaseOption.type === 'google_sheets' && !!databaseOption.originalFileName} // Read-only if GSheet was generated from Excel
                />
                {selectedDbConfig.description && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
                    <FaExclamationTriangle className="h-3 w-3 mt-0.5 shrink-0 text-orange-500" />
                    {selectedDbConfig.description}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Step2DatabaseConfig;
