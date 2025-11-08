# 📚 API Reference - University Carpooling Backend

Complete reference for all backend service functions.

## Table of Contents
1. [Authentication Service](#authentication-service)
2. [Ride Service](#ride-service)
3. [Booking Service](#booking-service)
4. [Rating Service](#rating-service)
5. [Location Service](#location-service)
6. [Chat Service](#chat-service)
7. [Notification Service](#notification-service)
8. [Error Handling](#error-handling)

---

## Authentication Service

### `createUser(userData)`
Creates a new user account with email and password.

**Parameters:**
```javascript
{
  email: string,          // User email (required)
  password: string,       // Password, min 6 chars (required)
  name: string,          // Full name (required)
  phone: string,         // Phone number (required)
  role: 'driver'|'rider', // User role (required)
  profilePic: string     // Profile picture URL (optional)
}
```

**Returns:**
```javascript
{
  success: true,
  user: {
    uid: string,
    email: string,
    name: string,
    phone: string,
    role: string,
    avgRating: 0,
    ratingsCount: 0,
    verified: false,
    // ... other fields
  }
}
```

**Example:**
```javascript
const result = await createUser({
  email: 'john@university.edu',
  password: 'securePass123',
  name: 'John Doe',
  phone: '+1234567890',
  role: 'driver'
});
```

**Errors:**
- `auth/email-already-in-use`
- `auth/weak-password`
- `auth/invalid-email`

---

### `loginUser(email, password)`
Authenticates user and returns user data.

**Parameters:**
- `email`: string - User email
- `password`: string - User password

**Returns:**
```javascript
{
  success: true,
  user: {
    uid: string,
    email: string,
    emailVerified: boolean,
    name: string,
    // ... all user fields
  }
}
```

**Example:**
```javascript
const user = await loginUser('john@university.edu', 'securePass123');
console.log('Logged in:', user.user.name);
```

---

### `logoutUser()`
Signs out the current user.

**Returns:**
```javascript
{
  success: true,
  message: 'Logged out successfully'
}
```

---

### `resetPassword(email)`
Sends password reset email.

**Parameters:**
- `email`: string - User email

**Returns:**
```javascript
{
  success: true,
  message: 'Password reset email sent'
}
```

---

### `getCurrentUser()`
Gets current authenticated user data.

**Returns:**
```javascript
{
  uid: string,
  email: string,
  emailVerified: boolean,
  // ... all user fields
}
```
Returns `null` if no user is logged in.

---

### `updateUserProfile(uid, updates)`
Updates user profile information.

**Parameters:**
- `uid`: string - User ID
- `updates`: object - Fields to update

**Allowed Updates:**
```javascript
{
  name: string,
  phone: string,
  profilePic: string,
  notificationPreferences: object
}
```

**Returns:**
```javascript
{
  success: true,
  user: { ...updatedUserData }
}
```

---

### `onAuthStateChange(callback)`
Listens to authentication state changes.

**Parameters:**
- `callback`: function - Called with user data or null

**Returns:**
- Unsubscribe function

**Example:**
```javascript
const unsubscribe = onAuthStateChange((user) => {
  if (user) {
    console.log('User logged in:', user.name);
  } else {
    console.log('User logged out');
  }
});

// Later: unsubscribe();
```

---

## Ride Service

### `createRide(rideData)`
Creates a new ride (driver only).

**Parameters:**
```javascript
{
  driverID: string,        // Driver's user ID (required)
  pickup: string,          // Pickup location name (required)
  destination: string,     // Destination name (required)
  pickupLat: number,       // Pickup latitude (required)
  pickupLng: number,       // Pickup longitude (required)
  destinationLat: number,  // Destination latitude (required)
  destinationLng: number,  // Destination longitude (required)
  date: string,           // Date in YYYY-MM-DD format (required)
  time: string,           // Time in HH:mm format (required)
  totalSeats: number,     // Total available seats 1-8 (required)
  cost: number,           // Cost per seat (required)
  notes: string,          // Additional notes (optional)
  vehicleInfo: {          // Vehicle details (optional)
    make: string,
    model: string,
    color: string,
    licensePlate: string
  }
}
```

**Returns:**
```javascript
{
  success: true,
  ride: {
    rideID: string,
    driverID: string,
    pickup: string,
    destination: string,
    date: string,
    time: string,
    totalSeats: number,
    seatsAvailable: number,
    cost: number,
    status: 'active',
    riders: [],
    // ... other fields
  }
}
```

**Example:**
```javascript
const ride = await createRide({
  driverID: 'user123',
  pickup: 'University Main Gate',
  destination: 'Downtown Mall',
  pickupLat: 40.7128,
  pickupLng: -74.0060,
  destinationLat: 40.7580,
  destinationLng: -73.9855,
  date: '2024-12-25',
  time: '14:30',
  totalSeats: 4,
  cost: 5.00,
  vehicleInfo: {
    make: 'Toyota',
    model: 'Camry',
    color: 'Blue'
  }
});
```

---

### `getAvailableRides(filters)`
Searches for available rides with optional filters.

**Parameters:**
```javascript
{
  pickup: string,         // Partial match on pickup location (optional)
  destination: string,    // Partial match on destination (optional)
  date: string,          // Specific date YYYY-MM-DD (optional)
  seatsNeeded: number,   // Minimum available seats (default: 1)
  maxCost: number,       // Maximum cost per seat (optional)
  limitResults: number   // Max results to return (default: 50)
}
```

**Returns:**
```javascript
{
  success: true,
  rides: [
    {
      rideID: string,
      driverName: string,
      driverRating: number,
      pickup: string,
      destination: string,
      date: string,
      time: string,
      seatsAvailable: number,
      cost: number,
      // ... other fields
    }
  ],
  count: number
}
```

**Example:**
```javascript
const rides = await getAvailableRides({
  pickup: 'University',
  destination: 'Mall',
  date: '2024-12-25',
  seatsNeeded: 2,
  maxCost: 10
});

console.log(`Found ${rides.count} rides`);
```

---

### `getRideById(rideID)`
Gets detailed information about a specific ride.

**Parameters:**
- `rideID`: string - Ride ID

**Returns:**
```javascript
{
  success: true,
  ride: { ...fullRideData }
}
```

---

### `getMyRides(uid, type)`
Gets rides for a user (as driver or rider).

**Parameters:**
- `uid`: string - User ID
- `type`: string - 'driver', 'rider', or 'all' (default: 'all')

**Returns:**
```javascript
{
  success: true,
  rides: [...allRides],
  driverRides: [...ridesAsDriver],
  riderRides: [...ridesAsRider]
}
```

---

### `cancelRide(rideID, driverID)`
Cancels a ride (driver only).

**Parameters:**
- `rideID`: string - Ride ID
- `driverID`: string - Driver ID (for authorization)

**Returns:**
```javascript
{
  success: true,
  message: 'Ride cancelled successfully'
}
```

**Side Effects:**
- All active bookings automatically cancelled
- All riders notified via push notification and email
- Cloud Function handles cleanup

---

### `completeRide(rideID, driverID)`
Marks a ride as completed.

**Parameters:**
- `rideID`: string - Ride ID
- `driverID`: string - Driver ID

**Returns:**
```javascript
{
  success: true,
  message: 'Ride marked as completed'
}
```

---

### `searchRidesByLocation(params)`
Finds rides near a geographic location.

**Parameters:**
```javascript
{
  lat: number,          // User's latitude (required)
  lng: number,          // User's longitude (required)
  radiusKm: number,     // Search radius in km (default: 5)
  type: string,         // 'pickup' or 'destination' (default: 'pickup')
  date: string          // Optional date filter
}
```

**Returns:**
```javascript
{
  success: true,
  rides: [...nearbyRides],
  count: number
}
```

---

## Booking Service

### `bookSeat(rideID, riderID, seatsBooked)`
Books seats in a ride.

**Parameters:**
- `rideID`: string - Ride ID
- `riderID`: string - Rider's user ID
- `seatsBooked`: number - Number of seats (1-4, default: 1)

**Returns:**
```javascript
{
  success: true,
  booking: {
    bookingID: string,
    rideID: string,
    riderID: string,
    seatsBooked: number,
    totalCost: number,
    status: 'active',
    // ... other fields
  },
  message: 'Booking confirmed successfully',
  rideFull: boolean
}
```

**Side Effects:**
- Ride seats decremented atomically
- Driver notified via push notification and email
- System message sent to ride chat

**Example:**
```javascript
const booking = await bookSeat('ride123', 'rider456', 2);
console.log('Booked!', booking.booking.bookingID);
```

---

### `cancelBooking(bookingID, riderID)`
Cancels a booking (must be at least 2 hours before ride).

**Parameters:**
- `bookingID`: string - Booking ID
- `riderID`: string - Rider ID (for authorization)

**Returns:**
```javascript
{
  success: true,
  message: 'Booking cancelled successfully',
  seatsFreed: number,
  refundAmount: number
}
```

**Side Effects:**
- Ride seats incremented
- Driver notified
- Booking marked as cancelled

---

### `getMyBookings(riderID, status)`
Gets all bookings for a rider.

**Parameters:**
- `riderID`: string - Rider's user ID
- `status`: string - Filter by status: 'active', 'cancelled', 'completed' (optional)

**Returns:**
```javascript
{
  success: true,
  bookings: [...bookings],
  count: number
}
```

---

### `getRideBookings(rideID, driverID)`
Gets all bookings for a specific ride (driver only).

**Parameters:**
- `rideID`: string - Ride ID
- `driverID`: string - Driver ID (for authorization)

**Returns:**
```javascript
{
  success: true,
  bookings: [...activeBookings],
  count: number,
  totalSeatsBooked: number
}
```

---

### `hasUserBookedRide(rideID, riderID)`
Checks if a user has booked a specific ride.

**Parameters:**
- `rideID`: string - Ride ID
- `riderID`: string - Rider ID

**Returns:**
```javascript
{
  success: true,
  hasBooked: boolean,
  booking: object|null
}
```

---

## Rating Service

### `rateUser(ratingData)`
Submits a rating for a user after a ride.

**Parameters:**
```javascript
{
  rideID: string,        // Ride ID (required)
  fromUserID: string,    // User giving rating (required)
  toUserID: string,      // User being rated (required)
  rating: number,        // Rating 1-5 (required)
  comment: string        // Optional comment
}
```

**Returns:**
```javascript
{
  success: true,
  message: 'Rating submitted successfully',
  ratingID: string
}
```

**Side Effects:**
- User's average rating updated automatically via Cloud Function
- Cannot rate the same person twice for same ride
- Can only rate after ride is completed

**Example:**
```javascript
await rateUser({
  rideID: 'ride123',
  fromUserID: 'rider456',
  toUserID: 'driver789',
  rating: 5,
  comment: 'Excellent driver! Very professional and punctual.'
});
```

---

### `getUserRatings(userID, limitResults)`
Gets all ratings for a user.

**Parameters:**
- `userID`: string - User ID
- `limitResults`: number - Max results (default: 50)

**Returns:**
```javascript
{
  success: true,
  ratings: [
    {
      ratingID: string,
      fromUserName: string,
      rating: number,
      comment: string,
      rideDate: string,
      rideRoute: string,
      createdAt: timestamp
    }
  ],
  totalRatings: number,
  avgRating: number,
  distribution: {
    1: number,
    2: number,
    3: number,
    4: number,
    5: number
  }
}
```

---

### `getPendingRatings(userID)`
Gets list of rides where user hasn't rated all participants.

**Returns:**
```javascript
{
  success: true,
  pendingRatings: [
    {
      rideID: string,
      date: string,
      route: string,
      usersToRate: [
        {
          userID: string,
          userName: string,
          userRole: 'driver'|'rider'
        }
      ]
    }
  ],
  count: number
}
```

---

### `canUserRate(rideID, fromUserID, toUserID)`
Checks if a user can rate another user for a specific ride.

**Returns:**
```javascript
{
  canRate: boolean,
  reason: string|null
}
```

---

## Location Service

### `updateDriverLocation(rideID, driverID, lat, lng, heading, speed)`
Updates driver's current location (call every 3-5 seconds while driving).

**Parameters:**
- `rideID`: string - Ride ID
- `driverID`: string - Driver ID
- `lat`: number - Current latitude
- `lng`: number - Current longitude
- `heading`: number - Direction in degrees 0-360 (optional)
- `speed`: number - Speed in km/h (optional)

**Returns:**
```javascript
{
  success: true,
  message: 'Location updated successfully'
}
```

**Example:**
```javascript
// In React Native - update location continuously
const watchPosition = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  
  Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10
    },
    async (location) => {
      await updateDriverLocation(
        rideID,
        driverID,
        location.coords.latitude,
        location.coords.longitude,
        location.coords.heading,
        location.coords.speed * 3.6 // convert m/s to km/h
      );
    }
  );
};
```

---

### `subscribeToLocationUpdates(rideID, callback)`
Subscribes to real-time driver location updates.

**Parameters:**
- `rideID`: string - Ride ID
- `callback`: function - Called with location data

**Returns:**
- Unsubscribe function

**Example:**
```javascript
const unsubscribe = subscribeToLocationUpdates('ride123', (data) => {
  if (data.success && data.location) {
    const { lat, lng, speed, heading } = data.location;
    console.log(`Driver at: ${lat}, ${lng}, moving at ${speed} km/h`);
    // Update map marker
  }
});

// Clean up when component unmounts
return () => unsubscribe();
```

---

### `getDriverLocation(rideID)`
Gets driver's current location (one-time fetch).

**Returns:**
```javascript
{
  success: true,
  location: {
    lat: number,
    lng: number,
    heading: number,
    speed: number,
    timestamp: number
  }
}
```

---

### `stopLocationTracking(rideID, driverID)`
Stops location tracking for a ride.

**Parameters:**
- `rideID`: string - Ride ID
- `driverID`: string - Driver ID

---

### `isDriverNearPickup(rideID, thresholdKm)`
Checks if driver is within threshold distance of pickup.

**Parameters:**
- `rideID`: string - Ride ID
- `thresholdKm`: number - Distance threshold (default: 0.5km)

**Returns:**
```javascript
{
  success: true,
  isNear: boolean,
  distance: number,    // in km
  eta: number,         // in minutes
  message: string
}
```

---

## Chat Service

### `sendMessage(rideID, senderID, text, messageType)`
Sends a message in ride chat.

**Parameters:**
- `rideID`: string - Ride ID
- `senderID`: string - Sender's user ID
- `text`: string - Message text (max 1000 chars)
- `messageType`: string - 'text', 'location', or 'system' (default: 'text')

**Returns:**
```javascript
{
  success: true,
  message: {
    id: string,
    senderID: string,
    senderName: string,
    text: string,
    timestamp: number,
    read: false
  }
}
```

**Example:**
```javascript
await sendMessage('ride123', 'user456', 'I am on my way!');
```

---

### `subscribeToMessages(rideID, userID, callback)`
Subscribes to new messages in real-time.

**Parameters:**
- `rideID`: string - Ride ID
- `userID`: string - User ID (for authorization)
- `callback`: function - Called with new messages

**Returns:**
- Promise resolving to unsubscribe function

**Example:**
```javascript
const unsubscribe = await subscribeToMessages('ride123', 'user456', (data) => {
  if (data.success) {
    console.log('New message:', data.message.text);
    // Update UI with new message
  }
});
```

---

### `getChatMessages(rideID, userID, limit)`
Gets chat history for a ride.

**Parameters:**
- `rideID`: string - Ride ID
- `userID`: string - User ID
- `limit`: number - Max messages (default: 50)

**Returns:**
```javascript
{
  success: true,
  messages: [...messages],
  count: number
}
```

---

### `getUnreadCount(rideID, userID)`
Gets number of unread messages in a ride.

**Returns:**
```javascript
{
  success: true,
  unreadCount: number
}
```

---

## Error Handling

All functions throw errors that should be caught:

```javascript
try {
  const user = await loginUser(email, password);
  // Handle success
} catch (error) {
  // Handle error
  console.error(error.message);
  
  // Common Firebase error codes:
  // auth/user-not-found
  // auth/wrong-password
  // auth/email-already-in-use
  // permission-denied
  // not-found
}
```

**Error Response Format:**
```javascript
{
  message: string,
  code: string  // Firebase error code
}
```

---

## Best Practices

1. **Always use try-catch** with async functions
2. **Check user authentication** before operations
3. **Validate inputs** on client-side before calling services
4. **Handle loading states** in your UI
5. **Unsubscribe from listeners** when components unmount
6. **Cache frequently accessed data** to reduce reads
7. **Use transactions** for operations that modify multiple documents
8. **Implement retry logic** for network errors
9. **Show user-friendly error messages**
10. **Log errors** for debugging

---

## Rate Limits

Firebase has the following quotas (Free tier):
- **Firestore:** 50K reads/day, 20K writes/day
- **Realtime DB:** 100 simultaneous connections
- **Cloud Functions:** 2M invocations/month
- **Authentication:** Unlimited

For production, upgrade to Blaze (pay-as-you-go) plan.

---

This API reference covers all backend services. For implementation examples, see the README.md and test files.
