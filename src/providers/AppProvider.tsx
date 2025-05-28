
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, WizardState, UserProfile, AssistantPurposeType, SubscriptionPlanType, DatabaseSource, AssistantConfig, DatabaseConfig, AuthProviderType } from '@/types';
import { MAX_WIZARD_STEPS } from '@/config/appConfig';
import { auth } from '@/lib/firebase'; // Import Firebase auth instance

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
  }, []);

  useEffect(() => {
    const fetchProfileFromApi = async (userId: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error("User not authenticated for fetching profile.");
          dispatch({ type: 'LOGOUT_USER' }); // Or handle appropriately
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }
        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/user-profile?userId=${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.userProfile) {
            dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: data.userProfile });
          } else if (response.status === 404) {
             console.log("Profile not found on backend for user:", userId);
             dispatch({ type: 'SET_LOADING', payload: false });
          } else {
             // Handle other non-404 but not ok statuses
            console.error("API responded but profile not found or error:", response.statusText);
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          console.error("Failed to fetch user profile from API:", response.status, response.statusText);
           if (response.status === 401 || response.status === 403) {
             dispatch({ type: 'LOGOUT_USER' }); // Token might be invalid or expired
           }
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error("Error fetching user profile from API:", error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    if (state.userProfile.isAuthenticated && state.userProfile.firebaseUid && !state.isLoading) {
      fetchProfileFromApi(state.userProfile.firebaseUid);
    }
  }, [state.userProfile.isAuthenticated, state.userProfile.firebaseUid, state.isLoading]);


  useEffect(() => {
    if (state.isLoading) { 
      return;
    }

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

    if (state.userProfile.isAuthenticated && state.userProfile.firebaseUid) {
      const saveProfileToApi = async () => {
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            console.error("User not authenticated for saving profile.");
            // Optionally dispatch logout or handle error
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
          const response = await fetch('/api/user-profile', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId: state.userProfile.firebaseUid, userProfile: serializableProfile }),
          });
          if (!response.ok) {
            console.error("Failed to save user profile to API:", response.status, response.statusText);
             if (response.status === 401 || response.status === 403) {
               // Handle token invalid/expired, maybe prompt re-login or refresh token
               console.warn("Token might be invalid or expired. Consider re-authentication.");
             }
          } else {
             const result = await response.json();
             console.log("Profile saved to API:", result.message);
          }
        } catch (error) {
          console.error("Error saving user profile to API:", error);
        }
      };
      saveProfileToApi();
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

