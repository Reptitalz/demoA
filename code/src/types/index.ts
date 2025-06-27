

export type AssistantPurposeType = "import_spreadsheet" | "notify_owner" | "notify_clients" | "create_smart_db";

export interface AssistantPurpose {
  id: AssistantPurposeType;
  name: string;
  description: string;
  icon?: React.ElementType; // For associating an icon
}

export type DatabaseSource = "google_sheets" | "smart_db"; 

export interface DatabaseConfig {
  id: string;
  name: string;
  source: DatabaseSource;
  details?: string; // For GSheet (orig Excel name), for SmartDB (could be description or same as name)
  accessUrl?: string; // Only for Google Sheets
}

export interface AssistantConfig {
  id: string;
  name: string;
  phoneLinked?: string;
  purposes: Set<AssistantPurposeType>;
  databaseId?: string;
  imageUrl?: string;
}

export type SubscriptionPlanType = "free" | "premium_179" | "business_270";

export interface SubscriptionPlanDetails {
  id: SubscriptionPlanType;
  name: string;
  priceMonthly: number;
  assistantLimit: number | "unlimited";
  features: string[];
  stripePriceId?: string;
}

export type AuthProviderType = "google";

export interface UserProfile {
  isAuthenticated: boolean;
  isGuest?: boolean;
  authProvider?: AuthProviderType;
  email?: string;
  currentPlan: SubscriptionPlanType | null;
  assistants: AssistantConfig[];
  databases: DatabaseConfig[];
  firebaseUid?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  ownerPhoneNumberForNotifications?: string;
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
    accessUrl?: string; // Only for Google Sheets
  };
  authMethod: AuthProviderType | null;
  selectedPlan: SubscriptionPlanType | null;
  ownerPhoneNumberForNotifications: string;
  isReconfiguring: boolean;
  editingAssistantId: string | null;
}

export interface AppState {
  wizard: WizardState;
  userProfile: UserProfile;
  isSetupComplete: boolean;
  isLoading: boolean;
}
