
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, WizardState, UserProfile, AssistantPurposeType, SubscriptionPlanType, DatabaseSource, AssistantConfig, DatabaseConfig, AuthProviderType } from '@/types';
import { MAX_WIZARD_STEPS } from '@/config/appConfig';

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'NEXT_WIZARD_STEP' }
  | { type: 'PREVIOUS_WIZARD_STEP' }
  | { type: 'SET_WIZARD_STEP'; payload: number }
  | { type: 'UPDATE_ASSISTANT_NAME'; payload: string }
  | { type: 'TOGGLE_ASSISTANT_PURPOSE'; payload: AssistantPurposeType }
  | { type: 'SET_DATABASE_OPTION'; payload: { type: DatabaseSource | null; name?: string; file?: File | null } }
  | { type: 'SET_AUTH_METHOD'; payload: AuthProviderType | null }
  | { type: 'SET_SUBSCRIPTION_PLAN'; payload: SubscriptionPlanType | null }
  | { type: 'COMPLETE_SETUP'; payload: UserProfile }
  | { type: 'RESET_WIZARD' }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'ADD_ASSISTANT'; payload: AssistantConfig }
  | { type: 'UPDATE_ASSISTANT'; payload: AssistantConfig }
  | { type: 'REMOVE_ASSISTANT'; payload: string } // assistant ID
  | { type: 'ADD_DATABASE'; payload: DatabaseConfig }
  | { type: 'LOGOUT_USER' };


const initialWizardState: WizardState = {
  currentStep: 1,
  maxSteps: MAX_WIZARD_STEPS,
  assistantName: '',
  selectedPurposes: new Set(),
  databaseOption: { type: null },
  authMethod: null,
  selectedPlan: null,
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
        wizard: initialWizardState // Reset wizard
      };
    case 'RESET_WIZARD':
      return { ...state, wizard: initialWizardState };
    case 'LOAD_STATE': {
      const loadedWizardPurposes = action.payload.wizard?.selectedPurposes;
      const wizardSelectedPurposesSet = Array.isArray(loadedWizardPurposes) 
        ? new Set(loadedWizardPurposes as AssistantPurposeType[]) 
        : new Set<AssistantPurposeType>();

      const loadedUserProfile = action.payload.userProfile || initialUserProfileState;
      const assistantsWithSetPurposes = (loadedUserProfile.assistants || []).map(assistant => ({
        ...assistant,
        purposes: Array.isArray(assistant.purposes) 
          ? new Set(assistant.purposes as AssistantPurposeType[])
          // Handle cases where purposes might be stored as an object (e.g. from older state versions)
          : (typeof assistant.purposes === 'object' && assistant.purposes !== null && !(assistant.purposes instanceof Set)) 
            ? new Set(Object.keys(assistant.purposes) as AssistantPurposeType[])
            : new Set<AssistantPurposeType>(), 
      }));

      return { 
        ...initialState, 
        ...action.payload, 
        userProfile: {
          ...initialUserProfileState,
          ...loadedUserProfile,
          assistants: assistantsWithSetPurposes,
        },
        wizard: {
          ...initialWizardState, 
          ...action.payload.wizard, 
          selectedPurposes: wizardSelectedPurposesSet,
        },
        isLoading: false 
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
        ...state, // Preserve existing state like isSetupComplete
        userProfile: initialUserProfileState, // Reset only user profile
        wizard: initialWizardState, // Reset wizard state, including currentStep
        isLoading: false,
      };
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
        // Ensure selectedPurposes in assistants are Sets after loading
        if (parsedState.userProfile && parsedState.userProfile.assistants) {
          parsedState.userProfile.assistants = parsedState.userProfile.assistants.map((asst: AssistantConfig) => ({
            ...asst,
            purposes: new Set(asst.purposes),
          }));
        }
        // Ensure selectedPurposes in wizard is a Set
        if (parsedState.wizard && parsedState.wizard.selectedPurposes) {
          parsedState.wizard.selectedPurposes = new Set(parsedState.wizard.selectedPurposes);
        }
        dispatch({ type: 'LOAD_STATE', payload: parsedState });
      } else {
        dispatch({ type: 'LOAD_STATE', payload: initialState }); 
      }
    } catch (error) {
      console.error("Error al cargar estado desde localStorage", error);
      dispatch({ type: 'LOAD_STATE', payload: initialState }); 
    }
  }, []);

  useEffect(() => {
    if (!state.isLoading) { 
      try {
        const serializableState = {
          ...state,
          wizard: {
            ...state.wizard,
            selectedPurposes: Array.from(state.wizard.selectedPurposes), // Serialize Set to Array
          },
          userProfile: {
            ...state.userProfile,
            assistants: state.userProfile.assistants.map(assistant => ({
              ...assistant,
              purposes: Array.from(assistant.purposes), // Serialize Set to Array for each assistant
            })),
          }
        };
        localStorage.setItem('assistAIManagerState', JSON.stringify(serializableState));
      } catch (error) {
        console.error("Error al guardar estado en localStorage", error);
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
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};
