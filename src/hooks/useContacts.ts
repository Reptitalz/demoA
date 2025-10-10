
// src/hooks/useContacts.ts
"use client";

import { useEffect, useCallback } from 'react';
import { useApp } from '@/providers/AppProvider';
import { Contact, ChatMessage, UserProfile } from '@/types';
import { useToast } from "@/hooks/use-toast";

export const useContacts = () => {
  const { state, dispatch } = useApp();
  const { contacts, userProfile } = state;
  const { toast } = useToast();

  const fetchContacts = useCallback(async () => {
    if (!userProfile.isAuthenticated || !userProfile._id) return;
    try {
      const response = await fetch(`/api/contacts?userId=${userProfile._id.toString()}`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar los contactos del perfil.');
      }
      const serverContacts: Contact[] = await response.json();
      dispatch({ type: 'SET_CONTACTS', payload: serverContacts });
    } catch (error: any) {
      console.error("Failed to fetch contacts from server:", error);
      toast({ title: 'Error de Sincronización', description: error.message, variant: 'destructive' });
    }
  }, [userProfile.isAuthenticated, userProfile._id, dispatch, toast]);

  // Load contacts from server on initial mount
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = useCallback(async (contactData: Omit<Contact, 'conversationSize' | '_id'>) => {
    if (!userProfile._id) return;
    
    // Optimistic update
    const newContact: Contact = { ...contactData, conversationSize: 0 };
    dispatch({ type: 'ADD_CONTACT', payload: newContact });

    try {
        const response = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userProfile._id.toString(), newContact }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            // Revert optimistic update
            dispatch({ type: 'SET_CONTACTS', payload: state.contacts.filter(c => c.chatPath !== newContact.chatPath) });
            throw new Error(result.message || "No se pudo añadir el contacto.");
        }
        // Refetch to get the source-of-truth
        fetchContacts();

    } catch (error: any) {
        console.error("Failed to add contact to DB:", error);
        toast({ title: 'Error', description: error.message, variant: 'destructive'});
        // Revert optimistic update
        dispatch({ type: 'SET_CONTACTS', payload: state.contacts.filter(c => c.chatPath !== newContact.chatPath) });
    }
  }, [dispatch, userProfile._id, fetchContacts, state.contacts, toast]);

  const removeContact = useCallback(async (chatPath: string) => {
    if (!userProfile._id) return;
    const originalContacts = state.contacts;
    // Optimistic update
    dispatch({ type: 'SET_CONTACTS', payload: originalContacts.filter(c => c.chatPath !== chatPath) });

    try {
      const response = await fetch('/api/contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userProfile._id.toString(), chatPath }),
      });
      if (!response.ok) {
        throw new Error("No se pudo eliminar el contacto.");
      }
    } catch (error: any) {
      console.error("Failed to remove contact from DB:", error);
      toast({ title: 'Error', description: error.message, variant: 'destructive'});
      // Revert
      dispatch({ type: 'SET_CONTACTS', payload: originalContacts });
    }
  }, [dispatch, userProfile._id, state.contacts, toast]);
  
  // This function is now a placeholder as we don't clear chats from MongoDB this way
  const clearContactChat = useCallback(async (chatPath: string) => {
     console.log("Clearing chat for", chatPath);
     // This would require a new API endpoint to delete messages for a chat from the central DB.
     // For now, it will just clear the local view if we were caching it.
     toast({ title: 'Función no implementada', description: 'La limpieza de chats se implementará en una futura versión.' });
  }, [toast]);

  return { contacts, addContact, removeContact, clearContactChat };
};
