// src/services/outboundWebhookService.ts
'use server';

import type { UserProfile, AssistantConfig, DatabaseConfig, DatabaseSource } from '@/types';
import axios from 'axios';

interface AssistantWebhookPayload {
  timestamp: string;
  event: 'assistant_created';
  userProfile: {
    firebaseUid?: string;
    email?: string;
    currentPlan: UserProfile['currentPlan'];
    stripeCustomerId?: string;
    virtualPhoneNumber?: string; // Número de Vonage principal de la cuenta
  };
  assistant: {
    id: string;
    name: string;
    phoneLinked?: string; // Número vinculado directamente al asistente
    purposes: string[]; // Convertido a array
    database?: {
      id: string;
      name: string;
      source: DatabaseSource;
      details?: string;
    } | null;
  };
  // NO SE INCLUYEN VONAGE_API_KEY y VONAGE_API_SECRET por seguridad.
  // La aplicación receptora debe usar sus propias credenciales de Vonage
  // para interactuar con la API de Vonage si es necesario, usando el phoneLinked.
}

const USER_ASSISTANT_WEBHOOK_URL = process.env.USER_ASSISTANT_WEBHOOK_URL;

export async function sendAssistantCreatedWebhook(
  userProfile: UserProfile,
  assistant: AssistantConfig,
  assistantDatabase: DatabaseConfig | null
): Promise<void> {
  if (!USER_ASSISTANT_WEBHOOK_URL) {
    console.log('USER_ASSISTANT_WEBHOOK_URL no está configurado en las variables de entorno. Omitiendo envío de webhook.');
    return;
  }

  const payload: AssistantWebhookPayload = {
    timestamp: new Date().toISOString(),
    event: 'assistant_created',
    userProfile: {
      firebaseUid: userProfile.firebaseUid,
      email: userProfile.email,
      currentPlan: userProfile.currentPlan,
      stripeCustomerId: userProfile.stripeCustomerId,
      virtualPhoneNumber: userProfile.virtualPhoneNumber,
    },
    assistant: {
      id: assistant.id,
      name: assistant.name,
      phoneLinked: assistant.phoneLinked,
      purposes: Array.from(assistant.purposes || new Set()), // Asegurar que purposes sea un array
      database: assistantDatabase
        ? {
            id: assistantDatabase.id,
            name: assistantDatabase.name,
            source: assistantDatabase.source,
            details: typeof assistantDatabase.details === 'string' ? assistantDatabase.details : assistantDatabase.details?.name,
          }
        : null,
    },
  };

  try {
    console.log(`Enviando webhook 'assistant_created' a ${USER_ASSISTANT_WEBHOOK_URL} para el asistente ${assistant.id} del usuario ${userProfile.firebaseUid || userProfile.email}`);
    const response = await axios.post(USER_ASSISTANT_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000, // Timeout de 10 segundos
    });
    console.log(`Webhook 'assistant_created' enviado exitosamente a ${USER_ASSISTANT_WEBHOOK_URL}. Status: ${response.status}`);
  } catch (error) {
    const axiosError = error as import('axios').AxiosError;
    console.error(`Error al enviar el webhook 'assistant_created' a ${USER_ASSISTANT_WEBHOOK_URL}:`, axiosError.isAxiosError ? (axiosError.response?.data || axiosError.message) : String(error));
    // En un entorno de producción, considera estrategias de reintento o un sistema de colas para errores.
  }
}
