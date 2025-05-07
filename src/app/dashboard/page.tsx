
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import AssistantCard from '@/components/dashboard/AssistantCard';
import DatabaseInfoCard from '@/components/dashboard/DatabaseInfoCard';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListTree, Settings, Database as DatabaseIcon, Bot as BotIcon } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import { subscriptionPlansConfig } from '@/config/appConfig'; // Import for plan limit check
import { Card, CardContent } from '@/components/ui/card';


const DashboardPage = () => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, isSetupComplete, isLoading } = state;

  useEffect(() => {
    if (!isLoading && !isSetupComplete) {
      router.replace('/setup');
    }
  }, [isLoading, isSetupComplete, router]);

  const handleReconfigureAssistant = (assistantId: string) => {
    const assistant = userProfile.assistants.find(a => a.id === assistantId);
    if (assistant) {
        dispatch({ type: 'RESET_WIZARD' }); 
        dispatch({ type: 'UPDATE_ASSISTANT_NAME', payload: assistant.name });
        assistant.purposes.forEach(purpose => {
            dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: purpose });
        });
        if(assistant.databaseId) {
            const db = userProfile.databases.find(d => d.id === assistant.databaseId);
            if (db) {
                let filePayload: File | undefined = undefined;
                if (db.source === 'excel' && db.details && typeof db.details === 'string') {
                    // Mock file for reconfigure display. Real reconfigure would need a better way to handle files.
                    // filePayload = new File([], db.details); 
                }
                 dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: db.source, name: db.name, file: filePayload }});
            }
        }
        // For reconfigure, we might want to skip auth/plan, or pre-fill them and allow changes
        // For this mock, we will take them to step 1 of wizard.
        dispatch({type: 'SET_AUTH_METHOD', payload: userProfile.authProvider || null});
        dispatch({type: 'SET_SUBSCRIPTION_PLAN', payload: userProfile.currentPlan || null});
        dispatch({ type: 'SET_WIZARD_STEP', payload: 1 }); 
        router.push('/setup'); 
         toast({ title: "Reconfigurando Asistente", description: `Cargando configuración para ${assistant.name} en el asistente de configuración. Estás en el paso 1.` });
    } else {
        toast({ title: "Error", description: "Asistente no encontrado.", variant: "destructive"});
    }
  };

  const handleAddNewAssistant = () => {
    const plan = userProfile.currentPlan;
    const planDetails = plan ? subscriptionPlansConfig.find(p => p.id === plan) : null;

    if (planDetails && planDetails.assistantLimit !== "unlimited" && userProfile.assistants.length >= planDetails.assistantLimit) {
      toast({
        title: "Límite de Asistentes Alcanzado",
        description: `Has alcanzado el límite de ${userProfile.assistants.length} asistentes para tu plan actual (${planDetails.name}). Por favor, actualiza tu plan para añadir más asistentes.`,
        variant: "destructive",
      });
      return;
    }
    
    dispatch({ type: 'RESET_WIZARD' }); 
    router.push('/setup');
  };

  if (isLoading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={48} />
      </PageContainer>
    );
  }

  if (!isSetupComplete) {
    return (
      <PageContainer className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-150px)]">
        <p className="text-lg mb-4">Redirigiendo a la configuración...</p>
        <LoadingSpinner size={32} />
      </PageContainer>
    );
  }
  
  return (
    <PageContainer className="space-y-8">
      <div className="animate-fadeIn">
        <h2 className="text-3xl font-bold tracking-tight mb-1 text-foreground">¡Bienvenido/a, {userProfile.email || "Usuario/a"}!</h2>
        <p className="text-muted-foreground">Aquí tienes un resumen de tu Gestor AssistAI.</p>
      </div>
      
      <DashboardSummary />

      <div className="space-y-6">
        <div className="flex justify-between items-center animate-fadeIn" style={{animationDelay: "0.3s"}}>
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <ListTree className="text-primary" /> Tus Asistentes
          </h3>
          <Button onClick={handleAddNewAssistant} className="transition-transform transform hover:scale-105">
            <PlusCircle size={18} className="mr-2" /> Añadir Nuevo
          </Button>
        </div>
        {userProfile.assistants.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-1"> 
            {userProfile.assistants.map((assistant, index) => (
              <AssistantCard 
                key={assistant.id} 
                assistant={assistant} 
                onReconfigure={handleReconfigureAssistant}
                animationDelay={`${0.4 + index * 0.1}s`}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-10 animate-fadeIn" style={{animationDelay: "0.4s"}}>
            <CardContent className="flex flex-col items-center gap-4">
              <BotIcon size={48} className="text-muted-foreground" />
              <p className="text-muted-foreground">Aún no has configurado ningún asistente.</p>
              <Button onClick={handleAddNewAssistant}>Crea tu Primer Asistente</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
         <h3 className="text-2xl font-semibold flex items-center gap-2 animate-fadeIn" style={{animationDelay: `${0.5 + userProfile.assistants.length * 0.1}s`}}>
            <DatabaseIcon className="text-primary" /> Bases de Datos Vinculadas
          </h3>
        {userProfile.databases.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-1"> 
            {userProfile.databases.map((db, index) => (
              <DatabaseInfoCard key={db.id} database={db} animationDelay={`${0.6 + (userProfile.assistants.length + index) * 0.1}s`} />
            ))}
          </div>
        ) : (
           <Card className="text-center py-10 animate-fadeIn" style={{animationDelay: `${0.6 + userProfile.assistants.length * 0.1}s`}}>
            <CardContent className="flex flex-col items-center gap-4">
              <DatabaseIcon size={48} className="text-muted-foreground" />
              <p className="text-muted-foreground">No hay bases de datos vinculadas o creadas aún.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default DashboardPage;
