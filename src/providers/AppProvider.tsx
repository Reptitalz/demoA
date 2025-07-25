"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import type { AppState, WizardState, UserProfile, AssistantPurposeType, AuthProviderType, AssistantConfig, DatabaseConfig } from '@/types';
import { MAX_WIZARD_STEPS } from '@/config/appConfig';
import { toast } from "@/hooks/use-toast";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { urlBase64ToUint8Array } from '@/lib/utils';
import { getAuth, signOut } from '@/lib/firebase'; 

const initialWizardState: WizardState = {
  currentStep: 1,
  maxSteps: MAX_WIZARD_STEPS,
  assistantName: '',
  assistantPrompt: '',
  selectedPurposes: new Set(),
  databaseOption: { type: null, name: '', accessUrl: '' },
  authMethod: null,
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
  ownerPhoneNumberForNotifications: '',
  isReconfiguring: false,
  editingAssistantId: null,
  acceptedTerms: false,
};

const initialUserProfileState: UserProfile = {
  isAuthenticated: false,
  authProvider: undefined,
  email: undefined,
  phoneNumber: undefined,
  password: undefined,
  assistants: [],
  databases: [],
  firebaseUid: undefined,
  ownerPhoneNumberForNotifications: undefined,
  credits: 0,
  pushSubscriptions: [],
};

const initialState: AppState = {
  wizard: initialWizardState,
  userProfile: initialUserProfileState,
  isSetupComplete: false,
  isLoading: true, // Start as true to check for session
};

const AppContext = createContext<{ 
  state: AppState; 
  dispatch: React.Dispatch<Action>; 
  isSavingProfile: boolean;
  enablePushNotifications: () => Promise<boolean>;
  isSubscribingToPush: boolean;
} | undefined>(undefined);

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'NEXT_WIZARD_STEP' }
  | { type: 'PREVIOUS_WIZARD_STEP' }
  | { type: 'SET_WIZARD_STEP'; payload: number }
  | { type: 'UPDATE_ASSISTANT_NAME'; payload: string }
  | { type: 'UPDATE_ASSISTANT_PROMPT'; payload: string }
  | { type: 'TOGGLE_ASSISTANT_PURPOSE'; payload: AssistantPurposeType }
  | { type: 'SET_DATABASE_OPTION'; payload: Partial<WizardState['databaseOption']> }
  | { type: 'SET_AUTH_METHOD'; payload: AuthProviderType | null }
  | { type: 'SET_WIZARD_PHONE_NUMBER'; payload: string }
  | { type: 'SET_WIZARD_PASSWORD'; payload: string }
  | { type: 'SET_WIZARD_CONFIRM_PASSWORD'; payload: string }
  | { type: 'SET_WIZARD_VERIFICATION_CODE'; payload: string }
  | { type: 'UPDATE_OWNER_PHONE_NUMBER'; payload: string }
  | { type: 'SET_TERMS_ACCEPTED'; payload: boolean }
  | { type: 'COMPLETE_SETUP'; payload: UserProfile }
  | { type: 'RESET_WIZARD' }
  | { type: 'SYNC_PROFILE_FROM_API'; payload: UserProfile }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'ADD_ASSISTANT'; payload: AssistantConfig }
  | { type: 'UPDATE_ASSISTANT'; payload: AssistantConfig }
  | { type: 'REMOVE_ASSISTANT'; payload: string }
  | { type: 'ADD_DATABASE'; payload: DatabaseConfig }
  | { type: 'LOGOUT_USER' }
  | { type: 'SET_IS_RECONFIGURING'; payload: boolean }
  | { type: 'ADD_PUSH_SUBSCRIPTION', payload: PushSubscriptionJSON }
  | { type: 'SET_EDITING_ASSISTANT_ID'; payload: string | null };


