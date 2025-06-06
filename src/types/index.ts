
export type AssistantPurposeType = "import_spreadsheet" | "create_smart_db" | "notify_owner" | "notify_clients";

export interface AssistantPurpose {
  id: AssistantPurposeType;
  name: string;
  description: string;
  icon?: React.ElementType; // For associating an icon
}

export type DatabaseSource = "google_sheets" | "excel" | "smart_db";

export interface DatabaseConfig {
  id: string; // Unique ID for this DB config
  name: string; // User-friendly name (e.g., GSheet name from API/user, SmartDB name from user, original Excel filename if source is 'excel' but unprocessed)
  source: DatabaseSource;
  details?: string; // Original Excel filename if source is 'google_sheets' (from a processed Excel) or if source is 'excel' (unprocessed).
  accessUrl?: string; // URL to access/edit the Google Sheet (whether linked directly or generated from Excel)
}

export interface AssistantConfig {
  id: string;
  name: string;
  phoneLinked?: string; // As assistants are linked to phone numbers
  purposes: Set<AssistantPurposeType>;
  databaseId?: string; // Link to a DatabaseConfig
  imageUrl?: string; // Image URL for the assistant
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
    name?: string; // User-friendly name for GSheet/SmartDB, or target GSheet name for Excel processing
    file?: File | null; // For excel upload
    accessUrl?: string; // For GSheet URL (provided or generated)
    originalFileName?: string; // To store original Excel filename if processed to GSheet
  };
  authMethod: AuthProviderType | null;
  selectedPlan: SubscriptionPlanType | null;
  customPhoneNumber?: string;
  isReconfiguring: boolean;
  editingAssistantId: string | null;
}

export interface AppState {
  wizard: WizardState;
  userProfile: UserProfile;
  isSetupComplete: boolean;
  isLoading: boolean;
}
