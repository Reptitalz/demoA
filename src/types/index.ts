
export type AssistantPurposeType = "import_spreadsheet" | "create_smart_db" | "notify_owner" | "notify_clients";

export interface AssistantPurpose {
  id: AssistantPurposeType;
  name: string;
  description: string;
  icon?: React.ElementType; // For associating an icon
}

export type DatabaseSource = "google_sheets" | "excel" | "smart_db";

export interface DatabaseConfig {
  id: string; 
  name: string; 
  source: DatabaseSource;
  details?: string; 
  accessUrl?: string; 
}

export interface AssistantConfig {
  id: string;
  name: string;
  phoneLinked?: string; 
  purposes: Set<AssistantPurposeType>;
  databaseId?: string; 
  imageUrl?: string; 
}

export type SubscriptionPlanType = "free" | "premium_179" | "business_270" | "test_plan";

export interface SubscriptionPlanDetails {
  id: SubscriptionPlanType;
  name: string;
  priceMonthly: number;
  assistantLimit: number | "unlimited";
  features: string[];
  stripePriceId?: string;
}

export type AuthProviderType = "google" | "no_account";

export interface UserProfile {
  isAuthenticated: boolean;
  authProvider?: AuthProviderType;
  email?: string;
  currentPlan: SubscriptionPlanType | null;
  assistants: AssistantConfig[];
  databases: DatabaseConfig[];
  firebaseUid?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  virtualPhoneNumber?: string;
  vonageNumberStatus?: 'active' | 'pending_cancellation' | 'cancelled';
  countryCodeForVonageNumber?: string;
}

// For wizard state
export interface WizardState {
  currentStep: number;
  maxSteps: number;
  assistantName: string;
  selectedPurposes: Set<AssistantPurposeType>;
  databaseOption: {
    type: DatabaseSource | null;
    name?: string; 
    file?: File | null; 
    accessUrl?: string; 
    originalFileName?: string; 
  };
  authMethod: AuthProviderType | null;
  selectedPlan: SubscriptionPlanType | null;
  customPhoneNumber?: string;
  isReconfiguring: boolean;
  editingAssistantId: string | null;
  pendingExcelProcessing?: {
    file: File | null;
    targetSheetName: string;
    originalFileName: string; 
  } | null;
}

export interface AppState {
  wizard: WizardState;
  userProfile: UserProfile;
  isSetupComplete: boolean;
  isLoading: boolean;
}
