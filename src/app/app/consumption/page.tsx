"use client";

import PageContainer from '@/components/layout/PageContainer';
import { BarChart2, MessageSquareText, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from '@/config/appConfig';

// Placeholder data - replace with actual data fetching and state
const consumptionData = {
  currentPeriod: "Julio 2024", // This could come from a date utility or state
  assistants: [
    {
      id: "asst_1",
      name: "Asistente de Ventas",
      messagesSent: 1250,
      activeConversations: 45,
      apiCalls: 3000,
    },
    {
      id: "asst_2",
      name: "Soporte Técnico IA",
      messagesSent: 870,
      activeConversations: 22,
      apiCalls: 1500,
    },
    {
      id: "asst_3",
      name: "Asistente de Reservas",
      messagesSent: 2500,
      activeConversations: 70,
      apiCalls: 5500,
    },
     {
      id: "asst_4",
      name: "Asistente de Marketing",
      messagesSent: 1800,
      activeConversations: 30,
      apiCalls: 4000,
    },
    {
      id: "asst_5",
      name: "Asistente de Logística",
      messagesSent: 950,
      activeConversations: 15,
      apiCalls: 2200,
    },
    {
      id: "asst_6",
      name: "Asistente de RRHH",
      messagesSent: 300,
      activeConversations: 10,
      apiCalls: 700,
    },
  ],
  planLimit: {
    messages: 5000,
    apiCalls: 10000,
  },
};

const ConsumptionPage = () => {
  const totalMessagesSent = consumptionData.assistants.reduce((sum, asst) => sum + asst.messagesSent, 0);
  const totalApiCalls = consumptionData.assistants.reduce((sum, asst) => sum + asst.apiCalls, 0);

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
          Resumen del uso de tus asistentes para el período actual ({consumptionData.currentPeriod}).
        </p>
      </div>

      {/* Content previously in ScrollArea now flows directly or within a simple div for animation/spacing */}
      <div className="space-y-6 animate-fadeIn" style={{animationDelay: "0.2s"}}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen Total del Plan</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <MessageSquareText className="h-5 w-5 text-accent" />
              <div>
                <p className="font-semibold">{totalMessagesSent.toLocaleString()} Mensajes Enviados</p>
                <p className="text-xs text-muted-foreground">Límite del plan: {consumptionData.planLimit.messages.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <Zap className="h-5 w-5 text-accent" />
              <div>
                <p className="font-semibold">{totalApiCalls.toLocaleString()} Llamadas API</p>
                <p className="text-xs text-muted-foreground">Límite del plan: {consumptionData.planLimit.apiCalls.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-lg font-semibold mb-3">Consumo por Asistente</h3>
          <div className="space-y-4">
            {consumptionData.assistants.map((asst) => (
              <Card key={asst.id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-md">{asst.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-1.5">
                        <MessageSquareText className="h-4 w-4 text-muted-foreground" /> Mensajes Enviados:
                    </div>
                    <span className="font-semibold">{asst.messagesSent.toLocaleString()}</span>
                  </div>
                   <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-muted-foreground" /> Conversaciones Activas:
                    </div>
                    <span className="font-semibold">{asst.activeConversations.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-muted-foreground" /> Llamadas API:
                    </div>
                    <span className="font-semibold">{asst.apiCalls.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ConsumptionPage;
