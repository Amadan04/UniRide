/**
 * Firebase Cloud Functions
 * 
 * Automated backend operations triggered by Firestore events,
 * scheduled tasks, and HTTPS requests.
 * 
 * Deploy with: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const rtdb = admin.database();

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

/**
 * Send push notification via FCM
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) {
    console.log('No FCM token provided');
    return null;
  }

  const message = {
    token: fcmToken,
    notification: {
      title,
      body
    },
    data: {
      ...data,
      clickAction: 'FLUTTER_NOTIFICATION_CLICK'
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

  try {
    const response = await admin.messaging().send(message);
    console.log('Push notification sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return null;
  }
};

/**
 * Configure email transporter using Nodemailer
 * Replace with your SMTP credentials
 */
// Email transporter configuration
// Gmail with App Password (2FA enabled)
// NOTE: Email notifications require Firebase Blaze plan (Cloud Functions)
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user || 'your-email@gmail.com',
    pass: functions.config().email.password || 'your-app-password'
  }
});

/**
 * Send email notification
 */
const sendEmailNotification = async (to, subject, html) => {
  const mailOptions = {
    from: 'University Carpooling <noreply@carpooling.app>',
    to,
    subject,
    html
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    return null;
  }
};

// ============================================================================
// TRIGGER 1: Update Average Rating (onCreate rating)
// ============================================================================

exports.updateAvgRating = functions.firestore
  .document('ratings/{ratingID}')
  .onCreate(async (snap, context) => {
    try {
      const rating = snap.data();
      const { toUserID, rating: ratingValue } = rating;

      console.log(`New rating for user ${toUserID}: ${ratingValue}`);

      // Get user document
      const userRef = db.collection('users').doc(toUserID);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.error('User not found');
        return null;
      }

      const userData = userDoc.data();
      const currentAvgRating = userData.avgRating || 0;
      const currentRatingsCount = userData.ratingsCount || 0;

      // Calculate new average
      const newRatingsCount = currentRatingsCount + 1;
      const newAvgRating = ((currentAvgRating * currentRatingsCount) + ratingValue) / newRatingsCount;

      // Update user document
      await userRef.update({
        avgRating: parseFloat(newAvgRating.toFixed(2)),
        ratingsCount: newRatingsCount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Updated user ${toUserID} rating: ${newAvgRating.toFixed(2)}`);

      return null;
    } catch (error) {
      console.error('Error updating average rating:', error);
      return null;
    }
  });

// ============================================================================
// TRIGGER 2: Notify Driver on New Booking (onCreate booking)
// ============================================================================

exports.notifyDriverOnBooking = functions.firestore
  .document('bookings/{bookingID}')
  .onCreate(async (snap, context) => {
    try {
      const booking = snap.data();
      const { driverID, riderName, seatsBooked, destination, date, time, rideID } = booking;

      console.log(`New booking: ${booking.bookingID} for ride ${rideID}`);

      // Get driver info
      const driverDoc = await db.collection('users').doc(driverID).get();
      
      if (!driverDoc.exists) {
        console.error('Driver not found');
        return null;
      }

      const driverData = driverDoc.data();

      // Send push notification
      if (driverData.fcmToken) {
        await sendPushNotification(
          driverData.fcmToken,
          '🚗 New Booking!',
          `${riderName} booked ${seatsBooked} seat(s) for your ride to ${destination}`,
          {
            type: 'new_booking',
            bookingID: booking.bookingID,
            rideID,
            screen: 'RideDetails'
          }
        );
      }

      // Send email notification
      if (driverData.email) {
        const emailHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">🚗 New Booking Received!</h2>
            <p>Hi ${driverData.name},</p>
            <p><strong>${riderName}</strong> has booked <strong>${seatsBooked} seat(s)</strong> for your ride.</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Ride Details</h3>
              <p><strong>📍 Destination:</strong> ${destination}</p>
              <p><strong>📅 Date:</strong> ${date}</p>
              <p><strong>🕐 Time:</strong> ${time}</p>
              <p><strong>💺 Seats Booked:</strong> ${seatsBooked}</p>
            </div>
            <p>You can view full booking details in the app.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This is an automated message from University Carpooling App.
            </p>
          </div>
        `;

        await sendEmailNotification(
          driverData.email,
          'New Booking for Your Ride',
          emailHTML
        );
      }

      // Send system message to ride chat
      await rtdb.ref(`chats/${rideID}`).push({
        senderID: 'system',
        senderName: 'System',
        senderRole: 'system',
        text: `${riderName} joined the ride! 🎉`,
        messageType: 'system',
        timestamp: Date.now(),
        read: false
      });

      return null;
    } catch (error) {
      console.error('Error notifying driver:', error);
      return null;
    }
  });

