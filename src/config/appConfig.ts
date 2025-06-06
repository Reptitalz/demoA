
import type { SubscriptionPlanDetails, AssistantPurpose, AuthProviderType, SubscriptionPlanType } from '@/types';
import { FaFileExcel, FaUserCog, FaUsers, FaUserTimes, FaGoogle, FaCheckCircle, FaChartLine, FaBriefcase, FaFlask } from 'react-icons/fa';
import type React from 'react';

export const APP_NAME = "Hey Manito!";
export const MAX_WIZARD_STEPS = 4; // This might reduce if DB step is always present and auth always present
export const DEFAULT_ASSISTANTS_LIMIT_FOR_FREE_PLAN = 1;
export const DEFAULT_ASSISTANT_IMAGE_URL = "https://placehold.co/100x100.png";
export const DEFAULT_ASSISTANT_IMAGE_HINT = "assistant avatar";


export const assistantPurposesConfig: AssistantPurpose[] = [
  {
    id: "import_spreadsheet",
    name: "Vincular Hoja de Google Existente",
    description: "Conecta y usa datos desde una Hoja de Google existente.",
    icon: FaGoogle // Changed icon
  },
  // "create_smart_db" removed
  { id: "notify_owner", name: "Comunicarse con el Propietario", description: "El asistente te enviará actualizaciones y alertas vía WhatsApp.", icon: FaUserCog },
  { id: "notify_clients", name: "Comunicarse con Clientes", description: "El asistente interactuará con tus clientes vía WhatsApp.", icon: FaUsers },
];

export const DEFAULT_FREE_PLAN_PHONE_NUMBER = "+523344090167"; // Standardized format

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
    name: "Plan Premium (1er mes $39)",
    priceMonthly: 179,
    assistantLimit: 1,
    features: ["Oferta especial: Primer mes a $39 USD", "Luego $179 USD/mes por asistente", "Todas las funciones completas de asistente", "Soporte prioritario", "Analíticas avanzadas (próximamente)", "Número de Vonage dedicado (EE. UU.)"],
    stripePriceId: "price_1RQdzjBwdSNcDr02SfU6zNHW"
  },
  {
    id: "business_270",
    name: "Plan de Negocios",
    priceMonthly: 270,
    assistantLimit: 5,
    features: ["Hasta 5 asistentes", "Todas las funciones Premium", "Gestor de cuenta dedicado", "Proporciona tus propios números para asistentes", "Número de Vonage adicional para la cuenta (EE. UU.)"],
    stripePriceId: "price_1RQenGBwdSNcDr02fU9nVQkg"
  },
  {
    id: "test_plan",
    name: "Plan de Prueba (Webhook)",
    priceMonthly: 0,
    assistantLimit: 1,
    features: ["Solo para pruebas de webhook", "Genera número de teléfono aleatorio", "No usa Vonage ni Stripe", "Asistente funcional con webhook"]
  }
];

export const WIZARD_STEP_TITLES: { [key: number]: string } = {
  1: "Configura tu Asistente",
  2: "Configura la Base de Datos", // This title remains, but content changes
  3: "Autenticación de Cuenta",
  4: "Elige tu Plan",
};

export const AUTH_METHODS: Array<{id: AuthProviderType; name: string; icon: React.ElementType}> = [
  { id: "google", name: "Iniciar sesión con Google", icon: FaGoogle },
  { id: "no_account", name: "Iniciar sesión sin cuenta", icon: FaUserTimes },
];

export const planIcons: { [key in SubscriptionPlanType]: React.ElementType } = {
  free: FaCheckCircle,
  premium_179: FaChartLine,
  business_270: FaBriefcase,
  test_plan: FaFlask, // Icon for test plan
};
