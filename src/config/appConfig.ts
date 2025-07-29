
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

export const PRICE_PER_CREDIT = 50; 
export const MAX_CUSTOM_CREDITS = 100;
export const MESSAGES_PER_CREDIT = 1000;

// Calculated credits for the 5 MXN test plan. 5 MXN / 50 MXN per credit = 0.1 credits
export const CREDITS_FOR_TEST_PLAN = 0.1;

export const CREDIT_PACKAGES = [
  { credits: CREDITS_FOR_TEST_PLAN, price: 5.00, name: "Prueba" },
  { credits: 1, price: 50.00, name: "Básico" },
  { credits: 5, price: 250.00, name: "Estándar" },
  { credits: 10, price: 500.00, name: "Pro" },
  { credits: 25, price: 1250.00, name: "Premium" },
];

    
