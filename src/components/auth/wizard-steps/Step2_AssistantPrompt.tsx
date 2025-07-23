"use client";

import { useApp } from "@/providers/AppProvider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
    <div className="w-full animate-fadeIn space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold">Define la Personalidad de tu Asistente</h3>
        <p className="text-sm text-muted-foreground">
          Escribe las instrucciones (prompt) que seguirá tu asistente. Esto define su comportamiento.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assistantPrompt" className="text-base font-medium">
          Prompt del Asistente
        </Label>
        <Textarea
          id="assistantPrompt"
          placeholder={EXAMPLE_PROMPT}
          value={assistantPrompt}
          onChange={handlePromptChange}
          className="text-sm min-h-[280px] lg:min-h-[320px] bg-muted/30"
          aria-required="true"
        />
        <p className="text-xs text-muted-foreground pt-1">
          Un buen prompt es claro y detallado. Describe quién es, su objetivo y cómo debe interactuar.
        </p>
      </div>
    </div>
  );
};

export default Step2AssistantPrompt;
