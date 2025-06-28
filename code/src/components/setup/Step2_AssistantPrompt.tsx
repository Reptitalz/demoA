
"use client";

import { useApp } from "@/providers/AppProvider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const EXAMPLE_PROMPT = `Eres un asistente de ventas amigable y eficiente para una tienda de pasteles llamada "Dulce Bocado".

Tu objetivo principal es tomar pedidos de pasteles personalizados.

Instrucciones:
1.  Saluda al cliente amablemente.
2.  Pregunta qué tipo de pastel le gustaría (sabor, tamaño, para cuántas personas).
3.  Confirma los detalles del pedido.
4.  Pregunta la fecha y hora de entrega.
5.  Si el cliente tiene preguntas sobre ingredientes o alérgenos, responde usando la información de la base de datos vinculada. Si no encuentras la información, pide disculpas y di que un humano se pondrá en contacto.
6.  Finaliza la conversación agradeciendo al cliente por su pedido.`;

const Step2AssistantPrompt = () => {
  const { state, dispatch } = useApp();
  const { assistantPrompt } = state.wizard;

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'UPDATE_ASSISTANT_PROMPT', payload: e.target.value });
  };

  return (
    <Card className="w-full shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle>Define la Personalidad de tu Asistente</CardTitle>
        <CardDescription>
          Escribe las instrucciones (prompt) que seguirá tu asistente. Esto define su comportamiento, tono y tareas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
