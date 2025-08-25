
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import type { AppState, WizardState, UserProfile, AssistantPurposeType, AuthProviderType, AssistantConfig, DatabaseConfig, UserAddress, LoadingStatus } from '@/types';
import { toast } from "@/hooks/use-toast";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession, signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

const initialWizardState: WizardState = {
  currentStep: 1,
  assistantName: '',
  assistantType: 'desktop',
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
  firebaseUid: '', 
  email: '',
  firstName: undefined,
  lastName: undefined,
  address: undefined,
  assistants: [],
  databases: [],
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
  fetchProfileCallback: (email: string, newUserFlow?: 'desktop' | 'whatsapp') => Promise<void>;
} | undefined>(undefined);

type Action =
  | { type: 'SET_LOADING_STATUS'; payload: Partial<LoadingStatus> }
  | { type: 'NEXT_WIZARD_STEP' }
  | { type: 'PREVIOUS_WIZARD_STEP' }
  | { type: 'SET_WIZARD_STEP'; payload: number }
  | { type: 'UPDATE_ASSISTANT_NAME'; payload: string }
  | { type: 'UPDATE_ASSISTANT_TYPE', payload: 'desktop' | 'whatsapp' }
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
  | { type: 'REASSIGN_ASSISTANT_PHONE'; payload: string } // Assistant ID
  | { type: 'ADD_DATABASE_TO_ASSISTANT'; payload: { assistantId: string, database: DatabaseConfig } }
  | { type: 'UPDATE_DATABASE'; payload: DatabaseConfig }
  | { type: 'REMOVE_DATABASE'; payload: string }
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
    case 'UPDATE_ASSISTANT_TYPE':
        return { ...state, wizard: { ...state.wizard, assistantType: action.payload } };
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
      return { ...state, userProfile: { ...state.userProfile, ...action.payload }};
    }
    case 'ADD_ASSISTANT':
      return { ...state, userProfile: { ...state.userProfile, assistants: [...state.userProfile.assistants, action.payload] }};
    case 'UPDATE_ASSISTANT':
      return { ...state, userProfile: { ...state.userProfile, assistants: state.userProfile.assistants.map(a => a.id === action.payload.id ? action.payload : a) }};
    case 'REMOVE_ASSISTANT':
      return { ...state, userProfile: { ...state.userProfile, assistants: state.userProfile.assistants.filter(a => a.id !== action.payload) }};
    case 'REASSIGN_ASSISTANT_PHONE': {
      const assistantIdToReassign = action.payload;
      const updatedAssistants = state.userProfile.assistants.map(asst => {
        if (asst.id === assistantIdToReassign) {
          return {
            ...asst,
            phoneLinked: undefined,
            isActive: false,
            numberReady: false,
            verificationCode: undefined,
          };
        }
        return asst;
      });
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          assistants: updatedAssistants,
        },
      };
    }
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
      const updatedDatabases = state.userProfile.databases.filter(db => db.id !== dbIdToRemove);
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
  if (!userProfile._id) {
    console.error("Cannot save profile without an ID.");
    throw new Error("Cannot save profile without an ID.");
  }
  try {
    const profileToSave = {
      ...userProfile,
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

const AppProviderInternal = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const previousStateRef = useRef<AppState>(initialState);
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const fetchProfileCallback = useCallback(async (email: string, newUserFlow?: 'desktop' | 'whatsapp') => {
    dispatch({ type: 'SET_LOADING_STATUS', payload: { active: true, message: 'Cargando perfil...', progress: 75 } });
    try {
      const response = await fetch(`/api/user-profile?email=${encodeURIComponent(email)}`);
      
      if (response.status === 404 && newUserFlow === 'desktop') {
          console.log(`Profile not found for ${email}, creating new profile with desktop assistant.`);
          
          const newAssistant: AssistantConfig = {
              id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name: "Mi Primer Asistente",
              type: 'desktop',
              prompt: "Eres un asistente amigable y servicial. Tu objetivo es responder preguntas de manera clara y concisa.",
              purposes: [],
              isActive: true, // Desktop assistants are active by default
              numberReady: true, // No number needed
              messageCount: 0,
              monthlyMessageLimit: 1000, // Free tier limit
          };

          const newUserProfile: Omit<UserProfile, '_id' | 'isAuthenticated'> = {
              firebaseUid: session?.user?.id || '',
              email: session?.user?.email || '',
              firstName: session?.user?.name?.split(' ')[0] || 'Nuevo',
              lastName: session?.user?.name?.split(' ').slice(1).join(' ') || 'Usuario',
              authProvider: 'google',
              assistants: [newAssistant],
              databases: [],
              credits: 1, // 1 free credit
          };

          const createResponse = await fetch('/api/create-user-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUserProfile),
          });
          const { userProfile: createdProfile } = await createResponse.json();
          dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: createdProfile });
          toast({ title: "¡Bienvenido/a!", description: "Hemos creado tu primer asistente. ¡Ya puedes empezar!" });

      } else if (response.status === 404) { // Handles new WhatsApp users or any other new user
          dispatch({ type: 'LOGOUT_USER' }); 
          toast({
              title: "Bienvenido/a",
              description: "Parece que eres nuevo/a. Por favor, crea tu primer asistente.",
              duration: 6000,
          });
          window.location.href = '/login'; // Redirect to login to start full wizard

      } else if (response.ok) {
        const data = await response.json();
        if (data.userProfile) {
          dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: data.userProfile });
        }
      } else {
        throw new Error('Failed to fetch profile.');
      }
    } catch (error) {
      console.error("Error fetching/handling profile:", error);
      toast({ title: 'Error de Red', description: 'No se pudo conectar para obtener tu perfil.', variant: 'destructive' });
      dispatch({ type: 'LOGOUT_USER' });
    } finally {
      dispatch({ type: 'SET_LOADING_STATUS', payload: { active: false, progress: 100 } });
    }
  }, [session]);


  useEffect(() => {
    const hasProfileChanged = JSON.stringify(previousStateRef.current.userProfile) !== JSON.stringify(state.userProfile);
    
    if (hasProfileChanged && state.userProfile.isAuthenticated && state.userProfile._id) {
      saveUserProfile(state.userProfile)
        .then(() => {
            console.log("Profile saved successfully.");
            toast({ title: "Cambios Guardados", description: "Tus cambios se han guardado exitosamente."});
        })
        .catch((error) => {
          console.error("Failed to save profile, reverting state.", error);
          toast({ title: "Error al Guardar", description: `No se pudieron guardar los cambios: ${error.message}`, variant: "destructive", copyable: true });
          dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: previousStateRef.current.userProfile });
        });
    }
    previousStateRef.current = state;
  }, [state.userProfile]);

  useEffect(() => {
    const newUserFlow = searchParams.get('newUserFlow') as 'desktop' | 'whatsapp' | null;

    if (status === 'loading') {
      dispatch({ type: 'SET_LOADING_STATUS', payload: { active: true, message: 'Verificando sesión...', progress: 30 } });
    } else if (status === 'unauthenticated') {
      dispatch({ type: 'LOGOUT_USER' });
    } else if (status === 'authenticated') {
      if (session?.user?.email && !state.userProfile.isAuthenticated) {
        fetchProfileCallback(session.user.email, newUserFlow || undefined);
      } else {
        dispatch({ type: 'SET_LOADING_STATUS', payload: { active: false } });
      }
    }
  }, [status, session, state.userProfile.isAuthenticated, fetchProfileCallback, searchParams]);

  return (
    <AppContext.Provider value={{ state, dispatch, fetchProfileCallback }}>
        {children}
    </AppContext.Provider>
  );
};


export const AppProvider = ({ children }: { children: ReactNode }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <AppProviderInternal>{children}</AppProviderInternal>
        </QueryClientProvider>
    )
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};
