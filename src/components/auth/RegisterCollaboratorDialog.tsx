
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

interface RegisterCollaboratorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RegisterCollaboratorDialog = ({ isOpen, onOpenChange }: RegisterCollaboratorDialogProps) => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      toast({ title: "Campos incompletos", description: "Por favor, completa todos los campos.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", description: "Por favor, verifica que ambas contraseñas sean iguales.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Create collaborator profile in our DB via API
      const registerResponse = await fetch('/api/create-collaborator-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.message || 'No se pudo crear el perfil de colaborador.');
      }
      
      // 2. Sign in the new collaborator with NextAuth using credentials
      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password,
        userType: 'collaborator'
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }
      
      toast({
        title: "¡Registro Exitoso!",
        description: `Bienvenido/a. Serás redirigido a tu panel de colaborador.`,
      });
      
      onOpenChange(false);
      // Redirect to the collaborator dashboard
      router.push('/colaboradores/dashboard');
      
    } catch (error: any) {
      console.error("Collaborator registration error:", error);
      toast({ title: "Error de Registro", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>Registro de Colaborador</DialogTitle>
          <DialogDescription>
            Crea tu cuenta para obtener tu enlace de referido y empezar a ganar.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstNameRegCollab">Nombre</Label>
                <Input id="firstNameRegCollab" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastNameRegCollab">Apellido</Label>
                <Input id="lastNameRegCollab" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
          </div>
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
            Crear Cuenta de Colaborador
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterCollaboratorDialog;
