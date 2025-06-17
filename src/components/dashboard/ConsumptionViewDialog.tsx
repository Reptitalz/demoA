
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart2, MessageSquareText, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle as SmallCardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConsumptionViewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Placeholder data - replace with actual data fetching and state
const consumptionData = {
  currentPeriod: "Julio 2024",
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
  ],
  planLimit: {
    messages: 5000,
    apiCalls: 10000,
  },
};

const ConsumptionViewDialog = ({ isOpen, onOpenChange }: ConsumptionViewDialogProps) => {
  const totalMessagesSent = consumptionData.assistants.reduce((sum, asst) => sum + asst.messagesSent, 0);
  const totalApiCalls = consumptionData.assistants.reduce((sum, asst) => sum + asst.apiCalls, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg md:max-w-xl lg:max-w-2xl min-h-[60vh] sm:min-h-[70vh] bg-card flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BarChart2 size={24} className="text-primary" />
            Consumo de Asistentes
          </DialogTitle>
          <DialogDescription>
            Resumen del uso de tus asistentes para el período actual ({consumptionData.currentPeriod}).
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow p-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <SmallCardTitle className="text-lg">Resumen Total del Plan</SmallCardTitle>
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
                      <SmallCardTitle className="text-md">{asst.name}</SmallCardTitle>
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
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConsumptionViewDialog;
