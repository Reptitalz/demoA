
"use client";

import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import { BarChart2, MessageSquareText, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from '@/config/appConfig';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const ConsumptionPage = () => {
  const { state } = useApp();
  const { userProfile, isLoading } = state;

  if (isLoading) {
    return (
        <PageContainer className="flex items-center justify-center">
            <LoadingSpinner size={32} />
        </PageContainer>
    )
  }

  // Calculate totals from actual user data
  const totalMessagesSent = userProfile.assistants.reduce((sum, asst) => sum + (asst.messageCount || 0), 0);
  const totalApiCalls = 0; // Placeholder as this is not tracked yet
  
  const currentPeriod = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date());

  return (
    <PageContainer className="space-y-5">
       <div className="animate-fadeIn">
        <div className="flex justify-between items-center mb-0.5">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart2 size={22} className="text-primary" />
            Consumo de Asistentes
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Resumen del uso de tus asistentes para el período actual ({currentPeriod}).
        </p>
      </div>

      <div className="space-y-6 animate-fadeIn" style={{animationDelay: "0.2s"}}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen Total del Plan</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <MessageSquareText className="h-5 w-5 text-accent" />
              <div>
                <p className="font-semibold">{totalMessagesSent.toLocaleString()} Mensajes Enviados este mes</p>
                <p className="text-xs text-muted-foreground">El consumo se reinicia el día 1 de cada mes.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <Zap className="h-5 w-5 text-accent" />
              <div>
                <p className="font-semibold">{totalApiCalls.toLocaleString()} Llamadas API</p>
                <p className="text-xs text-muted-foreground">El seguimiento de llamadas API se habilitará pronto.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-lg font-semibold mb-3">Consumo por Asistente</h3>
          {userProfile.assistants.length > 0 ? (
            <div className="space-y-4">
                {userProfile.assistants.map((asst) => (
                <Card key={asst.id} className="shadow-sm">
                    <CardHeader className="pb-3">
                    <CardTitle className="text-md">{asst.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                        <div className="flex items-center gap-1.5">
                            <MessageSquareText className="h-4 w-4 text-muted-foreground" /> Mensajes Enviados (este mes):
                        </div>
                        <span className="font-semibold">{(asst.messageCount || 0).toLocaleString()}</span>
                    </div>
                    </CardContent>
                </Card>
                ))}
            </div>
          ) : (
             <Card className="text-center py-10">
                <CardContent>
                    <p className="text-muted-foreground">No tienes asistentes para mostrar.</p>
                </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default ConsumptionPage;

    