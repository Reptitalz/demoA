export type AssistantPurposeType = "import_spreadsheet" | "notify_owner" | "notify_clients" | "create_smart_db";

export interface AssistantPurpose {
  id: AssistantPurposeType;
  name: string;
  description: string;
  icon?: React.ElementType;
}

export type DatabaseSource = "google_sheets" | "smart_db"; 

export interface DatabaseConfig {
  id: string;
  name: string;
  source: DatabaseSource;
  details?: string;
  accessUrl?: string;
}

export interface AssistantBusinessInfo {
  companyEmail?: string;
  companyAddress?: string;
  googleMapsUrl?: string;
  openingHours?: string;
  websiteUrl?: string;
}

export interface AssistantConfig {
  id: string;
  name: string;
  prompt?: string;
  phoneLinked?: string;
  purposes: Set<AssistantPurposeType>;
  databaseId?: string;
  imageUrl?: string;
  verificationCode?: string;
  numberReady?: boolean;
  businessInfo?: AssistantBusinessInfo;
}

export type AuthProviderType = "google" | "phone"; // Added "phone"

export interface AppNotification {
  _id?: string;
  userId: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  read: boolean;
  link?: string;
  createdAt: Date;
}

export interface UserProfile {
  isAuthenticated: boolean;
  authProvider?: AuthProviderType;
  email?: string;
  phoneNumber?: string; // Main identifier now
  password?: string; // For auth, will not be sent to client
  assistants: AssistantConfig[];
  databases: DatabaseConfig[];
  firebaseUid?: string; // Kept for legacy or other potential uses
  ownerPhoneNumberForNotifications?: string;
  credits: number;
  pushSubscriptions?: PushSubscriptionJSON[];
}

export interface WizardState {
  currentStep: number;
  maxSteps: number;
  assistantName: string;
  assistantPrompt: string;
  selectedPurposes: Set<AssistantPurposeType>;
  databaseOption: {
    type: DatabaseSource | null;
    name?: string;
    accessUrl?: string;
  };
  authMethod: AuthProviderType | null; // For wizard flow logic
  phoneNumber?: string; // For registration
  password?: string; // For registration
  confirmPassword?: string; // For registration
  verificationCode?: string; // For registration
  ownerPhoneNumberForNotifications: string;
  isReconfiguring: boolean;
  editingAssistantId: string | null;
  acceptedTerms: boolean;
}

export interface AppState {
  wizard: WizardState;
  userProfile: UserProfile;
  isSetupComplete: boolean;
  isLoading: boolean;
}

export interface Transaction {
  _id?: string;
  userId: string; // Firebase UID or Phone Number
  orderId: string; // Mercado Pago Payment ID
  amount: number; // Amount in MXN (e.g., 58.00)
  currency: string; // e.g., 'MXN'
  creditsPurchased: number;
  paymentMethod: string; // e.g., 'spei', 'oxxo', 'debit_card'
  status: string; // e.g., 'approved'
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}
