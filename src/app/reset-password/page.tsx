
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Eye, EyeOff, FaSpinner } from 'lucide-react';
import Link from 'next/link';

const APP_NAME = "Hey Manito";

const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const recoveryToken = searchParams.get('token');
    if (!recoveryToken) {
      toast({
        title: "Enlace Inválido",
        description: "No se encontró un token de recuperación. Por favor, solicita un nuevo enlace.",
        variant: "destructive",
      });
      router.replace('/login');
    } else {
      setToken(recoveryToken);
    }
  }, [searchParams, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({ title: "Contraseña Débil", description: "La contraseña debe tener al menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    if (!token) {
        toast({ title: "Error", description: "Token de recuperación no encontrado.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al restablecer la contraseña.');
      }
      
      toast({
        title: "¡Éxito!",
        description: "Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión.",
      });
      router.replace('/login');

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!token) {
    // Show a loading or placeholder state while token is being validated from URL
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <FaSpinner className="animate-spin text-primary h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md animate-fadeIn shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-brand-gradient">{APP_NAME}</CardTitle>
          <CardDescription>Restablecer tu contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="flex items-center gap-2">
                <Key className="h-4 w-4" /> Nueva Contraseña
              </Label>
               <div className="relative">
                <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Introduce tu nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isProcessing}
                    required
                />
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                 >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                 </Button>
               </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="flex items-center gap-2">
                <Key className="h-4 w-4" /> Confirmar Contraseña
              </Label>
               <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirma tu nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isProcessing}
                    required
                />
            </div>
            <Button type="submit" className="w-full bg-brand-gradient text-primary-foreground" disabled={isProcessing}>
              {isProcessing && <FaSpinner className="animate-spin mr-2" />}
              Restablecer Contraseña
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="underline text-muted-foreground hover:text-primary">
              Volver a iniciar sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ResetPasswordPage = () => (
    <Suspense fallback={<div>Cargando...</div>}>
        <ResetPasswordContent />
    </Suspense>
);


export default ResetPasswordPage;
