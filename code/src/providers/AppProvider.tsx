
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import type { AppState, WizardState, UserProfile, AssistantPurposeType, AuthProviderType, AssistantConfig, DatabaseConfig } from '@/types';
import { MAX_WIZARD_STEPS } from '@/config/appConfig';
import { auth, getRedirectResult } from '@/lib/firebase'; 
import { toast } from "@/hooks/use-toast";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { urlBase64ToUint8Array } from '@/lib/utils';

const initialWizardState: WizardState = {
  currentStep: 1,
  maxSteps: MAX_WIZARD_STEPS,
  assistantName: '',
  assistantPrompt: '',
  selectedPurposes: new Set(),
  databaseOption: { type: null, name: '', accessUrl: '' },
  authMethod: null,
  ownerPhoneNumberForNotifications: '',
  isReconfiguring: false,
  editingAssistantId: null,
  acceptedTerms: false,
};

const initialUserProfileState: UserProfile = {
  isAuthenticated: false,
  authProvider: undefined,
  email: undefined,
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
  isLoading: true,
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
  | { type: 'UPDATE_OWNER_PHONE_NUMBER'; payload: string }
  | { type: 'SET_TERMS_ACCEPTED'; payload: boolean }
  | { type: 'COMPLETE_SETUP'; payload: UserProfile }
  | { type: 'RESET_WIZARD' }
  | { type: 'LOAD_WIZARD_STATE'; payload: Partial<WizardState> }
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
    case 'LOAD_WIZARD_STATE': {
      const loadedWizardState = action.payload;
      const wizardSelectedPurposesSet = Array.isArray(loadedWizardState?.selectedPurposes)
        ? new Set(loadedWizardState.selectedPurposes as AssistantPurposeType[])
        : new Set<AssistantPurposeType>();

      return {
        ...state,
        wizard: {
          ...initialWizardState,
          ...loadedWizardState,
          selectedPurposes: wizardSelectedPurposesSet,
          acceptedTerms: !!loadedWizardState.acceptedTerms,
        },
      };
    }
    case 'SYNC_PROFILE_FROM_API': {
        const apiProfile = action.payload;
        const assistantsWithSetPurposes = (apiProfile.assistants || []).map(assistant => ({
            ...assistant,
            purposes: new Set(Array.isArray(assistant.purposes) ? assistant.purposes : []) as Set<AssistantPurposeType>,
        }));
        const newIsSetupComplete = apiProfile.assistants && apiProfile.assistants.length > 0;
        
        const freshUserProfile: UserProfile = {
            ...initialUserProfileState,
            isAuthenticated: true,
            authProvider: state.userProfile.authProvider,
            firebaseUid: state.userProfile.firebaseUid,
            email: state.userProfile.email,
            ...apiProfile,
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

  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.error("VAPID public key is not set in .env.local");
      toast({ title: "Error de Configuración", description: "El administrador no ha configurado las notificaciones.", variant: "destructive" });
      return false;
    }
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      toast({ title: "No Soportado", description: "Las notificaciones push no son soportadas por tu navegador.", variant: "destructive" });
      return false;
    }

    setIsSubscribingToPush(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({ title: "Permiso Denegado", description: "No se podrán activar las notificaciones. Puedes hacerlo más tarde en la configuración de tu navegador." });
        return false;
      }
      
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
        });
      }

      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Usuario no autenticado.");
      
      const response = await fetch('/api/save-push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) throw new Error('No se pudo guardar la suscripción en el servidor.');
      
      dispatch({ type: 'ADD_PUSH_SUBSCRIPTION', payload: subscription.toJSON() });
      toast({ title: "¡Notificaciones Activadas!", description: "Recibirás alertas y actualizaciones." });
      return true;

    } catch (error) {
      console.error("Error subscribing:", error);
      toast({ title: "Error", description: `No se pudieron activar las notificaciones: ${(error as Error).message}`, variant: "destructive" });
      return false;
    } finally {
      setIsSubscribingToPush(false);
    }
  }, [dispatch]);

  const fetchProfileCallback = useCallback(async (userId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        dispatch({ type: 'LOGOUT_USER' });
        return;
      }
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/user-profile?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.userProfile) {
          dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: data.userProfile });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        if (response.status === 404) {
          dispatch({ type: 'SET_LOADING', payload: false });
        } else if (response.status === 401 || response.status === 403) {
          dispatch({ type: 'LOGOUT_USER' });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);
  
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PROFILE_UPDATED') {
        console.log('Profile update message received from service worker. Refetching profile...');
        if (state.userProfile.firebaseUid) {
          fetchProfileCallback(state.userProfile.firebaseUid);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          toast({
            title: "Actualización en tiempo real",
            description: "Tu panel ha sido actualizado con los últimos cambios."
          });
        }
      }
    };
    
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }
    
    return () => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        }
    };
  }, [state.userProfile.firebaseUid, fetchProfileCallback]);

  useEffect(() => {
    // Register service worker on component mount
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => console.log('Service Worker registered with scope:', registration.scope))
        .catch(error => console.error('Service Worker registration failed:', error));
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    getRedirectResult(auth).catch(error => {
        console.error("Error from getRedirectResult:", error);
        toast({
            title: "Error de Autenticación",
            description: "No se pudo completar el inicio de sesión. Por favor, inténtalo de nuevo.",
            variant: "destructive"
        });
    });

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        if (!state.userProfile.isAuthenticated || state.userProfile.firebaseUid !== user.uid) {
            dispatch({
              type: 'UPDATE_USER_PROFILE',
              payload: {
                isAuthenticated: true,
                authProvider: 'google',
                email: user.email || undefined,
                firebaseUid: user.uid,
              }
            });
            await fetchProfileCallback(user.uid);
        } else {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        if (state.userProfile.isAuthenticated) {
          dispatch({ type: 'LOGOUT_USER' });
        } else {
          dispatch({type: 'SET_LOADING', payload: false });
        }
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfileCallback]);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    if (state.isLoading || !state.isSetupComplete || !state.userProfile.isAuthenticated || !state.userProfile.firebaseUid) {
      return;
    }

    const saveProfileToApi = async () => {
      setIsSavingProfile(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || currentUser.uid !== state.userProfile.firebaseUid) {
          return;
        }
        const token = await currentUser.getIdToken();
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
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId: state.userProfile.firebaseUid, userProfile: serializableProfile }),
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
  }, [state.userProfile, state.isSetupComplete, state.isLoading]);

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
