
// src/hooks/useContacts.ts
"use client";

import { useEffect, useCallback } from 'react';
import { useApp } from '@/providers/AppProvider';
import { Contact, ChatMessage } from '@/types';
import { openDB, CONTACTS_STORE_NAME, SESSIONS_STORE_NAME, MESSAGES_STORE_NAME } from '@/lib/db';

interface StoredMessage extends ChatMessage {
    id?: number; // keyPath is 'id', so it will be present
    sessionId: string;
}


export const useContacts = () => {
  const { state, dispatch } = useApp();
  const { contacts } = state;

  // Load contacts from IndexedDB on initial mount
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const db = await openDB();
        const contactTx = db.transaction(CONTACTS_STORE_NAME, 'readonly');
        const storedContacts: Contact[] = await contactTx.objectStore(CONTACTS_STORE_NAME).getAll();

        // Now, for each contact, fetch the last message and unread count
        const contactsWithDetails = await Promise.all(
          storedContacts.map(async (contact) => {
            if (contact.isDemo) return contact;
            try {
              const session = await db.get(SESSIONS_STORE_NAME, contact.chatPath);
              if (session?.sessionId) {
                const msgTx = db.transaction(MESSAGES_STORE_NAME, 'readonly');
                const msgStore = msgTx.objectStore(MESSAGES_STORE_NAME);
                const msgIndex = msgStore.index('by_sessionId');
                
                let lastMsg: StoredMessage | null = null;
                let unreadCount = 0;

                let cursor = await msgIndex.openCursor(session.sessionId, 'prev');
                let count = 0;
                while(cursor) {
                    if (count === 0) {
                        lastMsg = cursor.value;
                    }
                    if (cursor.value.role === 'model' && cursor.value.status !== 'read') {
                        unreadCount++;
                    }
                    count++;
                    if (count > 100) break; // Safety break for performance
                    cursor = await cursor.continue();
                }

                if (lastMsg) {
                  const content = typeof lastMsg.content === 'string' ? lastMsg.content : (lastMsg.content as any).type ? `[${(lastMsg.content as any).type}]` : '[Archivo]';
                  return {
                    ...contact,
                    lastMessage: content,
                    lastMessageTimestamp: new Date(lastMsg.time).getTime(),
                    unreadCount: unreadCount,
                  };
                }
              }
            } catch (e) {
                console.error(`Failed to get last message for ${contact.chatPath}`, e);
            }
            return { ...contact, unreadCount: 0 };
          })
        );
        
        // Sort contacts by last message timestamp
        contactsWithDetails.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));

        dispatch({ type: 'SET_CONTACTS', payload: contactsWithDetails });
      } catch (error) {
        console.error("Failed to load contacts from IndexedDB:", error);
      }
    };
    if (state.userProfile.isAuthenticated) {
        loadContacts();
    }
  }, [dispatch, state.userProfile.isAuthenticated]);

  const addContact = useCallback(async (contact: Omit<Contact, 'id'>) => {
    if (contact.isDemo) return;
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
      const session = await db.get(SESSIONS_STORE_NAME, chatPath);
      const sessionId = session?.sessionId;
      
      const tx = db.transaction([CONTACTS_STORE_NAME, SESSIONS_STORE_NAME, MESSAGES_STORE_NAME], 'readwrite');
      
      // 1. Delete messages if session existed
      if (sessionId) {
          const msgStore = tx.objectStore(MESSAGES_STORE_NAME);
          const msgIndex = msgStore.index('by_sessionId');
          let cursor = await msgIndex.openCursor(sessionId);
          while(cursor) {
              await cursor.delete();
              cursor = await cursor.continue();
          }
      }
      
      // 2. Delete session
      await tx.objectStore(SESSIONS_STORE_NAME).delete(chatPath);
      
      // 3. Delete contact
      await tx.objectStore(CONTACTS_STORE_NAME).delete(chatPath);

      await tx.done;

      dispatch({ type: 'SET_CONTACTS', payload: contacts.filter(c => c.chatPath !== chatPath) });

    } catch (error) {
      console.error("Failed to remove contact and related data from IndexedDB:", error);
    }
  }, [dispatch, contacts]);

  const clearContactChat = useCallback(async (chatPath: string) => {
     try {
        const db = await openDB();
        const session = await db.get(SESSIONS_STORE_NAME, chatPath);

        if (session?.sessionId) {
            const sessionId = session.sessionId;
            const tx = db.transaction(MESSAGES_STORE_NAME, 'readwrite');
            const store = tx.objectStore(MESSAGES_STORE_NAME);
            const index = store.index('by_sessionId');
            let cursor = await index.openCursor(sessionId);
            
            while(cursor) {
                await cursor.delete();
                cursor = await cursor.continue();
            }
            await tx.done;
        }

    } catch (error: any) {
        console.error("Error clearing conversation:", error);
    }
  }, []);

  return { contacts, addContact, removeContact, clearContactChat };
};