const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'NEXT_WIZARD_STEP': {
      return { ...state, wizard: { ...state.wizard, currentStep: state.wizard.currentStep + 1 } };
    }
    case 'PREVIOUS_WIZARD_STEP':
      if (state.wizard.currentStep > 1) {
        return { ...state, wizard: { ...state.wizard, currentStep: state.wizard.currentStep - 1 } };
      }
      return state;
    case 'SET_WIZARD_STEP':
      return { ...state, wizard: { ...state.wizard, currentStep: action.payload } };
    case 'UPDATE_ASSISTANT_NAME':
      return { ...state, wizard: { ...state.wizard, assistantName: action.payload } };
    case 'UPDATE_ASSISTANT_PROMPT':
      return { ...state, wizard: { ...state.wizard, assistantPrompt: action.payload } };
    case 'TOGGLE_ASSISTANT_PURPOSE': {
      const newPurposes = new Set(state.wizard.selectedPurposes);
      const purposeToToggle = action.payload;
      
      if (newPurposes.has(purposeToToggle)) {
        newPurposes.delete(purposeToToggle);
      } else {
        newPurposes.add(purposeToToggle);
        const dbPurposes = ["import_spreadsheet", "create_smart_db"];
        const toggledIsDb = dbPurposes.includes(purposeToToggle);
        if (toggledIsDb) {
            dbPurposes.filter(p => p !== purposeToToggle).forEach(p => newPurposes.delete(p as AssistantPurposeType));
        }
      }
      return { ...state, wizard: { ...state.wizard, selectedPurposes: newPurposes } };
    }
    case 'SET_DATABASE_OPTION':
      return { ...state, wizard: { ...state.wizard, databaseOption: { ...state.wizard.databaseOption, ...action.payload } } };
    case 'SET_AUTH_METHOD':
      return { ...state, wizard: { ...state.wizard, authMethod: action.payload } };
    case 'SET_WIZARD_PHONE_NUMBER':
      return { ...state, wizard: { ...state.wizard, phoneNumber: action.payload } };
    case 'SET_WIZARD_PASSWORD':
      return { ...state, wizard: { ...state.wizard, password: action.payload } };
    case 'SET_WIZARD_CONFIRM_PASSWORD':
      return { ...state, wizard: { ...state.wizard, confirmPassword: action.payload } };
    case 'SET_WIZARD_VERIFICATION_CODE':
      return { ...state, wizard: { ...state.wizard, verificationCode: action.payload } };
    case 'UPDATE_OWNER_PHONE_NUMBER':
      return { ...state, wizard: { ...state.wizard, ownerPhoneNumberForNotifications: action.payload } };
    case 'SET_TERMS_ACCEPTED':
        return { ...state, wizard: { ...state.wizard, acceptedTerms: action.payload } };
    case 'COMPLETE_SETUP':
      return {
        ...state,
        userProfile: action.payload,
        isSetupComplete: true,
        wizard: initialWizardState,
      };
    case 'RESET_WIZARD':
      return {
        ...state,
        wizard: initialWizardState
      };
    case 'SYNC_PROFILE_FROM_API': {
        const apiProfile = action.payload;
        const assistantsWithSetPurposes = (apiProfile.assistants || []).map(assistant => ({
            ...assistant,
            purposes: new Set(Array.isArray(assistant.purposes) ? assistant.purposes : []) as Set<AssistantPurposeType>,
        }));
        const newIsSetupComplete = apiProfile.assistants && apiProfile.assistants.length > 0;
        
        const freshUserProfile: UserProfile = {
            ...initialUserProfileState,
            ...apiProfile,
            isAuthenticated: true,
            assistants: assistantsWithSetPurposes,
            credits: apiProfile.credits || 0,
        };

        return {
            ...state,
            userProfile: freshUserProfile,
            isSetupComplete: newIsSetupComplete,
            isLoading: false,
        };
    }
    case 'UPDATE_USER_PROFILE':
      return { ...state, userProfile: { ...state.userProfile, ...action.payload }};
    case 'ADD_ASSISTANT':
      return { ...state, userProfile: { ...state.userProfile, assistants: [...state.userProfile.assistants, action.payload] }};
    case 'UPDATE_ASSISTANT':
      return { ...state, userProfile: { ...state.userProfile, assistants: state.userProfile.assistants.map(a => a.id === action.payload.id ? action.payload : a) }};
    case 'REMOVE_ASSISTANT':
      return { ...state, userProfile: { ...state.userProfile, assistants: state.userProfile.assistants.filter(a => a.id !== action.payload) }};
    case 'ADD_DATABASE':
      return { ...state, userProfile: { ...state.userProfile, databases: [...state.userProfile.databases, action.payload] }};
    case 'ADD_PUSH_SUBSCRIPTION': {
      const existingSubs = state.userProfile.pushSubscriptions || [];
      if (existingSubs.some(sub => sub.endpoint === action.payload.endpoint)) {
        return state;
      }
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          pushSubscriptions: [...existingSubs, action.payload],
        },
      };
    }
    case 'LOGOUT_USER':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'SET_IS_RECONFIGURING':
      return { ...state, wizard: { ...state.wizard, isReconfiguring: action.payload } };
    case 'SET_EDITING_ASSISTANT_ID':
      return { ...state, wizard: { ...state.wizard, editingAssistantId: action.payload } };
    default:
      return state;
  }
};

