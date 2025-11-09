/**
 * Chat Service
 * 
 * Handles in-app chat functionality using Firebase Realtime Database.
 * Allows riders and drivers to communicate about specific rides.
 */

import { ref, push, get, query, orderByChild, limitToLast, onChildAdded, off, update, set } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { realtimeDb, db, REALTIME_PATHS, COLLECTIONS } from '../firebase';

/**
 * Send a message in a ride chat
 * @param {string} rideID - Ride ID
 * @param {string} senderID - Sender's user ID
 * @param {string} text - Message text
 * @param {string} messageType - Message type: 'text', 'location', 'system'
 * @returns {Promise<Object>} Sent message data
 */
export const sendMessage = async (rideID, senderID, text, messageType = 'text') => {
  try {
    // Validate inputs
    if (!rideID || !senderID || !text) {
      throw new Error('Ride ID, sender ID, and message text are required');
    }

    // Verify ride exists
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));
    
    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideDoc.data();

    // Verify sender is part of the ride (driver or rider)
    const isDriver = rideData.driverID === senderID;
    const isRider = rideData.riders.includes(senderID);

    if (!isDriver && !isRider) {
      throw new Error('You must be part of this ride to send messages');
    }

    // Get sender info
    const senderDoc = await getDoc(doc(db, COLLECTIONS.USERS, senderID));
    
    if (!senderDoc.exists()) {
      throw new Error('Sender not found');
    }

    const senderData = senderDoc.data();

    // Create message object
    const message = {
      senderID,
      senderName: senderData.name,
      senderProfilePic: senderData.profilePic || '',
      senderRole: isDriver ? 'driver' : 'rider',
      text: text.trim(),
      messageType,
      timestamp: Date.now(),
      readBy: [senderID]
    };

    // Push message to chat
    const chatRef = ref(realtimeDb, `${REALTIME_PATHS.CHATS}/${rideID}`);
    const newMessageRef = await push(chatRef, message);

    return {
      success: true,
      message: {
        ...message,
        id: newMessageRef.key
      }
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error(error.message || 'Failed to send message');
  }
};

/**
 * Send a system message (e.g., booking confirmation, cancellation)
 * @param {string} rideID - Ride ID
 * @param {string} text - System message text
 * @returns {Promise<Object>} Sent message data
 */
export const sendSystemMessage = async (rideID, text) => {
  try {
    const message = {
      senderID: 'system',
      senderName: 'System',
      senderProfilePic: '',
      senderRole: 'system',
      text: text.trim(),
      messageType: 'system',
      timestamp: Date.now(),
      readBy: []
    };

    const chatRef = ref(realtimeDb, `${REALTIME_PATHS.CHATS}/${rideID}`);
    const newMessageRef = await push(chatRef, message);

    return {
      success: true,
      message: {
        ...message,
        id: newMessageRef.key
      }
    };
  } catch (error) {
    console.error('Error sending system message:', error);
    throw new Error('Failed to send system message');
  }
};

/**
 * Get chat messages for a ride (one-time fetch)
 * @param {string} rideID - Ride ID
 * @param {string} userID - User ID (for authorization)
 * @param {number} limit - Maximum number of messages to fetch
 * @returns {Promise<Array>} Chat messages
 */
export const getChatMessages = async (rideID, userID, limit = 50) => {
  try {
    // Verify ride exists and user is part of it
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));
    
    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideDoc.data();
    const isDriver = rideData.driverID === userID;
    const isRider = rideData.riders.includes(userID);

    if (!isDriver && !isRider) {
      throw new Error('You must be part of this ride to view messages');
    }

    // Get messages
    const chatRef = ref(realtimeDb, `${REALTIME_PATHS.CHATS}/${rideID}`);
    const messagesQuery = query(chatRef, orderByChild('timestamp'), limitToLast(limit));
    
    const snapshot = await get(messagesQuery);

    const messages = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }

    // Sort by timestamp (ascending)
    messages.sort((a, b) => a.timestamp - b.timestamp);

    return {
      success: true,
      messages,
      count: messages.length
    };
  } catch (error) {
    console.error('Error getting chat messages:', error);
    throw new Error(error.message || 'Failed to fetch messages');
  }
};

/**
 * Subscribe to new messages in a chat (real-time listener)
 * @param {string} rideID - Ride ID
 * @param {string} userID - User ID (for authorization)
 * @param {Function} callback - Callback function to receive new messages
 * @returns {Promise<Function>} Unsubscribe function
 */
