// src/hooks/useAssistants.ts
"use client";

import { useEffect, useCallback } from 'react';
import { useApp } from '@/providers/AppProvider';
import { AssistantConfig } from '@/types';
import { openDB, ASSISTANTS_STORE_NAME } from '@/lib/db';

export const useAssistants = () => {
  const { state, dispatch } = useApp();
  const { assistants } = state.userProfile;

  // Load assistants from IndexedDB on initial mount
  useEffect(() => {
    const loadAssistants = async () => {
      try {
        const db = await openDB();
        const tx = db.transaction(ASSISTANTS_STORE_NAME, 'readonly');
        const store = tx.objectStore(ASSISTANTS_STORE_NAME);
        const storedAssistants = await store.getAll();
        
        // Only dispatch if there's a difference to avoid loops
        if (JSON.stringify(storedAssistants) !== JSON.stringify(assistants)) {
            dispatch({ type: 'UPDATE_USER_PROFILE', payload: { assistants: storedAssistants } });
        }
      } catch (error) {
        console.error("Failed to load assistants from IndexedDB:", error);
      }
    };
    loadAssistants();
  }, [dispatch]); // Removed assistants from deps to avoid re-running on every update

  const addAssistant = useCallback(async (assistant: AssistantConfig) => {
    try {
      const db = await openDB();
      const tx = db.transaction(ASSISTANTS_STORE_NAME, 'readwrite');
      await tx.objectStore(ASSISTANTS_STORE_NAME).put(assistant);
      await tx.done;
      dispatch({ type: 'ADD_ASSISTANT', payload: assistant });
    } catch (error) {
      console.error("Failed to add assistant to IndexedDB:", error);
    }
  }, [dispatch]);

  const removeAssistant = useCallback(async (assistantId: string) => {
    try {
      const db = await openDB();
      const tx = db.transaction(ASSISTANTS_STORE_NAME, 'readwrite');
      await tx.objectStore(ASSISTANTS_STORE_NAME).delete(assistantId);
      await tx.done;
      dispatch({ type: 'REMOVE_ASSISTANT', payload: assistantId });
    } catch (error) {
      console.error("Failed to remove assistant from IndexedDB:", error);
    }
  }, [dispatch]);

  return { assistants, addAssistant, removeAssistant };
};
