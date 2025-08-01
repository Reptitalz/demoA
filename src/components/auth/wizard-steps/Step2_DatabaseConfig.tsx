
"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from "@/providers/AppProvider";
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaGoogle, FaBrain, FaExclamationTriangle, FaCheckCircle, FaRegCircle } from "react-icons/fa";
import type { DatabaseSource } from "@/types";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface DatabaseOptionConfig {
  id: DatabaseSource;
  name: string;
  icon: React.ElementType;
  inputNameLabel?: string;
  inputNamePlaceholder?: string;
  requiresAccessUrlInput?: boolean;
  accessUrlLabel?: string;
  accessUrlPlaceholder?: string;
  description?: string;
}

const allDatabaseOptionsConfig: DatabaseOptionConfig[] = [
  {
    id: "google_sheets" as DatabaseSource,
    name: "Vincular Hoja de Google",
    icon: FaGoogle,
    inputNameLabel: "Nombre Descriptivo de la Hoja",
    inputNamePlaceholder: "Ej: CRM Clientes Activos",
    requiresAccessUrlInput: true,
    accessUrlLabel: "URL de la Hoja de Google",
    accessUrlPlaceholder: "https://docs.google.com/spreadsheets/d/...",
    description: "Asegúrate de que la Hoja sea pública y editable para que tu asistente pueda acceder a los datos."
  },
  {
    id: "smart_db" as DatabaseSource,
    name: "Crear Base de Datos Inteligente",
    icon: FaBrain,
    inputNameLabel: "Nombre para la Base de Datos",
    inputNamePlaceholder: "Ej: Conocimiento de Productos",
    requiresAccessUrlInput: false,
    description: "La IA gestionará esta base de datos. Solo necesitas darle un nombre descriptivo."
  }
];

