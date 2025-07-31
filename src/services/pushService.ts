
// src/services/pushService.ts
'use server';

import type { UserProfile } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import webpush from 'web-push';
import { ObjectId } from 'mongodb';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

let isWebPushConfigured = false;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.ADMIN_EMAIL || 'admin@example.com'}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  isWebPushConfigured = true;
  console.log("Web Push service configured.");
} else {
  console.warn("VAPID keys not configured. Push notifications will be disabled.");
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string; // e.g., 'profile-update' to trigger client refresh
}

export async function sendPushNotification(userDbId: string, payload: PushPayload) {
  if (!isWebPushConfigured) {
    console.log(`Push notifications not configured. Skipping notification for user ${userDbId}.`);
    return { success: false, reason: 'Not configured' };
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection<UserProfile>('userProfiles').findOne({ _id: new ObjectId(userDbId) });

    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      console.log(`User ${userDbId} has no push subscriptions.`);
      return { success: false, reason: 'No subscriptions' };
    }

    const notifications = user.pushSubscriptions.map(subscription => {
      console.log(`Sending push to endpoint for user ${userDbId}`);
      return webpush.sendNotification(subscription, JSON.stringify(payload)).catch(error => {
        // This is common if a subscription is expired or invalid
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Subscription for user ${userDbId} is expired/invalid. It should be removed.`);
          // TODO: Implement logic to remove expired subscriptions from the database
        } else {
          console.error('Error sending push notification:', error);
        }
        return null; // Return null for failed sends
      });
    });

    const results = await Promise.all(notifications);
    const successfulSends = results.filter(r => r !== null).length;

    console.log(`Sent ${successfulSends} / ${user.pushSubscriptions.length} push notifications for user ${userDbId}.`);
    return { success: true, sent: successfulSends, total: user.pushSubscriptions.length };

  } catch (error) {
    console.error(`Failed to send push notification for user ${userDbId}:`, error);
    return { success: false, reason: 'Database or unknown error' };
  }
}
