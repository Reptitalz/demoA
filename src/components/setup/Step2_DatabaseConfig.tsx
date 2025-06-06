
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
  const { databaseOption, selectedPurposes, pendingExcelProcessing } = state.wizard;
  const { toast } = useToast();

  const [dbNameValue, setDbNameValue] = useState('');
  const [accessUrlValue, setAccessUrlValue] = useState('');
  const [fileNameForDisplay, setFileNameForDisplay] = useState('');
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
      dispatch({ type: 'CLEAR_PENDING_EXCEL_PROCESSING' });
      setFileNameForDisplay('');
    }
  }, [selectedPurposes, dispatch, databaseOption.type]);

  useEffect(() => {
    setDbNameValue(databaseOption.name || '');
    setAccessUrlValue(databaseOption.accessUrl || '');

    if (pendingExcelProcessing?.file) {
      setFileNameForDisplay(pendingExcelProcessing.originalFileName);
    } else if (databaseOption.type === 'google_sheets' && databaseOption.originalFileName) {
      // If it's a GSheet that was processed from Excel, show its original name (or don't show anything here for file)
      setFileNameForDisplay(''); // Or perhaps show `Original: ${databaseOption.originalFileName}`
    } else {
      setFileNameForDisplay('');
    }
  }, [databaseOption.type, databaseOption.name, databaseOption.accessUrl, databaseOption.originalFileName, pendingExcelProcessing]);


  const handleOptionChange = (value: string) => {
    const valueAsDbSource = value as DatabaseSource;
    dispatch({
      type: 'SET_DATABASE_OPTION',
      payload: {
        type: valueAsDbSource,
        name: '', // Reset name when type changes
        accessUrl: '', // Reset URL
        // Keep file if type is still excel and a file was pending, otherwise clear.
        // This logic might be complex if switching back and forth.
        // Simpler: Reset file related things always unless specifically Excel.
        originalFileName: (valueAsDbSource === 'excel' && pendingExcelProcessing?.originalFileName) ? pendingExcelProcessing.originalFileName : '',
      }
    });
    if (valueAsDbSource !== 'excel') {
        dispatch({ type: 'CLEAR_PENDING_EXCEL_PROCESSING' });
        setFileNameForDisplay('');
    } else if (pendingExcelProcessing?.file) {
      // If switching TO Excel and a file was already pending, re-set its display name
      setFileNameForDisplay(pendingExcelProcessing.originalFileName);
      // And ensure targetSheetName in pendingExcelProcessing is synced with current dbNameValue
       dispatch({
        type: 'SET_PENDING_EXCEL_PROCESSING',
        payload: { ...pendingExcelProcessing, targetSheetName: dbNameValue || pendingExcelProcessing.originalFileName.split('.')[0] }
      });
    }
  };

  const handleDbNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setDbNameValue(newName);
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { name: newName } });

    // If type is excel and a file is pending, update the targetSheetName in pending state
    if (databaseOption.type === 'excel' && pendingExcelProcessing?.file) {
      dispatch({
        type: 'SET_PENDING_EXCEL_PROCESSING',
        payload: { ...pendingExcelProcessing, targetSheetName: newName }
      });
    }
  };

  const handleAccessUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setAccessUrlValue(newUrl);
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { accessUrl: newUrl } });
  };

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
      setFileNameForDisplay(file.name);
      dispatch({
        type: 'SET_PENDING_EXCEL_PROCESSING',
        payload: { file, targetSheetName: dbNameValue, originalFileName: file.name }
      });
      // No immediate processing here. User will proceed to next steps.
      toast({
        title: "Archivo Seleccionado",
        description: `${file.name} está listo para ser procesado al completar la configuración.`,
      });
      e.target.value = ''; // Clear input for re-selection possibility
    }
  };
  
  const selectedDbConfig = availableOptions.find(opt => opt.id === databaseOption.type);

  return (
    <Card className="w-full shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle>Configura tu Base de Datos</CardTitle>
        <CardDescription>
          {selectedPurposes.has("import_spreadsheet") && "Elige cómo importar datos. La Hoja de Google generada desde Excel será pública y editable."}
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
                  // Read-only if GSheet was generated from Excel in a previous attempt (though this flow defers processing)
                  readOnly={databaseOption.type === 'google_sheets' && !!databaseOption.originalFileName && !selectedDbConfig.requiresAccessUrlInput} 
                />
              </div>
            )}

            {selectedDbConfig.requiresFileUpload && databaseOption.type === "excel" && (
              <div className="space-y-2">
                <Label htmlFor="fileUpload" className="text-base">
                  Archivo Excel (.xlsx, .xls, .csv)
                </Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" asChild size="sm" disabled={!dbNameValue.trim()}>
                    <Label htmlFor="fileUpload" className={`cursor-pointer ${(!dbNameValue.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <FaUpload className="mr-2 h-4 w-4" /> Elegir Archivo
                    </Label>
                  </Button>
                  <Input id="fileUpload" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" aria-describedby="fileNameDisplay" disabled={!dbNameValue.trim()}/>
                  {fileNameForDisplay && databaseOption.type === 'excel' && (
                    <span id="fileNameDisplay" className="text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]">
                      {fileNameForDisplay}
                    </span>
                  )}
                </div>
                 {!dbNameValue.trim() && databaseOption.type === "excel" && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                        <FaExclamationTriangle/> Por favor, primero asigna un nombre al nuevo Google Sheet.
                    </p>
                )}
                 {pendingExcelProcessing?.file && databaseOption.type === "excel" && (
                    <p className="text-xs text-muted-foreground pt-1">
                        El archivo "{pendingExcelProcessing.originalFileName}" se procesará al completar la configuración.
                    </p>
                )}
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
                  readOnly={databaseOption.type === 'google_sheets' && !!databaseOption.originalFileName} 
                />
                {selectedDbConfig.id === 'google_sheets' && selectedDbConfig.description && !databaseOption.originalFileName && (
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

