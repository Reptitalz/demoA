
"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from "@/providers/AppProvider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaFileExcel, FaBrain, FaUpload, FaGoogle, FaSpinner } from "react-icons/fa";
import type { DatabaseSource } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase'; // Import Firebase auth

interface DatabaseOptionConfig {
  id: DatabaseSource;
  name: string;
  icon: React.ElementType;
  requiresNameInput?: boolean;
  nameInputPlaceholder?: string;
  requiresAccessUrlInput?: boolean;
  accessUrlPlaceholder?: string;
  requiresFileUpload?: boolean;
  allowExcelToSheetConversion?: boolean;
}

const databaseOptionsConfig: DatabaseOptionConfig[] = [
  {
    id: "google_sheets" as DatabaseSource,
    name: "Vincular Hoja de Google existente",
    icon: FaGoogle,
    requiresNameInput: true,
    nameInputPlaceholder: "Nombre descriptivo para esta Hoja",
    requiresAccessUrlInput: true,
    accessUrlPlaceholder: "URL de la Hoja de Google (debe ser editable por ti)",
  },
  {
    id: "excel" as DatabaseSource,
    name: "Importar desde Excel",
    icon: FaFileExcel,
    requiresFileUpload: true,
    allowExcelToSheetConversion: true, // New flag
    nameInputPlaceholder: "Nombre del archivo Excel (autocompletado)",
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
  const { databaseOption } = state.wizard;
  const { toast } = useToast();

  const [dbNameValue, setDbNameValue] = useState('');
  const [accessUrlValue, setAccessUrlValue] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);

  useEffect(() => {
    setDbNameValue(databaseOption.name || '');
    setAccessUrlValue(databaseOption.accessUrl || '');
    setFileName(databaseOption.file?.name || databaseOption.name || ''); // Use file name if present for Excel
    setSelectedFile(databaseOption.file || null);
  }, [databaseOption.type, databaseOption.name, databaseOption.accessUrl, databaseOption.file]);

  const handleOptionChange = (value: string) => {
    const selectedConfig = databaseOptionsConfig.find(opt => opt.id === value);
    if (selectedConfig) {
      dispatch({
        type: 'SET_DATABASE_OPTION',
        payload: { type: value as DatabaseSource, name: '', accessUrl: '', file: null }
      });
      // Reset local states
      setDbNameValue('');
      setAccessUrlValue('');
      setFileName('');
      setSelectedFile(null);
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
      dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: "excel", name: file.name, file: file, accessUrl: databaseOption.accessUrl } });
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]); // Get Base64 part
      reader.onerror = (error) => reject(error);
    });
  };

  const handleProcessExcelToSheet = async () => {
    if (!selectedFile || databaseOption.type !== 'excel') {
      toast({ title: "Error", description: "Por favor, selecciona un archivo Excel primero.", variant: "destructive" });
      return;
    }
    if (!auth.currentUser) {
      toast({ title: "Error de Autenticación", description: "Debes estar autenticado para realizar esta acción.", variant: "destructive" });
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
          firebaseUid: auth.currentUser.uid // Send firebaseUid for backend verification
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Error del servidor: ${response.status}`);
      }

      dispatch({
        type: 'SET_DATABASE_OPTION',
        payload: {
          type: 'google_sheets', // Source type changes to google_sheets
          name: result.spreadsheetName, // User-friendly name from API
          accessUrl: result.spreadsheetUrl, // The public URL
          file: null, // Clear the original Excel file from wizard state
        }
      });
      setDbNameValue(result.spreadsheetName); // Update local state for display
      setAccessUrlValue(result.spreadsheetUrl); // Update local state for display
      setFileName(''); // Clear old Excel file name
      setSelectedFile(null); // Clear selected file

      toast({ title: "¡Éxito!", description: `Google Sheet '${result.spreadsheetName}' creado y vinculado. URL: ${result.spreadsheetUrl}` });
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

  const selectedDbConfig = databaseOptionsConfig.find(opt => opt.id === databaseOption.type);

  return (
    <Card className="w-full shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle>Configura tu Base de Datos</CardTitle>
        <CardDescription>Elige cómo proporcionar datos para tu asistente. Los Google Sheets creados desde Excel serán públicos y editables por cualquiera con el enlace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={databaseOption.type || ""}
          onValueChange={handleOptionChange}
          className="space-y-3"
          aria-label="Opciones de Base de Datos"
        >
          {databaseOptionsConfig.map((option) => {
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

        {selectedDbConfig && (selectedDbConfig.requiresNameInput || selectedDbConfig.requiresAccessUrlInput || selectedDbConfig.requiresFileUpload) && (
          <div className="space-y-4 pt-4 border-t mt-4">
            {selectedDbConfig.requiresFileUpload && (
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
                 {/* Display Name input for Excel if file is selected, prefilled with filename */}
                {selectedFile && (
                    <div className="space-y-1 mt-2">
                        <Label htmlFor="excelNameInput" className="text-xs">Nombre Descriptivo (opcional, por defecto el nombre del archivo)</Label>
                        <Input
                            id="excelNameInput"
                            type="text"
                            placeholder="Ej: Reporte de Ventas Q4"
                            value={dbNameValue || fileName} // Use dbNameValue or fallback to fileName
                            onChange={handleDbNameChange}
                            className="text-sm"
                        />
                    </div>
                )}
              </div>
            )}

            {selectedDbConfig.requiresNameInput && !selectedDbConfig.requiresFileUpload && ( // Only show if not excel, excel name is handled above
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
                  {selectedDbConfig.accessUrlPlaceholder || "URL de Acceso"}
                </Label>
                <Input
                  id="accessUrlInput"
                  type="url"
                  placeholder={selectedDbConfig.accessUrlPlaceholder}
                  value={accessUrlValue}
                  onChange={handleAccessUrlChange}
                  className="text-base"
                  aria-required={selectedDbConfig.requiresAccessUrlInput}
                />
              </div>
            )}

            {selectedDbConfig.allowExcelToSheetConversion && selectedFile && (
              <div className="pt-3">
                <Button 
                  onClick={handleProcessExcelToSheet} 
                  disabled={isProcessingExcel || !selectedFile}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                >
                  {isProcessingExcel ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaGoogle className="mr-2" />
                  )}
                  {isProcessingExcel ? "Procesando..." : "Procesar Excel y generar Google Sheet"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Esto creará un Google Sheet público y editable con los datos de tu Excel.
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
