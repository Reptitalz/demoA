
import type { SubscriptionPlanDetails, AssistantPurpose, AuthProviderType, SubscriptionPlanType } from '@/types';
import { FaGoogle, FaUserCog, FaUsers, FaUserTimes, FaCheckCircle, FaChartLine, FaBriefcase, FaFlask, FaBrain } from 'react-icons/fa';
import type React from 'react';

export const APP_NAME = "Hey Manito!";
export const MAX_WIZARD_STEPS = 4; 
export const DEFAULT_ASSISTANTS_LIMIT_FOR_FREE_PLAN = 1;
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

export const subscriptionPlansConfig: SubscriptionPlanDetails[] = [
  {
    id: "free",
    name: "Nivel Gratuito",
    priceMonthly: 0,
    assistantLimit: DEFAULT_ASSISTANTS_LIMIT_FOR_FREE_PLAN,
    features: [`${DEFAULT_ASSISTANTS_LIMIT_FOR_FREE_PLAN} asistente básico`, "Interacciones limitadas", "Soporte comunitario", `Número telefónico: ${DEFAULT_FREE_PLAN_PHONE_NUMBER}`]
  },
  {
    id: "premium_179",
    name: "Plan Pro",
    priceMonthly: 179,
    assistantLimit: 1,
    features: ["1 asistente", "Todas las funciones completas de asistente", "Soporte prioritario", "Analíticas avanzadas (próximamente)", "Permite vincular tu propio número de teléfono nuevo"],
    stripePriceId: "price_1RQdzjBwdSNcDr02SfU6zNHW"
  },
  {
    id: "business_270",
    name: "Plan de Negocios (Próximamente)",
    priceMonthly: 270,
    assistantLimit: 5,
    features: ["Hasta 5 asistentes", "Todas las funciones Pro", "Gestor de cuenta dedicado", "Adquisición de números virtuales con costo adicional"],
    stripePriceId: undefined
  },
];

export const WIZARD_STEP_TITLES: { [key: number]: string } = {
  1: "Configura tu Asistente",
  2: "Configura la Base de Datos",
  3: "Autenticación de Cuenta",
  4: "Elige tu Plan",
};

export const AUTH_METHODS: Array<{id: AuthProviderType; name: string; icon: React.ElementType}> = [
  { id: "google", name: "Iniciar sesión con Google", icon: FaGoogle },
];

export const planIcons: { [key in SubscriptionPlanType]: React.ElementType } = {
  free: FaCheckCircle,
  premium_179: FaChartLine,
  business_270: FaBriefcase,
};

    