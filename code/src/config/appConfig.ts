
import type { AssistantPurpose, AuthProviderType } from '@/types';
import { FaGoogle, FaUserCog, FaUsers, FaBrain } from 'react-icons/fa';
import type React from 'react';

export const APP_NAME = "Hey Manito!";
export const MAX_WIZARD_STEPS = 3; 
export const DEFAULT_ASSISTANTS_LIMIT_FOR_FREE_PLAN = 1; // This can be used for guest mode or future limits
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

export const DEFAULT_FREE_PLAN_PHONE_NUMBER = "+523344090167"; 

export const WIZARD_STEP_TITLES: { [key: number]: string } = {
  1: "Configura tu Asistente",
  2: "Configura la Base de Datos",
  3: "Autenticación de Cuenta",
};

export const AUTH_METHODS: Array<{id: AuthProviderType; name: string; icon: React.ElementType}> = [
  { id: "google", name: "Iniciar sesión con Google", icon: FaGoogle },
];
