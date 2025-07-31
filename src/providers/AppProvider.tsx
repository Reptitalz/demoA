
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import type { AppState, WizardState, UserProfile, AssistantPurposeType, AuthProviderType, AssistantConfig, DatabaseConfig, UserAddress } from '@/types';
import { MAX_WIZARD_STEPS } from '@/config/appConfig';
import { toast } from "@/hooks/use-toast";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const initialWizardState: WizardState = {
  currentStep: 1,
  maxSteps: MAX_WIZARD_STEPS,
  assistantName: '',
  assistantPrompt: '',
  selectedPurposes: new Set(),
  databaseOption: { type: null, name: '', accessUrl: '' },
  authMethod: null,
  firstName: '',
  lastName: '',
  email: '',
  address: {},
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
  firstName: undefined,
  lastName: undefined,
  address: undefined,
  phoneNumber: undefined,
  password: undefined,
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
  isLoading: true, // Start as true to check for session
};

const AppContext = createContext<{ 
  state: AppState; 
  dispatch: React.Dispatch<Action>; 
  fetchProfileCallback: (phoneNumber: string) => Promise<void>;
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
  | { type: 'UPDATE_WIZARD_USER_DETAILS'; payload: { field: keyof UserProfile; value: string | UserAddress } }
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
    case 'UPDATE_WIZARD_USER_DETAILS': {
      const { field, value } = action.payload;
      if (field === 'address') {
        return { ...state, wizard: { ...state.wizard, address: { ...state.wizard.address, ...(value as UserAddress) }}};
      }
      return { ...state, wizard: { ...state.wizard, [field]: value }};
    }
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
    case 'LOGOUT_USER':
      // Clear session storage on logout
      try {
        sessionStorage.removeItem('loggedInUser');
      } catch (error) {
        console.error("Could not clear session storage:", error);
      }
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
  
  const fetchProfileCallback = useCallback(async (phoneNumber: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`/api/user-profile?phoneNumber=${encodeURIComponent(phoneNumber)}`);

      if (response.ok) {
        const data = await response.json();
        if (data.userProfile) {
          dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: data.userProfile });
          sessionStorage.setItem('loggedInUser', phoneNumber);
        } else {
           dispatch({ type: 'LOGOUT_USER' });
        }
      } else {
        dispatch({ type: 'LOGOUT_USER' });
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      dispatch({ type: 'LOGOUT_USER' });
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);
  
  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (loggedInUser) {
      fetchProfileCallback(loggedInUser);
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
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
