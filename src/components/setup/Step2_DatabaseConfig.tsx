
"use client";
import React, { useState, useEffect } from 'react';
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
  description?: string; // Optional description for the option
  requiresNameInput?: boolean;
  nameInputPlaceholder?: string;
  requiresAccessUrlInput?: boolean;
  accessUrlInputPlaceholder?: string;
  requiresFileUpload?: boolean;
  allowExcelToSheetConversion?: boolean;
}

const allDatabaseOptionsConfig: DatabaseOptionConfig[] = [
  {
    id: "google_sheets" as DatabaseSource,
    name: "Vincular Hoja de Google existente",
    icon: FaGoogle,
    requiresNameInput: true,
    nameInputPlaceholder: "Nombre descriptivo para esta Hoja",
    requiresAccessUrlInput: true,
    accessUrlInputPlaceholder: "URL de la Hoja de Google",
    description: "Asegúrate de que esta Hoja de Google sea pública y editable por cualquiera con el enlace para que tu asistente pueda acceder y (si es necesario) modificar los datos."
  },
  {
    id: "excel" as DatabaseSource,
    name: "Importar desde Excel",
    icon: FaFileExcel,
    requiresFileUpload: true,
    allowExcelToSheetConversion: true,
    nameInputPlaceholder: "Nombre del archivo Excel (autocompletado)",
    // Description for Excel can be part of the "Procesar Excel" button's help text.
  },
  {
    id: "smart_db" as DatabaseSource,
    name: "Crear Base de Datos Inteligente",
    icon: FaBrain,
    requiresNameInput: true,
    nameInputPlaceholder: "Nombre para tu Base de Datos Inteligente",
  },
];

