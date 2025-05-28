
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
  | { type: 'LOAD_STATE'; payload: AppState } // For initial localStorage load
  | { type: 'SYNC_PROFILE_FROM_API'; payload: UserProfile } // For syncing profile from API
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'ADD_ASSISTANT'; payload: AssistantConfig }
  | { type: 'UPDATE_ASSISTANT'; payload: AssistantConfig }
  | { type: 'REMOVE_ASSISTANT'; payload: string } // assistant ID
  | { type: 'ADD_DATABASE'; payload: DatabaseConfig }
  | { type: 'LOGOUT_USER' }
  | { type: 'SET_IS_RECONFIGURING'; payload: boolean }
  | { type: 'SET_EDITING_ASSISTANT_ID'; payload: string | null };


const initialWizardState: WizardState = {
  currentStep: 1,
  maxSteps: MAX_WIZARD_STEPS,
  assistantName: '',
  selectedPurposes: new Set(),
  databaseOption: { type: null },
  authMethod: null,
  selectedPlan: null,
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

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

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
    case 'LOAD_STATE': { // Primarily for localStorage initial load
      const loadedState = action.payload;
      const wizardSelectedPurposesSet = Array.isArray(loadedState.wizard?.selectedPurposes)
        ? new Set(loadedState.wizard.selectedPurposes as AssistantPurposeType[])
        : new Set<AssistantPurposeType>();

      const assistantsWithSetPurposes = (loadedState.userProfile?.assistants || []).map(assistant => ({
        ...assistant,
        purposes: new Set(Array.isArray(assistant.purposes) ? assistant.purposes : []) as Set<AssistantPurposeType>,
      }));
      
      return {
        ...initialState, // Base default state
        ...loadedState,   // Overlay with loaded state from LS
        userProfile: {
          ...initialUserProfileState, // Base default profile
          ...(loadedState.userProfile || {}), // Overlay with loaded profile
          assistants: assistantsWithSetPurposes,
        },
        wizard: {
          ...initialWizardState, // Base default wizard
          ...(loadedState.wizard || {}), // Overlay with loaded wizard
          selectedPurposes: wizardSelectedPurposesSet,
        },
        isLoading: false, // Explicitly set loading to false after LS load
      };
    }
    case 'SYNC_PROFILE_FROM_API': { // New action to update profile from API data
        const apiProfile = action.payload;
        const assistantsWithSetPurposes = (apiProfile.assistants || []).map(assistant => ({
            ...assistant,
            purposes: new Set(Array.isArray(assistant.purposes) ? assistant.purposes : []) as Set<AssistantPurposeType>,
        }));
        const newIsSetupComplete = !!apiProfile.currentPlan || (apiProfile.assistants && apiProfile.assistants.length > 0);

        return {
            ...state,
            userProfile: {
                ...state.userProfile, // Keep existing non-profile parts of userProfile if any
                ...apiProfile,
                assistants: assistantsWithSetPurposes,
            },
            isSetupComplete: newIsSetupComplete, // Determine setup completeness based on API profile
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

  // Effect for loading initial state from localStorage (runs once on mount)
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
    // SET_LOADING to false is handled within LOAD_STATE action
  }, []);

  // Effect for fetching profile from API when user is authenticated
  useEffect(() => {
    const fetchProfileFromApi = async (userId: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await fetch(`/api/user-profile?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.userProfile) {
            // The SYNC_PROFILE_FROM_API action should correctly deserialize Sets
            dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: data.userProfile });
          } else if (response.status === 404) {
            // Profile not found on backend, local state (from LS or initial) will be used.
            // This might be the first time for this user, so local state will be saved to backend later.
             console.log("Profile not found on backend for user:", userId);
             dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          console.error("Failed to fetch user profile from API:", response.statusText);
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error("Error fetching user profile from API:", error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    if (state.userProfile.isAuthenticated && state.userProfile.firebaseUid && !state.isLoading) {
        // Only fetch if not currently loading from another source (like initial LS load)
        // This condition might need refinement to avoid re-fetching if profile is already up-to-date
        // For now, it fetches when firebaseUid becomes available and app is not in initial loading phase.
      fetchProfileFromApi(state.userProfile.firebaseUid);
    }
  }, [state.userProfile.isAuthenticated, state.userProfile.firebaseUid, state.isLoading]); // Added isLoading to dependencies


  // Effect for saving state (including profile to API and full state to localStorage)
  useEffect(() => {
    if (state.isLoading) { // Don't save while initial loading is in progress
      return;
    }

    // Save full state to localStorage
    try {
      const serializableState = {
        ...state,
        wizard: {
          ...state.wizard,
          selectedPurposes: Array.from(state.wizard.selectedPurposes),
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

    // Save userProfile to API if authenticated
    if (state.userProfile.isAuthenticated && state.userProfile.firebaseUid) {
      const saveProfileToApi = async () => {
        try {
          const serializableProfile = {
            ...state.userProfile,
            assistants: state.userProfile.assistants.map(assistant => ({
              ...assistant,
              purposes: Array.from(assistant.purposes),
            })),
          };
          const response = await fetch('/api/user-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: state.userProfile.firebaseUid, userProfile: serializableProfile }),
          });
          if (!response.ok) {
            console.error("Failed to save user profile to API:", response.statusText);
          } else {
             const result = await response.json();
             console.log("Profile saved to API (mock):", result.message);
          }
        } catch (error) {
          console.error("Error saving user profile to API:", error);
        }
      };
      saveProfileToApi();
    }
  }, [state]); // This effect runs whenever any part of `state` changes.

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

