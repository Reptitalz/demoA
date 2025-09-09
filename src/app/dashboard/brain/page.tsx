"use client";

import PageContainer from "@/components/layout/PageContainer";
import { useApp } from "@/providers/AppProvider";
import { Brain, Bell, Bot, BookOpen, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BrainPage = () => {
    const { state } = useApp();
    const { assistants } = state.userProfile;
    const { toast } = useToast();

    const handleActionClick = (action: string) => {
        toast({
            title: "Función Próximamente",
            description: `La función de "${action}" estará disponible pronto.`,
        });
    };

  return (
    <PageContainer>
      <div className="animate-fadeIn space-y-8">
         <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-3 border border-primary/20 shadow-inner">
                <Brain className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Cerebro Central</h1>
            <p className="mt-2 text-md text-muted-foreground max-w-2xl mx-auto">
              Define el conocimiento y las reglas de comportamiento que todos tus asistentes compartirán. Ahorra tiempo y asegura consistencia.
            </p>
        </div>

        <Card className="w-full max-w-2xl mx-auto shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                    <BookOpen className="text-primary"/>
                    Conocimiento Global
                </CardTitle>
                <CardDescription>
                    La información que añadas aquí estará disponible para todos tus asistentes, a menos que un asistente tenga su propia base de datos vinculada.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                    <p className="font-semibold">Ejemplos de Conocimiento Global:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li><span className="font-semibold text-foreground">Reglas de Comportamiento:</span> "Nunca ofrezcas descuentos sin autorización."</li>
                        <li><span className="font-semibold text-foreground">Datos de la Empresa:</span> "Nuestra dirección es Av. Siempre Viva 742."</li>
                        <li><span className="font-semibold text-foreground">Políticas Generales:</span> "Las devoluciones son aceptadas hasta 15 días después de la compra."</li>
                    </ul>
                </div>
                 <div className="p-3 bg-blue-500/10 text-blue-800 dark:text-blue-300 rounded-lg text-xs flex items-start gap-2">
                    <Brain className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                        <span className="font-semibold">Anulación de Conocimiento:</span> Si un asistente está conectado a una base de datos específica (como una Hoja de Google), usará esa fuente de datos en lugar del conocimiento global.
                    </div>
                 </div>
            </CardContent>
            <CardHeader>
                <Button className="w-full" onClick={() => handleActionClick('Editar Conocimiento Global')}>
                    Editar Conocimiento Global
                </Button>
            </CardHeader>
        </Card>

        <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Estado de tus Asistentes</h3>
            <div className="flex flex-wrap justify-center gap-4">
                {assistants.length > 0 ? (
                    assistants.map((assistant) => (
                        <div key={assistant.id} className="flex items-center gap-2 p-2 bg-card border rounded-lg shadow-sm">
                            <Bot className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium">{assistant.name}</span>
                            <span className={`h-2 w-2 rounded-full ${assistant.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground">No has creado asistentes aún.</p>
                )}
            </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default BrainPage;
