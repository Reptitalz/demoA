
export type AssistantPurposeType = "import_spreadsheet" | "notify_owner" | "notify_clients";

export interface AssistantPurpose {
  id: AssistantPurposeType;
  name: string;
  description: string;
  icon?: React.ElementType; // For associating an icon
}

export type DatabaseSource = "google_sheets"; // Only Google Sheets now

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
    accessUrl?: string;
    // file and originalFileName removed
  };
  authMethod: AuthProviderType | null;
  selectedPlan: SubscriptionPlanType | null;
  customPhoneNumber?: string;
  isReconfiguring: boolean;
  editingAssistantId: string | null;
  // pendingExcelProcessing removed
}

export interface AppState {
  wizard: WizardState;
  userProfile: UserProfile;
  isSetupComplete: boolean;
  isLoading: boolean;
}
