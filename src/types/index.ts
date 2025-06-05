
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
  name: string; // User-friendly name for this database (e.g., "Q4 Sales Report", "Client Contacts Sheet")
  source: DatabaseSource;
  details?: string; // Original Excel filename, or other non-URL details.
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
    name?: string; // User-friendly name for GSheet/SmartDB, or Excel filename by default
    file?: File | null; // For excel upload
    accessUrl?: string; // For GSheet URL (provided or generated)
    // spreadsheetId?: string; // Optional: if we need to store the GSheet ID separately
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
