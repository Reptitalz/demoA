
"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from "@/providers/AppProvider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaGoogle, FaBrain, FaExclamationTriangle } from "react-icons/fa";
import type { DatabaseSource } from "@/types";

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
    id: "smart_db" as DatabaseSource,
    name: "Crear Base de Datos Inteligente",
    icon: FaBrain,
    inputNameLabel: "Nombre para la Base de Datos Inteligente",
    inputNamePlaceholder: "Ej: Conocimiento de Productos",
    requiresAccessUrlInput: false,
    description: "La IA gestionará esta base de datos. Puedes darle un nombre descriptivo."
  }
];

const Step2DatabaseConfig = () => {
  const { state, dispatch } = useApp();
  const { databaseOption, selectedPurposes } = state.wizard;

  const [dbNameValue, setDbNameValue] = useState('');
  const [accessUrlValue, setAccessUrlValue] = useState('');
  const [availableOptions, setAvailableOptions] = useState<DatabaseOptionConfig[]>([]);

  useEffect(() => {
    let currentAvailableOptions: DatabaseOptionConfig[] = [];
    if (selectedPurposes.has("import_spreadsheet")) {
      currentAvailableOptions = allDatabaseOptionsConfig.filter(opt => opt.id === "google_sheets");
    } else if (selectedPurposes.has("create_smart_db")) {
      currentAvailableOptions = allDatabaseOptionsConfig.filter(opt => opt.id === "smart_db");
    }
    setAvailableOptions(currentAvailableOptions);

    // Auto-select the first available option if not already selected or if current selection is invalid
    if (currentAvailableOptions.length > 0) {
      const currentSelectionIsValid = databaseOption.type && currentAvailableOptions.some(opt => opt.id === databaseOption.type);
      if (!currentSelectionIsValid) {
        dispatch({
          type: 'SET_DATABASE_OPTION',
          payload: { type: currentAvailableOptions[0].id, name: '', accessUrl: '' }
        });
      }
    } else if (databaseOption.type) { // If no options available but a type was selected, reset it
        dispatch({
          type: 'SET_DATABASE_OPTION',
          payload: { type: null, name: '', accessUrl: '' }
        });
    }
  }, [selectedPurposes, dispatch, databaseOption.type]);


  useEffect(() => {
    setDbNameValue(databaseOption.name || '');
    setAccessUrlValue(databaseOption.accessUrl || '');
  }, [databaseOption.type, databaseOption.name, databaseOption.accessUrl]);


  const handleOptionChange = (value: string) => {
    const valueAsDbSource = value as DatabaseSource;
    dispatch({
      type: 'SET_DATABASE_OPTION',
      payload: {
        type: valueAsDbSource,
        name: '', 
        accessUrl: valueAsDbSource === 'google_sheets' ? '' : undefined, // Clear accessUrl if not GSheet
      }
    });
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

  const selectedDbConfig = availableOptions.find(opt => opt.id === databaseOption.type);

  return (
    <Card className="w-full shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle>Configura tu Base de Datos</CardTitle>
        <CardDescription>
          {selectedPurposes.has("import_spreadsheet") || selectedPurposes.has("create_smart_db") 
            ? "Elige una opción y completa los detalles para la base de datos de tu asistente."
            : "Selecciona un propósito en el Paso 1 que requiera una base de datos (Vincular Hoja de Google o Crear Base de Datos Inteligente) para ver las opciones."
          }
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
            <p>No hay opciones de base de datos disponibles para los propósitos seleccionados.</p>
            <p>Por favor, vuelve al Paso 1 y selecciona "Vincular Hoja de Google Existente" o "Crear Base de Datos Inteligente".</p>
          </div>
        )}

        {selectedDbConfig && (selectedDbConfig.inputNameLabel || selectedDbConfig.requiresAccessUrlInput) && (
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
                />
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
                />
              </div>
            )}
            {selectedDbConfig.description && (
              <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
                 {selectedDbConfig.id === 'google_sheets' ? <FaExclamationTriangle className="h-3 w-3 mt-0.5 shrink-0 text-orange-500" /> : <FaBrain className="h-3 w-3 mt-0.5 shrink-0 text-orange-500" />}
                {selectedDbConfig.description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Step2DatabaseConfig;
