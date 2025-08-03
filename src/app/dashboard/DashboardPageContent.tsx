
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import AssistantCard from '@/components/dashboard/AssistantCard';
import DatabaseInfoCard from '@/components/dashboard/DatabaseInfoCard';
import { Button } from '@/components/ui/button';
import { FaPlusCircle, FaSitemap, FaDatabase, FaRobot, FaSignOutAlt, FaKey, FaPalette, FaWhatsapp } from 'react-icons/fa';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from '@/config/appConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AddDatabaseDialog from '@/components/dashboard/AddDatabaseDialog';
import PersonalInfoDialog from '@/components/dashboard/PersonalInfoDialog';
import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, User } from 'lucide-react';
import Link from 'next/link';

const DashboardPageContent = () => {
  const { state, dispatch, fetchProfileCallback } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { userProfile, isLoading } = state;
  
  const [isAddDatabaseDialogOpen, setIsAddDatabaseDialogOpen] = useState(false);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Handle session and payment status logic
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
      // Clean up the URL
      router.replace(pathname);
    }
  }, [searchParams, fetchProfileCallback, toast, state.userProfile.phoneNumber, router, pathname]);

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
  
  const showAddDatabaseButton = userProfile.assistants.some(a => !a.databaseId);

  if (isLoading || !userProfile.isAuthenticated) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={28} /> 
      </PageContainer>
    );
  }
  
  const renderContentForRoute = () => {
    if (pathname.startsWith('/dashboard/assistants')) {
      return (
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
      );
    }
    
    if (pathname.startsWith('/dashboard/databases')) {
      return (
        <div className="space-y-4">
            <div className="flex justify-between items-center animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FaDatabase size={18} className="text-primary" />
                    Bases de Datos Vinculadas
                </h3>
                {showAddDatabaseButton && (
                    <Button onClick={() => setIsAddDatabaseDialogOpen(true)} size="sm" className="transition-transform transform hover:scale-105 text-xs px-2 py-1">
                        <FaPlusCircle size={13} className="mr-1" />
                        Añadir Base de Datos
                    </Button>
                )}
            </div>
            {userProfile.databases.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {userProfile.databases.map((db, index) => (
                        <DatabaseInfoCard key={db.id} database={db} animationDelay={`${0.2 + index * 0.1}s`} />
                    ))}
                </div>
            ) : (
                <Card className="text-center py-10 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <CardContent className="flex flex-col items-center gap-3">
                        <FaDatabase size={40} className="text-muted-foreground" />
                        <h3 className="text-lg font-semibold">No tienes bases de datos</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Conecta una Hoja de Google o crea una Base de Datos Inteligente para darle a tus asistentes el conocimiento que necesitan para operar.
                        </p>
                        {showAddDatabaseButton && (
                            <Button onClick={() => setIsAddDatabaseDialogOpen(true)} size="sm" className="text-sm px-4 py-2 mt-2">Añadir Base de Datos</Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
      );
    }
    
    if (pathname.startsWith('/dashboard/profile')) {
      return (
         <Card
          className="animate-fadeIn transition-all hover:shadow-lg"
          style={{ animationDelay: '0.1s' }}
        >
          <CardContent className="p-0">
            <div className="flex flex-col">
              {/* Personal Info Section */}
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <User className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">Información Personal</h3>
                    <p className="text-sm text-muted-foreground">
                      Actualiza tus datos personales y de facturación.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsPersonalInfoOpen(true)}
                  className="shrink-0"
                >
                  Editar
                </Button>
              </div>
              <Separator />

              {/* Security Section */}
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <FaKey className="h-6 w-6 text-destructive" />
                  <div>
                    <h3 className="font-semibold">Seguridad</h3>
                    <p className="text-sm text-muted-foreground">
                      ¿Olvidaste tu contraseña? Inicia la recuperación.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="shrink-0"
                >
                  Recuperar
                </Button>
              </div>
              <Separator />

              {/* Appearance Section */}
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <FaPalette className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">Apariencia</h3>
                    <p className="text-sm text-muted-foreground">
                      Elige entre el tema claro y el oscuro.
                    </p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
              <Separator />

              {/* Support Section */}
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <MessageSquare className="h-6 w-6 text-green-500" />
                  <div>
                    <h3 className="font-semibold">Soporte Técnico</h3>
                    <p className="text-sm text-muted-foreground">
                      ¿Necesitas ayuda? Contáctanos por WhatsApp.
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="shrink-0 bg-green-500 hover:bg-green-600 text-white"
                >
                  <Link
                    href="https://wa.me/5213344090167"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contactar
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return null; // Or a default view
  }
  
  return (
    <>
      <PageContainer className="space-y-5"> 
        <div className="animate-fadeIn">
          <div className="flex justify-between items-center mb-0.5"> 
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {pathname.startsWith('/dashboard/assistants') && 'Panel de Asistentes'}
              {pathname.startsWith('/dashboard/databases') && 'Bases de Datos'}
              {pathname.startsWith('/dashboard/profile') && 'Perfil y Soporte'}
            </h2> 
          </div>
          <p className="text-xs text-muted-foreground">
             {pathname.startsWith('/dashboard/assistants') && 'Gestiona todos tus asistentes de IA desde aquí.'}
             {pathname.startsWith('/dashboard/databases') && 'Administra las fuentes de datos conectadas a tus asistentes.'}
             {pathname.startsWith('/dashboard/profile') && 'Administra tu información, apariencia y obtén ayuda.'}
          </p>
        </div>
        
        {pathname !== '/dashboard/profile' && <DashboardSummary />}

        {renderContentForRoute()}
      </PageContainer>
      
      {/* Dialogs that can be opened from multiple places */}
      <AddDatabaseDialog 
          isOpen={isAddDatabaseDialogOpen} 
          onOpenChange={setIsAddDatabaseDialogOpen} 
      />
       <PersonalInfoDialog
        isOpen={isPersonalInfoOpen}
        onOpenChange={setIsPersonalInfoOpen}
      />
      <ForgotPasswordDialog
        isOpen={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      />
    </>
  );
};

export default DashboardPageContent;
