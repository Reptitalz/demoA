
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
      // 1. Create Firebase user
      const auth = getAuth(firebaseApp);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("No se pudo crear el usuario en Firebase.");
      }

      // 2. Create User Profile via API with a pre-configured assistant based on selection
      const isDesktopAssistant = assistantType === 'desktop';
       const newAssistant: AssistantConfig = {
          id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: isDesktopAssistant ? "Mi Asistente de Escritorio" : "Mi Asistente de WhatsApp",
          type: assistantType || 'desktop',
          prompt: "Eres un asistente amigable y servicial. Tu objetivo es responder preguntas de manera clara y concisa.",
          purposes: [],
          isActive: isDesktopAssistant, // Active only if desktop
          numberReady: isDesktopAssistant, // Ready only if desktop
          messageCount: 0,
          monthlyMessageLimit: isDesktopAssistant ? 1000 : 0, // Free tier limit for desktop
          imageUrl: DEFAULT_ASSISTANT_IMAGE_URL
      };

      const profileData: Omit<UserProfile, '_id' | 'isAuthenticated'> = {
        firebaseUid: firebaseUser.uid,
        email,
        firstName: '', // User can fill this in later
        lastName: '', // User can fill this in later
        authProvider: 'email',
        assistants: [newAssistant],
        databases: [],
        credits: isDesktopAssistant ? 1 : 0, // 1 free credit for desktop users
      };
      
      const response = await fetch('/api/create-user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "No se pudo crear el perfil.");
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
        description: `Bienvenido/a. Serás redirigido a tu panel.`,
      });
      
      onOpenChange(false);
      router.push('/dashboard');

    } catch (error: any) {
      console.error("User registration error:", error);
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
