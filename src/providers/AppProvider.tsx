
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, WizardState, UserProfile, AssistantPurposeType, SubscriptionPlanType, DatabaseSource, AssistantConfig, DatabaseConfig } from '@/types';
import { MAX_WIZARD_STEPS } from '@/config/appConfig';

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'NEXT_WIZARD_STEP' }
  | { type: 'PREVIOUS_WIZARD_STEP' }
  | { type: 'SET_WIZARD_STEP'; payload: number }
  | { type: 'UPDATE_ASSISTANT_NAME'; payload: string }
  | { type: 'TOGGLE_ASSISTANT_PURPOSE'; payload: AssistantPurposeType }
  | { type: 'SET_DATABASE_OPTION'; payload: { type: DatabaseSource | null; name?: string; file?: File | null } }
  | { type: 'SET_AUTH_METHOD'; payload: "google" | "microsoft" | null }
  | { type: 'SET_SUBSCRIPTION_PLAN'; payload: SubscriptionPlanType | null }
  | { type: 'COMPLETE_SETUP'; payload: UserProfile }
  | { type: 'RESET_WIZARD' }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'ADD_ASSISTANT'; payload: AssistantConfig }
  | { type: 'UPDATE_ASSISTANT'; payload: AssistantConfig }
  | { type: 'REMOVE_ASSISTANT'; payload: string } // assistant ID
  | { type: 'ADD_DATABASE'; payload: DatabaseConfig };


const initialState: AppState = {
  wizard: {
    currentStep: 1,
    maxSteps: MAX_WIZARD_STEPS,
    assistantName: '',
    selectedPurposes: new Set(),
    databaseOption: { type: null },
    authMethod: null,
    selectedPlan: null,
  },
  userProfile: {
    isAuthenticated: false,
    currentPlan: null,
    assistants: [],
    databases: [],
  },
  isSetupComplete: false,
  isLoading: true, // Start with loading true to check localStorage
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'NEXT_WIZARD_STEP':
      if (state.wizard.currentStep < state.wizard.maxSteps) {
        return { ...state, wizard: { ...state.wizard, currentStep: state.wizard.currentStep + 1 } };
      }
      return state;
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
      if (newPurposes.has(action.payload)) {
        newPurposes.delete(action.payload);
      } else {
        newPurposes.add(action.payload);
      }
      return { ...state, wizard: { ...state.wizard, selectedPurposes: newPurposes } };
    }
    case 'SET_DATABASE_OPTION':
      return { ...state, wizard: { ...state.wizard, databaseOption: action.payload } };
    case 'SET_AUTH_METHOD':
      return { ...state, wizard: { ...state.wizard, authMethod: action.payload } };
    case 'SET_SUBSCRIPTION_PLAN':
      return { ...state, wizard: { ...state.wizard, selectedPlan: action.payload } };
    case 'COMPLETE_SETUP':
      return { 
        ...state, 
        userProfile: action.payload, 
        isSetupComplete: true, 
        wizard: initialState.wizard // Reset wizard
      };
    case 'RESET_WIZARD':
      return { ...state, wizard: initialState.wizard };
    case 'LOAD_STATE':
      // Ensure selectedPurposes is always a Set, even if localStorage is empty or malformed for this field.
      const loadedSelectedPurposes = action.payload.wizard?.selectedPurposes;
      const selectedPurposesSet = Array.isArray(loadedSelectedPurposes) 
        ? new Set(loadedSelectedPurposes as AssistantPurposeType[]) 
        : new Set<AssistantPurposeType>(); // Default to empty set if not an array

      return { 
        ...action.payload, 
        wizard: {
          ...initialState.wizard, // Start with default wizard state
          ...action.payload.wizard, // Override with loaded wizard state
          selectedPurposes: selectedPurposesSet, // Ensure it's a Set
        },
        isLoading: false 
      };
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
    default:
      return state;
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    try {
      const persistedState = localStorage.getItem('assistAIManagerState');
      if (persistedState) {
        const parsedState = JSON.parse(persistedState);
        dispatch({ type: 'LOAD_STATE', payload: parsedState });
      } else {
        dispatch({ type: 'LOAD_STATE', payload: initialState }); // Load initial state if nothing in LS
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      dispatch({ type: 'LOAD_STATE', payload: initialState }); // Fallback to initial state on error
    }
  }, []);

  useEffect(() => {
    if (!state.isLoading) { // Only save state if not in initial loading phase
      try {
        // Convert Set to array for JSON serialization
        const serializableState = {
          ...state,
          wizard: {
            ...state.wizard,
            selectedPurposes: Array.from(state.wizard.selectedPurposes),
          },
        };
        localStorage.setItem('assistAIManagerState', JSON.stringify(serializableState));
      } catch (error) {
        console.error("Failed to save state to localStorage", error);
      }
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
