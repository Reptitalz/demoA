
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { FaSpinner } from 'react-icons/fa';
import { signIn } from 'next-auth/react';
import { useApp } from '@/providers/AppProvider';

interface RegisterCollaboratorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RegisterCollaboratorDialog = ({ isOpen, onOpenChange }: RegisterCollaboratorDialogProps) => {
  const { state } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      toast({ title: "Campos incompletos", description: "Por favor, completa todos los campos.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", description: "Por favor, verifica que ambas contraseñas sean iguales.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { assistantType } = state.wizard;
      
      // 1. Create user directly in our DB via API
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, assistantType }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.message || 'No se pudo crear el perfil.');
      }
      
      // 2. Sign in the new user with NextAuth using credentials
      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password,
        userType: 'user'
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }
      
      toast({
        title: "¡Registro Exitoso!",
        description: `Bienvenido/a. Serás redirigido a tu panel.`,
      });
      
      onOpenChange(false);
      router.push('/dashboard/assistants');

    } catch (error: any) {
      console.error("User registration error:", error);
      toast({ title: "Error de Registro", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>Registro con Correo</DialogTitle>
          <DialogDescription>
            Crea tu cuenta para guardar tu progreso y empezar a usar tu asistente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailRegCollab">Correo Electrónico</Label>
            <Input id="emailRegCollab" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordRegCollab">Contraseña</Label>
            <Input id="passwordRegCollab" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPasswordRegCollab">Verificar Contraseña</Label>
            <Input id="confirmPasswordRegCollab" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repite tu contraseña" required />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleRegister} disabled={isProcessing}>
            {isProcessing ? <FaSpinner className="animate-spin mr-2" /> : null}
            Crear Cuenta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterCollaboratorDialog;
