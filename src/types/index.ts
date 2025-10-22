

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


export type AssistantPurposeType = "import_spreadsheet" | "notify_owner" | "notify_clients" | "create_smart_db" | "sell_credits" | "sell_products" | "manage_authorizations";

export interface AssistantPurpose {
  id: AssistantPurposeType;
  name: string;
  description: string;
  icon?: React.ElementType;
}

export type DatabaseSource = "google_sheets" | "smart_db"; 

export interface Product {
    _id?: ObjectId;
    id: string;
    catalogId: string;
    ownerId: string; // ID of the user who owns the product
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    location: string; // e.g., "Ciudad de México"
    seller?: string;
}

export interface CartItem extends Product {
    quantity: number;
}


export interface Catalog {
  id: string;
  name: string;
  promoterType: 'user' | 'bot';
  promoterId: string; // userProfile._id or assistant.id
  products: Product[]; // This will now just hold IDs or be deprecated in favor of a separate collection
}

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

export interface GoogleSheetsTool {
  enabled: boolean;
  spreadsheetUrl?: string;
  sheetName?: string;
}

export interface AssistantTools {
  googleSheets?: GoogleSheetsTool;
}

export interface Authorization {
  id: string;
  messageId?: number; // from IndexedDB if applicable
  product: string; // e.g. 'Comprobante (imagen)'
  fileName?: string;
  userName: string; // from userIdentifier
  chatPath: string; // session ID
  amount: number;
  receiptUrl: string; // data URL
  receivedAt: string; // ISO date string
  status: 'pending' | 'completed' | 'rejected';
}

export interface AssistantConfig {
  id: string;
  name: string;
  type: 'desktop' | 'whatsapp';
  prompt?: string;
  isActive: boolean;
  messageCount: number;
  monthlyMessageLimit: number;
  phoneLinked?: string;
  webhookPath?: string;
  chatPath?: string; // New field for desktop assistant chat path
  imageUrl?: string;
  purposes: string[];
  databaseId?: string | null;
  catalogId?: string | null;
  verificationCode?: string;
  numberReady?: boolean;
  businessInfo?: AssistantBusinessInfo;
  tools?: AssistantTools;
  timezone?: string;
  isFirstDesktopAssistant?: boolean;
  trialStartDate?: string;
  isPlanActive?: boolean;
  accountType?: 'personal' | 'business'; // Added for business verification badge
  authorizations?: Authorization[];
}

export type AuthProviderType = "google" | "phone" | "email";

export interface UserAddress {
  street_name?: string;
  street_number?: string;
  zip_code?: string;
  city?: string;
  state?: string;
}

export interface CollaboratorBankInfo {
    bankName?: string;
    accountHolder?: string;
    clabe?: string;
}

export interface RequiredDocument {
  id: string;
  title: string;
}

/**
 * Representa una plantilla o "tipo" de crédito que ofreces.
 * Esto define los términos generales de un crédito que tus asistentes pueden ofrecer.
 */
export interface CreditOffer {
  id: string; // ID único para la oferta de crédito
  name: string; // Nombre descriptivo, ej: "Crédito Emprendedor"
  amount: number; // Monto máximo a ofrecer
  interest: number; // Tasa de interés mensual (ej: 10 para 10%)
  profitPerPayment: number; // Ganancia que obtienes por cada pago recibido
  term: number; // Duración del crédito (ej: 12)
  termUnit: 'weeks' | 'fortnights' | 'months'; // Unidad del plazo
  customColor?: string; // Color para la tarjeta de previsualización
  cardIconUrl?: string; // URL del logo para la tarjeta
  managerType: 'user' | 'assistant'; // Quién gestiona la cobranza
  managerId: string; // ID del usuario o asistente gestor
  requiredDocuments: RequiredDocument[]; // Documentos que el cliente debe subir
}

export interface CollaboratorProfile {
  _id?: ObjectId;
  firebaseUid: string;
  isAuthenticated: boolean;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  referralCode: string;
  referredUsers: ObjectId[]; // Array of UserProfile IDs
  totalEarnings: number;
  conversionRate: number;
  bankInfo?: CollaboratorBankInfo;
}

/**
 * Representa una solicitud de crédito individual de un cliente.
 * Se crea cuando un cliente aplica a una de tus `CreditOffer`.
 */