export const subscribeToMessages = async (rideID, userID, callback) => {
  try {
    // Verify ride exists and user is part of it
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));
    
    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideDoc.data();
    const isDriver = rideData.driverID === userID;
    const isRider = rideData.riders.includes(userID);

    if (!isDriver && !isRider) {
      throw new Error('You must be part of this ride to subscribe to messages');
    }

    // Subscribe to new messages
    const chatRef = ref(realtimeDb, `${REALTIME_PATHS.CHATS}/${rideID}`);
    
    // Listen for new children (messages)
    const unsubscribe = onChildAdded(chatRef, (snapshot) => {
      const message = {
        id: snapshot.key,
        ...snapshot.val()
      };
      
      callback({
        success: true,
        message
      });
    }, (error) => {
      console.error('Error listening to messages:', error);
      callback({
        success: false,
        error: error.message
      });
    });

    // Return unsubscribe function
    return () => {
      off(chatRef);
    };
  } catch (error) {
    console.error('Error subscribing to messages:', error);
    throw new Error(error.message || 'Failed to subscribe to messages');
  }
};

/**
 * Get unread message count for a user in a ride
 * @param {string} rideID - Ride ID
 * @param {string} userID - User ID
 * @returns {Promise<number>} Unread message count
 */
export const getUnreadCount = async (rideID, userID) => {
  try {
    const chatRef = ref(realtimeDb, `${REALTIME_PATHS.CHATS}/${rideID}`);
    const snapshot = await get(chatRef);

    let unreadCount = 0;

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        // Count messages not sent by this user and not yet read by them
        if (message.senderID !== userID && (!message.readBy || !message.readBy.includes(userID))) {
          unreadCount++;
        }
      });
    }

    return {
      success: true,
      unreadCount
    };
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw new Error('Failed to get unread count');
  }
};

/**
 * Mark messages as read
 * @param {string} rideID - Ride ID
 * @param {string} userID - User ID (reading the messages)
 * @returns {Promise<Object>} Success status
 */
export const markMessagesAsRead = async (rideID, userID) => {
  try {
    const chatRef = ref(realtimeDb, `${REALTIME_PATHS.CHATS}/${rideID}`);
    const snapshot = await get(chatRef);

    if (snapshot.exists()) {
      const updates = {};
      
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        const readBy = message.readBy || [];
        
        // Add user to readBy array if not sent by this user and not already read by them
        if (message.senderID !== userID && !readBy.includes(userID)) {
          // Add userID to the readBy array
          const updatedReadBy = [...readBy, userID];
          updates[`${childSnapshot.key}/readBy`] = updatedReadBy;
        }
      });

      if (Object.keys(updates).length > 0) {
        await update(chatRef, updates);
      }
    }

    return {
      success: true,
      message: 'Messages marked as read'
    };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw new Error('Failed to mark messages as read');
  }
};

/**
 * Delete a message (only sender or driver can delete)
 * @param {string} rideID - Ride ID
 * @param {string} messageID - Message ID
 * @param {string} userID - User ID (for authorization)
 * @returns {Promise<Object>} Success status
 */
export const deleteMessage = async (rideID, messageID, userID) => {
  try {
    // Get message
    const messageRef = ref(realtimeDb, `${REALTIME_PATHS.CHATS}/${rideID}/${messageID}`);
    const snapshot = await get(messageRef);

    if (!snapshot.exists()) {
      throw new Error('Message not found');
    }

    const message = snapshot.val();

    // Get ride to check if user is driver
    const rideDoc = await getDoc(doc(db, COLLECTIONS.RIDES, rideID));
    
    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }

    const rideData = rideDoc.data();
    const isDriver = rideData.driverID === userID;
    const isSender = message.senderID === userID;

    // Only sender or driver can delete
    if (!isSender && !isDriver) {
      throw new Error('You can only delete your own messages or messages in your ride (if driver)');
    }

    // Delete message
    await set(messageRef, null);

    return {
      success: true,
      message: 'Message deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error(error.message || 'Failed to delete message');
  }
};

/**
 * Get all chats for a user (list of rides with active chats)
 * @param {string} userID - User ID
 * @returns {Promise<Array>} List of rides with chat activity
 */
export const getUserChats = async (userID) => {
  try {
    // This would require getting all rides user is part of
    // and checking which ones have chat messages
    // Implementation would depend on your specific requirements
    
    return {
      success: true,
      chats: [],
      message: 'Feature to be implemented based on requirements'
    };
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw new Error('Failed to fetch user chats');
  }
};