
// src/services/userSubscriptionService.ts
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, SubscriptionPlanType, AssistantConfig } from '@/types';

/**
 * Marks a user's profile as pending number acquisition.
 * This is used by the Stripe webhook for paid plans.
 * @param firebaseUid The Firebase UID of the user.
 * @param stripeCustomerId Optional. The Stripe Customer ID.
 * @param stripeSubscriptionId Optional. The Stripe Subscription ID.
 * @param planId Optional. The plan ID to set for the user.
 * @returns True if the update was successful, false otherwise.
 */
export async function setNumberAcquisitionAsPending(
  firebaseUid: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
  planId?: SubscriptionPlanType
): Promise<boolean> {
  console.log(`Setting number acquisition to 'pending_acquisition' for user: ${firebaseUid}, planId: ${planId}`);
  try {
    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>('userProfiles');

    // Define the data to be set. This marks the profile for the external process.
    const setData: Partial<Omit<UserProfile, 'assistants' | 'databases' | 'email' | 'isAuthenticated'>> = {
      numberActivationStatus: 'pending_acquisition',
      virtualPhoneNumber: undefined,
      numberCountryCode: undefined,
      numberActivationId: undefined,
    };
    
    if (stripeCustomerId) setData.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId) setData.stripeSubscriptionId = stripeSubscriptionId;
    if (planId) setData.currentPlan = planId;

    // Define data to set only on insertion of a new document
    const setOnInsertData: Partial<UserProfile> = {
        firebaseUid: firebaseUid,
        email: '', 
        assistants: [],
        databases: [],
        isAuthenticated: true,
        currentPlan: planId || null,
    };
    
    // We don't link the number here as it doesn't exist yet.
    // The external platform will be responsible for linking it.

    const result = await userProfileCollection.updateOne(
      { firebaseUid: firebaseUid },
      {
        $set: setData,
        $setOnInsert: setOnInsertData,
      },
      { upsert: true }
    );

    if (result.modifiedCount > 0 || result.upsertedId) {
      console.log(`Successfully set user ${firebaseUid} to pending number acquisition.`);
      return true;
    } else {
      console.warn(`Profile for user ${firebaseUid} was not modified or upserted. DB Result:`, JSON.stringify(result));
      return true; // Still return true if matched but not modified
    }
  } catch (error: any) {
    console.error(`Error in setNumberAcquisitionAsPending for ${firebaseUid}:`, error.message, error.stack);
    return false;
  }
}
