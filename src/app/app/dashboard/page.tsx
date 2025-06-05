
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import AssistantCard from '@/components/dashboard/AssistantCard';
import DatabaseInfoCard from '@/components/dashboard/DatabaseInfoCard';
import { Button } from '@/components/ui/button';
import { FaPlusCircle, FaSitemap, FaDatabase, FaRobot, FaSignOutAlt } from 'react-icons/fa';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import { subscriptionPlansConfig, APP_NAME } from '@/config/appConfig';
import { Card, CardContent } from '@/components/ui/card';
import { auth, signOut } from '@/lib/firebase';

const DashboardPage = () => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, isSetupComplete, isLoading } = state;

  useEffect(() => {
    if (!isLoading && !userProfile.isAuthenticated) {
      if (isSetupComplete) { 
         dispatch({ type: 'SET_WIZARD_STEP', payload: 3 });
         dispatch({ type: 'SET_IS_RECONFIGURING', payload: false }); 
         dispatch({ type: 'SET_EDITING_ASSISTANT_ID', payload: null });
      }
      router.replace('/app/setup'); // Updated route
    }
  }, [isLoading, userProfile.isAuthenticated, isSetupComplete, router, dispatch]);


  const handleReconfigureAssistant = (assistantId: string) => {
    const assistant = userProfile.assistants.find(a => a.id === assistantId);
    if (assistant) {
        dispatch({ type: 'RESET_WIZARD' }); 
        dispatch({ type: 'SET_IS_RECONFIGURING', payload: true });
        dispatch({ type: 'SET_EDITING_ASSISTANT_ID', payload: assistant.id });
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
                dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: db.source, name: db.name, file: undefined }});
            }
        }
        if (userProfile.currentPlan) {
            dispatch({ type: 'SET_SUBSCRIPTION_PLAN', payload: userProfile.currentPlan });
        }
        
        dispatch({ type: 'SET_WIZARD_STEP', payload: 1 }); 
        router.push('/app/setup'); // Updated route
        toast({ title: "Reconfigurando Asistente", description: `Cargando configuración para ${assistant.name} en el asistente. Estás en el paso 1.` });
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
    router.push('/app/setup'); // Updated route
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch({ type: 'LOGOUT_USER' });
      dispatch({ type: 'SET_WIZARD_STEP', payload: 3 }); 
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/app/setup'); // Updated route: send to setup for login options
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={28} /> {/* Adjusted size */}
      </PageContainer>
    );
  }

  if (!userProfile.isAuthenticated) { 
    return (
      <PageContainer className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-150px)]">
        <p className="text-xs mb-2">Redirigiendo...</p> {/* Adjusted size and margin */}
        <LoadingSpinner size={24} /> {/* Adjusted size */}
      </PageContainer>
    );
  }
  
  return (
    <PageContainer className="space-y-5"> {/* Adjusted spacing */}
      <div className="animate-fadeIn">
        <div className="flex justify-between items-center mb-0.5"> {/* Adjusted margin */}
          <h2 className="text-xl font-bold tracking-tight text-foreground">¡Bienvenido/a, {userProfile.email || "Usuario/a"}!</h2> {/* Adjusted size */}
          {userProfile.isAuthenticated && (
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs px-2 py-1"> {/* Adjusted padding */}
              <FaSignOutAlt size={12} className="mr-1" /> {/* Adjusted size and margin */}
              Cerrar Sesión
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Aquí tienes un resumen de tu {APP_NAME}.</p>
      </div>
      
      <DashboardSummary />

      <div className="space-y-4"> {/* Adjusted spacing */}
        <div className="flex justify-between items-center animate-fadeIn" style={{animationDelay: "0.3s"}}>
          <h3 className="text-lg font-semibold flex items-center gap-1"> {/* Adjusted size and gap */}
            <FaSitemap size={18} className="text-primary" /> {/* Adjusted size */}
            Tus Asistentes
          </h3>
          <Button onClick={handleAddNewAssistant} size="sm" className="transition-transform transform hover:scale-105 text-xs px-2 py-1"> {/* Adjusted padding */}
            <FaPlusCircle size={13} className="mr-1" /> {/* Adjusted size and margin */}
            Añadir Nuevo
          </Button>
        </div>
        {userProfile.assistants.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-1"> {/* Adjusted gap */}
            {userProfile.assistants.map((assistant, index) => (
              <AssistantCard 
                key={assistant.id} 
                assistant={assistant} 
                onReconfigure={handleReconfigureAssistant}
                animationDelay={`${0.4 + index * 0.1}s`}
                accountVirtualPhoneNumber={userProfile.virtualPhoneNumber}
                accountVonageNumberStatus={userProfile.vonageNumberStatus}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-6 animate-fadeIn" style={{animationDelay: "0.4s"}}> {/* Adjusted padding */}
            <CardContent className="flex flex-col items-center gap-2.5"> {/* Adjusted gap */}
              <FaRobot size={36} className="text-muted-foreground" /> {/* Adjusted size */}
              <p className="text-xs text-muted-foreground">Aún no has configurado ningún asistente.</p>
              <Button onClick={handleAddNewAssistant} size="sm" className="text-xs px-2 py-1">Crea tu Primer Asistente</Button> {/* Adjusted padding */}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4"> {/* Adjusted spacing */}
         <h3 className="text-lg font-semibold flex items-center gap-1 animate-fadeIn" style={{animationDelay: `${0.5 + userProfile.assistants.length * 0.1}s`}}> {/* Adjusted size and gap */}
            <FaDatabase size={18} className="text-primary" /> {/* Adjusted size */}
            Bases de Datos Vinculadas
          </h3>
        {userProfile.databases.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-1">  {/* Adjusted gap */}
            {userProfile.databases.map((db, index) => (
              <DatabaseInfoCard key={db.id} database={db} animationDelay={`${0.6 + (userProfile.assistants.length + index) * 0.1}s`} />
            ))}
          </div>
        ) : (
           <Card className="text-center py-6 animate-fadeIn" style={{animationDelay: `${0.6 + userProfile.assistants.length * 0.1}s`}}> {/* Adjusted padding */}
            <CardContent className="flex flex-col items-center gap-2.5"> {/* Adjusted gap */}
              <FaDatabase size={36} className="text-muted-foreground" /> {/* Adjusted size */}
              <p className="text-xs text-muted-foreground">No hay bases de datos vinculadas o creadas aún.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default DashboardPage;
