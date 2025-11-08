# University Carpooling & Ride-Sharing App - Backend

Complete backend architecture using Firebase (v10+) for a React Native mobile carpooling application.

## 🏗️ Architecture Overview

This backend uses:
- **Firebase Authentication** - User signup/login/password reset
- **Cloud Firestore** - Primary database for users, rides, bookings, ratings
- **Realtime Database** - Live location tracking and in-app chat
- **Cloud Functions** - Automated triggers and background tasks
- **Firebase Cloud Messaging (FCM)** - Push notifications
- **Nodemailer** - Email notifications (fallback)

## 📁 Project Structure

```
carpooling-backend/
├── services/
│   ├── firebase.js              # Firebase initialization
│   ├── authService.js           # Authentication operations
│   ├── rideService.js           # Ride management
│   ├── bookingService.js        # Booking operations
│   ├── ratingService.js         # Rating system
│   ├── notificationService.js   # FCM notifications
│   ├── locationService.js       # Real-time location tracking
│   └── chatService.js           # In-app chat
├── functions/
│   ├── index.js                 # Cloud Functions
│   └── package.json             # Functions dependencies
├── firestore.rules              # Firestore security rules
├── database.rules.json          # Realtime DB security rules
├── sampleData.js                # Example data structures
├── package.json                 # Client dependencies
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Firebase Project** - Create at [Firebase Console](https://console.firebase.google.com)
3. **Firebase CLI** - Install globally: `npm install -g firebase-tools`

### Step 1: Firebase Project Setup

1. Create a new Firebase project
2. Enable Authentication (Email/Password provider)
3. Create Firestore Database (start in production mode)
4. Create Realtime Database
5. Enable Cloud Functions (Blaze plan required)
6. Get your Firebase config from Project Settings

### Step 2: Install Dependencies

```bash
# Install client-side dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

### Step 3: Configure Firebase

1. Open `services/firebase.js`
2. Replace the Firebase config with your project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
};
```

### Step 4: Deploy Security Rules

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Realtime Database rules
firebase deploy --only database
```

### Step 5: Configure Cloud Functions

1. Set email credentials for notifications:

```bash
firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-password"
```

2. Deploy Cloud Functions:

```bash
firebase deploy --only functions
```

### Step 6: Integrate with React Native

In your React Native (Expo) project:

```bash
npm install firebase
```

Then import and use the services:

```javascript
import { createUser, loginUser } from './services/authService';
import { createRide, getAvailableRides } from './services/rideService';
import { bookSeat, cancelBooking } from './services/bookingService';
```

## 🔥 Core Features

### 1. Authentication (`authService.js`)

```javascript
// User signup
const result = await createUser({
  email: 'user@university.edu',
  password: 'securePassword123',
  name: 'John Doe',
  phone: '+1234567890',
  role: 'driver' // or 'rider'
});

// User login
const user = await loginUser('user@university.edu', 'password');

// Password reset
await resetPassword('user@university.edu');

// Logout
await logoutUser();
```

### 2. Ride Management (`rideService.js`)

```javascript
// Create a ride (driver only)
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

// Search available rides
const rides = await getAvailableRides({
  pickup: 'University',
  destination: 'Downtown',
  date: '2024-12-25',
  seatsNeeded: 2,
  maxCost: 10
});

// Get user's rides
const myRides = await getMyRides('user123', 'all');
```

### 3. Booking (`bookingService.js`)

```javascript
// Book seats
const booking = await bookSeat('ride123', 'rider456', 2);

// Cancel booking
await cancelBooking('booking789', 'rider456');

// Get user bookings
const bookings = await getMyBookings('rider456', 'active');
```

### 4. Rating System (`ratingService.js`)

```javascript
// Rate a user after ride
await rateUser({
  rideID: 'ride123',
  fromUserID: 'rider456',
  toUserID: 'driver123',
  rating: 5,
  comment: 'Great driver!'
});

// Get user ratings
const ratings = await getUserRatings('driver123');

// Check pending ratings
const pending = await getPendingRatings('user123');
```

### 5. Live Location Tracking (`locationService.js`)

```javascript
// Driver updates location (call every 3-5 seconds while active)
await updateDriverLocation('ride123', 'driver123', 40.7128, -74.0060, 180, 45);

// Riders subscribe to location updates
const unsubscribe = subscribeToLocationUpdates('ride123', (data) => {
  console.log('Driver location:', data.location);
});

// Stop tracking when ride ends
await stopLocationTracking('ride123', 'driver123');
```

### 6. In-App Chat (`chatService.js`)

```javascript
// Send a message
await sendMessage('ride123', 'rider456', 'I am at the pickup point');

// Subscribe to new messages
const unsubscribe = await subscribeToMessages('ride123', 'user123', (data) => {
  console.log('New message:', data.message);
});

// Get chat history
const messages = await getChatMessages('ride123', 'user123', 50);
```

