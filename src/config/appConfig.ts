
import type { AssistantPurpose, AuthProviderType } from '@/types';
import { FaGoogle, FaUserCog, FaUsers, FaBrain, FaKey, FaPhone, FaBell } from 'react-icons/fa';
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
  { 
    id: "notify_owner", 
    name: "Notificar al propietario por WhatsApp", 
    description: "El asistente te enviará notificaciones a tu número de WhatsApp personal cuando necesite tu atención.", 
    icon: FaBell 
  },
];

export const WIZARD_STEP_TITLES: { [key: number]: string } = {
  1: "Tipo de Asistente",
  2: "Detalles del Asistente",
  3: "Personalidad (Prompt)",
  4: "Base de Datos",
  5: "Términos y Condiciones",
  6: "Crear Cuenta"
};


export const AUTH_METHODS: Array<{id: AuthProviderType; name: string; icon: React.ElementType}> = [
  { id: "google", name: "Continuar con Google", icon: FaGoogle },
];

export const PRICE_PER_CREDIT = 65.00; // Precio base por crédito
export const MAX_CUSTOM_CREDITS = 100;
export const MESSAGES_PER_CREDIT = 1000;
export const MONTHLY_PLAN_CREDIT_COST = 179 / PRICE_PER_CREDIT; // Approx 2.75 -> Price is $179 MXN
export const UNLIMITED_MESSAGES_LIMIT = 1000000; // A high number to simulate unlimited

export const CREDIT_PACKAGES = [
  { credits: 1, price: 65.00, name: "Básico" },
  { credits: 5, price: 325.00, name: "Estándar" },
  { credits: 10, price: 650.00, name: "Pro" },
  { credits: 25, price: 1625.00, name: "Premium" },
];