const queryClient = new QueryClient();

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubscribingToPush, setIsSubscribingToPush] = useState(false);
  
  const auth = getAuth();

  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast({ title: 'Push no soportado', description: 'Tu navegador no soporta notificaciones push.', variant: 'destructive' });
      return false;
    }
    
    if (!state.userProfile.firebaseUid) {
      toast({ title: 'Error', description: 'El ID de usuario no está disponible para suscribirse a notificaciones.', variant: 'destructive' });
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        const permission = await window.Notification.requestPermission();
        if (permission !== 'granted') {
          toast({ title: 'Permiso denegado', description: 'No has permitido las notificaciones.' });
          return false;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            toast({ title: 'Error de Configuración', description: 'La clave VAPID para notificaciones no está configurada.', variant: 'destructive' });
            return false;
        }

        setIsSubscribingToPush(true);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const subJSON = subscription.toJSON();
      dispatch({ type: 'ADD_PUSH_SUBSCRIPTION', payload: subJSON });
      toast({ title: '¡Suscripción Exitosa!', description: 'Recibirás notificaciones importantes.' });
      return true;

    } catch (error) {
      console.error('Error al suscribirse a las notificaciones push:', error);
      toast({ title: 'Error de Suscripción', description: 'No se pudieron activar las notificaciones.', variant: 'destructive' });
      return false;
    } finally {
      setIsSubscribingToPush(false);
    }
  }, [state.userProfile.firebaseUid]);

  const fetchProfileCallback = useCallback(async (phoneNumber: string) => {
    try {
      const response = await fetch(`/api/user-profile?phoneNumber=${encodeURIComponent(phoneNumber)}`);

      if (response.ok) {
        const data = await response.json();
        if (data.userProfile) {
          dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: data.userProfile });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        dispatch({ type: 'LOGOUT_USER' });
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);
  
  useEffect(() => {
    const loggedInUserPhone = sessionStorage.getItem('loggedInUser');
    if (loggedInUserPhone) {
      fetchProfileCallback(loggedInUserPhone);
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [fetchProfileCallback]);

  useEffect(() => {
    if (state.userProfile.isAuthenticated && state.userProfile.phoneNumber) {
      sessionStorage.setItem('loggedInUser', state.userProfile.phoneNumber);
    } else {
      sessionStorage.removeItem('loggedInUser');
    }
  }, [state.userProfile.isAuthenticated, state.userProfile.phoneNumber]);


  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    if (state.isLoading || !state.userProfile.isAuthenticated || !state.userProfile.phoneNumber) {
      return;
    }

    const saveProfileToApi = async () => {
      setIsSavingProfile(true);
      try {
        const serializableProfile = {
          ...state.userProfile,
          assistants: state.userProfile.assistants.map(assistant => ({
            ...assistant,
            purposes: Array.from(assistant.purposes),
          })),
        };

        await fetch('/api/user-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userProfile: serializableProfile }),
        });
      } catch (error) {
        console.error("Error saving user profile to API:", error);
      } finally {
        setIsSavingProfile(false);
      }
    };

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveProfileToApi, 1000);

    return () => clearTimeout(debounceTimer);
  }, [state.userProfile, state.isLoading]);

  return (
    <QueryClientProvider client={queryClient}>
        <AppContext.Provider value={{ state, dispatch, isSavingProfile, enablePushNotifications, isSubscribingToPush }}>
            {children}
        </AppContext.Provider>
    </QueryClientProvider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};
