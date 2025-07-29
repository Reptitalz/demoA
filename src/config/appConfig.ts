
import type { AssistantPurpose, AuthProviderType } from '@/types';
import { FaGoogle, FaUserCog, FaUsers, FaBrain, FaKey, FaPhone } from 'react-icons/fa';
import type React from 'react';

export const APP_NAME = "Hey Manito!";
export const DEFAULT_ASSISTANT_IMAGE_URL = "https://placehold.co/100x100.png";
export const DEFAULT_ASSISTANT_IMAGE_HINT = "assistant avatar";

export const assistantPurposesConfig: AssistantPurpose[] = [
  {
    id: "import_spreadsheet",
    name: "Vincular Hoja de Google Existente",
    description: "Conecta y usa datos desde una Hoja de Google existente.",
    icon: FaGoogle
  },
  { 
    id: "create_smart_db", 
    name: "Crear Base de Datos Inteligente", 
    description: "Permite que la IA gestione una base de datos interna para el asistente.", 
    icon: FaBrain 
  },
  { id: "notify_owner", name: "Comunicarse con el Propietario", description: "El asistente te enviará actualizaciones y alertas vía WhatsApp.", icon: FaUserCog },
  { id: "notify_clients", name: "Comunicarse con Clientes", description: "El asistente interactuará con tus clientes vía WhatsApp.", icon: FaUsers },
];

export const WIZARD_STEP_TITLES: { [key: number]: string } = {
  1: "Detalles del Asistente",
  2: "Personalidad (Prompt)",
  3: "Base de Datos",
  4: "Credenciales de Cuenta",
  5: "Verificación",
  6: "Términos y Condiciones",
};

export const MAX_WIZARD_STEPS = 6;

export const AUTH_METHODS: Array<{id: AuthProviderType; name: string; icon: React.ElementType}> = [
  { id: "phone", name: "Continuar con Teléfono", icon: FaPhone },
];

// If 1000 messages cost 50 MXN (1 credit), then 10 messages cost 0.5 MXN.
// This corresponds to 0.01 credits.
export const PRICE_PER_CREDIT = 50; 
export const MAX_CUSTOM_CREDITS = 100;
export const MESSAGES_PER_CREDIT_FOR_CUSTOM_PLAN = 10;
export const CREDITS_FOR_CUSTOM_PLAN = 0.01;


// Prices are now the final amount in MXN.
export const CREDIT_PACKAGES = [
  { credits: CREDITS_FOR_CUSTOM_PLAN, price: 1.00, name: "Prueba" },
  { credits: 1, price: 50, name: "Básico" },
  { credits: 5, price: 250, name: "Estándar" },
  { credits: 10, price: 500, name: "Pro" },
  { credits: 25, price: 1250, name: "Premium" },
];

export const MESSAGES_PER_CREDIT = 1000;

    