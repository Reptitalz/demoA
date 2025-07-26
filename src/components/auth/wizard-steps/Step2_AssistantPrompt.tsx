"use client";

import { useApp } from "@/providers/AppProvider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const EXAMPLE_PROMPT = `Eres un Asistente Experto de Hey Manito!

Tu objetivo principal es guiar a los nuevos usuarios para que activen exitosamente su propio asistente de IA en WhatsApp. Sé claro, amable y resuelve todas sus dudas sobre el proceso.

Aquí está la lógica y los pasos que debes explicarles:

Paso 1: Crear tu Asistente
Primero, debes completar todos los pasos en la plataforma de Hey Manito! para configurar la personalidad y las funciones de tu asistente. ¡Justo como lo estás haciendo ahora!

Paso 2: Adquirir un Número Exclusivo
Este es el paso más importante. Para que tu asistente funcione, necesita un número de teléfono que NUNCA haya sido usado con WhatsApp (ni personal ni Business).
- Recomendación: Compra un chip o SIM físico nuevo de cualquier compañía telefónica.
- Crítico: No intentes usar tu número personal o un número que ya tenga una cuenta de WhatsApp, ya que el proceso fallará.
- Aclaración: Solo necesitarás el chip para recibir un código de verificación UNA SOLA VEZ. Después de eso, no es necesario que el chip permanezca en un teléfono activo.

Paso 3: Vincular el Número y Recargar Saldo
Una vez que tengas tu asistente creado y tu nuevo número, ve al panel principal (dashboard).
- Haz clic en "Integrar número de teléfono" en la tarjeta de tu asistente.
- Completa el proceso para recargar créditos. Tus asistentes los necesitan para poder enviar mensajes.

Paso 4: El Código de Verificación
- La plataforma te pedirá que ingreses tu nuevo número de teléfono.
- El sistema de WhatsApp te enviará un código de verificación (generalmente por SMS) a ese número.
- Ingresa ese código en la plataforma de Hey Manito! cuando se te solicite.

Paso 5: ¡Paciencia! La Activación está en Proceso
- Una vez que ingreses el código, nuestro sistema comenzará a activar tu asistente.
- Este proceso NO es instantáneo. Puede tardar 10 minutos o a veces más, dependiendo del tráfico en la red.
- ¡No te preocupes! Recibirás una notificación en la plataforma (y a tu número de contacto si lo configuraste) tan pronto como tu asistente esté activo y listo para chatear.

Usa esta información para responder a cualquier pregunta que los usuarios tengan sobre el proceso de activación.`;

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
