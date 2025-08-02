
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import AssistantCard from '@/components/dashboard/AssistantCard';
import { Button } from '@/components/ui/button';
import { FaPlusCircle, FaRobot } from 'react-icons/fa';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from '@/components/ui/card';
import AddDatabaseDialog from '@/components/dashboard/AddDatabaseDialog';

function AssistantsPageContent() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, isLoading } = state;

  useEffect(() => {
    if (!isLoading && !state.userProfile.isAuthenticated) {
        router.replace('/login');
    }
  }, [isLoading, state.userProfile.isAuthenticated, router]);

  const handleReconfigureAssistant = (assistantId: string) => {
    const assistant = userProfile.assistants.find(a => a.id === assistantId);
    if (assistant) {
        dispatch({ type: 'RESET_WIZARD' }); 
        dispatch({ type: 'SET_IS_RECONFIGURING', payload: true });
        dispatch({ type: 'SET_EDITING_ASSISTANT_ID', payload: assistant.id });
        dispatch({ type: 'UPDATE_ASSISTANT_NAME', payload: assistant.name });
        dispatch({ type: 'UPDATE_ASSISTANT_PROMPT', payload: assistant.prompt || '' });
        
        const purposesArray = Array.isArray(assistant.purposes) 
          ? assistant.purposes 
          : (assistant.purposes instanceof Set ? Array.from(assistant.purposes) : []);

        purposesArray.forEach(purpose => {
            dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: purpose });
        });

        if(assistant.databaseId) {
            const db = userProfile.databases.find(d => d.id === assistant.databaseId);
            if (db) {
                dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: db.source, name: db.name, accessUrl: db.accessUrl, selectedColumns: db.selectedColumns, relevantColumnsDescription: db.relevantColumnsDescription }});
            }
        }
        
        dispatch({ type: 'SET_WIZARD_STEP', payload: 1 }); 
        router.push('/app');
        toast({ title: "Reconfigurando Asistente", description: `Cargando configuración para ${assistant.name}.` });
    } else {
        toast({ title: "Error", description: "Asistente no encontrado.", variant: "destructive"});
    }
  };

  const handleAddNewAssistant = () => {
    dispatch({ type: 'RESET_WIZARD' });
    router.push('/app?action=add'); 
  };

  if (isLoading || !userProfile.isAuthenticated) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={28} /> 
      </PageContainer>
    );
  }
  
  return (
    <PageContainer className="space-y-5"> 
        <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Panel de Asistentes</h2> 
            <p className="text-sm text-muted-foreground">Gestiona todos tus asistentes de IA desde aquí.</p>
        </div>
      
        <DashboardSummary />

        <div className="space-y-4"> 
            <div className="flex justify-between items-center animate-fadeIn" style={{animationDelay: "0.3s"}}>
            <h3 className="text-lg font-semibold flex items-center gap-2"> 
                <FaRobot size={18} className="text-primary" /> 
                Tus Asistentes
            </h3>
            <Button onClick={handleAddNewAssistant} size="sm" className="transition-transform transform hover:scale-105 text-xs px-2 py-1"> 
                <FaPlusCircle size={13} className="mr-1" /> 
                Añadir Asistente
            </Button>
            </div>
            {userProfile.assistants.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"> 
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
                <CardContent className="flex flex-col items-center gap-3"> 
                <FaRobot size={40} className="text-muted-foreground" /> 
                <h3 className="text-lg font-semibold">No has creado ningún asistente</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Los asistentes son agentes de IA que puedes personalizar para realizar tareas como responder preguntas, agendar citas o gestionar datos.
                </p>
                <Button onClick={handleAddNewAssistant} size="sm" className="text-sm px-4 py-2 mt-2">Crear mi Primer Asistente</Button> 
                </CardContent>
            </Card>
            )}
        </div>
    </PageContainer>
  );
};


export default function AssistantsPage() {
    return (
        <Suspense fallback={
            <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
                <LoadingSpinner size={36} />
            </PageContainer>
        }>
            <AssistantsPageContent />
        </Suspense>
    )
}