## 🔔 Cloud Functions (Automated)

All Cloud Functions are automatically triggered:

### 1. `updateAvgRating`
- **Trigger:** onCreate(rating)
- **Action:** Recalculates user's average rating

### 2. `notifyDriverOnBooking`
- **Trigger:** onCreate(booking)
- **Action:** Sends push notification and email to driver

### 3. `notifyRideFull`
- **Trigger:** onUpdate(ride.status → 'full')
- **Action:** Notifies driver when all seats are booked

### 4. `rideReminder`
- **Trigger:** Scheduled (every 5 minutes)
- **Action:** Sends reminders 30 minutes before ride starts

### 5. `cleanupOldRides`
- **Trigger:** Scheduled (daily at 2 AM)
- **Action:** Archives rides older than 30 days

### 6. `notifyOnBookingCancellation`
- **Trigger:** onUpdate(booking.status → 'cancelled')
- **Action:** Notifies driver about cancellation

## 🔒 Security Rules

Security rules are configured for:

✅ **Authentication required** for all operations
✅ **Users can only edit their own data**
✅ **Drivers can only edit their rides**
✅ **Riders can only edit their bookings**
✅ **Ratings allowed only by ride participants**
✅ **Location updates only by ride driver**
✅ **Chat messages validated for length and content**

## 📧 Email Setup (Optional)

For email notifications, configure Nodemailer:

### Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Set Firebase config:

```bash
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
```

### Other Email Services

Modify the transporter in `functions/index.js`:

```javascript
const emailTransporter = nodemailer.createTransporter({
  host: 'smtp.yourservice.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email',
    pass: 'your-password'
  }
});
```

## 📱 Push Notifications Setup

### React Native Setup

1. Install required packages:

```bash
npx expo install expo-notifications expo-device
```

2. Get FCM token and save it:

```javascript
import * as Notifications from 'expo-notifications';
import { updateFCMToken } from './services/authService';

// Request permissions
const { status } = await Notifications.requestPermissionsAsync();

// Get FCM token
const token = (await Notifications.getExpoPushTokenAsync()).data;

// Save to user profile
await updateFCMToken(userID, token);
```

## 🧪 Testing

### Test Authentication

```javascript
// Create test user
const user = await createUser({
  email: 'test@test.com',
  password: 'test123',
  name: 'Test User',
  phone: '+1234567890',
  role: 'driver'
});

console.log('User created:', user);
```

### Test Ride Creation

```javascript
// Create test ride
const ride = await createRide({
  driverID: user.user.uid,
  pickup: 'Test Pickup',
  destination: 'Test Destination',
  pickupLat: 40.7128,
  pickupLng: -74.0060,
  destinationLat: 40.7580,
  destinationLng: -73.9855,
  date: '2024-12-25',
  time: '14:30',
  totalSeats: 4,
  cost: 5
});

console.log('Ride created:', ride);
```

## 🐛 Troubleshooting

### Firebase Not Initialized
- Verify Firebase config in `services/firebase.js`
- Check Firebase project is created and enabled

### Permission Denied Errors
- Deploy security rules: `firebase deploy --only firestore:rules`
- Check user is authenticated before operations

### Cloud Functions Not Triggering
- Verify Blaze plan is active
- Check function logs: `firebase functions:log`
- Redeploy functions: `firebase deploy --only functions`

### Push Notifications Not Working
- Verify FCM token is saved in user document
- Check Cloud Messaging is enabled in Firebase Console
- Test with Firebase Console → Cloud Messaging → Send test message

## 📊 Monitoring

### Firebase Console
- Monitor real-time database usage
- View Cloud Function execution logs
- Track authentication metrics
- Check Firestore query performance

### Function Logs
```bash
# View recent logs
firebase functions:log

# Stream logs in real-time
firebase functions:log --only notifyDriverOnBooking
```

## 💰 Cost Optimization

### Firestore
- Use compound indexes for complex queries
- Implement pagination for large result sets
- Cache frequently accessed data client-side

### Cloud Functions
- Use minimal timeout values
- Batch operations where possible
- Use Pub/Sub for scheduled tasks instead of HTTPS

### Realtime Database
- Clear location data after rides complete
- Limit chat history to last 100 messages
- Use presence detection to cleanup stale data

## 🔐 Production Checklist

Before going live:

- [ ] Update all API keys and secrets
- [ ] Enable Firestore backups
- [ ] Set up Firebase App Check
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Set up monitoring and alerts
- [ ] Test all security rules thoroughly
- [ ] Configure CORS for web clients
- [ ] Set up custom domain for Auth
- [ ] Review and optimize function timeouts

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Cloud Functions Best Practices](https://firebase.google.com/docs/functions/best-practices)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Firebase Console logs
3. Consult Firebase documentation
4. Open an issue in your project repository

## 📝 License

MIT License - Feel free to use this backend for your carpooling app!

---

Built with ❤️ using Firebase and React Native
