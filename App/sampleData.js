/**
 * Sample Data Structures for University Carpooling App
 * 
 * These are example JSON structures showing how data is stored
 * in Firestore and Realtime Database.
 */

// ============================================================================
// FIRESTORE COLLECTIONS
// ============================================================================

/**
 * USERS COLLECTION
 * Path: /users/{uid}
 */
const sampleUser = {
  uid: "user123abc",
  name: "John Doe",
  email: "john.doe@university.edu",
  phone: "+1234567890",
  role: "driver", // or "rider"
  avgRating: 4.5,
  ratingsCount: 12,
  profilePic: "https://example.com/profile.jpg",
  verified: true,
  createdAt: { _seconds: 1704067200, _nanoseconds: 0 },
  updatedAt: { _seconds: 1704067200, _nanoseconds: 0 },
  totalRidesOffered: 25,
  totalRidesTaken: 18,
  fcmToken: "fcm_token_here_for_push_notifications",
  isActive: true,
  lastLogin: { _seconds: 1704067200, _nanoseconds: 0 },
  notificationPreferences: {
    pushEnabled: true,
    emailEnabled: true,
    bookingNotifications: true,
    rideReminders: true,
    ratingRequests: true,
    promotions: false
  }
};

/**
 * RIDES COLLECTION
 * Path: /rides/{rideID}
 */
const sampleRide = {
  rideID: "ride_1704067200_abc123",
  driverID: "user123abc",
  driverName: "John Doe",
  driverPhone: "+1234567890",
  driverRating: 4.5,
  driverProfilePic: "https://example.com/profile.jpg",
  pickup: "University Main Campus",
  destination: "Downtown Shopping Mall",
  pickupLat: 40.7128,
  pickupLng: -74.0060,
  destinationLat: 40.7580,
  destinationLng: -73.9855,
  date: "2024-12-25",
  time: "14:30",
  rideDateTime: { _seconds: 1704067200, _nanoseconds: 0 },
  totalSeats: 4,
  seatsAvailable: 2,
  cost: 5.00,
  riders: ["rider1_uid", "rider2_uid"],
  status: "active", // active, full, completed, cancelled
  notes: "Pickup at Gate 3. Please be on time!",
  vehicleInfo: {
    make: "Toyota",
    model: "Camry",
    color: "Blue",
    licensePlate: "ABC1234"
  },
  createdAt: { _seconds: 1704067200, _nanoseconds: 0 },
  updatedAt: { _seconds: 1704067200, _nanoseconds: 0 },
  completedAt: null // Set when ride is completed
};

/**
 * BOOKINGS COLLECTION
 * Path: /bookings/{bookingID}
 */
const sampleBooking = {
  bookingID: "booking_1704067200_xyz789",
  rideID: "ride_1704067200_abc123",
  riderID: "rider1_uid",
  riderName: "Jane Smith",
  riderPhone: "+1987654321",
  riderProfilePic: "https://example.com/jane.jpg",
  driverID: "user123abc",
  pickup: "University Main Campus",
  destination: "Downtown Shopping Mall",
  date: "2024-12-25",
  time: "14:30",
  seatsBooked: 2,
  costPerSeat: 5.00,
  totalCost: 10.00,
  status: "active", // active, cancelled, completed
  createdAt: { _seconds: 1704067200, _nanoseconds: 0 },
  updatedAt: { _seconds: 1704067200, _nanoseconds: 0 },
  cancelledAt: null,
  completedAt: null
};

/**
 * RATINGS COLLECTION
 * Path: /ratings/{ratingID}
 */
const sampleRating = {
  ratingID: "rating_1704067200_def456",
  rideID: "ride_1704067200_abc123",
  fromUserID: "rider1_uid",
  fromUserName: "Jane Smith",
  toUserID: "user123abc",
  toUserName: "John Doe",
  rating: 5, // 1 to 5
  comment: "Great driver! Very punctual and friendly. The car was clean and comfortable. Highly recommend!",
  rideDate: "2024-12-25",
  rideRoute: "University Main Campus → Downtown Shopping Mall",
  createdAt: { _seconds: 1704067200, _nanoseconds: 0 }
};

// ============================================================================
// REALTIME DATABASE PATHS
// ============================================================================

/**
 * RIDE LOCATIONS
 * Path: /rideLocations/{rideID}
 */
const sampleRideLocation = {
  lat: 40.7128,
  lng: -74.0060,
  heading: 180, // Direction in degrees (0-360)
  speed: 45, // Speed in km/h
  updatedAt: { ".sv": "timestamp" },
  timestamp: 1704067200000
};

