"use client";

import { useEffect, useState } from 'react';
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
import AddDatabaseDialog from './AddDatabaseDialog';

const DashboardPageContent = () => {
  const { state, dispatch, fetchProfileCallback } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { userProfile, isLoading } = state;
  const [isAddDatabaseDialogOpen, setIsAddDatabaseDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !state.userProfile.isAuthenticated) {
        router.replace('/login');
    }
  }, [isLoading, state.userProfile.isAuthenticated, router]);
  
  useEffect(() => {
    const paymentStatus = searchParams.get('payment_status');
    const phoneNumber = state.userProfile.phoneNumber;

    if (paymentStatus === 'success' && phoneNumber) {
      toast({
        title: "¡Pago Exitoso!",
        description: "Tu compra ha sido procesada. Actualizando tu saldo...",
        variant: "default",
      });
      fetchProfileCallback(phoneNumber);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams, fetchProfileCallback, toast, state.userProfile.phoneNumber]);

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

  const handleAddNewDatabase = () => {
    setIsAddDatabaseDialogOpen(true);
  };

  const handleLogout = async () => {
    try {
      dispatch({ type: 'LOGOUT_USER' });
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      router.replace('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };

  const showAddDatabaseButton = userProfile.assistants.some(a => !a.databaseId);

  if (isLoading || !userProfile.isAuthenticated) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={28} /> 
      </PageContainer>
    );
  }
  
  return (
    <>
    <PageContainer className="space-y-5"> 
      <div className="animate-fadeIn">
        <div className="flex justify-between items-center mb-0.5"> 
          <h2 className="text-xl font-bold tracking-tight text-foreground">¡Bienvenido/a, {userProfile.firstName || userProfile.phoneNumber || "Usuario/a"}!</h2> 
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
            Añadir Asistente
          </Button>
        </div>
        {userProfile.assistants.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"> 
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
              <Button onClick={handleAddNewAssistant} size="sm" className="text-xs px-2 py-1">Crear Asistente</Button> 
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
          {showAddDatabaseButton && (
             <Button onClick={handleAddNewDatabase} size="sm" className="transition-transform transform hover:scale-105 text-xs px-2 py-1"> 
                <FaPlusCircle size={13} className="mr-1" /> 
                Añadir Base de Datos
            </Button>
          )}
        </div>
        {userProfile.databases.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">  
            {userProfile.databases.map((db, index) => (
              <DatabaseInfoCard key={db.id} database={db} animationDelay={`${0.6 + (userProfile.assistants.length + index) * 0.1}s`} />
            ))}
          </div>
        ) : (
           <Card className="text-center py-6 animate-fadeIn" style={{animationDelay: `${0.6 + userProfile.assistants.length * 0.1}s`}}> 
            <CardContent className="flex flex-col items-center gap-2.5"> 
              <FaDatabase size={36} className="text-muted-foreground" /> 
              <p className="text-xs text-muted-foreground">No hay bases de datos vinculadas o creadas aún.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
    <AddDatabaseDialog 
        isOpen={isAddDatabaseDialogOpen} 
        onOpenChange={setIsAddDatabaseDialogOpen} 
    />
    </>
  );
};

// This is no longer the main export, but kept in case of direct reference.
// The new layout system handles routing.
export default DashboardPageContent;
