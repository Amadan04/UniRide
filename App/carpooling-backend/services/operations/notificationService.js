/**
 * Notification Service
 * 
 * Handles push notifications using Firebase Cloud Messaging (FCM)
 * and email notifications as fallback.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  NEW_BOOKING: 'new_booking',
  BOOKING_CANCELLED: 'booking_cancelled',
  RIDE_FULL: 'ride_full',
  RIDE_REMINDER: 'ride_reminder',
  RIDE_CANCELLED: 'ride_cancelled',
  RATING_REQUEST: 'rating_request',
  DRIVER_NEARBY: 'driver_nearby'
};

/**
 * Get notification template
 */
const getNotificationTemplate = (type, data) => {
  const templates = {
    [NOTIFICATION_TYPES.NEW_BOOKING]: {
      title: '🚗 New Booking!',
      body: `${data.riderName} booked ${data.seatsBooked} seat(s) for your ride to ${data.destination}`
    },
    [NOTIFICATION_TYPES.BOOKING_CANCELLED]: {
      title: '❌ Booking Cancelled',
      body: `${data.riderName} cancelled their booking for the ride to ${data.destination}`
    },
    [NOTIFICATION_TYPES.RIDE_FULL]: {
      title: '✅ Ride Full',
      body: `Your ride to ${data.destination} is now full!`
    },
    [NOTIFICATION_TYPES.RIDE_REMINDER]: {
      title: '⏰ Ride Reminder',
      body: `Your ride to ${data.destination} starts in 30 minutes!`
    },
    [NOTIFICATION_TYPES.RIDE_CANCELLED]: {
      title: '🚫 Ride Cancelled',
      body: `The ride to ${data.destination} on ${data.date} has been cancelled`
    },
    [NOTIFICATION_TYPES.RATING_REQUEST]: {
      title: '⭐ Rate Your Ride',
      body: `How was your ride to ${data.destination}? Please rate your experience`
    }
  };

  return templates[type] || { title: 'Notification', body: 'You have a new notification' };
};

/**
 * Create notification payload for FCM
 */
export const createNotificationPayload = async (userID, type, data) => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userID));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
      return null;
    }

    const template = getNotificationTemplate(type, data);

    return {
      token: fcmToken,
      notification: {
        title: template.title,
        body: template.body
      },
      data: {
        type,
        ...data
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'ride_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };
  } catch (error) {
    console.error('Error creating notification payload:', error);
    throw error;
  }
};

/**
 * Email templates
 */
export const createEmailPayload = (type, data) => {
  const emailTemplates = {
    [NOTIFICATION_TYPES.NEW_BOOKING]: {
      subject: 'New Booking for Your Ride',
      html: `
        <h2>New Booking! 🚗</h2>
        <p>${data.riderName} booked ${data.seatsBooked} seat(s)</p>
        <p>Ride: ${data.pickup} → ${data.destination}</p>
        <p>Date: ${data.date} at ${data.time}</p>
      `
    },
    [NOTIFICATION_TYPES.RIDE_CANCELLED]: {
      subject: 'Ride Cancelled',
      html: `
        <h2>Ride Cancellation</h2>
        <p>The ride to ${data.destination} has been cancelled.</p>
        <p>Date: ${data.date}</p>
      `
    }
  };

  return emailTemplates[type] || { subject: 'Notification', html: '<p>Update from University Carpooling</p>' };
};
