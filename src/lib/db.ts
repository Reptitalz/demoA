// src/lib/db.ts
import { openDB as openIDB, DBSchema, IDBPDatabase } from 'idb';

export const DB_NAME = 'HeyManitoChatDB';
const DB_VERSION = 2; // Incremented version

// Object Store Names
export const SESSIONS_STORE_NAME = 'session';
export const MESSAGES_STORE_NAME = 'messages';
export const CONTACTS_STORE_NAME = 'contacts';
export const ASSISTANTS_STORE_NAME = 'assistants';

interface HeyManitoDB extends DBSchema {
  [SESSIONS_STORE_NAME]: {
    key: string; // chatPath
    value: { chatPath: string; sessionId: string };
  };
  [MESSAGES_STORE_NAME]: {
    key: number; // auto-incrementing
    value: any; // ChatMessage + sessionId
    indexes: { 'by_sessionId': string };
  };
  [CONTACTS_STORE_NAME]: {
    key: string; // chatPath
    value: any; // Contact type
  };
  [ASSISTANTS_STORE_NAME]: {
    key: string; // assistant.id
    value: any; // AssistantConfig type
  };
}

let dbPromise: Promise<IDBPDatabase<HeyManitoDB>> | null = null;

export const openDB = (): Promise<IDBPDatabase<HeyManitoDB>> => {
  if (dbPromise) {
    return dbPromise;
  }
  
  dbPromise = openIDB<HeyManitoDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (oldVersion < 1) {
        // Initial schema from your original code
        if (!db.objectStoreNames.contains(MESSAGES_STORE_NAME)) {
          db.createObjectStore(MESSAGES_STORE_NAME, { autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(SESSIONS_STORE_NAME)) {
          db.createObjectStore(SESSIONS_STORE_NAME, { keyPath: 'chatPath' });
        }
      }
      if (oldVersion < 2) {
        // New object stores for version 2
        if (!db.objectStoreNames.contains(CONTACTS_STORE_NAME)) {
          db.createObjectStore(CONTACTS_STORE_NAME, { keyPath: 'chatPath' });
        }
        if (!db.objectStoreNames.contains(ASSISTANTS_STORE_NAME)) {
          db.createObjectStore(ASSISTANTS_STORE_NAME, { keyPath: 'id' });
        }
        
        // Add index to messages store for efficient lookup
        // Correctly get the object store from the upgrade transaction
        const messagesStore = transaction.objectStore(MESSAGES_STORE_NAME);
        if (!messagesStore.indexNames.contains('by_sessionId')) {
            messagesStore.createIndex('by_sessionId', 'sessionId');
        }
      }
    },
  });

  return dbPromise;
};