export interface CreditLine {
  id: string; // ID único para esta solicitud específica
  amount: number; // Monto final aprobado
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'Al Corriente' | 'Atrasado'; // Estado de la solicitud
  applicantIdentifier: string; // Identificador del cliente (ej: userProfile.chatPath)
  assistantId: string; // Asistente que procesó la solicitud
  documents: { // Documentos subidos por el cliente
    ineFront: string; // Data URL de la imagen
    ineBack: string; // Data URL de la imagen
    proofOfAddress: string; // Data URL de la imagen
  };
  paymentFrequency: 'weekly' | 'biweekly' | 'monthly'; // Frecuencia de pago acordada
  createdAt: string;
  updatedAt: string;
}

export interface ContactImage {
    _id: string;
    url: string;
    type?: 'image' | 'video' | 'audio' | 'document';
    name?: string;
    receivedAt: Date;
    read: boolean;
}

export interface Contact {
  _id?: string;
  chatPath: string;
  name: string;
  imageUrl?: string;
  isDemo?: boolean;
  // These fields are now optional and will be hydrated dynamically
  lastMessage?: string;
  lastMessageTimestamp?: number;
  isOnline?: boolean;
  unreadCount?: number;
  conversationSize?: number;
  destination?: string; // phone number or session ID
  images?: ContactImage[];
  accountType?: 'personal' | 'business';
}

export interface Delivery {
    id: string;
    productName: string;
    productValue: number;
    destination: string;
    googleMapsUrl: string;
    status: 'pending' | 'en_route' | 'delivered';
    clientName: string;
    assistantId?: string; // ID of the assistant that created the delivery
}

/**
 * El objeto principal que se guarda en la colección `userProfiles` de MongoDB.
 * Contiene toda la información y configuración de un usuario.
 */
export interface UserProfile {
  _id?: ObjectId;
  firebaseUid: string; // This will now hold the user's unique ID from next-auth
  isAuthenticated: boolean;
  authProvider: AuthProviderType;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  chatPath?: string; // Personal chat path for user-to-user communication
  address?: UserAddress;
  assistants: AssistantConfig[];
  databases: DatabaseConfig[];
  catalogs?: Catalog[];
  contacts?: Contact[]; // User's saved contacts
  pushSubscriptions?: any[];
  referredBy?: string; // Link to CollaboratorProfile referral code
  ownerPhoneNumberForNotifications?: string;
  purchasedUnlimitedPlans?: number;
  accountType?: 'personal' | 'business';
  
  // AQUÍ SE GUARDAN LOS CRÉDITOS:
  // Este arreglo almacena las plantillas de crédito que tú creas y ofreces.
  creditOffers?: CreditOffer[]; 
  // Este arreglo almacena las solicitudes de crédito individuales de tus clientes.
  creditLines?: CreditLine[]; 

  cart?: CartItem[];
  deliveries?: Delivery[];
  credits: number;
}

export interface WizardState {
  currentStep: number;
  assistantName: string;
  assistantType: 'desktop' | 'whatsapp' | null;
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
  // User details, now part of the wizard for new user onboarding
  firstName: string;
  lastName: string;
  email: string;
  imageUrl?: string;
  address: UserAddress;
  accountType?: 'personal' | 'business';
  chatMode?: 'me' | 'ia';


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
  contacts: Contact[];
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

export interface KnowledgeItem {
    _id: ObjectId;
    databaseId: string;
    userId: string;
    content: string;
    size: number; // in bytes
    createdAt: Date;
}

export interface ContactWithImages extends Contact {
  _id: string; // This will be the _id of the conversation document
  name: string; // This will be the userIdentifier
  destination: string; // This will be the userIdentifier
  conversationSize: number; // in bytes
  images?: ContactImage[]; // Images are now correctly populated
}

export interface AssistantMemory {
  assistantId: string;
  totalMemory: number;
}

export interface AssistantWithMemory extends AssistantConfig {
  totalMemory: number;
}

export interface ChatMessage {
  id: string; // Unique ID for each message (e.g., timestamp + random string)
  role: 'user' | 'model';
  content: string | { type: 'image' | 'audio' | 'video' | 'document'; url: string, name?: string };
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
    _id: string;
    userIdentifier: string;
    assistantId: string;
    history: ChatMessage[];
    createdAt: string;
    updatedAt: string;
    lastMessage: string;
}
