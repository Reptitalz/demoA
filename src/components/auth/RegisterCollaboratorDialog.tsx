
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { FaSpinner } from 'react-icons/fa';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { signIn } from 'next-auth/react';
import { useApp } from '@/providers/AppProvider';
import type { AssistantConfig, UserProfile } from '@/types';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';

interface RegisterCollaboratorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RegisterCollaboratorDialog = ({ isOpen, onOpenChange }: RegisterCollaboratorDialogProps) => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName) {
      toast({ title: "Campos incompletos", description: "Por favor, completa todos los campos.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    
    try {
      const { assistantType } = state.wizard;
      // 1. Create Firebase user
      const auth = getAuth(firebaseApp);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("No se pudo crear el usuario en Firebase.");
      }

      // 2. Create User Profile via API with a pre-configured assistant
       const newAssistant: AssistantConfig = {
          id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: "Mi Primer Asistente",
          type: assistantType || 'desktop',
          prompt: "Eres un asistente amigable y servicial. Tu objetivo es responder preguntas de manera clara y concisa.",
          purposes: [],
          isActive: true,
          numberReady: true,
          messageCount: 0,
          monthlyMessageLimit: 1000,
          imageUrl: DEFAULT_ASSISTANT_IMAGE_URL
      };

      const profileData: Omit<UserProfile, '_id' | 'isAuthenticated'> = {
        firebaseUid: firebaseUser.uid,
        email,
        firstName,
        lastName,
        authProvider: 'email',
        assistants: [newAssistant],
        databases: [],
        credits: 1, // Start with 1 free credit
      };
      
      const response = await fetch('/api/create-user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "No se pudo crear el perfil de colaborador.");
      }
      
      // 3. Sign in the new user with NextAuth
      await signIn('credentials', {
        redirect: false,
        email,
        password,
        userType: 'user'
      });
      
      toast({
        title: "¡Registro Exitoso!",
        description: `Bienvenido/a, ${firstName}. Serás redirigido a tu panel.`,
      });
      
      onOpenChange(false);
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Collaborator registration error:", error);
      let errorMessage = "Ocurrió un error inesperado durante el registro.";
      if (error.code === 'auth/email-already-in-use') {
          errorMessage = "Este correo electrónico ya está registrado. Por favor, inicia sesión.";
      } else if (error.message) {
          errorMessage = error.message;
      }
      toast({ title: "Error de Registro", description: errorMessage, variant: "destructive" });
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstNameRegCollab">Nombre</Label>
              <Input id="firstNameRegCollab" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Tu nombre" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastNameRegCollab">Apellido</Label>
              <Input id="lastNameRegCollab" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Tu apellido" required />
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