const Step2DatabaseConfig = () => {
  const { state, dispatch } = useApp();
  const { databaseOption, selectedPurposes } = state.wizard;
  const { toast } = useToast();

  const [dbNameValue, setDbNameValue] = useState('');
  const [accessUrlValue, setAccessUrlValue] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

    // Reset databaseOption.type if it's no longer valid for the current purposes
    if (databaseOption.type && !currentAvailableOptions.some(opt => opt.id === databaseOption.type)) {
      dispatch({
        type: 'SET_DATABASE_OPTION',
        payload: { type: null, name: '', accessUrl: '', file: null }
      });
    }

  }, [selectedPurposes, dispatch, databaseOption.type]);


  useEffect(() => {
    // Sync local state with global wizard state when type changes or on initial load
    setDbNameValue(databaseOption.name || '');
    setAccessUrlValue(databaseOption.accessUrl || '');
    setFileName(databaseOption.file?.name || ''); 
    setSelectedFile(databaseOption.file || null);
  }, [databaseOption.type, databaseOption.name, databaseOption.accessUrl, databaseOption.file]);


  const handleOptionChange = (value: string) => {
    const selectedConfig = availableOptions.find(opt => opt.id === value);
    if (selectedConfig) {
      dispatch({
        type: 'SET_DATABASE_OPTION',
        payload: { 
          type: value as DatabaseSource, 
          name: value === 'excel' && selectedFile ? selectedFile.name : '', // Pre-fill name for excel if file already selected
          accessUrl: '', 
          file: value === 'excel' ? selectedFile : null // Keep file if switching to excel and file was already selected
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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && databaseOption.type === "excel") {
      setFileName(file.name);
      setSelectedFile(file);
      // Update global state: set file and use file.name as default db name for Excel type
      dispatch({ 
        type: 'SET_DATABASE_OPTION', 
        payload: { 
          type: "excel", 
          name: databaseOption.name || file.name, // Preserve user's custom name if they typed one, else use file name
          file: file, 
          accessUrl: databaseOption.accessUrl // Preserve existing accessUrl if any
        } 
      });
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleProcessExcelToSheet = async () => {
    if (!selectedFile || databaseOption.type !== 'excel') {
      toast({ title: "Error", description: "Por favor, selecciona un archivo Excel primero.", variant: "destructive" });
      return;
    }
    if (!auth.currentUser) {
      toast({ title: "Error de Autenticación", description: "Debes estar autenticado para realizar esta acción. Por favor, completa el paso de autenticación.", variant: "destructive" });
      return;
    }

    setIsProcessingExcel(true);
    toast({ title: "Procesando Excel...", description: "Creando Google Sheet. Esto puede tardar un momento." });

    try {
      const fileData = await fileToBase64(selectedFile);
      const token = await auth.currentUser.getIdToken();

      const response = await fetch('/api/sheets-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          fileData, 
          fileName: selectedFile.name,
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
          file: null, 
        }
      });
      // No need to set local state here, useEffect will sync from global state
      toast({ title: "¡Éxito!", description: `Google Sheet '${result.spreadsheetName}' creado y vinculado.` });
      if (result.warning) {
        toast({ title: "Advertencia", description: result.warning, variant: "default", duration: 7000 });
      }

    } catch (error: any) {
      console.error("Error processing Excel to Sheet:", error);
      toast({ title: "Error al Procesar Excel", description: error.message || "No se pudo generar el Google Sheet.", variant: "destructive" });
    } finally {
      setIsProcessingExcel(false);
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

        {selectedDbConfig && (selectedDbConfig.requiresNameInput || selectedDbConfig.requiresAccessUrlInput || selectedDbConfig.requiresFileUpload) && (
          <div className="space-y-4 pt-4 border-t mt-4">
            {selectedDbConfig.requiresFileUpload && databaseOption.type === "excel" && (
              <div className="space-y-2">
                <Label htmlFor="fileUpload" className="text-base">
                  Archivo Excel (.xlsx, .xls, .csv)
                </Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" asChild size="sm">
                    <Label htmlFor="fileUpload" className="cursor-pointer">
                      <FaUpload className="mr-2 h-4 w-4" /> Elegir Archivo
                    </Label>
                  </Button>
                  <Input id="fileUpload" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" aria-describedby="fileNameDisplay"/>
                  {fileName && <span id="fileNameDisplay" className="text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]">{fileName}</span>}
                </div>
                {selectedFile && (
                    <div className="space-y-1 mt-2">
                        <Label htmlFor="excelNameInput" className="text-xs">Nombre Descriptivo (se usará como nombre del Google Sheet generado)</Label>
                        <Input
                            id="excelNameInput"
                            type="text"
                            placeholder="Ej: Reporte de Ventas Q4"
                            value={dbNameValue} 
                            onChange={handleDbNameChange}
                            className="text-sm"
                        />
                    </div>
                )}
              </div>
            )}

            {selectedDbConfig.requiresNameInput && databaseOption.type !== "excel" && ( 
              <div className="space-y-2">
                <Label htmlFor="dbNameInput" className="text-base">
                  {selectedDbConfig.nameInputPlaceholder || "Nombre Descriptivo"}
                </Label>
                <Input
                  id="dbNameInput"
                  type="text"
                  placeholder={selectedDbConfig.nameInputPlaceholder}
                  value={dbNameValue}
                  onChange={handleDbNameChange}
                  className="text-base"
                  aria-required={selectedDbConfig.requiresNameInput}
                />
              </div>
            )}
            
            {selectedDbConfig.requiresAccessUrlInput && (
              <div className="space-y-2">
                <Label htmlFor="accessUrlInput" className="text-base">
                  {selectedDbConfig.accessUrlInputPlaceholder || "URL de Acceso"}
                </Label>
                <Input
                  id="accessUrlInput"
                  type="url"
                  placeholder={selectedDbConfig.accessUrlInputPlaceholder}
                  value={accessUrlValue}
                  onChange={handleAccessUrlChange}
                  className="text-base"
                  aria-required={selectedDbConfig.requiresAccessUrlInput}
                  disabled={databaseOption.type === 'excel' && isProcessingExcel} // Disable if processing excel
                />
                {selectedDbConfig.description && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
                    <FaExclamationTriangle className="h-3 w-3 mt-0.5 shrink-0 text-orange-500" />
                    {selectedDbConfig.description}
                  </p>
                )}
              </div>
            )}

            {selectedDbConfig.allowExcelToSheetConversion && selectedFile && databaseOption.type === "excel" && (
              <div className="pt-3">
                <Button 
                  onClick={handleProcessExcelToSheet} 
                  disabled={isProcessingExcel || !selectedFile || !dbNameValue.trim()}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                  title={!dbNameValue.trim() ? "Por favor, proporciona un nombre descriptivo para el Google Sheet que se generará." : "Procesar Excel"}
                >
                  {isProcessingExcel ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaGoogle className="mr-2" />
                  )}
                  {isProcessingExcel ? "Procesando..." : "Procesar Excel y generar Google Sheet"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Esto creará un Google Sheet público y editable con los datos de tu Excel usando el "Nombre Descriptivo" proporcionado.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Step2DatabaseConfig;

