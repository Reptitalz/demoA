
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import AssistantCard from '@/components/dashboard/AssistantCard';
import { Button } from '@/components/ui/button';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { AssistantConfig, DatabaseConfig, UserProfile } from '@/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FaGoogle, FaSave } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';

function generateChatPath(assistantName: string): string {
  const slug = assistantName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${slug}-${randomSuffix}`;
}

const TryPage = () => {
    const { state, dispatch } = useApp();
    const { data: session, status } = useSession();
    const router = useRouter();
    const { toast } = useToast();
    const { wizard } = state;

    const [isSaving, setIsSaving] = useState(false);

    // Create a temporary assistant config from the wizard state
    const tempAssistant: AssistantConfig = useMemo(() => ({
        id: `temp_${Date.now()}`,
        name: wizard.assistantName || 'Asistente de Prueba',
        type: 'desktop', // Try page only supports desktop for now
        prompt: wizard.assistantPrompt,
        purposes: Array.from(wizard.selectedPurposes),
        databaseId: wizard.databaseOption.type ? 'temp_db' : undefined,
        imageUrl: DEFAULT_ASSISTANT_IMAGE_URL,
        isActive: true, // Active for trying
        numberReady: true,
        messageCount: 0,
        monthlyMessageLimit: 1000,
        chatPath: generateChatPath(wizard.assistantName || 'asistente-prueba'),
        isFirstDesktopAssistant: true, // Assume it's their first
        trialStartDate: new Date().toISOString(),
    }), [wizard]);

    // Redirect if wizard is empty
    useEffect(() => {
        if (!wizard.assistantPrompt) {
            router.replace('/make');
        }
    }, [wizard.assistantPrompt, router]);
    
    const handleSaveAndAuth = async () => {
      setIsSaving(true);
      if (status === 'authenticated' && session?.user) {
         // If already authenticated, just create the assistant profile
        const { email, name, id } = session.user;
        const userForProfile = { email, name, id };

        try {
            const finalProfileData: Omit<UserProfile, '_id' | 'isAuthenticated'> = {
              firebaseUid: userForProfile.id,
              email: userForProfile.email!,
              firstName: userForProfile.name?.split(' ')[0] || '',
              lastName: userForProfile.name?.split(' ').slice(1).join(' ') || '',
              authProvider: 'google',
              assistants: [tempAssistant],
              databases: tempAssistant.databaseId && wizard.databaseOption.type ? [{
                    id: tempAssistant.databaseId!,
                    name: wizard.databaseOption.name!,
                    source: wizard.databaseOption.type!,
                    accessUrl: wizard.databaseOption.accessUrl,
                }] as DatabaseConfig[] : [],
              credits: 0,
            };

            const response = await fetch('/api/create-user-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalProfileData),
            });
            const { userProfile: createdProfile, message } = await response.json();
            if (!response.ok) throw new Error(message);

            dispatch({ type: 'COMPLETE_SETUP', payload: createdProfile });
            toast({ title: "¡Asistente Guardado!", description: "Tu asistente ha sido guardado en tu cuenta." });
            router.push('/chat/dashboard');
        } catch (error: any) {
             toast({ title: 'Error', description: error.message, variant: 'destructive' });
             setIsSaving(false);
        }
      } else {
        // If not authenticated, trigger Google sign-in
        // The AppProvider will handle profile creation after redirect
        signIn('google', { callbackUrl: '/chat/dashboard' });
      }
    };


    if (!wizard.assistantPrompt) {
        return <PageContainer className="flex items-center justify-center"><LoadingSpinner /></PageContainer>;
    }

    return (
        <PageContainer fullWidth>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center px-4 animate-fadeIn">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground">
                    ¡Tu Asistente está <span className="text-brand-gradient">Casi Listo!</span>
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Pruébalo ahora mismo. Si te gusta, guárdalo en tu cuenta para no perderlo.
                </p>

                <div className="w-full max-w-md mt-10">
                    <AssistantCard assistant={tempAssistant} onReconfigure={() => router.push('/make')} />
                </div>
                
                <div className="mt-8 flex flex-col gap-4 items-center">
                    <Button 
                        size="lg" 
                        onClick={handleSaveAndAuth}
                        disabled={isSaving}
                    >
                       {isSaving ? <LoadingSpinner /> : <FaGoogle className="mr-2" />}
                       {status === 'authenticated' ? 'Guardar Asistente en Mi Cuenta' : 'Guardar y Vincular Cuenta de Google'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Se creará una cuenta gratuita para ti si no tienes una.
                    </p>
                </div>
            </div>
        </PageContainer>
    );
};

export default TryPage;
