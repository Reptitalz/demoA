"use client";

import { useApp } from "@/providers/AppProvider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const EXAMPLE_PROMPT = `Eres un asistente de ventas para una pastelería.

Tu objetivo: Tomar pedidos de pasteles.

Instrucciones:
- Sé amable y eficiente.
- Pregunta por sabor, tamaño y fecha de entrega.
- Usa la base de datos que conectaste para responder sobre ingredientes.
- Si no sabes algo, dile al cliente que un humano lo contactará.`;

const Step2AssistantPrompt = () => {
  const { state, dispatch } = useApp();
  const { assistantPrompt } = state.wizard;

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'UPDATE_ASSISTANT_PROMPT', payload: e.target.value });
  };

  return (
    <Card className="w-full shadow-none border-none animate-fadeIn">
      <CardHeader className="p-0 mb-6">
        <CardTitle>Define la Personalidad de tu Asistente</CardTitle>
        <CardDescription>
          Escribe las instrucciones (prompt) que seguirá tu asistente. Esto define su comportamiento, tono y tareas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div className="space-y-2">
          <Label htmlFor="assistantPrompt" className="text-base">
            Prompt del Asistente
          </Label>
          <Textarea
            id="assistantPrompt"
            placeholder={EXAMPLE_PROMPT}
            value={assistantPrompt}
            onChange={handlePromptChange}
            className="text-sm min-h-[200px] lg:min-h-[240px]"
            aria-required="true"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Un buen prompt es claro y detallado. Describe quién es el asistente, cuál es su objetivo y cómo debe interactuar. Puedes hacer referencia a la base de datos que podrías configurar en el siguiente paso.
        </p>
      </CardContent>
    </Card>
  );
};

export default Step2AssistantPrompt;
