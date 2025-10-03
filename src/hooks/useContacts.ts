// src/hooks/useContacts.ts
"use client";

import { useEffect, useCallback } from 'react';
import { useApp } from '@/providers/AppProvider';
import { Contact } from '@/types';
import { openDB, CONTACTS_STORE_NAME, SESSIONS_STORE_NAME, MESSAGES_STORE_NAME } from '@/lib/db';

export const useContacts = () => {
  const { state, dispatch } = useApp();
  const { contacts } = state;

  // Load contacts from IndexedDB on initial mount
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const db = await openDB();
        const tx = db.transaction(CONTACTS_STORE_NAME, 'readonly');
        const store = tx.objectStore(CONTACTS_STORE_NAME);
        const storedContacts = await store.getAll();
        dispatch({ type: 'SET_CONTACTS', payload: storedContacts });
      } catch (error) {
        console.error("Failed to load contacts from IndexedDB:", error);
      }
    };
    loadContacts();
  }, [dispatch]);

  const addContact = useCallback(async (contact: Omit<Contact, 'id'>) => {
    try {
      const db = await openDB();
      const tx = db.transaction(CONTACTS_STORE_NAME, 'readwrite');
      // The key is chatPath, which is already in the contact object
      await tx.objectStore(CONTACTS_STORE_NAME).put(contact);
      await tx.done;
      dispatch({ type: 'ADD_CONTACT', payload: contact as Contact });
    } catch (error) {
      console.error("Failed to add contact to IndexedDB:", error);
    }
  }, [dispatch]);

  const removeContact = useCallback(async (chatPath: string) => {
    try {
      const db = await openDB();
      const tx = db.transaction([CONTACTS_STORE_NAME, SESSIONS_STORE_NAME, MESSAGES_STORE_NAME], 'readwrite');
      const contactsStore = tx.objectStore(CONTACTS_STORE_NAME);
      const sessionsStore = tx.objectStore(SESSIONS_STORE_NAME);
      const messagesStore = tx.objectStore(MESSAGES_STORE_NAME);
      
      // Get session to delete messages
      const session = await sessionsStore.get(chatPath);
      if (session) {
          const messagesCursor = await messagesStore.index('by_sessionId').openCursor(IDBKeyRange.only(session.sessionId));
          let cursor = messagesCursor;
          while(cursor) {
              cursor.delete();
              cursor = await cursor.continue();
          }
          await sessionsStore.delete(chatPath);
      }

      await contactsStore.delete(chatPath);
      await tx.done;

      dispatch({ type: 'SET_CONTACTS', payload: contacts.filter(c => c.chatPath !== chatPath) });

    } catch (error) {
      console.error("Failed to remove contact from IndexedDB:", error);
    }
  }, [dispatch, contacts]);

  const clearContactChat = useCallback(async (chatPath: string) => {
     try {
        const db = await openDB();
        const sessionTx = db.transaction(SESSIONS_STORE_NAME, 'readonly');
        const sessionStore = sessionTx.objectStore(SESSIONS_STORE_NAME);
        const sessionReq = await sessionStore.get(chatPath);
        
        if (sessionReq && sessionReq.sessionId) {
            const sessionId = sessionReq.sessionId;
            const messagesTx = db.transaction(MESSAGES_STORE_NAME, 'readwrite');
            const messagesStore = messagesTx.objectStore(MESSAGES_STORE_NAME);
            const index = messagesStore.index('by_sessionId');
            let cursor = await index.openCursor(IDBKeyRange.only(sessionId));
            
            while (cursor) {
                cursor.delete();
                cursor = await cursor.continue();
            }
            await messagesTx.done;
        }

    } catch (error: any) {
        console.error("Error clearing conversation:", error);
    }
  }, []);

  return { contacts, addContact, removeContact, clearContactChat };
};
