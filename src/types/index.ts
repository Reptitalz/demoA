
import { ObjectId } from 'mongodb';
import type { DefaultSession } from 'next-auth';

// Extend the built-in Session type to include the user's ID
declare module 'next-auth' {
  interface Session {
    user?: {
      id: string;
    } & DefaultSession['user'];
  }
}


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
  sheetName?: string;
  selectedColumns?: string[];
  relevantColumnsDescription?: string;
  storageSize?: number; // in bytes
}

export interface AssistantBusinessInfo {
  companyEmail?: string;
  companyAddress?: string;
  openingHours?: string;
  websiteUrl?: string;
  vertical?: string; // e.g. "Restaurant", "Clothing", etc.
}

export interface GupshupConfig {
    appId: string;
    apiKey: string;
}

export interface GoogleSheetsTool {
  enabled: boolean;
  spreadsheetUrl?: string;
  sheetName?: string;
}

export interface AssistantTools {
  googleSheets?: GoogleSheetsTool;
}

export interface AssistantConfig {
  id: string;
  name: string;
  prompt?: string;
  isActive: boolean;
  messageCount: number;
  monthlyMessageLimit: number;
  phoneLinked?: string;
  webhookPath?: string;
  imageUrl?: string;
  purposes: string[]; // Changed from AssistantPurposeType[] to string[]
  databaseId?: string | null;
  verificationCode?: string;
  numberReady?: boolean;
  businessInfo?: AssistantBusinessInfo;
  gupshupConfig?: GupshupConfig;
  tools?: AssistantTools;
  timezone?: string;
}

export type AuthProviderType = "google" | "phone" | "email";

export interface UserAddress {
  street_name?: string;
  street_number?: string;
  zip_code?: string;
  city?: string;
  state?: string;
}

export interface CollaboratorProfile {
  _id?: ObjectId;
  firebaseUid: string;
  isAuthenticated: boolean;
  email: string;
  firstName?: string;
  lastName?: string;
  referralCode: string;
  referredUsers: ObjectId[]; // Array of UserProfile IDs
  totalEarnings: number;
  conversionRate: number;
}

export interface UserProfile {
  _id?: ObjectId;
  firebaseUid: string; // This will now hold the user's unique ID from next-auth
  isAuthenticated: boolean;
  authProvider: AuthProviderType;
  email: string;
  firstName?: string;
  lastName?: string;
  address?: UserAddress;
  assistants: AssistantConfig[];
  databases: DatabaseConfig[];
  ownerPhoneNumberForNotifications?: string;
  credits: number;
  pushSubscriptions?: any[];
  referredBy?: ObjectId; // Link to CollaboratorProfile
}

export interface WizardState {
  currentStep: number;
  assistantName: string;
  assistantPrompt: string;
  selectedPurposes: Set<AssistantPurposeType>;
  databaseOption: {
    type: DatabaseSource | null;
    name?: string;
    accessUrl?: string;
    sheetNames?: string[];
    selectedSheetName?: string;
    selectedColumns?: string[];
    relevantColumnsDescription?: string;
  };
  authMethod: AuthProviderType | null;
  // User details, now optional in the wizard itself
  firstName: string;
  lastName: string;
  email: string;
  address: UserAddress;
  ownerPhoneNumberForNotifications: string;
  isReconfiguring: boolean;
  editingAssistantId: string | null;
  acceptedTerms: boolean;
}

export interface LoadingStatus {
    active: boolean;
    message: string;
    progress: number;
}

export interface AppState {
  wizard: WizardState;
  userProfile: UserProfile;
  isSetupComplete: boolean;
  loadingStatus: LoadingStatus;
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
