
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import type { AppState, WizardState, UserProfile, AssistantPurposeType, SubscriptionPlanType, DatabaseSource, AssistantConfig, DatabaseConfig, AuthProviderType } from '@/types';
import { MAX_WIZARD_STEPS, assistantPurposesConfig } from '@/config/appConfig';
import { auth } from '@/lib/firebase'; 
import { toast } from "@/hooks/use-toast";


const initialWizardState: WizardState = {
  currentStep: 1,
  maxSteps: MAX_WIZARD_STEPS,
  assistantName: '',
  selectedPurposes: new Set(),
  databaseOption: { type: null, name: '', accessUrl: '' },
  authMethod: null,
  selectedPlan: null,
  customPhoneNumber: '',
  ownerPhoneNumberForNotifications: '',
  isReconfiguring: false,
  editingAssistantId: null,
};

const initialUserProfileState: UserProfile = {
  isAuthenticated: false,
  authProvider: null,
  email: undefined,
  currentPlan: null,
  assistants: [],
  databases: [],
  firebaseUid: undefined,
};

const initialState: AppState = {
  wizard: initialWizardState,
  userProfile: initialUserProfileState,
  isSetupComplete: false,
  isLoading: true,
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; isSavingProfile: boolean } | undefined>(undefined);

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'NEXT_WIZARD_STEP' }
  | { type: 'PREVIOUS_WIZARD_STEP' }
  | { type: 'SET_WIZARD_STEP'; payload: number }
  | { type: 'UPDATE_ASSISTANT_NAME'; payload: string }
  | { type: 'TOGGLE_ASSISTANT_PURPOSE'; payload: AssistantPurposeType }
  | { type: 'SET_DATABASE_OPTION'; payload: Partial<WizardState['databaseOption']> }
  | { type: 'SET_AUTH_METHOD'; payload: AuthProviderType | null }
  | { type: 'SET_SUBSCRIPTION_PLAN'; payload: SubscriptionPlanType | null }
  | { type: 'UPDATE_CUSTOM_PHONE_NUMBER'; payload: string }
  | { type: 'UPDATE_OWNER_PHONE_NUMBER'; payload: string }
  | { type: 'COMPLETE_SETUP'; payload: UserProfile }
  | { type: 'RESET_WIZARD' }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'SYNC_PROFILE_FROM_API'; payload: UserProfile }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'ADD_ASSISTANT'; payload: AssistantConfig }
  | { type: 'UPDATE_ASSISTANT'; payload: AssistantConfig }
  | { type: 'REMOVE_ASSISTANT'; payload: string }
  | { type: 'ADD_DATABASE'; payload: DatabaseConfig }
  | { type: 'LOGOUT_USER' }
  | { type: 'SET_IS_RECONFIGURING'; payload: boolean }
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
    case 'TOGGLE_ASSISTANT_PURPOSE': {
      const newPurposes = new Set(state.wizard.selectedPurposes);
      const purposeToToggle = action.payload;
      let showToast = false;
      let toastMessage = "";

      if (newPurposes.has(purposeToToggle)) {
        newPurposes.delete(purposeToToggle);
      } else {
        newPurposes.add(purposeToToggle);
        if (purposeToToggle === "import_spreadsheet" && newPurposes.has("create_smart_db")) {
          newPurposes.delete("create_smart_db");
          showToast = true;
          toastMessage = "Se deseleccionó 'Crear Base de Datos Inteligente' porque ya seleccionaste 'Vincular Hoja de Google'.";
        } else if (purposeToToggle === "create_smart_db" && newPurposes.has("import_spreadsheet")) {
          newPurposes.delete("import_spreadsheet");
          showToast = true;
          toastMessage = "Se deseleccionó 'Vincular Hoja de Google' porque ya seleccionaste 'Crear Base de Datos Inteligente'.";
        }
      }

      if (showToast) {
        toast({
          title: "Selección de Propósito Actualizada",
          description: toastMessage,
          duration: 5000,
        });
      }
      return { ...state, wizard: { ...state.wizard, selectedPurposes: newPurposes } };
    }
    case 'SET_DATABASE_OPTION':
      return { ...state, wizard: { ...state.wizard, databaseOption: { ...state.wizard.databaseOption, ...action.payload } } };
    case 'SET_AUTH_METHOD':
      return { ...state, wizard: { ...state.wizard, authMethod: action.payload } };
    case 'SET_SUBSCRIPTION_PLAN':
      return { ...state, wizard: { ...state.wizard, selectedPlan: action.payload } };
    case 'UPDATE_CUSTOM_PHONE_NUMBER':
      return { ...state, wizard: { ...state.wizard, customPhoneNumber: action.payload } };
    case 'UPDATE_OWNER_PHONE_NUMBER':
      return { ...state, wizard: { ...state.wizard, ownerPhoneNumberForNotifications: action.payload } };
    case 'COMPLETE_SETUP':
      return {
        ...state,
        userProfile: action.payload,
        isSetupComplete: true,
        wizard: {
          ...initialWizardState,
          isReconfiguring: false,
          editingAssistantId: null,
        }
      };
    case 'RESET_WIZARD':
      return {
        ...state,
        wizard: {
          ...initialWizardState,
          isReconfiguring: false,
          editingAssistantId: null,
        }
      };
    case 'LOAD_STATE': {
      const loadedState = action.payload;
      const wizardSelectedPurposesSet = Array.isArray(loadedState.wizard?.selectedPurposes)
        ? new Set(loadedState.wizard.selectedPurposes as AssistantPurposeType[])
        : new Set<AssistantPurposeType>();

      const assistantsWithSetPurposes = (loadedState.userProfile?.assistants || []).map(assistant => ({
        ...assistant,
        purposes: new Set(Array.isArray(assistant.purposes) ? assistant.purposes : []) as Set<AssistantPurposeType>,
      }));

      return {
        ...initialState,
        ...loadedState,
        userProfile: {
          ...initialUserProfileState,
          ...(loadedState.userProfile || {}),
          assistants: assistantsWithSetPurposes,
        },
        wizard: {
          ...initialWizardState,
          ...(loadedState.wizard || {}),
          selectedPurposes: wizardSelectedPurposesSet,
          customPhoneNumber: loadedState.wizard?.customPhoneNumber || '',
          ownerPhoneNumberForNotifications: loadedState.wizard?.ownerPhoneNumberForNotifications || '',
          databaseOption: { 
            type: (loadedState.wizard?.databaseOption?.type as DatabaseSource | null) || null,
            name: loadedState.wizard?.databaseOption?.name || '',
            accessUrl: loadedState.wizard?.databaseOption?.accessUrl || '',
          },
        },
        isLoading: false,
      };
    }
    case 'SYNC_PROFILE_FROM_API': {
        const apiProfile = action.payload;
        const assistantsWithSetPurposes = (apiProfile.assistants || []).map(assistant => ({
            ...assistant,
            purposes: new Set(Array.isArray(assistant.purposes) ? assistant.purposes : []) as Set<AssistantPurposeType>,
        }));
        const newIsSetupComplete = !!apiProfile.currentPlan || (apiProfile.assistants && apiProfile.assistants.length > 0);

        return {
            ...state,
            userProfile: {
                ...state.userProfile,
                ...apiProfile,
                assistants: assistantsWithSetPurposes,
            },
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
    case 'LOGOUT_USER':
      return {
        ...state,
        userProfile: initialUserProfileState,
        wizard: {
            ...initialWizardState,
            isReconfiguring: false,
            editingAssistantId: null,
        },
        isSetupComplete: false,
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

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const persistedState = localStorage.getItem('assistAIManagerState');
      if (persistedState) {
        const parsedState = JSON.parse(persistedState);
        dispatch({ type: 'LOAD_STATE', payload: parsedState });
      } else {
        dispatch({ type: 'LOAD_STATE', payload: initialState });
      }
    } catch (error) {
      console.error("Error al cargar estado desde localStorage", error);
      dispatch({ type: 'LOAD_STATE', payload: initialState });
    }

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        dispatch({
          type: 'UPDATE_USER_PROFILE',
          payload: {
            isAuthenticated: true,
            authProvider: user.isAnonymous ? 'anonymous' : (user.providerData[0]?.providerId as AuthProviderType) || 'google',
            email: user.email || undefined,
            firebaseUid: user.uid,
          }
        });
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
  }, []);

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
        } else if (response.status === 404) {
          dispatch({ type: 'SET_LOADING', payload: false });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        if (response.status === 401 || response.status === 403) {
          dispatch({ type: 'LOGOUT_USER' });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  useEffect(() => {
    if (state.userProfile.isAuthenticated && state.userProfile.firebaseUid && state.isLoading) {
      fetchProfileCallback(state.userProfile.firebaseUid);
    } else if (!state.userProfile.isAuthenticated && state.isLoading) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.userProfile.isAuthenticated, state.userProfile.firebaseUid, state.isLoading, fetchProfileCallback]);


  useEffect(() => {
    if (state.isLoading) {
      return;
    }
    try {
      const serializableState = {
        ...state,
        isLoading: false,
        wizard: {
          ...state.wizard,
          selectedPurposes: Array.from(state.wizard.selectedPurposes),
          databaseOption: { 
            type: state.wizard.databaseOption.type,
            name: state.wizard.databaseOption.name,
            accessUrl: state.wizard.databaseOption.accessUrl,
          },
        },
        userProfile: {
          ...state.userProfile,
          assistants: state.userProfile.assistants.map(assistant => ({
            ...assistant,
            purposes: Array.from(assistant.purposes),
          })),
        }
      };
      localStorage.setItem('assistAIManagerState', JSON.stringify(serializableState));
    } catch (error) {
      console.error("Error al guardar estado en localStorage", error);
    }
  }, [state]);


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

        const cleanedProfile: Partial<UserProfile> = {};
        for (const key in serializableProfile) {
            if (Object.prototype.hasOwnProperty.call(serializableProfile, key)) {
                const typedKey = key as keyof UserProfile;
                if (serializableProfile[typedKey] !== undefined) {
                    (cleanedProfile as any)[typedKey] = serializableProfile[typedKey];
                }
            }
        }


        const response = await fetch('/api/user-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId: state.userProfile.firebaseUid, userProfile: cleanedProfile }),
        });
        if (!response.ok) {
          const errorData = await response.text();
          console.error("Failed to save user profile to API:", response.status, response.statusText, errorData);
        }
      } catch (error) {
        console.error("Error saving user profile to API:", error);
      } finally {
        setIsSavingProfile(false);
      }
    };

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveProfileToApi, 1000);

    return () => clearTimeout(debounceTimer);
  }, [state.userProfile, state.isSetupComplete, state.isLoading, dispatch]);

  return (
    <AppContext.Provider value={{ state, dispatch, isSavingProfile }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};
