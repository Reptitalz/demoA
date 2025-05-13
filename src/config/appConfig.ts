
import type { SubscriptionPlanDetails, AssistantPurpose, AuthProviderType } from '@/types';
import { FaFileExcel, FaBrain, FaUserCog, FaUsers, FaEnvelope, FaUserTimes, FaGoogle } from 'react-icons/fa';

export const APP_NAME = "Hey Manito!";
export const MAX_WIZARD_STEPS = 4;

export const assistantPurposesConfig: AssistantPurpose[] = [
  { id: "import_db_google_sheets", name: "Importar desde Hojas de cálculo de Google", description: "Conecta y usa datos de una Hoja de cálculo de Google existente.", icon: FaFileExcel },
  { id: "import_db_excel", name: "Importar desde Excel", description: "Sube un archivo de Excel para usarlo como tu base de datos.", icon: FaFileExcel },
  { id: "create_smart_db", name: "Crear Base de Datos Inteligente", description: "Deja que la IA te ayude a construir una base de datos inteligente.", icon: FaBrain },
  { id: "notify_owner", name: "Comunicarse con el Propietario", description: "El asistente te enviará actualizaciones y alertas vía WhatsApp.", icon: FaUserCog },
  { id: "notify_clients", name: "Comunicarse con Clientes", description: "El asistente interactuará con tus clientes vía WhatsApp.", icon: FaUsers },
];

export const subscriptionPlansConfig: SubscriptionPlanDetails[] = [
  { 
    id: "free", 
    name: "Nivel Gratuito", 
    priceMonthly: 0, 
    assistantLimit: 1, 
    features: ["Funciones básicas de asistente", "Interacciones limitadas", "Soporte comunitario"] 
  },
  { 
    id: "standard_39", 
    name: "Plan Estándar", 
    priceMonthly: 39, 
    assistantLimit: 1, 
    features: ["Funciones completas de asistente", "Mayor cantidad de interacciones", "Soporte por correo electrónico"] 
  },
  { 
    id: "premium_179", 
    name: "Plan Premium (por Asistente)", 
    priceMonthly: 179, 
    assistantLimit: 1, // This is per assistant
    features: ["Todas las funciones Estándar", "Soporte prioritario", "Analíticas avanzadas (próximamente)"] 
  },
  { 
    id: "business_270", 
    name: "Plan de Negocios", 
    priceMonthly: 270, 
    assistantLimit: 5, 
    features: ["Hasta 5 asistentes", "Todas las funciones Premium", "Gestor de cuenta dedicado"] 
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
  { id: "no_account", name: "Iniciar sesión sin cuenta", icon: FaUserTimes },
];

