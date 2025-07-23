"use client";

import { useApp } from "@/providers/AppProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from 'next/link';

const Step5TermsAndConditions = () => {
  const { state, dispatch } = useApp();
  const { acceptedTerms } = state.wizard;

  const handleTermsToggle = (checked: boolean | 'indeterminate') => {
    dispatch({ type: 'SET_TERMS_ACCEPTED', payload: !!checked });
  };

  return (
    <Card className="w-full shadow-none border-none animate-fadeIn">
      <CardHeader className="p-0 mb-6">
        <CardTitle>Términos y Condiciones</CardTitle>
        <CardDescription>
          Por favor, lee y acepta nuestros términos y condiciones para finalizar.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex items-start space-x-3 rounded-md border p-4">
          <Checkbox 
            id="terms" 
            checked={acceptedTerms}
            onCheckedChange={handleTermsToggle}
            aria-labelledby="terms-label"
            className="mt-1"
          />
          <div className="grid gap-1.5 leading-none">
            <Label 
              htmlFor="terms"
              id="terms-label"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              He leído y acepto los{" "}
              <Link
                href="/terms"
                target="_blank"
                className="underline underline-offset-4 hover:text-primary"
              >
                Términos y Condiciones
              </Link>{" "}
              y la{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="underline underline-offset-4 hover:text-primary"
              >
                Política de Privacidad
              </Link>.
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Step5TermsAndConditions;
