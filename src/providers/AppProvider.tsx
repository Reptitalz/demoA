"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import type { AppState, WizardState, UserProfile, AssistantPurposeType, AuthProviderType, AssistantConfig, DatabaseConfig, UserAddress, LoadingStatus } from '@/types';
import { toast } from "@/hooks/use-toast";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Mock user profile for guest/testing mode
export const MOCK_USER_PROFILE: UserProfile = {
  _id: 'GUEST_USER_ID',
  isAuthenticated: true,
  authProvider: 'google',
  email: 'guest@example.com',
  firebaseUid: 'GUEST_FIREBASE_UID',
  firstName: 'Usuario',
  lastName: 'de Prueba',
  address: {
    street_name: "Calle Falsa",
    street_number: "123",
    zip_code: "45010",
    city: "Guadalajara"
  },
  assistants: [
    {
      id: "asst_guest_1",
      name: "Asistente de Demostración",
      prompt: "Eres un asistente de demostración. Tu propósito es saludar a los usuarios y mostrarles cómo funcionas.",
      isActive: true,
      messageCount: 150,
      monthlyMessageLimit: 1000,
      phoneLinked: "+5213312345678",
      numberReady: true,
      purposes: [],
      databaseId: null,
      imageUrl: "https://placehold.co/100x100.png",
      businessInfo: { vertical: 'Software' },
    }
  ],
  databases: [],
  ownerPhoneNumberForNotifications: "+5213387654321",
  credits: 10,
};


const initialWizardState: WizardState = {
  currentStep: 1,
  assistantName: '',
  assistantPrompt: '',
  selectedPurposes: new Set(),
  databaseOption: { type: null, name: '', accessUrl: '', sheetNames: [], selectedSheetName: '', selectedColumns: [], relevantColumnsDescription: '' },
  authMethod: 'google',
  firstName: '',
  lastName: '',
  email: '',
  address: {},
  ownerPhoneNumberForNotifications: '',
  isReconfiguring: false,
  editingAssistantId: null,
  acceptedTerms: false,
};

const initialUserProfileState: UserProfile = {
  isAuthenticated: false,
  authProvider: 'google',
  email: '',
  firebaseUid: '',
  firstName: undefined,
  lastName: undefined,
  address: undefined,
  assistants: [],
  databases: [],
  ownerPhoneNumberForNotifications: undefined,
  credits: 0,
};

const initialLoadingStatus: LoadingStatus = {
    active: true,
    message: 'Iniciando aplicación...',
    progress: 10,
};

const initialState: AppState = {
  wizard: initialWizardState,
  userProfile: initialUserProfileState,
  isSetupComplete: false,
  loadingStatus: initialLoadingStatus,
};

const AppContext = createContext<{ 
  state: AppState; 
  dispatch: React.Dispatch<Action>; 
  fetchProfileCallback: (email: string) => Promise<UserProfile | null>;
} | undefined>(undefined);

type Action =
  | { type: 'SET_LOADING_STATUS'; payload: Partial<LoadingStatus> }
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
  | { type: 'UPDATE_WIZARD_USER_DETAILS'; payload: { field: keyof UserProfile; value: string | UserAddress } }
  | { type: 'COMPLETE_SETUP'; payload: UserProfile }
  | { type: 'RESET_WIZARD' }
  | { type: 'SYNC_PROFILE_FROM_API'; payload: UserProfile }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'ADD_ASSISTANT'; payload: AssistantConfig }
  | { type: 'UPDATE_ASSISTANT'; payload: AssistantConfig }
  | { type: 'REMOVE_ASSISTANT'; payload: string }
  | { type: 'ADD_DATABASE_TO_ASSISTANT'; payload: { assistantId: string, database: DatabaseConfig } }
  | { type: 'UPDATE_DATABASE'; payload: DatabaseConfig }
  | { type: 'REMOVE_DATABASE'; payload: string }
  | { type: 'LOGIN_USER'; payload: { user: User, profile: UserProfile } }
  | { type: 'LOGIN_GUEST' }
  | { type: 'LOGOUT_USER' }
  | { type: 'SET_IS_RECONFIGURING'; payload: boolean }
  | { type: 'SET_EDITING_ASSISTANT_ID'; payload: string | null };


