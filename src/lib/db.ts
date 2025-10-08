// src/lib/db.ts
import { openDB as openIDB, DBSchema, IDBPDatabase } from 'idb';

export const DB_NAME = 'HeyManitoChatDB';
const DB_VERSION = 3; // Incremented version to match existing DB and add new store

// Object Store Names
export const SESSIONS_STORE_NAME = 'session';
export const MESSAGES_STORE_NAME = 'messages';
export const CONTACTS_STORE_NAME = 'contacts';
export const ASSISTANTS_STORE_NAME = 'assistants';
export const AUTHORIZED_PAYMENTS_STORE_NAME = 'authorized_payments';


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
  [AUTHORIZED_PAYMENTS_STORE_NAME]: {
    key: string; // payment.id
    value: any; // Payment data
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
        if (!db.objectStoreNames.contains(SESSIONS_STORE_NAME)) {
          db.createObjectStore(SESSIONS_STORE_NAME, { keyPath: 'chatPath' });
        }
      }
      if (oldVersion < 2) {
          if (!db.objectStoreNames.contains(MESSAGES_STORE_NAME)) {
            const store = db.createObjectStore(MESSAGES_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            store.createIndex('by_sessionId', 'sessionId');
          } else {
            const store = transaction.objectStore(MESSAGES_STORE_NAME);
             if (!store.indexNames.contains('by_sessionId')) {
                store.createIndex('by_sessionId', 'sessionId');
             }
          }
          if (!db.objectStoreNames.contains(CONTACTS_STORE_NAME)) {
            db.createObjectStore(CONTACTS_STORE_NAME, { keyPath: 'chatPath' });
          }
          if (!db.objectStoreNames.contains(ASSISTANTS_STORE_NAME)) {
            db.createObjectStore(ASSISTANTS_STORE_NAME, { keyPath: 'id' });
          }
      }
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains(AUTHORIZED_PAYMENTS_STORE_NAME)) {
          db.createObjectStore(AUTHORIZED_PAYMENTS_STORE_NAME, { keyPath: 'id' });
        }
      }
    },
  });

  return dbPromise;
};
