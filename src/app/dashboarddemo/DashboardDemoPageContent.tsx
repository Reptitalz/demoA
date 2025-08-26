"use client";

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import AssistantCard from '@/components/dashboard/AssistantCard';
import DatabaseInfoCard from '@/components/dashboard/DatabaseInfoCard';
import { Button } from '@/components/ui/button';
import { FaPlusCircle, FaKey, FaPalette, FaWhatsapp } from 'react-icons/fa';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, User, Bot, Database } from 'lucide-react';
import Link from 'next/link';

const DashboardDemoPageContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const demoProfile = {
      isAuthenticated: false, // This marks it as a demo profile
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
          databaseId: 'demo-db-2'
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
      credits: 5
  };

  const handleActionInDemo = (action: string) => {
    toast({
        title: "Modo de Demostración",
        description: `La acción de "${action}" no está disponible en este modo.`,
    });
  };
  
  const renderContentForRoute = () => {
    const effectivePathname = pathname || '/dashboarddemo/assistants';

    if (effectivePathname.startsWith('/dashboarddemo/assistants')) {
      return (
        <div className="space-y-4"> 
            <div className="flex justify-between items-center animate-fadeIn" style={{animationDelay: "0.3s"}}>
            <h3 className="text-lg font-semibold flex items-center gap-2"> 
                <Bot size={18} className="text-primary" /> 
                Tus Asistentes
            </h3>
            <Button onClick={() => router.push('/login')} size="sm" className="transition-transform transform hover:scale-105 text-xs px-2 py-1"> 
                <FaPlusCircle size={13} className="mr-1" /> 
                Añadir Asistente
            </Button>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"> 
                {demoProfile.assistants.map((assistant, index) => (
                <AssistantCard 
                    key={assistant.id} 
                    assistant={assistant as any} 
                    onReconfigure={() => handleActionInDemo("Reconfigurar Asistente")}
                    animationDelay={`${0.4 + index * 0.1}s`}
                />
                ))}
            </div>
        </div>
      );
    }
    
    if (effectivePathname.startsWith('/dashboarddemo/databases')) {
      return (
        <div className="space-y-4">
            <div className="flex justify-between items-center animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Database size={18} className="text-primary" />
                    Bases de Datos Vinculadas
                </h3>
                 <Button onClick={() => handleActionInDemo("Añadir Base de Datos")} size="sm" className="transition-transform transform hover:scale-105 text-xs px-2 py-1">
                    <FaPlusCircle size={13} className="mr-1" />
                    Añadir Base de Datos
                </Button>
            </div>
             <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {demoProfile.databases.map((db, index) => (
                    <DatabaseInfoCard key={db.id} database={db as any} animationDelay={`${0.2 + index * 0.1}s`} />
                ))}
            </div>
        </div>
      );
    }
    
    if (effectivePathname.startsWith('/dashboarddemo/profile')) {
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
                      Inicia sesión para actualizar tus datos personales.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push('/login')}
                  className="shrink-0"
                >
                  Iniciar Sesión
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
                      Inicia sesión para gestionar la seguridad de tu cuenta.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled
                >
                 Modo Demo
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

    return null;
  }
  
  return (
      <PageContainer className="space-y-5"> 
        <div className="animate-fadeIn">
          <div className="flex justify-between items-center mb-0.5"> 
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {pathname.startsWith('/dashboarddemo/assistants') && 'Panel de Asistentes'}
              {pathname.startsWith('/dashboarddemo/databases') && 'Bases de Datos'}
              {pathname.startsWith('/dashboarddemo/profile') && 'Perfil y Soporte'}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
             {pathname.startsWith('/dashboarddemo/assistants') && 'Explora asistentes de ejemplo.'}
             {pathname.startsWith('/dashboarddemo/databases') && 'Explora bases de datos de ejemplo.'}
             {pathname.startsWith('/dashboarddemo/profile') && 'Administra tu información, apariencia y obtén ayuda.'}
          </p>
        </div>
        
        {pathname !== '/dashboarddemo/profile' && <DashboardSummary />}

        {renderContentForRoute()}
      </PageContainer>
  );
};

export default DashboardDemoPageContent;
