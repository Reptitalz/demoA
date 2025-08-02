
import { ObjectId } from 'mongodb';

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
  selectedColumns?: string[];
  relevantColumnsDescription?: string;
  storageSize?: number; // in bytes
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
  monthlyMessageLimit?: number;
  messagesSentThisMonth?: number;
}

export type AuthProviderType = "google" | "phone";

export interface UserAddress {
  street_name?: string;
  street_number?: string;
  zip_code?: string;
  city?: string;
  state?: string;
}

export interface UserProfile {
  _id?: ObjectId;
  isAuthenticated: boolean;
  authProvider?: AuthProviderType;
  email?: string;
  firstName?: string;
  lastName?: string;
  address?: UserAddress;
  phoneNumber?: string; 
  password?: string;
  assistants: AssistantConfig[];
  databases: DatabaseConfig[];
  ownerPhoneNumberForNotifications?: string;
  credits: number;
  recoveryToken?: string;
  recoveryTokenExpiry?: Date;
  pushSubscriptions?: any[]; // For web push notifications
  verificationCode?: string; // For sign-up verification
  verificationCodeExpiry?: Date;
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
    selectedColumns?: string[];
    relevantColumnsDescription?: string;
  };
  authMethod: AuthProviderType | null;
  // User details
  firstName: string;
  lastName: string;
  email: string;
  address: UserAddress;
  // Credentials
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

export interface AppNotification {
  _id?: string | ObjectId;
  userId: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  read: boolean;
  createdAt: string; // ISO 8601 string
  link?: string;
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
