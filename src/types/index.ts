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

export type AuthProviderType = "google" | "phone";

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
  phoneNumber?: string; 
  password?: string;
  assistants: AssistantConfig[];
  databases: DatabaseConfig[];
  firebaseUid?: string;
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
  authMethod: AuthProviderType | null;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  verificationCode?: string;
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
  userId: string;
  orderId: string;
  amount: number;
  currency: string;
  creditsPurchased: number;
  paymentMethod: string;
  status: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}
