"use client";

import PageContainer from "@/components/layout/PageContainer";
import { useApp } from "@/providers/AppProvider";
import { Brain, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
         <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-3 border border-primary/20">
                <Brain className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Cerebro del Asistente</h1>
            <p className="mt-2 text-md text-muted-foreground max-w-xl">
              Gestiona el conocimiento, las notificaciones y el comportamiento central de todos tus asistentes desde un solo lugar.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assistants.length > 0 ? (
                assistants.map((assistant, index) => (
                    <Card key={assistant.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
                        <CardHeader>
                             <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={assistant.imageUrl} alt={assistant.name} />
                                    <AvatarFallback>{assistant.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <CardTitle className="text-lg">{assistant.name}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Gestionar notificaciones</p>
                            <Button variant="outline" size="icon" onClick={() => handleNotificationClick(assistant.name)}>
                                <Bell className="h-5 w-5 text-primary" />
                            </Button>
                        </CardContent>
                    </Card>
                ))
            ) : (
                 <p className="text-center text-muted-foreground py-8 col-span-1 md:col-span-2">No tienes asistentes creados.</p>
            )}
        </div>
      </div>
    </PageContainer>
  );
};

export default BrainPage;
