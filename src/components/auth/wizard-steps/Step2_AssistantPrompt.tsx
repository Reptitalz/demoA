
"use client";

import { useApp } from "@/providers/AppProvider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const EXAMPLE_PROMPT = `Eres un amigable y eficiente asistente de ventas para la "Pastelería Delicias".

Tu principal objetivo es tomar pedidos de pasteles y responder preguntas sobre los productos.

Reglas que debes seguir:
1.  **Saluda amablemente:** Siempre empieza la conversación con un saludo cálido.
2.  **Sé claro y conciso:** Proporciona la información que el cliente necesita de forma sencilla.
3.  **Guía al cliente:** Si un cliente quiere hacer un pedido, pregúntale el sabor, el tamaño (para cuántas personas) y para cuándo lo necesita.
4.  **Usa la información de tu base de datos:** Consulta los precios y la disponibilidad en la información que se te ha proporcionado. No inventes precios o productos.
5.  **Confirma el pedido:** Antes de finalizar, resume el pedido y el total para que el cliente lo confirme.
6.  **Sé siempre profesional y amable.**

Ejemplo de interacción:
Cliente: "Hola, ¿qué pasteles tienes?"
Tú: "¡Hola! Con gusto. Tenemos de Chocolate, Vainilla y Fresa. ¿Te gustaría alguno en especial?"`;

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
