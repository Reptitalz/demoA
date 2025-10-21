
"use client";

import { useEffect, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AddDatabaseDialog from '@/components/dashboard/AddDatabaseDialog';
import PersonalInfoDialog from '@/components/dashboard/PersonalInfoDialog';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { AssistantMemory, AssistantWithMemory } from '@/types';
import AssistantMemoryCard from '@/components/dashboard/AssistantMemoryCard';
import ConversationsDialog from './ConversationsDialog'; // Import at top level if needed elsewhere

const DemoDashboardPageContent = () => {
  const { state, dispatch, fetchProfileCallback } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { userProfile, loadingStatus } = state;
  
  const [isAddDatabaseDialogOpen, setIsAddDatabaseDialogOpen] = useState(false);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [assistantsMemory, setAssistantsMemory] = useState<AssistantWithMemory[]>([]);
  const [isLoadingMemory, setIsLoadingMemory] = useState(false);
  
  const isDemoMode = true; // This component is always in demo mode

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
  const isDatabasesPage = pathname.endsWith('/databases');

  const handleActionInDemo = (action: string) => {
    toast({
        title: "Modo de Demostración",
        description: `La acción de "${action}" no está disponible en este modo.`,
    });
  };

  const handleAddNewAssistant = () => {
    router.push('/login');
  };
  
  const showAddDatabaseButton = false; // Never show in demo

  const renderContentForRoute = () => {
    const isAssistantsPage = pathname.endsWith('/assistants');
    const isProfilePage = pathname.endsWith('/profile');

    if (isAssistantsPage) {
      return (
        <div className="space-y-4"> 
            <div className="flex justify-between items-center animate-fadeIn" style={{animationDelay: "0.3s"}}>
                <h3 className="text-lg font-semibold flex items-center gap-2"> 
                    <FaRobot size={18} className="text-primary" /> 
                    Asistentes de Ejemplo
                </h3>
                <Button onClick={handleAddNewAssistant} size="sm" className={cn("transition-transform transform hover:scale-105 text-xs px-2 py-1", "bg-green-gradient text-primary-foreground hover:opacity-90 shiny-border")}>
                    <FaStar size={13} className="mr-1" />
                    Iniciar Sesión para Crear
                </Button>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"> 
                {profileToRender.assistants.map((assistant, index) => (
                    <AssistantCard 
                        key={assistant.id} 
                        assistant={assistant as any} 
                        onReconfigure={() => handleActionInDemo('Configurar Asistente')}
                        animationDelay={`${0.4 + index * 0.1}s`}
                    />
                ))}
            </div>
        </div>
      );
    }
    
    if (isDatabasesPage) {
      return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FaDatabase size={18} className="text-primary" />
                        Bases de Datos de Ejemplo
                    </h3>
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 mt-4">
                    {profileToRender.databases.map((db, index) => (
                        <DatabaseInfoCard key={db.id} database={db as any} animationDelay={`${0.2 + index * 0.1}s`} />
                    ))}
                </div>
            </div>
        </div>
      );
    }
    
    if (isProfilePage) {
      return (
         <Card className="animate-fadeIn transition-all hover:shadow-lg" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-0">
            <div className="flex flex-col">
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <FaUser className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">Información Personal</h3>
                    <p className="text-sm text-muted-foreground">Actualiza tus datos personales y de facturación.</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => router.push('/login')} className="shrink-0">Iniciar Sesión</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <FaKey className="h-6 w-6 text-destructive" />
                  <div>
                    <h3 className="font-semibold">Seguridad</h3>
                    <p className="text-sm text-muted-foreground">Inicia sesión para gestionar tu cuenta.</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" disabled>Modo Demo</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <FaRegCommentDots className="h-6 w-6 text-green-500" />
                  <div>
                    <h3 className="font-semibold">Soporte Técnico</h3>
                    <p className="text-sm text-muted-foreground">¿Necesitas ayuda? Contáctanos por WhatsApp.</p>
                  </div>
                </div>
                <Button asChild size="sm" className="shrink-0 bg-green-500 hover:bg-green-600 text-white">
                  <Link href="https://wa.me/5213344090167" target="_blank" rel="noopener noreferrer">Contactar</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }
  
  const getPageTitle = () => {
    if(pathname.endsWith('/assistants')) return 'Panel de Asistentes';
    if(pathname.endsWith('/databases')) return 'Cerebro';
    if(pathname.endsWith('/profile')) return 'Perfil y Soporte';
    return 'Panel de Demostración';
  }

  const getPageDescription = () => {
    if(pathname.endsWith('/assistants')) return 'Explora asistentes de ejemplo.';
    if(pathname.endsWith('/databases')) return 'Explora el cerebro de tus asistentes.';
    if(pathname.endsWith('/profile')) return 'Administra tu información, apariencia y obtén ayuda.';
    return 'Explora las funciones con datos de ejemplo.';
  }

  return (
    <>
      <PageContainer className="space-y-5"> 
        <div className="animate-fadeIn">
          <div className="flex justify-between items-center mb-0.5"> 
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {getPageTitle()}
            </h2>
            <Button onClick={() => router.push('/login')} size="sm">Iniciar Sesión / Registrarse</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {getPageDescription()}
          </p>
        </div>
        {!pathname.endsWith('/profile') && <DashboardSummary currentPath={pathname} />}
        {renderContentForRoute()}
      </PageContainer>
    </>
  );
};

export default DemoDashboardPageContent;
