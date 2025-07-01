
import type { AssistantPurpose, AuthProviderType } from '@/types';
import { FaGoogle, FaUserCog, FaUsers, FaBrain } from 'react-icons/fa';
import type React from 'react';

export const APP_NAME = "Hey Manito!";
export const MAX_WIZARD_STEPS = 5; // Details, Prompt, DB(opt), Auth, Terms
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
  4: "Autenticación",
  5: "Términos y Condiciones",
};

export const AUTH_METHODS: Array<{id: AuthProviderType; name: string; icon: React.ElementType}> = [
  { id: "google", name: "Continuar con Google", icon: FaGoogle },
];

export const CREDIT_PACKAGES = [
  { credits: 1, price: 50, name: "Básico" },
  { credits: 5, price: 240, name: "Estándar" },
  { credits: 10, price: 450, name: "Pro" },
  { credits: 25, price: 1000, name: "Premium" },
];

export const MESSAGES_PER_CREDIT = 1000;
