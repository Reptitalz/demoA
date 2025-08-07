
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from "@/providers/AppProvider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
    description: "Asegúrate de que la Hoja sea pública para que tu asistente pueda acceder a los datos."
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
  
  const [accessUrlValue, setAccessUrlValue] = useState(databaseOption.accessUrl || '');
  const [availableDbOptions, setAvailableDbOptions] = useState<DatabaseOptionConfig[]>([]);

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
  }, [databaseOption]);

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
      }
    });
  };

  const handleDbNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { ...databaseOption, name: newName } });
  };

  const handleAccessUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setAccessUrlValue(newUrl);
    dispatch({ type: 'SET_DATABASE_OPTION', payload: { ...databaseOption, accessUrl: newUrl } });
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
                    <p className="text-xs text-muted-foreground cursor-pointer">{option.description}</p>
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
                <div className="relative flex items-center">
                    <Input
                        id="accessUrlInput"
                        type="url"
                        placeholder={selectedDbConfig.accessUrlPlaceholder}
                        value={accessUrlValue}
                        onChange={handleAccessUrlChange}
                        className="text-base py-6"
                        aria-required={selectedDbConfig.requiresAccessUrlInput}
                        />
                </div>
                 {selectedDbConfig.description && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
                    <FaExclamationTriangle className="h-3 w-3 mt-0.5 shrink-0 text-orange-500" />
                    <span>{selectedDbConfig.description}</span>
                  </p>
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
