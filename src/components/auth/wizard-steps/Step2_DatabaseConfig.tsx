
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from "@/providers/AppProvider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FaGoogle, FaBrain, FaExclamationTriangle, FaCheckCircle, FaRegCircle, FaDatabase } from "react-icons/fa";
import type { DatabaseSource } from "@/types";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DatabaseOptionConfig {
  id: DatabaseSource;
  name: string;
  icon: React.ElementType;
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
    requiresAccessUrlInput: true,
    accessUrlLabel: "URL de la Hoja de Google",
    accessUrlPlaceholder: "https://docs.google.com/spreadsheets/d/...",
    description: "Importante: Debes compartir esta Hoja de Google con `excel-sheets-writer@reptitalz-413408.iam.gserviceaccount.com` con permisos de 'Editor' para que tu asistente pueda acceder a los datos."
  },
  {
    id: "smart_db" as DatabaseSource,
    name: "Crear Base de Datos Inteligente",
    icon: FaBrain,
    requiresAccessUrlInput: false,
    description: "La IA gestionará esta base de datos. Solo necesitas darle un nombre descriptivo."
  }
];

const Step2DatabaseConfig = () => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { databaseOption, selectedPurposes } = state.wizard;
  
  const [accessUrlValue, setAccessUrlValue] = useState(databaseOption.accessUrl || '');
  const [isLoadingSheetNames, setIsLoadingSheetNames] = useState(false);
  const [availableDbOptions, setAvailableDbOptions] = useState<DatabaseOptionConfig[]>([]);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedPurposes.has("import_spreadsheet")) {
      setAvailableDbOptions(allDatabaseOptionsConfig.filter(opt => opt.id === "google_sheets"));
    } else if (selectedPurposes.has("create_smart_db")) {
      setAvailableDbOptions(allDatabaseOptionsConfig.filter(opt => opt.id === "smart_db"));
    } else {
      setAvailableDbOptions(allDatabaseOptionsConfig);
    }
  }, [selectedPurposes]);
  
  useEffect(() => {
    if (databaseOption.accessUrl !== accessUrlValue) {
      setAccessUrlValue(databaseOption.accessUrl || '');
    }
  }, [databaseOption.accessUrl]);

  const handleFetchSheetNames = useCallback(async (url: string) => {
    if (!url.startsWith('https://docs.google.com/spreadsheets/d/')) {
      return;
    }
    setIsLoadingSheetNames(true);
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { sheetNames: [] } });

    try {
      const res = await fetch('/api/sheets/get-sheet-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: url }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al cargar las hojas');
      }
      const data = await res.json();
      dispatch({ type: 'SET_DATABASE_OPTION', payload: { sheetNames: data.sheetNames } });
      if (data.sheetNames && data.sheetNames.length > 0) {
        dispatch({ type: 'SET_DATABASE_OPTION', payload: { selectedSheetName: data.sheetNames[0], name: data.sheetNames[0] } });
      }
      toast({ title: 'Hojas Cargadas', description: 'Se encontraron las hojas de tu documento.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive', copyable: true });
      dispatch({ type: 'SET_DATABASE_OPTION', payload: { sheetNames: [] } });
    } finally {
      setIsLoadingSheetNames(false);
    }
  }, [dispatch, toast]);

  const handleOptionChange = (value: string) => {
    const valueAsDbSource = value as DatabaseSource;
    dispatch({
      type: 'SET_DATABASE_OPTION',
      payload: {
        type: valueAsDbSource,
        name: '',
        accessUrl: '',
        selectedColumns: [],
        relevantColumnsDescription: '',
        sheetNames: [],
        selectedSheetName: ''
      }
    });
    setAccessUrlValue('');
  };
  
  const handleAccessUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setAccessUrlValue(newUrl);
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { ...databaseOption, accessUrl: newUrl, sheetNames: [], selectedSheetName: '', name: '' } });

    if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
        handleFetchSheetNames(newUrl);
    }, 500); // Debounce time of 500ms
  };
  
  const handleSheetNameChange = (value: string) => {
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { selectedSheetName: value, name: value } });
  };

  const selectedDbConfig = allDatabaseOptionsConfig.find(opt => opt.id === databaseOption.type);

  return (
    <div className="w-full animate-fadeIn space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold">Configura tu Base de Datos</h3>
        <p className="text-sm text-muted-foreground">
          {availableDbOptions.length > 0 
            ? "Elige cómo tu asistente almacenará y accederá a la información."
            : "Vuelve al paso 1 y elige un propósito que requiera una base de datos."
          }
        </p>
      </div>

      <div className="space-y-6">
        {availableDbOptions.length > 0 ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            role="radiogroup"
            aria-label="Opciones de Base de Datos"
          >
            {availableDbOptions.map((option) => {
              const Icon = option.icon;
              const isChecked = databaseOption.type === option.id;
              
              return (
                <div
                  key={option.id}
                  onClick={() => handleOptionChange(option.id)}
                  className={cn(
                    "flex items-start space-x-4 p-4 border rounded-lg transition-all duration-200 relative hover:bg-muted/50 cursor-pointer hover:shadow-md hover:border-primary/50",
                     isChecked ? 'border-primary bg-primary/10 shadow-lg' : 'bg-card'
                  )}
                  role="radio"
                  aria-checked={isChecked}
                >
                   {isChecked 
                    ? <FaCheckCircle className="absolute top-3 right-3 h-5 w-5 text-green-500 shrink-0" />
                    : <FaRegCircle className="absolute top-3 right-3 h-5 w-5 text-muted-foreground/50 shrink-0" />
                  }
                  <Icon className="h-8 w-8 text-primary mt-1" />
                  <div className="flex-1 pr-4">
                    <Label className="font-semibold text-sm cursor-pointer">{option.name}</Label>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>Selecciona un propósito en el Paso 1 para ver las opciones aquí.</p>
          </div>
        )}

        {selectedDbConfig && (
          <div className="space-y-4 pt-4 border-t mt-4 animate-fadeIn">
            {selectedDbConfig.id === 'smart_db' && (
              <div className="space-y-2">
                <Label htmlFor="dbNameInput" className="text-base">
                  Nombre para la Base de Datos Inteligente
                </Label>
                <Input
                  id="dbNameInput"
                  type="text"
                  placeholder="Ej: Conocimiento de Productos"
                  value={databaseOption.name || ''}
                  onChange={(e) => dispatch({ type: 'SET_DATABASE_OPTION', payload: { name: e.target.value } })}
                  className="text-base py-6"
                  aria-required
                />
              </div>
            )}
            
            {selectedDbConfig.id === 'google_sheets' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessUrlInput" className="text-base">
                    {selectedDbConfig.accessUrlLabel || "URL de Acceso"}
                  </Label>
                  <div className="relative">
                      <Input
                          id="accessUrlInput"
                          type="url"
                          placeholder={selectedDbConfig.accessUrlPlaceholder}
                          value={accessUrlValue}
                          onChange={handleAccessUrlChange}
                          className="text-base py-6 pr-10" // Add padding for the spinner
                          aria-required
                          />
                      {isLoadingSheetNames && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                  </div>
                   {selectedDbConfig.description && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
                      <FaExclamationTriangle className="h-3 w-3 mt-0.5 shrink-0 text-orange-500" />
                      <span>{selectedDbConfig.description}</span>
                    </p>
                  )}
                </div>

                {Array.isArray(databaseOption.sheetNames) && databaseOption.sheetNames.length > 0 && (
                  <div className="space-y-2 animate-fadeIn">
                    <Label htmlFor="sheetNameSelect" className="text-base">
                      Selecciona la Hoja (y Nombre para la BD)
                    </Label>
                    <Select onValueChange={handleSheetNameChange} value={databaseOption.selectedSheetName}>
                      <SelectTrigger id="sheetNameSelect" className="text-base py-6">
                        <SelectValue placeholder="Elige una hoja..." />
                      </SelectTrigger>
                      <SelectContent>
                        {databaseOption.sheetNames.map((name) => (
                          <SelectItem key={name} value={name} className="text-base">
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2DatabaseConfig;