/**
 * CHAT MESSAGES
 * Path: /chats/{rideID}/{messageID}
 */
const sampleChatMessage = {
  senderID: "rider1_uid",
  senderName: "Jane Smith",
  senderProfilePic: "https://example.com/jane.jpg",
  senderRole: "rider", // driver, rider, or system
  text: "I'll be at the pickup location in 5 minutes!",
  messageType: "text", // text, location, system
  timestamp: 1704067200000,
  read: false
};

const sampleSystemMessage = {
  senderID: "system",
  senderName: "System",
  senderProfilePic: "",
  senderRole: "system",
  text: "Jane Smith joined the ride! 🎉",
  messageType: "system",
  timestamp: 1704067200000,
  read: false
};

// ============================================================================
// EXAMPLE QUERIES AND RESPONSES
// ============================================================================

/**
 * Example: Create User Response
 */
const createUserResponse = {
  success: true,
  user: {
    uid: "user123abc",
    email: "john.doe@university.edu",
    name: "John Doe",
    phone: "+1234567890",
    role: "driver",
    avgRating: 0,
    ratingsCount: 0,
    profilePic: "",
    verified: false,
    createdAt: { _seconds: 1704067200, _nanoseconds: 0 },
    updatedAt: { _seconds: 1704067200, _nanoseconds: 0 }
  }
};

/**
 * Example: Search Rides Response
 */
const searchRidesResponse = {
  success: true,
  rides: [
    {
      rideID: "ride_1704067200_abc123",
      driverName: "John Doe",
      pickup: "University Main Campus",
      destination: "Downtown Shopping Mall",
      date: "2024-12-25",
      time: "14:30",
      seatsAvailable: 2,
      cost: 5.00,
      driverRating: 4.5,
      // ... other ride fields
    },
    {
      rideID: "ride_1704067201_def456",
      driverName: "Bob Wilson",
      pickup: "University North Gate",
      destination: "Airport Terminal",
      date: "2024-12-25",
      time: "16:00",
      seatsAvailable: 3,
      cost: 15.00,
      driverRating: 4.8,
      // ... other ride fields
    }
  ],
  count: 2
};

/**
 * Example: Book Seat Response
 */
const bookSeatResponse = {
  success: true,
  booking: {
    bookingID: "booking_1704067200_xyz789",
    rideID: "ride_1704067200_abc123",
    riderID: "rider1_uid",
    seatsBooked: 2,
    totalCost: 10.00,
    status: "active",
    // ... other booking fields
  },
  message: "Booking confirmed successfully",
  rideFull: false
};

/**
 * Example: Get User Ratings Response
 */
const getUserRatingsResponse = {
  success: true,
  ratings: [
    {
      ratingID: "rating_1",
      fromUserName: "Jane Smith",
      rating: 5,
      comment: "Great driver!",
      rideDate: "2024-12-20",
      rideRoute: "Campus → Mall"
    },
    {
      ratingID: "rating_2",
      fromUserName: "Mike Johnson",
      rating: 4,
      comment: "Good experience",
      rideDate: "2024-12-18",
      rideRoute: "Campus → Airport"
    }
  ],
  totalRatings: 12,
  avgRating: 4.5,
  distribution: {
    1: 0,
    2: 1,
    3: 2,
    4: 4,
    5: 5
  }
};

// ============================================================================
// EXPORT FOR REFERENCE
// ============================================================================

module.exports = {
  sampleUser,
  sampleRide,
  sampleBooking,
  sampleRating,
  sampleRideLocation,
  sampleChatMessage,
  sampleSystemMessage,
  createUserResponse,
  searchRidesResponse,
  bookSeatResponse,
  getUserRatingsResponse
};

/**
 * NOTES FOR IMPLEMENTATION:
 * 
 * 1. All timestamps use Firestore Timestamp or server timestamp
 * 2. GeoPoints can be used instead of separate lat/lng if preferred
 * 3. Cost should be stored as number (not string) for calculations
 * 4. Status fields use predefined string values for consistency
 * 5. Arrays (like riders) should be updated atomically using arrayUnion/arrayRemove
 * 6. FCM tokens should be kept updated when users login
 * 7. Ratings are immutable once created (no updates allowed)
 * 8. Ride locations in Realtime DB should be cleared after ride completion
 * 9. Chat messages can be paginated using timestamp for cursor-based pagination
 * 10. All money amounts should be stored with 2 decimal places
 */
