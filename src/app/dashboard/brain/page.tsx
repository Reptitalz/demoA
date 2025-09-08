"use client";

import PageContainer from "@/components/layout/PageContainer";
import { useApp } from "@/providers/AppProvider";
import { Brain, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BrainPage = () => {
    const { state } = useApp();
    const { assistants } = state.userProfile;
    const { toast } = useToast();

    const handleNotificationClick = (assistantName: string) => {
        toast({
            title: "Función Próximamente",
            description: `Las notificaciones para ${assistantName} estarán disponibles pronto.`,
        });
    };

  return (
    <PageContainer>
      <div className="animate-fadeIn space-y-6">
         <div className="text-center">
            <Brain className="h-12 w-12 text-primary mb-3 mx-auto" />
            <h1 className="text-3xl font-bold text-foreground">Cerebro del Asistente</h1>
            <p className="mt-2 text-md text-muted-foreground">
              Gestiona el conocimiento y las notificaciones de tus asistentes.
            </p>
        </div>

        <Card>
            <CardContent className="p-4 space-y-3">
                {assistants.length > 0 ? (
                    assistants.map(assistant => (
                        <div key={assistant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={assistant.imageUrl} alt={assistant.name} />
                                    <AvatarFallback>{assistant.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="font-semibold">{assistant.name}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleNotificationClick(assistant.name)}>
                                <Bell className="h-5 w-5 text-muted-foreground hover:text-primary" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-muted-foreground py-4">No tienes asistentes creados.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default BrainPage;
