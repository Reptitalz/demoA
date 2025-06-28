
"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import AssistantCard from '@/components/dashboard/AssistantCard';
import DatabaseInfoCard from '@/components/dashboard/DatabaseInfoCard';
import { Button } from '@/components/ui/button';
import { FaPlusCircle, FaSitemap, FaDatabase, FaRobot, FaSignOutAlt } from 'react-icons/fa';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from '@/config/appConfig';
import { Card, CardContent } from '@/components/ui/card';
import { auth, signOut } from '@/lib/firebase';

// This component now holds the client-side logic for the dashboard.
const DashboardPageContent = () => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { userProfile, isSetupComplete, isLoading } = state;

  useEffect(() => {
    if (!isLoading && !userProfile.isAuthenticated) {
      if (isSetupComplete) { 
         dispatch({ type: 'SET_WIZARD_STEP', payload: 3 });
         dispatch({ type: 'SET_IS_RECONFIGURING', payload: false }); 
         dispatch({ type: 'SET_EDITING_ASSISTANT_ID', payload: null });
      }
      router.replace('/app/setup');
    }
  }, [isLoading, userProfile.isAuthenticated, isSetupComplete, router, dispatch]);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast({
        title: "¡Pago Exitoso!",
        description: "Tu plan ha sido actualizado. ¡Bienvenido/a!",
        duration: 5000,
      });
      router.replace('/app/dashboard', {scroll: false});
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: "Pago Cancelado",
        description: "El proceso de pago fue cancelado. Puedes intentar de nuevo desde tu panel.",
        variant: "destructive",
        duration: 7000,
      });
      router.replace('/app/dashboard', {scroll: false});
    }
  }, [searchParams, toast, router]);


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
                dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: db.source, name: db.name, accessUrl: db.accessUrl, }});
            }
        }
        
        dispatch({ type: 'SET_WIZARD_STEP', payload: 1 }); 
        router.push('/app/setup'); 
        toast({ title: "Reconfigurando Asistente", description: `Cargando configuración para ${assistant.name} en el asistente. Estás en el paso 1.` });
    } else {
        toast({ title: "Error", description: "Asistente no encontrado.", variant: "destructive"});
    }
  };

  const handleAddNewAssistant = () => {
    // No more plan limits
    dispatch({ type: 'RESET_WIZARD' }); 
    router.push('/app/setup'); 
  };

  const handleAddNewDatabase = () => {
    dispatch({ type: 'RESET_WIZARD' });
    router.push('/app/setup');
    toast({
      title: "Añadir Nueva Base de Datos",
      description: "Configura un nuevo asistente y su base de datos. La base de datos creada estará disponible para otros asistentes.",
      duration: 7000,
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch({ type: 'LOGOUT_USER' });
      dispatch({ type: 'SET_WIZARD_STEP', payload: 3 }); 
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/app/setup'); 
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={28} /> 
      </PageContainer>
    );
  }

  if (!userProfile.isAuthenticated) { 
    return (
      <PageContainer className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-150px)]">
        <p className="text-xs mb-2">Redirigiendo...</p> 
        <LoadingSpinner size={24} /> 
      </PageContainer>
    );
  }
  
  return (
    <PageContainer className="space-y-5"> 
      <div className="animate-fadeIn">
        <div className="flex justify-between items-center mb-0.5"> 
          <h2 className="text-xl font-bold tracking-tight text-foreground">¡Bienvenido/a, {userProfile.email || "Usuario/a"}!</h2> 
          {userProfile.isAuthenticated && (
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs px-2 py-1"> 
              <FaSignOutAlt size={12} className="mr-1" /> 
              Cerrar Sesión
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Aquí tienes un resumen de tu {APP_NAME}.</p>
      </div>
      
      <DashboardSummary />

      <div className="space-y-4"> 
        <div className="flex justify-between items-center animate-fadeIn" style={{animationDelay: "0.3s"}}>
          <h3 className="text-lg font-semibold flex items-center gap-1"> 
            <FaSitemap size={18} className="text-primary" /> 
            Tus Asistentes
          </h3>
          <Button onClick={handleAddNewAssistant} size="sm" className="transition-transform transform hover:scale-105 text-xs px-2 py-1"> 
            <FaPlusCircle size={13} className="mr-1" /> 
            Añadir Nuevo
          </Button>
        </div>
        {userProfile.assistants.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-1"> 
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
          <Card className="text-center py-6 animate-fadeIn" style={{animationDelay: "0.4s"}}> 
            <CardContent className="flex flex-col items-center gap-2.5"> 
              <FaRobot size={36} className="text-muted-foreground" /> 
              <p className="text-xs text-muted-foreground">Aún no has configurado ningún asistente.</p>
              <Button onClick={handleAddNewAssistant} size="sm" className="text-xs px-2 py-1">Crea tu Primer Asistente</Button> 
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4"> 
        <div className="flex justify-between items-center animate-fadeIn" style={{animationDelay: `${0.5 + userProfile.assistants.length * 0.1}s`}}>
          <h3 className="text-lg font-semibold flex items-center gap-1"> 
            <FaDatabase size={18} className="text-primary" /> 
            Bases de Datos Vinculadas
          </h3>
          <Button onClick={handleAddNewDatabase} size="sm" className="transition-transform transform hover:scale-105 text-xs px-2 py-1">
            <FaPlusCircle size={13} className="mr-1" />
            Añadir Base de Datos
          </Button>
        </div>
        {userProfile.databases.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-1">  
            {userProfile.databases.map((db, index) => (
              <DatabaseInfoCard key={db.id} database={db} animationDelay={`${0.6 + (userProfile.assistants.length + index) * 0.1}s`} />
            ))}
          </div>
        ) : (
           <Card className="text-center py-6 animate-fadeIn" style={{animationDelay: `${0.6 + userProfile.assistants.length * 0.1}s`}}> 
            <CardContent className="flex flex-col items-center gap-2.5"> 
              <FaDatabase size={36} className="text-muted-foreground" /> 
              <p className="text-xs text-muted-foreground">No hay bases de datos vinculadas o creadas aún.</p>
              <Button onClick={handleAddNewDatabase} size="sm" className="text-xs px-2 py-1">Crea tu Primera Base de Datos</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

export default DashboardPageContent;
