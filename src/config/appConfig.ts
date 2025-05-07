import type { SubscriptionPlanDetails, AssistantPurpose } from '@/types';
import { Bot, DatabaseZap, FileSpreadsheet, UserCog, Users, DollarSign, CheckCircle2, Mail, MessageSquare } from 'lucide-react';

export const APP_NAME = "AssistAI Manager";
export const MAX_WIZARD_STEPS = 4;

export const assistantPurposesConfig: AssistantPurpose[] = [
  { id: "import_db_google_sheets", name: "Import from Google Sheets", description: "Connect and use data from an existing Google Sheet.", icon: FileSpreadsheet },
  { id: "import_db_excel", name: "Import from Excel", description: "Upload an Excel file to use as your database.", icon: FileSpreadsheet },
  { id: "create_smart_db", name: "Create Smart Database", description: "Let AI help you build an intelligent database.", icon: DatabaseZap },
  { id: "notify_owner", name: "Communicate with Owner", description: "Assistant will send updates and alerts to you via WhatsApp.", icon: UserCog },
  { id: "notify_clients", name: "Communicate with Clients", description: "Assistant will interact with your clients via WhatsApp.", icon: Users },
];

export const subscriptionPlansConfig: SubscriptionPlanDetails[] = [
  { 
    id: "free", 
    name: "Free Tier", 
    priceMonthly: 0, 
    assistantLimit: 1, 
    features: ["Basic assistant features", "Limited interactions", "Community support"] 
  },
  { 
    id: "standard_39", 
    name: "Standard Plan", 
    priceMonthly: 39, 
    assistantLimit: 1, 
    features: ["Full assistant features", "Increased interactions", "Email support"] 
  },
  { 
    id: "premium_179", 
    name: "Premium Plan (per Assistant)", 
    priceMonthly: 179, 
    assistantLimit: 1, // This is per assistant
    features: ["All Standard features", "Priority support", "Advanced analytics (soon)"] 
  },
  { 
    id: "business_270", 
    name: "Business Plan", 
    priceMonthly: 270, 
    assistantLimit: 5, 
    features: ["Up to 5 assistants", "All Premium features", "Dedicated account manager"] 
  },
];

export const WIZARD_STEP_TITLES: { [key: number]: string } = {
  1: "Configure Your Assistant",
  2: "Set Up Database",
  3: "Account Authentication",
  4: "Choose Your Plan",
};

export const AUTH_METHODS = [
  { id: "google", name: "Sign in with Google", icon: Mail },
  { id: "microsoft", name: "Sign in with Microsoft", icon: Mail },
];
