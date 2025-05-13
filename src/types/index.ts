

export type AssistantPurposeType = "import_db_google_sheets" | "import_db_excel" | "create_smart_db" | "notify_owner" | "notify_clients";

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
  // Placeholder for actual connection details or file info
  details?: string | File; 
}

export interface AssistantConfig {
  id: string;
  name: string;
  phoneLinked?: string; // As assistants are linked to phone numbers
  purposes: Set<AssistantPurposeType>;
  databaseId?: string; // Link to a DatabaseConfig
}

export type SubscriptionPlanType = "free" | "standard_39" | "premium_179" | "business_270";

export interface SubscriptionPlanDetails {
  id: SubscriptionPlanType;
  name: string;
  priceMonthly: number;
  assistantLimit: number | "unlimited";
  features: string[];
}

export type AuthProviderType = "google" | "no_account";

export interface UserProfile {
  isAuthenticated: boolean;
  authProvider?: AuthProviderType;
  email?: string;
  currentPlan: SubscriptionPlanType | null;
  assistants: AssistantConfig[];
  databases: DatabaseConfig[];
  firebaseUid?: string; // Optional: store Firebase UID
}

// For wizard state
export interface WizardState {
  currentStep: number;
  maxSteps: number;
  assistantName: string;
  selectedPurposes: Set<AssistantPurposeType>;
  databaseOption: {
    type: DatabaseSource | null;
    name?: string; // For smart_db or uploaded file
    file?: File | null; // For excel upload
  };
  authMethod: AuthProviderType | null;
  selectedPlan: SubscriptionPlanType | null;
}

export interface AppState {
  wizard: WizardState;
  userProfile: UserProfile;
  isSetupComplete: boolean;
  isLoading: boolean; // For global loading states
}
