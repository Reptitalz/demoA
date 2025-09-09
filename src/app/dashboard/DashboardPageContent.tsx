
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import AssistantCard from '@/components/dashboard/AssistantCard';
import DatabaseInfoCard from '@/components/dashboard/DatabaseInfoCard';
import { Button } from '@/components/ui/button';
import { FaStar, FaKey, FaPalette, FaWhatsapp } from 'react-icons/fa';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from '@/components/ui/card';
import AddDatabaseDialog from '@/components/dashboard/AddDatabaseDialog';
import PersonalInfoDialog from '@/components/dashboard/PersonalInfoDialog';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, User, Bot, Database, Brain } from 'lucide-react';
import Link from 'next/link';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';

const DashboardPageContent = () => {
  const { state, dispatch, fetchProfileCallback } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { userProfile, loadingStatus } = state;
  
  const [isAddDatabaseDialogOpen, setIsAddDatabaseDialogOpen] = useState(false);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  
  const isDemoMode = !userProfile.isAuthenticated;

  // This is the single source of truth for demo data.
  const demoProfile = {
      isAuthenticated: false, // This is the key that triggers demo mode
      assistants: [{
          id: 'demo-asst-1',
          name: 'Asistente de Ventas (Demo)',
          isActive: true,
          type: 'whatsapp' as const,
          numberReady: true,
          phoneLinked: '+15551234567',
          messageCount: 1250,
          monthlyMessageLimit: 5000,
          purposes: ['import_spreadsheet', 'notify_owner +15551234567'],
          databaseId: 'demo-db-1'
      },
      {
          id: 'demo-asst-2',
          name: 'Asistente de Soporte (Demo)',
          isActive: true,
          type: 'desktop' as const,
          numberReady: true,
          messageCount: 300,
          monthlyMessageLimit: 1000,
          purposes: ['create_smart_db'],
          databaseId: 'demo-db-2',
          isFirstDesktopAssistant: true, // This assistant is in free trial
          trialStartDate: subDays(new Date(), 5).toISOString(), // Trial started 5 days ago
      }],
      databases: [{
          id: 'demo-db-1',
          name: 'Inventario de Productos (Demo)',
          source: 'google_sheets' as const,
          accessUrl: '#'
      },
      {
          id: 'demo-db-2',
          name: 'Base de Conocimiento (Demo)',
          source: 'smart_db' as const,
          storageSize: 15 * 1024 * 1024, // 15MB
      }],
      credits: 5
  };

  const profileToRender = isDemoMode ? demoProfile : userProfile;

  // Handle session and payment status logic for authenticated users
  useEffect(() => {
    if (loadingStatus.active && !isDemoMode) {
        return;
    }
    if (!loadingStatus.active && !isDemoMode && !userProfile.isAuthenticated) {
        router.replace('/login');
    }
  }, [loadingStatus.active, isDemoMode, userProfile.isAuthenticated, router]);
  
  useEffect(() => {
    if(isDemoMode) return;

    const paymentStatus = searchParams.get('payment_status');
    const userEmail = userProfile.email;

    if (paymentStatus && userEmail) {
      if (paymentStatus === 'success') {
          toast({
            title: "¡Pago Exitoso!",
            description: "Tu compra ha sido procesada. Actualizando tu saldo...",
            variant: "default",
          });
          fetchProfileCallback(userEmail);
      }
      const newPath = pathname || '/dashboard';
      router.replace(newPath, { scroll: false });
    }
  }, [searchParams, fetchProfileCallback, toast, userProfile.email, router, pathname, isDemoMode]);

  const handleActionInDemo = (action: string) => {
    toast({
        title: "Modo de Demostración",
        description: `La acción de "${action}" no está disponible en este modo.`,
    });
  };

  const handleReconfigureAssistant = (assistantId: string) => {
    if (isDemoMode) {
      handleActionInDemo('Configurar Asistente');
      return;
    }
    const assistant = userProfile.assistants.find(a => a.id === assistantId);
    if (assistant) {
        dispatch({ type: 'RESET_WIZARD' }); 
        dispatch({ type: 'SET_IS_RECONFIGURING', payload: true });
        dispatch({ type: 'SET_EDITING_ASSISTANT_ID', payload: assistant.id });
        dispatch({ type: 'UPDATE_ASSISTANT_NAME', payload: assistant.name });
        dispatch({ type: 'UPDATE_ASSISTANT_PROMPT', payload: assistant.prompt || '' });
        
        assistant.purposes.forEach(purpose => {
            const purposeId = purpose.split(' ')[0];
            dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: purposeId as any });
            
            if (purpose.startsWith('notify_owner')) {
                const phone = purpose.split(' ')[1];
                if (phone) {
                    dispatch({ type: 'UPDATE_OWNER_PHONE_NUMBER', payload: phone });
                }
            }
        });

        if(assistant.databaseId) {
            const db = userProfile.databases.find(d => d.id === assistant.databaseId);
            if (db) {
                dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: db.source, name: db.name, accessUrl: db.accessUrl, selectedColumns: db.selectedColumns, relevantColumnsDescription: db.relevantColumnsDescription }});
            }
        }
        
        dispatch({ type: 'SET_WIZARD_STEP', payload: 1 }); 
        router.push('/app');
        toast({ title: "Configurando Asistente", description: `Cargando configuración para ${assistant.name}.` });
    } else {
        toast({ title: "Error", description: "Asistente no encontrado.", variant: "destructive"});
    }
  };

  const handleAddNewAssistant = () => {
    if (isDemoMode) {
      router.push('/login');
      return;
    }
    dispatch({ type: 'RESET_WIZARD' });
    router.push('/app?action=add'); 
  };
  
  const showAddDatabaseButton = !isDemoMode && userProfile.assistants.some(a => !a.databaseId);

  if (loadingStatus.active && !isDemoMode) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={28} /> 
      </PageContainer>
    );
  }
  
  const renderContentForRoute = () => {
    const isAssistantsPage = pathname.endsWith('/assistants');
    const isDatabasesPage = pathname.endsWith('/databases');
    const isProfilePage = pathname.endsWith('/profile');

    if (isAssistantsPage) {
      return (
        <div className="space-y-4"> 
            <div className="flex justify-between items-center animate-fadeIn" style={{animationDelay: "0.3s"}}>
            <h3 className="text-lg font-semibold flex items-center gap-2"> 
                <Bot size={18} className="text-primary" /> 
                Tus Asistentes
            </h3>
            <Button onClick={handleAddNewAssistant} size="sm" className={cn("transition-transform transform hover:scale-105 text-xs px-2 py-1", "bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border")}>
                <FaStar size={13} className="mr-1" />
                {isDemoMode ? 'Iniciar Sesión para Crear' : 'Crear Asistente'}
            </Button>
            </div>
            {profileToRender.assistants.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"> 
                {profileToRender.assistants.map((assistant, index) => (
                <AssistantCard 
                    key={assistant.id} 
                    assistant={assistant as any} 
                    onReconfigure={handleReconfigureAssistant}
                    animationDelay={`${0.4 + index * 0.1}s`}
                />
                ))}
            </div>
            ) : (
            <Card className="text-center py-10 animate-fadeIn" style={{animationDelay: "0.4s"}}> 
                <CardContent className="flex flex-col items-center gap-3"> 
                <Bot size={40} className="text-muted-foreground" /> 
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
    
    if (isDatabasesPage) {
      return (
        <div className="space-y-4">
            <div className="flex justify-between items-center animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Brain size={18} className="text-primary" />
                    Cerebro de los Asistentes
                </h3>
                {showAddDatabaseButton && (
                    <Button onClick={() => isDemoMode ? handleActionInDemo('Añadir Base de Datos') : setIsAddDatabaseDialogOpen(true)} size="sm" className="transition-transform transform hover:scale-105 text-xs px-2 py-1">
                        <FaStar size={13} className="mr-1" />
                        Añadir Base de Datos
                    </Button>
                )}
            </div>
            {profileToRender.databases.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {profileToRender.databases.map((db, index) => (
                        <DatabaseInfoCard key={db.id} database={db as any} animationDelay={`${0.2 + index * 0.1}s`} />
                    ))}
                </div>
            ) : (
                <Card className="text-center py-10 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <CardContent className="flex flex-col items-center gap-3">
                        <Database size={40} className="text-muted-foreground" />
                        <h3 className="text-lg font-semibold">No tienes bases de datos</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Conecta una Hoja de Google o crea una Base de Datos Inteligente para darle a tus asistentes el conocimiento que necesitan para operar.
                        </p>
                        {showAddDatabaseButton && (
                            <Button onClick={() => isDemoMode ? handleActionInDemo('Añadir Base de Datos') : setIsAddDatabaseDialogOpen(true)} size="sm" className="text-sm px-4 py-2 mt-2">Añadir Base de Datos</Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
      );
    }
    
    if (isProfilePage) {
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
                  onClick={() => {
                    if (isDemoMode) {
                        router.push('/login');
                        return;
                    }
                    setIsPersonalInfoOpen(true)}
                  }
                  className="shrink-0"
                >
                  {isDemoMode ? 'Iniciar Sesión' : 'Editar'}
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
                      {isDemoMode ? "Inicia sesión para gestionar tu cuenta." : "Tu cuenta está segura con tu proveedor."}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled
                >
                 {isDemoMode ? "Modo Demo" : `Gestionado por ${userProfile.authProvider}`}
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
  
  const getPageTitle = () => {
    if(pathname.endsWith('/assistants')) return 'Panel de Asistentes';
    if(pathname.endsWith('/databases')) return 'Cerebro';
    if(pathname.endsWith('/profile')) return 'Perfil y Soporte';
    return isDemoMode ? 'Panel de Demostración' : 'Panel Principal';
  }

  const getPageDescription = () => {
    if(pathname.endsWith('/assistants')) return isDemoMode ? 'Explora asistentes de ejemplo.' : 'Gestiona todos tus asistentes de IA desde aquí.';
    if(pathname.endsWith('/databases')) return isDemoMode ? 'Explora bases de datos de ejemplo.' : 'Administra el conocimiento y las fuentes de datos de tus asistentes.';
    if(pathname.endsWith('/profile')) return 'Administra tu información, apariencia y obtén ayuda.';
    return isDemoMode ? 'Explora las funciones con datos de ejemplo.' : 'Bienvenido a tu panel de control.';
  }

  return (
    <>
      <PageContainer className="space-y-5"> 
        <div className="animate-fadeIn">
          <div className="flex justify-between items-center mb-0.5"> 
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {getPageTitle()}
            </h2>
            {isDemoMode && (
                <Button onClick={() => router.push('/login')} size="sm">Iniciar Sesión / Registrarse</Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {getPageDescription()}
          </p>
        </div>
        
        {!pathname.endsWith('/profile') && <DashboardSummary currentPath={pathname} />}

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
    </>
  );
};

export default DashboardPageContent;