const Step2DatabaseConfig = () => {
  const { state, dispatch } = useApp();
  const { databaseOption, selectedPurposes } = state.wizard;
  const { toast } = useToast();

  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [fetchedColumns, setFetchedColumns] = useState<string[]>([]);

  // Derived state from global state for local control
  const [accessUrlValue, setAccessUrlValue] = useState(databaseOption.accessUrl || '');

  useEffect(() => {
    let currentAvailableOptions: DatabaseOptionConfig[] = [];
    if (selectedPurposes.has("import_spreadsheet")) {
      currentAvailableOptions = allDatabaseOptionsConfig.filter(opt => opt.id === "google_sheets");
    } else if (selectedPurposes.has("create_smart_db")) {
      currentAvailableOptions = allDatabaseOptionsConfig.filter(opt => opt.id === "smart_db");
    }

    if (currentAvailableOptions.length > 0) {
      const currentSelectionIsValid = databaseOption.type && currentAvailableOptions.some(opt => opt.id === databaseOption.type);
      if (!currentSelectionIsValid) {
        dispatch({
          type: 'SET_DATABASE_OPTION',
          payload: { type: currentAvailableOptions[0].id, name: '', accessUrl: '', selectedColumns: [], relevantColumnsDescription: '' }
        });
      }
    }
  }, [selectedPurposes, dispatch, databaseOption.type]);


  useEffect(() => {
    // Sync local state when global state changes, but only if it's different
    if (databaseOption.accessUrl !== accessUrlValue) {
      setAccessUrlValue(databaseOption.accessUrl || '');
    }
    // Fetched columns are now driven by the global state to persist them across steps
    setFetchedColumns(databaseOption.selectedColumns || []);
  }, [databaseOption]);


  const handleOptionChange = (value: string) => {
    const valueAsDbSource = value as DatabaseSource;
    dispatch({
      type: 'SET_DATABASE_OPTION',
      payload: {
        type: valueAsDbSource,
        name: '', 
        accessUrl: valueAsDbSource === 'google_sheets' ? '' : undefined,
        selectedColumns: [],
        relevantColumnsDescription: '',
      }
    });
  };

  const handleDbNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { ...databaseOption, name: newName } });
  };

  const handleAccessUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setAccessUrlValue(newUrl); // Update local state immediately for button enable/disable
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { ...databaseOption, accessUrl: newUrl } });
  };
  
  const handleRelevantColumnsDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { ...databaseOption, relevantColumnsDescription: e.target.value } });
  }
  
  const toggleColumnSelection = (column: string) => {
    const currentSelected = databaseOption.selectedColumns || [];
    const newSelectedColumns = [...currentSelected];
    const index = newSelectedColumns.indexOf(column);
    if (index > -1) {
      newSelectedColumns.splice(index, 1);
    } else {
      newSelectedColumns.push(column);
    }
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { ...databaseOption, selectedColumns: newSelectedColumns } });
  }

  const handleFetchColumns = async () => {
    if (!accessUrlValue) {
        toast({ title: "URL Requerida", description: "Por favor, ingresa la URL de la Hoja de Google.", variant: "destructive" });
        return;
    }
    setIsLoadingColumns(true);
    try {
        const response = await fetch('/api/sheets/get-columns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sheetUrl: accessUrlValue })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Error desconocido al cargar columnas.");
        }
        // Set fetched columns to state and pre-select all columns by dispatching to global state
        dispatch({ type: 'SET_DATABASE_OPTION', payload: { ...databaseOption, selectedColumns: data.columns } });
        toast({ title: "¡Columnas Cargadas!", description: "Selecciona las columnas que tu asistente debe usar."});

    } catch (error: any) {
        toast({ title: "Error al Cargar Columnas", description: error.message, variant: "destructive" });
        dispatch({ type: 'SET_DATABASE_OPTION', payload: { ...databaseOption, selectedColumns: [] } });
    } finally {
        setIsLoadingColumns(false);
    }
  };

  const selectedDbConfig = allDatabaseOptionsConfig.find(opt => opt.id === databaseOption.type);

  return (
    <div className="w-full animate-fadeIn space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold">Configura tu Base de Datos</h3>
        <p className="text-sm text-muted-foreground">
          {allDatabaseOptionsConfig.length > 0 
            ? "Elige cómo tu asistente almacenará y accederá a la información."
            : "Vuelve al paso 1 y elige un propósito que requiera una base de datos."
          }
        </p>
      </div>

      <div className="space-y-6">
        {allDatabaseOptionsConfig.length > 0 ? (
          <RadioGroup
            value={databaseOption.type || ""}
            onValueChange={handleOptionChange}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            aria-label="Opciones de Base de Datos"
          >
            {allDatabaseOptionsConfig.map((option) => {
              const Icon = option.icon;
              const isChecked = databaseOption.type === option.id;
              const isDisabled = !selectedPurposes.has(option.id as any);

              return (
                <Label
                  key={option.id}
                  htmlFor={`db-option-${option.id}`}
                  className={cn(
                    "flex items-start space-x-4 p-4 border rounded-lg transition-all duration-200 relative",
                    isDisabled 
                      ? 'opacity-50 cursor-not-allowed bg-muted/40'
                      : "hover:bg-muted/50 cursor-pointer hover:shadow-md hover:border-primary/50",
                     isChecked ? 'border-primary bg-primary/10 shadow-lg' : 'bg-card'
                  )}
                >
                  <input type="radio" value={option.id} id={`db-option-${option.id}`} name="db-option" className="sr-only" disabled={isDisabled} />
                   {isChecked 
                    ? <FaCheckCircle className="absolute top-3 right-3 h-5 w-5 text-green-500 shrink-0" />
                    : <FaRegCircle className="absolute top-3 right-3 h-5 w-5 text-muted-foreground/50 shrink-0" />
                  }
                  <Icon className="h-8 w-8 text-primary mt-1" />
                  <div className="flex-1 pr-4">
                    <span className="font-semibold text-sm">{option.name}</span>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>Selecciona un propósito en el Paso 1 para ver las opciones aquí.</p>
          </div>
        )}

        {selectedDbConfig && (
          <div className="space-y-4 pt-4 border-t mt-4 animate-fadeIn">
            {selectedDbConfig.inputNameLabel && (
              <div className="space-y-2">
                <Label htmlFor="dbNameInput" className="text-base">
                  {selectedDbConfig.inputNameLabel}
                </Label>
                <Input
                  id="dbNameInput"
                  type="text"
                  placeholder={selectedDbConfig.inputNamePlaceholder}
                  value={databaseOption.name || ''}
                  onChange={handleDbNameChange}
                  className="text-base py-6"
                  aria-required={!!selectedDbConfig.inputNameLabel}
                />
              </div>
            )}
            {selectedDbConfig.requiresAccessUrlInput && (
              <div className="space-y-2">
                <Label htmlFor="accessUrlInput" className="text-base">
                  {selectedDbConfig.accessUrlLabel || "URL de Acceso"}
                </Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="accessUrlInput"
                        type="url"
                        placeholder={selectedDbConfig.accessUrlPlaceholder}
                        value={accessUrlValue}
                        onChange={handleAccessUrlChange}
                        className="text-base py-6"
                        aria-required={selectedDbConfig.requiresAccessUrlInput}
                        />
                    <Button onClick={handleFetchColumns} disabled={isLoadingColumns || !accessUrlValue.trim()}>
                        {isLoadingColumns && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cargar Columnas
                    </Button>
                </div>
                 {selectedDbConfig.description && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
                    <FaExclamationTriangle className="h-3 w-3 mt-0.5 shrink-0 text-orange-500" />
                    <span>{selectedDbConfig.description}</span>
                  </p>
                 )}
              </div>
            )}

            {(databaseOption.selectedColumns || []).length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-base">Columnas Disponibles</Label>
                    <p className="text-xs text-muted-foreground">Selecciona las columnas que el asistente debe considerar. Las columnas no seleccionadas serán ignoradas.</p>
                    <div className="flex flex-wrap gap-2">
                        {fetchedColumns.map(col => (
                            <Badge 
                                key={col}
                                variant={(databaseOption.selectedColumns || []).includes(col) ? 'default' : 'secondary'}
                                onClick={() => toggleColumnSelection(col)}
                                className="cursor-pointer text-sm"
                            >
                                {col}
                            </Badge>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relevantColumnsDesc" className="text-base">Define la Relevancia para tus Ventas</Label>
                     <p className="text-xs text-muted-foreground">Explícale al asistente cómo usar estas columnas para vender. Ej: "La columna 'Teléfono' es para contactar. 'Estatus' indica si el cliente está listo para comprar. 'Producto de Interés' es lo que quiere."</p>
                    <Textarea 
                        id="relevantColumnsDesc"
                        placeholder="Ej: 'Teléfono' para contactar, 'Estatus' para saber si está listo para comprar..."
                        value={databaseOption.relevantColumnsDescription || ''}
                        onChange={handleRelevantColumnsDescChange}
                    />
                  </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2DatabaseConfig;

    