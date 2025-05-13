
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import AssistantCard from '@/components/dashboard/AssistantCard';
import DatabaseInfoCard from '@/components/dashboard/DatabaseInfoCard';
import { Button } from '@/components/ui/button';
import { FaPlusCircle, FaSitemap, FaCog, FaDatabase, FaRobot, FaSignOutAlt } from 'react-icons/fa';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import { subscriptionPlansConfig } from '@/config/appConfig';
import { Card, CardContent } from '@/components/ui/card';
import { auth, signOut } from '@/lib/firebase';

const DashboardPage = () => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, isSetupComplete, isLoading } = state;

  useEffect(() => {
    if (!isLoading && !userProfile.isAuthenticated) {
      // User is not authenticated.
      // If setup was already complete, send them to step 3 (Auth) of setup.
      // Otherwise (setup not complete), send them to setup (will start at step 1).
      if (isSetupComplete) { 
         dispatch({ type: 'SET_WIZARD_STEP', payload: 3 });
      }
      router.replace('/setup');
    }
  }, [isLoading, userProfile.isAuthenticated, isSetupComplete, router, dispatch]);


  const handleReconfigureAssistant = (assistantId: string) => {
    const assistant = userProfile.assistants.find(a => a.id === assistantId);
    if (assistant) {
        dispatch({ type: 'RESET_WIZARD' }); 
        dispatch({ type: 'UPDATE_ASSISTANT_NAME', payload: assistant.name });
        
        const purposesArray = Array.isArray(assistant.purposes) 
          ? assistant.purposes 
          : (assistant.purposes instanceof Set ? Array.from(assistant.purposes) : []);

        purposesArray.forEach(purpose => {
            dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: purpose });
        });

        if(assistant.databaseId) {
            const db = userProfile.databases.find(d => d.id === assistant.databaseId);
            if (db) {
                let filePayload: File | undefined = undefined;
                dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: db.source, name: db.name, file: filePayload }});
            }
        }
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch({ type: 'LOGOUT_USER' });
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/'); 
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={36} />
      </PageContainer>
    );
  }

  if (!userProfile.isAuthenticated) { 
    return (
      <PageContainer className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-150px)]">
        <p className="text-base mb-3">Redirigiendo...</p>
        <LoadingSpinner size={28} />
      </PageContainer>
    );
  }
  
  return (
    <PageContainer className="space-y-6">
      <div className="animate-fadeIn">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">¡Bienvenido/a, {userProfile.email || "Usuario/a"}!</h2>
          {userProfile.isAuthenticated && (
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs">
              <FaSignOutAlt size={14} className="mr-1.5" />
              Cerrar Sesión
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Aquí tienes un resumen de tu Gestor AssistAI.</p>
      </div>
      
      <DashboardSummary />

      <div className="space-y-5">
        <div className="flex justify-between items-center animate-fadeIn" style={{animationDelay: "0.3s"}}>
          <h3 className="text-xl font-semibold flex items-center gap-1.5">
            <FaSitemap size={20} className="text-primary" /> Tus Asistentes
          </h3>
          <Button onClick={handleAddNewAssistant} size="sm" className="transition-transform transform hover:scale-105 text-xs">
            <FaPlusCircle size={15} className="mr-1.5" /> Añadir Nuevo
          </Button>
        </div>
        {userProfile.assistants.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-1"> 
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
          <Card className="text-center py-8 animate-fadeIn" style={{animationDelay: "0.4s"}}>
            <CardContent className="flex flex-col items-center gap-3">
              <FaRobot size={40} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Aún no has configurado ningún asistente.</p>
              <Button onClick={handleAddNewAssistant} size="sm" className="text-xs">Crea tu Primer Asistente</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-5">
         <h3 className="text-xl font-semibold flex items-center gap-1.5 animate-fadeIn" style={{animationDelay: `${0.5 + userProfile.assistants.length * 0.1}s`}}>
            <FaDatabase size={20} className="text-primary" /> Bases de Datos Vinculadas
          </h3>
        {userProfile.databases.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-1"> 
            {userProfile.databases.map((db, index) => (
              <DatabaseInfoCard key={db.id} database={db} animationDelay={`${0.6 + (userProfile.assistants.length + index) * 0.1}s`} />
            ))}
          </div>
        ) : (
           <Card className="text-center py-8 animate-fadeIn" style={{animationDelay: `${0.6 + userProfile.assistants.length * 0.1}s`}}>
            <CardContent className="flex flex-col items-center gap-3">
              <FaDatabase size={40} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">No hay bases de datos vinculadas o creadas aún.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default DashboardPage;
