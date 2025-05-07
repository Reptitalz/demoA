
"use client";

import { useApp } from "@/providers/AppProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AUTH_METHODS } from "@/config/appConfig";
import { CheckCircle2 } from 'lucide-react';

const Step3Authentication = () => {
  const { state, dispatch } = useApp();
  const { authMethod } = state.wizard;

  const handleAuthSelect = (methodId: "google" | "microsoft") => {
    dispatch({ type: 'SET_AUTH_METHOD', payload: methodId });
    // In a real app, this would trigger the OAuth flow
    // For now, we just set it in state and simulate success
    console.log(`Simulando autenticación con ${methodId}`);
  };

  return (
    <Card className="w-full shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle>Autenticación de Cuenta</CardTitle>
        <CardDescription>Inicia sesión para guardar la configuración de tu asistente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {AUTH_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = authMethod === method.id;
          return (
            <Button
              key={method.id}
              variant={isSelected ? "default" : "outline"}
              className="w-full justify-start text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105"
              onClick={() => handleAuthSelect(method.id as "google" | "microsoft")}
              aria-pressed={isSelected}
            >
              <Icon className={`mr-3 h-5 w-5 ${isSelected ? 'text-primary-foreground': 'text-primary'}`} />
              {method.name}
              {isSelected && <CheckCircle2 className="ml-auto h-5 w-5 text-primary-foreground" />}
            </Button>
          );
        })}
        {authMethod && (
          <p className="text-sm text-center text-green-500 flex items-center justify-center gap-1 pt-2">
            <CheckCircle2 size={16} /> Autenticado exitosamente con {authMethod}.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Step3Authentication;
