
"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import AssistantCard from '@/components/dashboard/AssistantCard';
import DatabaseInfoCard from '@/components/dashboard/DatabaseInfoCard';
import { Button } from '@/components/ui/button';
import { FaStar, FaKey, FaPalette, FaWhatsapp, FaUser, FaRobot, FaDatabase, FaBrain, FaSpinner, FaRegCommentDots } from 'react-icons/fa';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AddDatabaseDialog from '@/components/dashboard/AddDatabaseDialog';
import PersonalInfoDialog from '@/components/dashboard/PersonalInfoDialog';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Authorization, AssistantConfig, AssistantMemory, AssistantWithMemory } from '@/types';
import AssistantMemoryCard from '@/components/dashboard/AssistantMemoryCard';
import ConversationsDialog from './ConversationsDialog'; // Import at top level if needed elsewhere
import { BookOpen, CheckSquare, Bell, Eye, Loader2 } from 'lucide-react';
import InstructionsDialog from '../chat/admin/InstructionsDialog';
import ReceiptDialog from '../chat/admin/ReceiptDialog';
import NotifierDialog from './NotifierDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const DashboardPageContent = () => {
  const { state, dispatch, fetchProfileCallback } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { userProfile, loadingStatus } = state;
  
  const [isAddDatabaseDialogOpen, setIsAddDatabaseDialogOpen] = useState(false);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  
  // States for new trays
  const [isInstructionsDialogOpen, setIsInstructionsDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [isNotifierDialogOpen, setIsNotifierDialogOpen] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<AssistantConfig | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  
  const isDemoMode = !userProfile.isAuthenticated;
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
          purposes: ['import_spreadsheet', 'notify_owner +15551234567', 'manage_authorizations'],
          databaseId: 'demo-db-1',
          authorizations: [
            { id: 'demo-1', messageId: 999, product: 'Comprobante (imagen)', assistantId: 'demo-asst-1', userName: 'Cliente Demo 1', receiptUrl: 'https://i.imgur.com/8p8Yf9u.png', status: 'pending', amount: 0, receivedAt: new Date().toISOString(), chatPath: '' },
            { id: 'demo-2', messageId: 998, product: 'Comprobante (documento)', assistantId: 'demo-asst-1', userName: 'Cliente Demo 2', fileName: 'factura_mayo.pdf', receiptUrl: '', status: 'pending', amount: 0, receivedAt: subDays(new Date(), 1).toISOString(), chatPath: '' },
          ]
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
          trialStartDate: subDays(new Date(), 5).toISOString(),
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
      credits: 5,
      purchasedUnlimitedPlans: 0,
  };
  
  const profileToRender = isDemoMode ? demoProfile : userProfile;
  
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, children } = scrollRef.current;
        if (children.length > 0) {
          const cardWidth = children[0].clientWidth;
          const newIndex = Math.round(scrollLeft / cardWidth);
          if (newIndex !== activeIndex) {
            setActiveIndex(newIndex);
          }
        }
      }
    };
    const scroller = scrollRef.current;
    if (scroller) {
      scroller.addEventListener('scroll', handleScroll, { passive: true });
      return () => scroller.removeEventListener('scroll', handleScroll);
    }
  }, [activeIndex]);

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

  const handleOpenInstructions = (assistant: AssistantConfig) => {
    setSelectedAssistant(assistant);
    setIsInstructionsDialogOpen(true);
  };
  
  const handleOpenReceipt = (payment: any, assistantName: string) => {
    setSelectedPayment({...payment, assistantName});
    setIsReceiptDialogOpen(true);
  }

  const handleOpenNotifier = (assistant: AssistantConfig) => {
    setSelectedAssistant(assistant);
    setIsNotifierDialogOpen(true);
  }
  
  const handleReceiptAction = async (authId: string, assistantId: string, action: 'completed' | 'rejected', amount?: number) => {
    try {
        const response = await fetch('/api/authorizations', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authorizationId: authId, assistantId, status: action, amount }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar la autorización');
        }
        
        // Optimistic update on the frontend
        const updatedAssistants = profileToRender.assistants.map(asst => {
            if (asst.id === assistantId) {
                return {
                    ...asst,
                    authorizations: (asst.authorizations || []).map(auth => 
                        auth.id === authId ? { ...auth, status: action, amount: action === 'completed' ? amount || auth.amount : auth.amount } : auth
                    )
                };
            }
            return asst;
        });

        dispatch({ type: 'UPDATE_USER_PROFILE', payload: { assistants: updatedAssistants as any } });
        toast({ title: 'Éxito', description: `El comprobante ha sido ${action === 'completed' ? 'aprobado' : 'rechazado'}.` });

    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsReceiptDialogOpen(false);
    }
  };


  if (loadingStatus.active && !isDemoMode) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={28} /> 
      </PageContainer>
    );
  }
  
  const renderContentForRoute = () => {
    const isAssistantsPage = pathname.endsWith('/assistants');
    const isManagerPage = pathname.endsWith('/manager');
    const isProfilePage = pathname.endsWith('/profile');

    if (isAssistantsPage) {
      return (
        <div className="space-y-4">
            <div className="flex justify-between items-center animate-fadeIn" style={{ animationDelay: "0.3s" }}>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FaRobot size={18} className="text-primary" />
                    Tus Asistentes
                </h3>
                <Button onClick={handleAddNewAssistant} size="sm" className={cn("transition-transform transform hover:scale-105 text-xs px-2 py-1", "bg-green-gradient text-primary-foreground hover:opacity-90 shiny-border")}>
                    <FaStar size={13} className="mr-1" />
                    {isDemoMode ? 'Iniciar Sesión para Crear' : 'Crear Asistente'}
                </Button>
            </div>
            {profileToRender.assistants.length > 0 ? (
                <div>
                    <div ref={scrollRef} className="flex overflow-x-auto space-x-4 p-2 -m-2 snap-x snap-mandatory scrollbar-hide">
                        {profileToRender.assistants.map((assistant, index) => (
                            <div key={assistant.id} className="snap-center flex-shrink-0 w-[80%] sm:w-72">
                                <AssistantCard
                                    assistant={assistant as any}
                                    onReconfigure={handleReconfigureAssistant}
                                    animationDelay={`${0.4 + index * 0.1}s`}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center mt-4 space-x-2">
                        {profileToRender.assistants.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    if (scrollRef.current) {
                                        const cardNode = scrollRef.current.children[index] as HTMLElement;
                                        if (cardNode) {
                                            scrollRef.current.scrollTo({ left: cardNode.offsetLeft - scrollRef.current.offsetLeft, behavior: 'smooth' });
                                        }
                                    }
                                }}
                                className={cn(
                                    "h-2 w-2 rounded-full transition-all duration-300",
                                    activeIndex === index ? "w-4 bg-primary" : "bg-muted-foreground/50"
                                )}
                                aria-label={`Ir al asistente ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <Card className="text-center py-10 animate-fadeIn" style={{ animationDelay: "0.4s" }}>
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
    
    if (isManagerPage) {
      const allPendingAuthorizations = profileToRender.assistants.flatMap(a => 
        (a.authorizations || []).filter(auth => auth.status === 'pending').map(auth => ({ ...auth, assistantName: a.name, assistantId: a.id }))
      );

      return (
        <div className="animate-fadeIn">
            <Tabs defaultValue="instructions" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="instructions"><BookOpen className="mr-2 h-4 w-4"/>Instrucciones</TabsTrigger>
                <TabsTrigger value="authorizations"><CheckSquare className="mr-2 h-4 w-4"/>Autorizaciones <Badge variant="destructive" className="ml-2">{allPendingAuthorizations.length}</Badge></TabsTrigger>
                <TabsTrigger value="notifier"><Bell className="mr-2 h-4 w-4"/>Notificador</TabsTrigger>
                </TabsList>
                <TabsContent value="instructions" className="mt-4">
                    <Card>
                    <CardHeader>
                        <CardTitle>Bandeja de Instrucciones</CardTitle>
                        <CardDescription>Edita las personalidades y reglas de tus asistentes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {profileToRender.assistants.map(asst => (
                                <div key={asst.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                    <p className="font-medium text-sm">{asst.name}</p>
                                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handleOpenInstructions(asst as any)}>Editar</Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="authorizations" className="mt-4">
                    <Card>
                    <CardHeader>
                        <CardTitle>Bandeja de Autorizaciones</CardTitle>
                        <CardDescription>Revisa y aprueba los comprobantes de pago recibidos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {allPendingAuthorizations.length > 0 ? allPendingAuthorizations.map(payment => (
                                <div key={payment.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                    <div className="overflow-hidden">
                                        <p className="font-medium text-sm truncate">{payment.product} de {payment.userName}</p>
                                        <p className="text-xs text-muted-foreground">Recibido: {format(new Date(payment.receivedAt), "dd MMM, h:mm a", { locale: es })}</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="text-xs shrink-0" onClick={() => handleOpenReceipt(payment, payment.assistantName)}>
                                        <Eye className="mr-2 h-3 w-3"/> Revisar
                                    </Button>
                                </div>
                            )) : (
                                <p className="text-center text-muted-foreground text-sm py-4">No hay autorizaciones pendientes.</p>
                            )}
                        </div>
                    </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="notifier" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Bandeja de Notificador</CardTitle>
                        <CardDescription>Envía notificaciones masivas a los contactos de un asistente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {profileToRender.assistants.map(asst => (
                                <div key={asst.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                    <p className="font-medium text-sm">{asst.name}</p>
                                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handleOpenNotifier(asst as any)}>Configurar</Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
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
                  <FaUser className="h-6 w-6 text-green-500" />
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

              {/* Support Section */}
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <FaRegCommentDots className="h-6 w-6 text-green-500" />
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
    if(pathname.endsWith('/manager')) return 'Gestor';
    if(pathname.endsWith('/profile')) return 'Perfil y Soporte';
    return isDemoMode ? 'Panel de Demostración' : 'Panel Principal';
  }

  const getPageDescription = () => {
    if(pathname.endsWith('/assistants')) return isDemoMode ? 'Explora asistentes de ejemplo.' : 'Gestiona todos tus asistentes de IA desde aquí.';
    if(pathname.endsWith('/manager')) return isDemoMode ? 'Explora las bandejas de gestión.' : 'Administra las instrucciones, autorizaciones y notificaciones de tus asistentes.';
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
        
        {!pathname.endsWith('/profile') && !pathname.endsWith('/manager') && <DashboardSummary currentPath={pathname} />}

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
      {selectedAssistant && (
          <>
            <InstructionsDialog 
              isOpen={isInstructionsDialogOpen}
              onOpenChange={setIsInstructionsDialogOpen}
              assistant={selectedAssistant}
            />
            <NotifierDialog
                isOpen={isNotifierDialogOpen}
                onOpenChange={setIsNotifierDialogOpen}
                assistant={selectedAssistant}
            />
          </>
      )}
       <ReceiptDialog
            payment={selectedPayment}
            isOpen={isReceiptDialogOpen}
            onOpenChange={setIsReceiptDialogOpen}
            onAction={handleReceiptAction as any}
        />
    </>
  );
};

export default DashboardPageContent;
