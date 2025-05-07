
"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from "@/providers/AppProvider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, DatabaseZap, Upload } from "lucide-react";
import type { DatabaseSource } from "@/types";

const databaseOptionsConfig = [
  { id: "google_sheets", name: "Import from Google Sheets", icon: FileSpreadsheet, requiresInput: true, inputPlaceholder: "Google Sheet Link or ID" },
  { id: "excel", name: "Import from Excel", icon: FileSpreadsheet, requiresInput: false, requiresFile: true },
  { id: "smart_db", name: "Create Smart Database", icon: DatabaseZap, requiresInput: true, inputPlaceholder: "Smart Database Name" },
];

const Step2DatabaseConfig = () => {
  const { state, dispatch } = useApp();
  const { databaseOption } = state.wizard;
  const [inputValue, setInputValue] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    // Initialize inputValue if a database option is already selected (e.g., on back navigation or reconfigure)
    if (databaseOption.type && (databaseOption.type === "google_sheets" || databaseOption.type === "smart_db") && databaseOption.name) {
      setInputValue(databaseOption.name);
    } else if (databaseOption.type === "excel" && databaseOption.file) {
      setFileName(databaseOption.file.name);
    } else { // Reset if type is null or doesn't match current values
      setInputValue('');
      setFileName('');
    }
  }, [databaseOption.type, databaseOption.name, databaseOption.file]);

  const handleOptionChange = (value: string) => {
    const selectedConfig = databaseOptionsConfig.find(opt => opt.id === value);
    if (selectedConfig) {
      // Reset input value and file name when changing option type
      setInputValue(''); 
      setFileName('');
      dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: value as DatabaseSource, name: '', file: null } });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    if (databaseOption.type) {
      dispatch({ type: 'SET_DATABASE_OPTION', payload: { ...databaseOption, name: newInputValue, file: databaseOption.type === "excel" ? databaseOption.file : null } });
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && databaseOption.type === "excel") {
      setFileName(file.name);
      dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: "excel", name: file.name, file: file } });
    }
  };

  const selectedDbConfig = databaseOptionsConfig.find(opt => opt.id === databaseOption.type);

  return (
    <Card className="w-full shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle>Set Up Your Database</CardTitle>
        <CardDescription>Choose how to provide data for your assistant.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={databaseOption.type || ""}
          onValueChange={handleOptionChange}
          className="space-y-3"
          aria-label="Database Options"
        >
          {databaseOptionsConfig.map((option) => {
            const Icon = option.icon;
            return (
              <Label
                key={option.id}
                htmlFor={`db-option-${option.id}`}
                className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer has-[input:checked]:bg-accent has-[input:checked]:text-accent-foreground has-[input:checked]:border-primary"
              >
                <RadioGroupItem value={option.id} id={`db-option-${option.id}`} />
                <Icon className="h-5 w-5" />
                <span>{option.name}</span>
              </Label>
            );
          })}
        </RadioGroup>

        {selectedDbConfig && (selectedDbConfig.requiresInput || selectedDbConfig.requiresFile) && (
          <div className="space-y-2 pt-4 border-t mt-4">
            <Label htmlFor="dbDetailsInput" className="text-base">
              {selectedDbConfig.inputPlaceholder || "Details"}
            </Label>
            {selectedDbConfig.requiresFile && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" asChild>
                  <Label htmlFor="fileUpload" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Choose File
                  </Label>
                </Button>
                <Input id="fileUpload" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" aria-describedby="fileNameDisplay"/>
                {fileName && <span id="fileNameDisplay" className="text-sm text-muted-foreground truncate max-w-[150px]">{fileName}</span>}
              </div>
            )}
            {selectedDbConfig.requiresInput && (
               <Input
                id="dbDetailsInput"
                type="text"
                placeholder={selectedDbConfig.inputPlaceholder}
                value={inputValue}
                onChange={handleInputChange}
                className="text-base"
                aria-required={selectedDbConfig.requiresInput}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Step2DatabaseConfig;
