
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import type { AppState, WizardState, UserProfile, AssistantPurposeType, DatabaseSource, AssistantConfig, DatabaseConfig, AuthProviderType } from '@/types';
import { MAX_WIZARD_STEPS } from '@/config/appConfig';
import { auth } from '@/lib/firebase'; 
import { toast } from "@/hooks/use-toast";


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

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const persistedWizardStateJSON = localStorage.getItem('assistAIManagerWizardState');
      if (persistedWizardStateJSON) {
        const persistedWizardState = JSON.parse(persistedWizardStateJSON);
        dispatch({ type: 'LOAD_WIZARD_STATE', payload: persistedWizardState });
      }
    } catch (error) {
      console.error("Error loading wizard state from localStorage", error);
    }

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        dispatch({
          type: 'UPDATE_USER_PROFILE',
          payload: {
            isAuthenticated: true,
            authProvider: 'google',
            email: user.email || undefined,
            firebaseUid: user.uid,
          }
        });
      } else {
        if (state.userProfile.isAuthenticated) {
          localStorage.removeItem('assistAIManagerWizardState');
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
    if (state.userProfile.isAuthenticated && state.userProfile.firebaseUid && !state.isSetupComplete) {
      fetchProfileCallback(state.userProfile.firebaseUid);
    } else if (!state.userProfile.isAuthenticated && !state.isLoading) {
      // Already not loading, do nothing
    } else if (!state.userProfile.isAuthenticated) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.userProfile.isAuthenticated, state.userProfile.firebaseUid, state.isSetupComplete, fetchProfileCallback]);


  useEffect(() => {
    if (state.isLoading) {
      return;
    }
    try {
      const serializableWizardState = {
        ...state.wizard,
        selectedPurposes: Array.from(state.wizard.selectedPurposes),
      };
      localStorage.setItem('assistAIManagerWizardState', JSON.stringify(serializableWizardState));
    } catch (error) {
      console.error("Error saving wizard state to localStorage", error);
    }
  }, [state.wizard, state.isLoading]);


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