const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_LOADING_STATUS':
      return { ...state, loadingStatus: { ...state.loadingStatus, ...action.payload } };
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
    case 'UPDATE_WIZARD_USER_DETAILS': {
      const { field, value } = action.payload;
      if (field === 'address') {
        return { ...state, wizard: { ...state.wizard, address: { ...state.wizard.address, ...(value as UserAddress) }}};
      }
      return { ...state, wizard: { ...state.wizard, [field]: value }};
    }
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
     case 'LOGIN_USER': {
      const { user, profile } = action.payload;
      return {
        ...state,
        userProfile: {
          ...profile,
          isAuthenticated: true,
          email: user.email!,
          firebaseUid: user.uid,
        },
        isSetupComplete: profile.assistants && profile.assistants.length > 0,
      };
    }
    case 'LOGIN_GUEST':
      return {
        ...state,
        userProfile: MOCK_USER_PROFILE,
        isSetupComplete: true,
      };
    case 'SYNC_PROFILE_FROM_API': {
        const apiProfile = action.payload;
        const newIsSetupComplete = apiProfile.assistants && apiProfile.assistants.length > 0;
        
        const freshUserProfile: UserProfile = {
            ...initialUserProfileState,
            ...apiProfile,
            isAuthenticated: true,
            credits: apiProfile.credits || 0,
        };

        return {
            ...state,
            userProfile: freshUserProfile,
            isSetupComplete: newIsSetupComplete,
        };
    }
    case 'UPDATE_USER_PROFILE': {
      // Ensure 'purposes' in assistants remains an array.
      const payload = action.payload;
      if (payload.assistants) {
        payload.assistants = payload.assistants.map(a => ({
          ...a,
          purposes: Array.isArray(a.purposes) ? a.purposes : [],
        }))
      }
      return { ...state, userProfile: { ...state.userProfile, ...payload }};
    }
    case 'ADD_ASSISTANT':
      return { ...state, userProfile: { ...state.userProfile, assistants: [...state.userProfile.assistants, action.payload] }};
    case 'UPDATE_ASSISTANT':
      return { ...state, userProfile: { ...state.userProfile, assistants: state.userProfile.assistants.map(a => a.id === action.payload.id ? action.payload : a) }};
    case 'REMOVE_ASSISTANT':
      return { ...state, userProfile: { ...state.userProfile, assistants: state.userProfile.assistants.filter(a => a.id !== action.payload) }};
    case 'ADD_DATABASE_TO_ASSISTANT': {
      const { assistantId, database } = action.payload;
      const updatedAssistants = state.userProfile.assistants.map(a => 
        a.id === assistantId ? { ...a, databaseId: database.id } : a
      );
      const updatedDatabases = [...state.userProfile.databases, database];
      return { ...state, userProfile: { ...state.userProfile, assistants: updatedAssistants, databases: updatedDatabases }};
    }
    case 'UPDATE_DATABASE': {
        const updatedDb = action.payload;
        const updatedDbs = state.userProfile.databases.map(db => db.id === updatedDb.id ? updatedDb : db);
        return { ...state, userProfile: { ...state.userProfile, databases: updatedDbs }};
    }
    case 'REMOVE_DATABASE': {
      const dbIdToRemove = action.payload;
      // Remove the database from the databases array
      const updatedDatabases = state.userProfile.databases.filter(db => db.id !== dbIdToRemove);
      // Unlink the database from any assistants that were using it
      const updatedAssistants = state.userProfile.assistants.map(asst => {
        if (asst.databaseId === dbIdToRemove) {
          return { ...asst, databaseId: undefined };
        }
        return asst;
      });
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          databases: updatedDatabases,
          assistants: updatedAssistants,
        }
      };
    }
    case 'LOGOUT_USER':
      return {
        ...initialState,
        loadingStatus: { active: false, message: '', progress: 0 },
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

async function saveUserProfile(userProfile: UserProfile): Promise<void> {
  // Do not save guest profile to the backend
  if (userProfile._id === 'GUEST_USER_ID') {
    console.log("Guest profile updated locally. Skipping save to backend.");
    return;
  }

  if (!userProfile._id) {
    console.error("Cannot save profile without an ID.");
    throw new Error("Cannot save profile without an ID.");
  }
  try {
    const profileToSave = {
      ...userProfile,
      assistants: userProfile.assistants.map(a => ({
        ...a,
        purposes: Array.isArray(a.purposes) ? a.purposes : [],
      }))
    }
    const response = await fetch('/api/user-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userProfile: profileToSave }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to save user profile.");
    }
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const previousStateRef = useRef<AppState>(initialState);

  useEffect(() => {
    // This effect tracks changes to the userProfile and saves it automatically.
    const hasProfileChanged = JSON.stringify(previousStateRef.current.userProfile) !== JSON.stringify(state.userProfile);
    
    if (hasProfileChanged && state.userProfile.isAuthenticated && state.userProfile._id) {
      saveUserProfile(state.userProfile)
        .then(() => {
            if (state.userProfile._id !== 'GUEST_USER_ID') {
                console.log("Profile saved successfully.");
                toast({ title: "Cambios Guardados", description: "Tus cambios se han guardado exitosamente."});
            }
        })
        .catch((error) => {
          console.error("Failed to save profile, reverting state.", error);
          toast({ title: "Error al Guardar", description: `No se pudieron guardar los cambios: ${error.message}`, variant: "destructive", copyable: true });
          dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: previousStateRef.current.userProfile });
        });
    }

    previousStateRef.current = state;
  }, [state.userProfile]);

  const fetchProfileCallback = useCallback(async (email: string): Promise<UserProfile | null> => {
    try {
      const response = await fetch(`/api/user-profile?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) { // This handles 404s and other errors
        return null;
      }
      
      const data = await response.json();
      return data.userProfile || null;

    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      toast({ title: "Error de Conexión", description: "No se pudo comunicar con el servidor para obtener el perfil.", variant: "destructive" });
      return null;
    }
  }, []);
  
  useEffect(() => {
    // onAuthStateChanged is the single source of truth for auth state.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      dispatch({ type: 'SET_LOADING_STATUS', payload: { active: true, message: 'Verificando sesión...', progress: 30 } });

      if (user && user.email) {
        dispatch({ type: 'SET_LOADING_STATUS', payload: { message: 'Buscando perfil de usuario...', progress: 60 } });
        const profile = await fetchProfileCallback(user.email);
        
        if (profile) {
          // User is authenticated and has a profile in our DB.
          dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: profile });
          dispatch({ type: 'SET_LOADING_STATUS', payload: { message: "¡Listo!", progress: 100 } });
        } else {
          // User is authenticated with Firebase, but no profile exists in our DB.
          // This is a new user who needs to complete registration.
          // Keep them authenticated at Firebase level but without a full app profile.
          dispatch({
            type: 'UPDATE_USER_PROFILE',
            payload: { isAuthenticated: true, email: user.email, firebaseUid: user.uid },
          });
          toast({ title: 'Bienvenido/a', description: 'Completa el registro para crear tu primer asistente.' });
        }
      } else {
        // No Firebase user is signed in.
        dispatch({ type: 'LOGOUT_USER' });
      }

      // Deactivate loading screen once the entire flow is complete.
      dispatch({ type: 'SET_LOADING_STATUS', payload: { active: false } });
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [fetchProfileCallback]);

  return (
    <QueryClientProvider client={queryClient}>
        <AppContext.Provider value={{ state, dispatch, fetchProfileCallback }}>
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
