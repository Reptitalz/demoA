
// src/services/userSubscriptionService.ts
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, SubscriptionPlanType, AssistantConfig } from '@/types';
import { getNumberForWhatsApp } from '@/services/vonage';

/**
 * Provisions a SMS-Activate number specifically for the test plan.
 * This function only handles getting the number, not DB updates.
 * @returns An object with the phoneNumber, activationId and countryCode, or null if it fails.
 */
export async function provisionTestSmsActivateNumber(): Promise<{ phoneNumber: string; activationId: string; countryCode: string; } | null> {
    console.log(`Attempting to provision a SMS-Activate number for a test plan.`);
    try {
        const numberDetails = await getNumberForWhatsApp('US');
        if (!numberDetails) {
            console.error(`No SMS-Activate numbers available in US for test plan.`);
            return null;
        }

        console.log(`Successfully got SMS-Activate number ${numberDetails.number} for test plan.`);
        return { phoneNumber: numberDetails.number, activationId: numberDetails.activationId, countryCode: 'US' };
    } catch (error: any) {
        console.error(`Error in provisionTestSmsActivateNumber:`, error.message, error.stack);
        return null;
    }
}


/**
 * Provisions a SMS-Activate number for a user and updates their profile in MongoDB.
 * Used by the Stripe webhook for paid plans.
 * @param firebaseUid The Firebase UID of the user.
 * @param stripeCustomerId Optional. The Stripe Customer ID.
 * @param stripeSubscriptionId Optional. The Stripe Subscription ID.
 * @param planId Optional. The plan ID to set for the user.
 * @returns True if successful, false otherwise.
 */
export async function provisionSmsActivateNumberForUser(
  firebaseUid: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
  planId?: SubscriptionPlanType
): Promise<boolean> {
  console.log(`Attempting to provision SMS-Activate number for user: ${firebaseUid}, planId: ${planId}`);
  try {
    const numberDetails = await getNumberForWhatsApp('US'); // Assuming US for now
    if (!numberDetails) {
      console.error(`No SMS-Activate numbers available for user ${firebaseUid} in US.`);
      return false;
    }

    console.log(`Successfully got SMS-Activate number ${numberDetails.number} for user ${firebaseUid}.`);

    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>('userProfiles');

    const setData: Partial<Omit<UserProfile, 'assistants' | 'databases' | 'email' | 'isAuthenticated'>> = {
      virtualPhoneNumber: numberDetails.number,
      numberCountryCode: 'US',
      numberActivationId: numberDetails.activationId,
      numberActivationStatus: 'active',
    };
    if (stripeCustomerId) {
      setData.stripeCustomerId = stripeCustomerId;
    }
    if (stripeSubscriptionId) {
      setData.stripeSubscriptionId = stripeSubscriptionId;
    }
    if (planId) {
      setData.currentPlan = planId;
    }

    const setOnInsertData: Partial<UserProfile> = {
        firebaseUid: firebaseUid,
        email: '', 
        assistants: [],
        databases: [],
        isAuthenticated: true,
        currentPlan: planId || null,
    };

    const currentUserProfile = await userProfileCollection.findOne({ firebaseUid });
    let assistantsToUpdate: AssistantConfig[] = currentUserProfile?.assistants || [];

    if (currentUserProfile && currentUserProfile.assistants && currentUserProfile.assistants.length > 0) {
      const firstAssistantWithoutPhoneIndex = currentUserProfile.assistants.findIndex(
        (asst) => !asst.phoneLinked
      );

      if (firstAssistantWithoutPhoneIndex !== -1) {
        console.log(`Assigning new number ${numberDetails.number} to assistant ${currentUserProfile.assistants[firstAssistantWithoutPhoneIndex].id} for user ${firebaseUid}`);
        assistantsToUpdate = currentUserProfile.assistants.map((asst, index) =>
          index === firstAssistantWithoutPhoneIndex
            ? { ...asst, phoneLinked: numberDetails.number }
            : asst
        );
        (setData as UserProfile).assistants = assistantsToUpdate.map(asst => ({
            ...asst,
            purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || new Set()),
          }));
      } else {
        if((setData as UserProfile).assistants === undefined && currentUserProfile) {
             (setData as UserProfile).assistants = currentUserProfile.assistants.map(asst => ({
                ...asst,
                purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || new Set()),
            }));
        }
      }
    }
    
    if (assistantsToUpdate.length > 0 && !currentUserProfile) {
        setOnInsertData.assistants = assistantsToUpdate.map(asst => ({
            ...asst,
            purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || new Set()),
        }));
    }

    const result = await userProfileCollection.updateOne(
      { firebaseUid: firebaseUid },
      {
        $set: setData,
        $setOnInsert: setOnInsertData,
      },
      { upsert: true }
    );

    if (result.modifiedCount > 0 || result.upsertedId) {
      console.log(`Successfully updated/created profile for user ${firebaseUid} with SMS-Activate number ${numberDetails.number}.`);
      return true;
    } else if (result.matchedCount > 0 && result.modifiedCount === 0) {
      console.log(`Profile for user ${firebaseUid} was matched but not modified. SMS-Activate number ${numberDetails.number} provisioned. Status may already be up-to-date.`);
      return true;
    }
     else {
      console.warn(`Profile for user ${firebaseUid} was not modified or upserted despite successful number purchase. DB Result:`, JSON.stringify(result));
      return true;
    }
  } catch (error: any) {
    console.error(`Error in provisionSmsActivateNumberForUser for ${firebaseUid}:`, error.message, error.stack);
    return false;
  }
}