// ============================================================================
// TRIGGER 3: Notify When Ride is Full (onUpdate ride seatsAvailable)
// ============================================================================

exports.notifyRideFull = functions.firestore
  .document('rides/{rideID}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // Check if ride just became full
      if (beforeData.status !== 'full' && afterData.status === 'full') {
        const { driverID, destination, rideID } = afterData;

        console.log(`Ride ${rideID} is now full`);

        // Get driver info
        const driverDoc = await db.collection('users').doc(driverID).get();
        
        if (!driverDoc.exists) {
          return null;
        }

        const driverData = driverDoc.data();

        // Send push notification to driver
        if (driverData.fcmToken) {
          await sendPushNotification(
            driverData.fcmToken,
            '✅ Ride Full!',
            `Your ride to ${destination} is now completely booked!`,
            {
              type: 'ride_full',
              rideID,
              screen: 'RideDetails'
            }
          );
        }

        // Send system message to chat
        await rtdb.ref(`chats/${rideID}`).push({
          senderID: 'system',
          senderName: 'System',
          senderRole: 'system',
          text: 'This ride is now full! 🎊',
          messageType: 'system',
          timestamp: Date.now(),
          read: false
        });
      }

      // Check if ride was cancelled
      if (beforeData.status !== 'cancelled' && afterData.status === 'cancelled') {
        const { rideID, riders, destination, date } = afterData;

        console.log(`Ride ${rideID} was cancelled`);

        // Notify all riders about cancellation
        for (const riderID of riders) {
          const riderDoc = await db.collection('users').doc(riderID).get();
          
          if (riderDoc.exists) {
            const riderData = riderDoc.data();

            if (riderData.fcmToken) {
              await sendPushNotification(
                riderData.fcmToken,
                '🚫 Ride Cancelled',
                `The ride to ${destination} on ${date} has been cancelled`,
                {
                  type: 'ride_cancelled',
                  rideID,
                  screen: 'MyBookings'
                }
              );
            }

            // Send email
            if (riderData.email) {
              const emailHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                  <h2 style="color: #f44336;">🚫 Ride Cancellation Notice</h2>
                  <p>Hi ${riderData.name},</p>
                  <p>We're sorry to inform you that the ride to <strong>${destination}</strong> 
                  scheduled for <strong>${date}</strong> has been cancelled by the driver.</p>
                  <p>Your booking has been automatically cancelled and any applicable refund 
                  will be processed shortly.</p>
                  <p>You can search for alternative rides in the app.</p>
                </div>
              `;

              await sendEmailNotification(
                riderData.email,
                'Ride Cancellation Notice',
                emailHTML
              );
            }
          }
        }

        // Update all active bookings to cancelled
        const bookingsSnapshot = await db.collection('bookings')
          .where('rideID', '==', rideID)
          .where('status', '==', 'active')
          .get();

        const batch = db.batch();
        bookingsSnapshot.forEach((doc) => {
          batch.update(doc.ref, {
            status: 'cancelled',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
      }

      return null;
    } catch (error) {
      console.error('Error in ride update trigger:', error);
      return null;
    }
  });

// ============================================================================
// TRIGGER 4: Ride Reminder (Scheduled - 30 min before ride)
// Runs every 5 minutes to check for upcoming rides
// ============================================================================

exports.rideReminder = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      console.log('Running ride reminder check...');

      const now = new Date();
      const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);
      const thirtyFiveMinutesFromNow = new Date(now.getTime() + 35 * 60000);

      // Get rides starting in 30-35 minutes
      const ridesSnapshot = await db.collection('rides')
        .where('status', '==', 'active')
        .where('rideDateTime', '>=', admin.firestore.Timestamp.fromDate(thirtyMinutesFromNow))
        .where('rideDateTime', '<=', admin.firestore.Timestamp.fromDate(thirtyFiveMinutesFromNow))
        .get();

      console.log(`Found ${ridesSnapshot.size} rides starting soon`);

      const promises = [];

      ridesSnapshot.forEach((doc) => {
        const ride = doc.data();
        const { rideID, driverID, riders, destination, time } = ride;

        // Notify driver
        promises.push(
          db.collection('users').doc(driverID).get().then(async (driverDoc) => {
            if (driverDoc.exists) {
              const driverData = driverDoc.data();
              if (driverData.fcmToken) {
                await sendPushNotification(
                  driverData.fcmToken,
                  '⏰ Ride Starting Soon!',
                  `Your ride to ${destination} starts at ${time}. Get ready!`,
                  {
                    type: 'ride_reminder',
                    rideID,
                    screen: 'RideDetails'
                  }
                );
              }
            }
          })
        );

        // Notify all riders
        riders.forEach((riderID) => {
          promises.push(
            db.collection('users').doc(riderID).get().then(async (riderDoc) => {
              if (riderDoc.exists) {
                const riderData = riderDoc.data();
                if (riderData.fcmToken) {
                  await sendPushNotification(
                    riderData.fcmToken,
                    '⏰ Ride Reminder',
                    `Your ride to ${destination} starts at ${time}. Be ready!`,
                    {
                      type: 'ride_reminder',
                      rideID,
                      screen: 'RideDetails'
                    }
                  );
                }
              }
            })
          );
        });

        // Send system message to chat
        promises.push(
          rtdb.ref(`chats/${rideID}`).push({
            senderID: 'system',
            senderName: 'System',
            senderRole: 'system',
            text: `⏰ Reminder: Ride starts in 30 minutes!`,
            messageType: 'system',
            timestamp: Date.now(),
            read: false
          })
        );
      });

      await Promise.all(promises);
      console.log('Ride reminders sent successfully');

      return null;
    } catch (error) {
      console.error('Error sending ride reminders:', error);
      return null;
    }
  });

// ============================================================================
// TRIGGER 5: Cleanup Old Rides (Daily at 2 AM)
// ============================================================================

exports.cleanupOldRides = functions.pubsub
  .schedule('0 2 * * *') // Every day at 2 AM
  .timeZone('America/New_York') // Set your timezone
  .onRun(async (context) => {
    try {
      console.log('Running cleanup of old rides...');

      // Get rides older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldRidesSnapshot = await db.collection('rides')
        .where('rideDateTime', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .where('status', 'in', ['completed', 'cancelled'])
        .get();

      console.log(`Found ${oldRidesSnapshot.size} old rides to archive`);

      const batch = db.batch();
      let count = 0;

      oldRidesSnapshot.forEach((doc) => {
        // Option 1: Delete the ride
        // batch.delete(doc.ref);

        // Option 2: Archive the ride (move to archived_rides collection)
        const archivedRef = db.collection('archived_rides').doc(doc.id);
        batch.set(archivedRef, {
          ...doc.data(),
          archivedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        batch.delete(doc.ref);

        count++;

        // Firestore batch has a limit of 500 operations
        if (count >= 500) {
          return;
        }
      });

      if (count > 0) {
        await batch.commit();
        console.log(`Archived ${count} old rides`);
      }

      // Also cleanup old location data from Realtime Database
      oldRidesSnapshot.forEach((doc) => {
        rtdb.ref(`rideLocations/${doc.id}`).remove();
        rtdb.ref(`chats/${doc.id}`).remove();
      });

      return null;
    } catch (error) {
      console.error('Error cleaning up old rides:', error);
      return null;
    }
  });

// ============================================================================
// TRIGGER 6: Notify on Booking Cancellation
// ============================================================================

exports.notifyOnBookingCancellation = functions.firestore
  .document('bookings/{bookingID}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // Check if booking was just cancelled
      if (beforeData.status !== 'cancelled' && afterData.status === 'cancelled') {
        const { driverID, riderName, seatsBooked, destination, rideID } = afterData;

        console.log(`Booking cancelled: ${context.params.bookingID}`);

        // Notify driver
        const driverDoc = await db.collection('users').doc(driverID).get();
        
        if (driverDoc.exists) {
          const driverData = driverDoc.data();

          if (driverData.fcmToken) {
            await sendPushNotification(
              driverData.fcmToken,
              '❌ Booking Cancelled',
              `${riderName} cancelled their booking for ${destination}. ${seatsBooked} seat(s) now available.`,
              {
                type: 'booking_cancelled',
                rideID,
                screen: 'RideDetails'
              }
            );
          }

          // Send system message to chat
          await rtdb.ref(`chats/${rideID}`).push({
            senderID: 'system',
            senderName: 'System',
            senderRole: 'system',
            text: `${riderName} cancelled their booking. ${seatsBooked} seat(s) available.`,
            messageType: 'system',
            timestamp: Date.now(),
            read: false
          });
        }
      }

      return null;
    } catch (error) {
      console.error('Error notifying booking cancellation:', error);
      return null;
    }
  });

// ============================================================================
// HTTPS FUNCTION: Send Rating Request After Ride Completion
// ============================================================================

exports.sendRatingRequest = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { rideID } = data;

    if (!rideID) {
      throw new functions.https.HttpsError('invalid-argument', 'Ride ID is required');
    }

    // Get ride details
    const rideDoc = await db.collection('rides').doc(rideID).get();
    
    if (!rideDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Ride not found');
    }

    const ride = rideDoc.data();

    if (ride.status !== 'completed') {
      throw new functions.https.HttpsError('failed-precondition', 'Ride must be completed');
    }

    const { driverID, riders, destination } = ride;

    // Send rating request to driver (to rate riders)
    const driverDoc = await db.collection('users').doc(driverID).get();
    if (driverDoc.exists) {
      const driverData = driverDoc.data();
      if (driverData.fcmToken) {
        await sendPushNotification(
          driverData.fcmToken,
          '⭐ Rate Your Riders',
          `How was your ride to ${destination}? Please rate your experience.`,
          {
            type: 'rating_request',
            rideID,
            screen: 'RateRiders'
          }
        );
      }
    }

    // Send rating request to all riders (to rate driver)
    const promises = riders.map(async (riderID) => {
      const riderDoc = await db.collection('users').doc(riderID).get();
      if (riderDoc.exists) {
        const riderData = riderDoc.data();
        if (riderData.fcmToken) {
          await sendPushNotification(
            riderData.fcmToken,
            '⭐ Rate Your Ride',
            `How was your ride to ${destination}? Please rate your experience.`,
            {
              type: 'rating_request',
              rideID,
              screen: 'RateDriver'
            }
          );
        }
      }
    });

    await Promise.all(promises);

    return {
      success: true,
      message: 'Rating requests sent'
    };
  } catch (error) {
    console.error('Error sending rating requests:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// HTTPS FUNCTION: Send Email (Fallback for push notifications)
// ============================================================================

exports.sendEmail = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { to, subject, html } = data;

    if (!to || !subject || !html) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    await sendEmailNotification(to, subject, html);

    return {
      success: true,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// SCHEDULED FUNCTION: Auto-Complete Expired Rides
// Runs every hour to automatically complete rides that have passed
// ============================================================================

exports.autoCompleteExpiredRides = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('America/New_York') // Change to your timezone
  .onRun(async (context) => {
    try {
      console.log('Running auto-complete expired rides...');

      const now = admin.firestore.Timestamp.now();
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      // Find all active rides that should have completed 2+ hours ago
      const expiredRidesSnapshot = await db.collection('rides')
        .where('status', '==', 'active')
        .where('rideDateTime', '<', admin.firestore.Timestamp.fromDate(twoHoursAgo))
        .get();

      if (expiredRidesSnapshot.empty) {
        console.log('No expired rides found');
        return null;
      }

      const batch = db.batch();
      let completedCount = 0;

      expiredRidesSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'completed',
          completedAt: now,
          autoCompleted: true,
          updatedAt: now
        });
        completedCount++;
      });

      await batch.commit();

      console.log(`Successfully auto-completed ${completedCount} expired rides`);
      return { completedCount };
    } catch (error) {
      console.error('Error in autoCompleteExpiredRides:', error);
      return null;
    }
  });

// ============================================================================
// SCHEDULED FUNCTION: Send Completion Reminders
// Runs every 30 minutes to remind drivers to complete rides
// ============================================================================

exports.sendCompletionReminders = functions.pubsub
  .schedule('every 30 minutes')
  .timeZone('America/New_York') // Change to your timezone
  .onRun(async (context) => {
    try {
      console.log('Checking for rides needing completion reminders...');

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Find rides that finished 1-2 hours ago but not yet marked complete
      const ridesNeedingReminderSnapshot = await db.collection('rides')
        .where('status', '==', 'active')
        .where('rideDateTime', '>=', admin.firestore.Timestamp.fromDate(twoHoursAgo))
        .where('rideDateTime', '<', admin.firestore.Timestamp.fromDate(oneHourAgo))
        .get();

      if (ridesNeedingReminderSnapshot.empty) {
        console.log('No rides needing completion reminders');
        return null;
      }

      const promises = [];

      ridesNeedingReminderSnapshot.forEach((rideDoc) => {
        const ride = rideDoc.data();
        const rideID = rideDoc.id;

        // Send reminder to driver
        const driverPromise = db.collection('users').doc(ride.driverID).get()
          .then(async (driverDoc) => {
            if (driverDoc.exists) {
              const driverData = driverDoc.data();

              // Send push notification
              if (driverData.fcmToken) {
                await sendPushNotification(
                  driverData.fcmToken,
                  '✅ Mark Ride as Complete?',
                  `Your ride to ${ride.destination} should be finished. Please mark it as complete.`,
                  {
                    type: 'completion_reminder',
                    rideID,
                    screen: 'ActivityPage'
                  }
                );
              }

              // Send email reminder
              if (driverData.email) {
                await sendEmailNotification(
                  driverData.email,
                  'Ride Completion Reminder',
                  `
                    <h2>Mark Your Ride as Complete</h2>
                    <p>Hi ${driverData.name},</p>
                    <p>Your ride to <strong>${ride.destination}</strong> scheduled for ${ride.date} at ${ride.time} should be finished.</p>
                    <p>Please log in to the app and mark this ride as complete so riders can rate their experience.</p>
                    <p><strong>Ride Details:</strong></p>
                    <ul>
                      <li>From: ${ride.pickup}</li>
                      <li>To: ${ride.destination}</li>
                      <li>Date: ${ride.date}</li>
                      <li>Time: ${ride.time}</li>
                    </ul>
                    <p>If you don't mark it as complete within 24 hours, it will be automatically completed.</p>
                  `
                );
              }
            }
          });

        promises.push(driverPromise);

        // Also send reminder to riders
        if (ride.riders && ride.riders.length > 0) {
          ride.riders.forEach((riderID) => {
            const riderPromise = db.collection('users').doc(riderID).get()
              .then(async (riderDoc) => {
                if (riderDoc.exists) {
                  const riderData = riderDoc.data();

                  if (riderData.fcmToken) {
                    await sendPushNotification(
                      riderData.fcmToken,
                      '📝 Ride Complete?',
                      `Was your ride to ${ride.destination} completed? You can rate your experience soon.`,
                      {
                        type: 'ride_status_check',
                        rideID,
                        screen: 'ActivityPage'
                      }
                    );
                  }
                }
              });
            promises.push(riderPromise);
          });
        }
      });

      await Promise.all(promises);

      console.log(`Sent completion reminders for ${ridesNeedingReminderSnapshot.size} rides`);
      return { remindersSent: ridesNeedingReminderSnapshot.size };
    } catch (error) {
      console.error('Error in sendCompletionReminders:', error);
      return null;
    }
  });

// ============================================================================
// TRIGGER: Send Rating Prompts When Ride Completes
// Triggers when a ride status changes to 'completed'
// ============================================================================

exports.sendRatingPromptsOnCompletion = functions.firestore
  .document('rides/{rideID}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const rideID = context.params.rideID;

      // Check if ride just became completed
      if (beforeData.status !== 'completed' && afterData.status === 'completed') {
        console.log(`Ride ${rideID} just completed - sending rating prompts`);

        const { driverID, riders, destination, pickup, date, time } = afterData;

        const promises = [];

        // Send notification to driver to rate riders
        const driverPromise = db.collection('users').doc(driverID).get()
          .then(async (driverDoc) => {
            if (driverDoc.exists) {
              const driverData = driverDoc.data();

              // Send push notification
              if (driverData.fcmToken) {
                await sendPushNotification(
                  driverData.fcmToken,
                  '⭐ Rate Your Riders',
                  `Your ride to ${destination} is complete! How was your experience?`,
                  {
                    type: 'rating_prompt',
                    rideID,
                    userType: 'driver',
                    screen: 'ActivityPage'
                  }
                );
              }

              // Send email
              if (driverData.email) {
                await sendEmailNotification(
                  driverData.email,
                  'Rate Your Recent Ride',
                  `
                    <div style="font-family: Arial, sans-serif; max-width: 600px;">
                      <h2 style="color: #4CAF50;">⭐ How Was Your Ride?</h2>
                      <p>Hi ${driverData.name},</p>
                      <p>Your ride to <strong>${destination}</strong> on ${date} at ${time} has been completed!</p>
                      <p>We'd love to hear about your experience. Please take a moment to rate your riders.</p>
                      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Ride Details</h3>
                        <p><strong>📍 From:</strong> ${pickup}</p>
                        <p><strong>📍 To:</strong> ${destination}</p>
                        <p><strong>📅 Date:</strong> ${date}</p>
                        <p><strong>🕐 Time:</strong> ${time}</p>
                        <p><strong>👥 Riders:</strong> ${riders.length}</p>
                      </div>
                      <p>Your feedback helps maintain a safe and reliable community!</p>
                      <p style="margin-top: 30px;">
                        <a href="https://your-app-link.com/activity"
                           style="background-color: #4CAF50; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                          Rate Now
                        </a>
                      </p>
                    </div>
                  `
                );
              }
            }
          });

        promises.push(driverPromise);

        // Send notification to all riders to rate the driver
        if (riders && riders.length > 0) {
          riders.forEach((riderID) => {
            const riderPromise = db.collection('users').doc(riderID).get()
              .then(async (riderDoc) => {
                if (riderDoc.exists) {
                  const riderData = riderDoc.data();

                  // Send push notification
                  if (riderData.fcmToken) {
                    await sendPushNotification(
                      riderData.fcmToken,
                      '⭐ Rate Your Ride',
                      `Your ride to ${destination} is complete! How was it?`,
                      {
                        type: 'rating_prompt',
                        rideID,
                        userType: 'rider',
                        screen: 'ActivityPage'
                      }
                    );
                  }

                  // Send email
                  if (riderData.email) {
                    await sendEmailNotification(
                      riderData.email,
                      'Rate Your Recent Ride',
                      `
                        <div style="font-family: Arial, sans-serif; max-width: 600px;">
                          <h2 style="color: #4CAF50;">⭐ How Was Your Ride?</h2>
                          <p>Hi ${riderData.name},</p>
                          <p>Your ride to <strong>${destination}</strong> on ${date} at ${time} has been completed!</p>
                          <p>We hope you had a great experience. Please take a moment to rate your driver.</p>
                          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Ride Details</h3>
                            <p><strong>📍 From:</strong> ${pickup}</p>
                            <p><strong>📍 To:</strong> ${destination}</p>
                            <p><strong>📅 Date:</strong> ${date}</p>
                            <p><strong>🕐 Time:</strong> ${time}</p>
                          </div>
                          <p>Your feedback helps us build a better community!</p>
                          <p style="margin-top: 30px;">
                            <a href="https://your-app-link.com/activity"
                               style="background-color: #4CAF50; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                              Rate Now
                            </a>
                          </p>
                        </div>
                      `
                    );
                  }
                }
              });

            promises.push(riderPromise);
          });
        }

        await Promise.all(promises);
        console.log(`Sent rating prompts for ride ${rideID}`);
      }

      return null;
    } catch (error) {
      console.error('Error sending rating prompts:', error);
      return null;
    }
  });
