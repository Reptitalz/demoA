// src/services/userSubscriptionService.ts
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, SubscriptionPlanType, AssistantConfig } from '@/types';
import { searchAvailableNumber, buyNumber } from './vonage'; // Assuming US numbers for now

/**
 * Provisions a Vonage number for a user and updates their profile in MongoDB.
 * @param firebaseUid The Firebase UID of the user.
 * @param stripeCustomerId The Stripe Customer ID.
 * @param stripeSubscriptionId Optional. The Stripe Subscription ID.
 * @param planId Optional. The plan ID to set for the user.
 * @returns True if successful, false otherwise.
 */
export async function provisionVonageNumberForUser(
  firebaseUid: string,
  stripeCustomerId: string,
  stripeSubscriptionId?: string,
  planId?: SubscriptionPlanType
): Promise<boolean> {
  console.log(`Attempting to provision Vonage number for user: ${firebaseUid}, planId: ${planId}`);
  try {
    const availableNumber = await searchAvailableNumber('US'); // Assuming US for now
    if (!availableNumber) {
      console.error(`No Vonage numbers available for user ${firebaseUid} in US.`);
      return false;
    }

    const bought = await buyNumber('US', availableNumber);
    if (!bought) {
      console.error(`Failed to buy Vonage number ${availableNumber} for user ${firebaseUid}.`);
      // Potentially, we might want to try another number if buying fails, but for now, fail.
      return false;
    }

    console.log(`Successfully bought Vonage number ${availableNumber} for user ${firebaseUid}.`);

    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>('userProfiles');

    // Prepare update object for $set
    const setData: Partial<Omit<UserProfile, 'assistants' | 'databases' | 'email' | 'isAuthenticated'>> & { stripeCustomerId: string } = {
      virtualPhoneNumber: availableNumber,
      countryCodeForVonageNumber: 'US', // Store the country code
      vonageNumberStatus: 'active',
      stripeCustomerId: stripeCustomerId,
    };
    if (stripeSubscriptionId) {
      setData.stripeSubscriptionId = stripeSubscriptionId;
    }
    if (planId) {
      setData.currentPlan = planId;
    }

    // Prepare $setOnInsert object
    const setOnInsertData: Partial<UserProfile> = {
        firebaseUid: firebaseUid, // Ensure firebaseUid is set on insert
        email: '', // Placeholder, Stripe webhook might provide customer email
        assistants: [],
        databases: [],
        isAuthenticated: true, // Assume true if they are getting a number through payment
        currentPlan: planId || null, // Set plan on insert as well
    };


    // Try to find an assistant without a phoneLinked and assign the new number
    // This part needs to fetch the current profile first to get assistants
    const currentUserProfile = await userProfileCollection.findOne({ firebaseUid });
    let assistantsToUpdate: AssistantConfig[] = currentUserProfile?.assistants || [];

    if (currentUserProfile && currentUserProfile.assistants && currentUserProfile.assistants.length > 0) {
      const firstAssistantWithoutPhoneIndex = currentUserProfile.assistants.findIndex(
        (asst) => !asst.phoneLinked
      );

      if (firstAssistantWithoutPhoneIndex !== -1) {
        console.log(`Assigning new Vonage number ${availableNumber} to assistant ${currentUserProfile.assistants[firstAssistantWithoutPhoneIndex].id} for user ${firebaseUid}`);
        // Create a new array for assistants to ensure immutability and correct update
        assistantsToUpdate = currentUserProfile.assistants.map((asst, index) =>
          index === firstAssistantWithoutPhoneIndex
            ? { ...asst, phoneLinked: availableNumber }
            : asst
        );
        // Add the updated assistants array to the setData object
        setData.assistants = assistantsToUpdate.map(asst => ({
            ...asst,
            purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || new Set()),
          }));
      } else {
         // If no assistant without a phone, ensure the setData.assistants is not undefined if it was going to be set
         // Or, ensure assistants array is set if userProfile was null before upsert
        if(setData.assistants === undefined && currentUserProfile) {
             setData.assistants = currentUserProfile.assistants.map(asst => ({
                ...asst,
                purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || new Set()),
            }));
        }
      }
    }
    
    // If assistantsToUpdate was populated for a new user, add it to setOnInsert
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
      console.log(`Successfully updated/created profile for user ${firebaseUid} with Vonage number ${availableNumber}.`);
      return true;
    } else if (result.matchedCount > 0 && result.modifiedCount === 0) {
      console.log(`Profile for user ${firebaseUid} was matched but not modified. Vonage number ${availableNumber} provisioned. Status may already be up-to-date.`);
      return true; // Still considered success as number was provisioned
    }
     else {
      console.warn(`Profile for user ${firebaseUid} was not modified or upserted despite successful number purchase. DB Result:`, JSON.stringify(result));
      // This case might mean the data was identical. Still, number was bought.
      return true;
    }
  } catch (error: any) {
    console.error(`Error in provisionVonageNumberForUser for ${firebaseUid}:`, error.message, error.stack);
    return false;
  }
}
