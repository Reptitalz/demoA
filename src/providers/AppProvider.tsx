
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
        isLoading: false, // Ensure isLoading is false after loading state
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
            userProfile: { // Create new userProfile object
                ...state.userProfile,
                ...apiProfile,
                assistants: assistantsWithSetPurposes,
            },
            isSetupComplete: newIsSetupComplete,
            isLoading: false, // Crucial: set isLoading to false after sync
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
        isSetupComplete: false, // Explicitly set isSetupComplete to false on logout
        isLoading: false, // Ensure isLoading is false after logout
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

  // Effect for loading initial state from localStorage and Firebase Auth
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const persistedState = localStorage.getItem('assistAIManagerState');
      if (persistedState) {
        const parsedState = JSON.parse(persistedState);
        // We dispatch LOAD_STATE, which itself will set isLoading to false.
        // It also might set isAuthenticated.
        dispatch({ type: 'LOAD_STATE', payload: parsedState });
      } else {
        dispatch({ type: 'LOAD_STATE', payload: initialState }); // Still sets isLoading to false
      }
    } catch (error) {
      console.error("Error al cargar estado desde localStorage", error);
      dispatch({ type: 'LOAD_STATE', payload: initialState }); // Still sets isLoading to false
    }

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        const token = await user.getIdToken();
        console.log("Firebase Auth User UID:", user.uid, "Email:", user.email);
        dispatch({
          type: 'UPDATE_USER_PROFILE',
          payload: {
            isAuthenticated: true,
            authProvider: (user.providerData[0]?.providerId as AuthProviderType) || 'google',
            email: user.email || undefined,
            firebaseUid: user.uid,
          }
        });
        // Note: Fetching profile from API will be handled by the next useEffect
        // based on isAuthenticated and firebaseUid.
      } else {
        console.log("Firebase Auth: No user signed in.");
        dispatch({ type: 'LOGOUT_USER' });
      }
      // SET_LOADING(false) is handled by LOAD_STATE, SYNC_PROFILE_FROM_API, or LOGOUT_USER
    });
    return () => unsubscribe();
  }, [dispatch]); // dispatch is stable

  // Effect for fetching profile from API
  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      // No SET_LOADING(true) here, let the caller manage or rely on global isLoading if needed
      // This effect is triggered by auth changes, subsequent isLoading is handled by reducer on SYNC or error
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error("User not authenticated for fetching profile.");
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
            console.log("Profile not found on backend for user:", userId, "Will proceed with local/default state.");
            // If profile not found, we might not want to set loading to false here,
            // as LOAD_STATE should have already done it. If it's a fresh login with no profile,
            // isSetupComplete will be false, guiding user to setup.
            dispatch({ type: 'SET_LOADING', payload: false }); // Or rely on initial LOAD_STATE
          } else {
            console.error("API responded but profile not found or error:", response.statusText);
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          console.error("Failed to fetch user profile from API:", response.status, response.statusText);
          if (response.status === 401 || response.status === 403) {
            dispatch({ type: 'LOGOUT_USER' });
          } else {
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        }
      } catch (error) {
        console.error("Error fetching user profile from API:", error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    // Only fetch if authenticated, has UID, AND critically, if we are not already loading.
    // This !state.isLoading helps prevent re-fetching if another process (like initial load) is still considered loading.
    if (state.userProfile.isAuthenticated && state.userProfile.firebaseUid && !state.isLoading) {
       // This `SET_LOADING` is for the fetch operation itself.
      dispatch({ type: 'SET_LOADING', payload: true });
      fetchProfile(state.userProfile.firebaseUid);
    }
  // IMPORTANT: Removed state.isLoading from dependencies to prevent re-triggering from its own SET_LOADING calls.
  // This hook now primarily reacts to authentication state changes.
  }, [state.userProfile.isAuthenticated, state.userProfile.firebaseUid, dispatch]);


  // Effect for saving entire app state to localStorage
  useEffect(() => {
    // Do not save to localStorage if we are in an isLoading state,
    // as the state might be intermediate or incomplete.
    if (state.isLoading) {
      return;
    }
    try {
      const serializableState = {
        ...state,
        isLoading: false, // Persist isLoading as false if we are saving
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
  // Depend on the actual data parts of the state, not isLoading itself for triggering localStorage save.
  }, [state.wizard, state.userProfile, state.isSetupComplete, dispatch]);


  // Effect for saving just the user profile to the API
  useEffect(() => {
    // Do not save to API if we are in an isLoading state,
    // especially if it's due to fetching this very profile.
    if (state.isLoading) {
      return;
    }

    if (state.userProfile.isAuthenticated && state.userProfile.firebaseUid && state.isSetupComplete) {
      const saveProfileToApi = async () => {
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            console.error("User not authenticated for saving profile.");
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
  // This effect should run when the userProfile's content (that needs to be persisted to backend) changes,
  // or when setup is completed.
  // Using specific fields from userProfile that are relevant for backend persistence.
  // Also depends on isAuthenticated and firebaseUid to ensure user is logged in.
  // isSetupComplete is a good trigger for an initial save after wizard.
  // isLoading is added to ensure it re-evaluates after loading is done.
  }, [
      state.userProfile.firebaseUid, // Ensures UID is present
      state.userProfile.isAuthenticated, // Ensures user is authenticated
      state.userProfile.currentPlan,
      state.userProfile.assistants,
      state.userProfile.databases,
      state.isSetupComplete, // Triggers save after setup
      state.isLoading, // Re-evaluate when loading finishes
      dispatch
     ]);

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

    