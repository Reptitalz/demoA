
"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import AssistantCard from '@/components/dashboard/AssistantCard';
import DatabaseInfoCard from '@/components/dashboard/DatabaseInfoCard';
import { Button } from '@/components/ui/button';
import { FaStar, FaKey, FaPalette, FaWhatsapp, FaUser, FaRobot, FaDatabase, FaBrain, FaSpinner, FaRegCommentDots, FaComments, FaAddressBook, FaPlus } from 'react-icons/fa';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AddDatabaseDialog from '@/components/dashboard/AddDatabaseDialog';
import PersonalInfoDialog from '@/components/dashboard/PersonalInfoDialog';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { AssistantMemory, AssistantWithMemory } from '@/types';
import AssistantMemoryCard from '@/components/dashboard/AssistantMemoryCard';
import { BookOpen, CheckSquare, Bell, Eye, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from "framer-motion";
import ConversationsDialog from './ConversationsDialog';
import { assistantPurposesConfig } from '@/config/appConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';


const DemoDashboardPageContent = () => {
  const { state, dispatch, fetchProfileCallback } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { userProfile, loadingStatus } = state;
  
  const [isAddDatabaseDialogOpen, setIsAddDatabaseDialogOpen] = useState(false);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [isConversationsDialogOpen, setIsConversationsDialogOpen] = useState(false);
  
  const isDemoMode = true; // This component is always in demo mode
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const demoProfile = {
      isAuthenticated: false,
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
          isFirstDesktopAssistant: true,
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
          storageSize: 15 * 1024 * 1024,
      }],
      credits: 5,
      purchasedUnlimitedPlans: 0,
  };
  
  const profileToRender = demoProfile;
  
   useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollLeft = scrollRef.current.scrollLeft;
        const cardWidth = scrollRef.current.scrollWidth / profileToRender.assistants.length;
        if (cardWidth > 0) {
            const newIndex = Math.round(scrollLeft / cardWidth);
            setActiveIndex(newIndex);
        }
      }
    };
    const scroller = scrollRef.current;
    if (scroller) {
      scroller.addEventListener('scroll', handleScroll, { passive: true });
      return () => scroller.removeEventListener('scroll', handleScroll);
    }
  }, [profileToRender.assistants.length]);

  const handleActionInDemo = (action: string) => {
    toast({
        title: "Modo de Demostración",
        description: `La acción de "${action}" no está disponible en este modo.`,
    });
  };

  const handleReconfigureAssistant = (assistantId: string) => {
      handleActionInDemo('Configurar Asistente');
  };

  const handleAddNewAssistant = () => {
    router.push('/login');
  };
  
  const showAddDatabaseButton = !isDemoMode && userProfile.assistants.some(a => !a.databaseId);
  
  const renderContentForRoute = () => {
    const isAssistantsPage = pathname.endsWith('/assistants');
    const isManagerPage = pathname.endsWith('/manager');
    const isProfilePage = pathname.endsWith('/profile');
    const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);

    if (isAssistantsPage) {
      return (
        <div className="space-y-4"> 
            <div className="flex justify-between items-center animate-fadeIn" style={{ animationDelay: "0.3s" }}>
                <h3 className="text-sm font-semibold flex items-center gap-2"> 
                    <FaRobot size={16} className="text-green-500" /> 
                    Asistentes de Ejemplo
                </h3>
                <Button onClick={handleAddNewAssistant} size="sm" className={cn("transition-transform transform hover:scale-105 text-xs px-2 py-1", "bg-green-gradient text-primary-foreground hover:opacity-90 shiny-border")}>
                    <FaRobot size={13} className="mr-1" />
                    Iniciar Sesión para Crear
                </Button>
            </div>
            <div>
              <div ref={scrollRef} className="flex overflow-x-auto space-x-4 p-2 -m-2 snap-x snap-mandatory scrollbar-hide">
                  {profileToRender.assistants.map((assistant, index) => (
                      <div key={assistant.id} className="snap-center flex-shrink-0 w-[80%] sm:w-64">
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
                                    if(cardNode) {
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
        </div>
      );
    }
    
    if (isManagerPage) {
        const allPendingAuthorizations = profileToRender.assistants.flatMap(a =>
            (a.authorizations || []).filter(auth => auth.status === 'pending')
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
                                <p className="text-sm text-center text-muted-foreground py-4">Inicia sesión para gestionar las instrucciones de tus asistentes.</p>
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
                                <p className="text-sm text-center text-muted-foreground py-4">Inicia sesión para gestionar las autorizaciones.</p>
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
                                <p className="text-sm text-center text-muted-foreground py-4">Inicia sesión para enviar notificaciones.</p>
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
    return null;
  }
  
  const getPageTitle = () => {
    if(pathname.endsWith('/assistants')) return 'Asistentes';
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
        {!pathname.endsWith('/profile') && <DashboardSummary currentPath={pathname} />}

        {renderContentForRoute()}
      </PageContainer>
      
      <AddDatabaseDialog 
          isOpen={isAddDatabaseDialogOpen} 
          onOpenChange={setIsAddDatabaseDialogOpen} 
      />
       <PersonalInfoDialog
        isOpen={isPersonalInfoOpen}
        onOpenChange={setIsPersonalInfoOpen}
      />
      <ConversationsDialog
        isOpen={isConversationsDialogOpen}
        onOpenChange={setIsConversationsDialogOpen}
        assistants={profileToRender.assistants as any[]}
      />
    </>
  );
};

export default DemoDashboardPageContent;
