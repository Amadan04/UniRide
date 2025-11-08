# 🚀 Quick Reference Cheat Sheet

## Essential Commands

```bash
# Install dependencies
npm install
cd functions && npm install

# Firebase login
firebase login

# Initialize project
firebase init

# Deploy everything
firebase deploy

# Deploy specific parts
firebase deploy --only firestore:rules
firebase deploy --only database
firebase deploy --only functions

# View logs
firebase functions:log
firebase functions:log --only notifyDriverOnBooking

# Set email config
firebase functions:config:set email.user="your@email.com"
firebase functions:config:set email.password="app-password"
```

---

## Import Services

```javascript
// Import everything
import * as Backend from './backend';

// Or import specific services
import { 
  createUser, 
  loginUser, 
  createRide, 
  bookSeat 
} from './backend';
```

---

## Common Use Cases

### 1. User Signup & Login
```javascript
// Signup
const user = await createUser({
  email: 'user@example.com',
  password: 'pass123',
  name: 'John Doe',
  phone: '+1234567890',
  role: 'driver'
});

// Login
const loggedIn = await loginUser('user@example.com', 'pass123');

// Logout
await logoutUser();
```

### 2. Create & Search Rides
```javascript
// Create
const ride = await createRide({
  driverID: user.uid,
  pickup: 'University',
  destination: 'Mall',
  pickupLat: 40.7128,
  pickupLng: -74.0060,
  destinationLat: 40.7580,
  destinationLng: -73.9855,
  date: '2024-12-25',
  time: '14:30',
  totalSeats: 4,
  cost: 5
});

// Search
const rides = await getAvailableRides({
  pickup: 'University',
  seatsNeeded: 2,
  maxCost: 10
});
```

### 3. Book & Cancel
```javascript
// Book
const booking = await bookSeat(rideID, riderID, 2);

// Cancel
await cancelBooking(bookingID, riderID);
```

### 4. Rate Users
```javascript
await rateUser({
  rideID: 'ride123',
  fromUserID: 'user1',
  toUserID: 'user2',
  rating: 5,
  comment: 'Great ride!'
});
```

### 5. Live Location
```javascript
// Driver updates (every 3-5 seconds)
await updateDriverLocation(rideID, driverID, lat, lng, heading, speed);

// Riders subscribe
const unsubscribe = subscribeToLocationUpdates(rideID, (data) => {
  console.log('Location:', data.location);
});
```

### 6. Chat
```javascript
// Send message
await sendMessage(rideID, userID, 'Hello!');

// Subscribe to messages
const unsub = await subscribeToMessages(rideID, userID, (data) => {
  console.log('Message:', data.message.text);
});
```

---

## React Native Integration

### Setup Location
```javascript
import * as Location from 'expo-location';

// Request permissions
const { status } = await Location.requestForegroundPermissionsAsync();

// Watch position
Location.watchPositionAsync(
  { accuracy: Location.Accuracy.High, distanceInterval: 10 },
  async (location) => {
    await updateDriverLocation(
      rideID, 
      driverID,
      location.coords.latitude,
      location.coords.longitude,
      location.coords.heading,
      location.coords.speed * 3.6
    );
  }
);
```

### Setup Notifications
```javascript
import * as Notifications from 'expo-notifications';

// Request permissions
const { status } = await Notifications.requestPermissionsAsync();

// Get FCM token
const token = (await Notifications.getExpoPushTokenAsync()).data;

// Save token
await updateFCMToken(userID, token);
```

---

## Error Handling

```javascript
try {
  const result = await someFunction();
  // Success
} catch (error) {
  console.error(error.message);
  
  // Show user-friendly message
  Alert.alert('Error', error.message);
}
```

---

## Common Firebase Error Codes

```
auth/email-already-in-use
auth/weak-password
auth/user-not-found
auth/wrong-password
auth/invalid-email
permission-denied
not-found
```

---

## Firebase Console URLs

```
Project: https://console.firebase.google.com
Auth: https://console.firebase.google.com/project/YOUR_PROJECT/authentication
Firestore: https://console.firebase.google.com/project/YOUR_PROJECT/firestore
Functions: https://console.firebase.google.com/project/YOUR_PROJECT/functions
```

---

## File Paths

```
services/firebase.js          - Configure this first!
services/authService.js       - User auth
services/rideService.js       - Rides
services/bookingService.js    - Bookings
services/ratingService.js     - Ratings
services/locationService.js   - Live location
services/chatService.js       - In-app chat
functions/index.js            - Cloud Functions
firestore.rules               - Security rules
```

---

## NPM Packages Needed

### Client-side
```json
{
  "firebase": "^10.7.1"
}
```

### React Native
```bash
npm install firebase
npx expo install expo-location expo-notifications
```

### Cloud Functions
```json
{
  "firebase-admin": "^11.11.1",
  "firebase-functions": "^4.5.0",
  "nodemailer": "^6.9.7"
}
```

---

## Security Rules Reminder

```
✓ Users can only edit own data
✓ Drivers edit own rides
✓ Riders edit own bookings
✓ Ratings locked after creation
✓ Location updates by driver only
```

---

## Cloud Function Triggers

```
onCreate(rating)    → updateAvgRating
onCreate(booking)   → notifyDriverOnBooking
onUpdate(ride)      → notifyRideFull, handleCancellation
Schedule (5min)     → rideReminder
Schedule (daily)    → cleanupOldRides
```

---

## Testing Checklist

- [ ] Create user
- [ ] Login user
- [ ] Create ride
- [ ] Search rides
- [ ] Book seat
- [ ] Cancel booking
- [ ] Rate user
- [ ] Send chat message
- [ ] Update location
- [ ] Receive notification

---

## Production Checklist

- [ ] Update Firebase config
- [ ] Deploy security rules
- [ ] Deploy Cloud Functions
- [ ] Set email credentials
- [ ] Test all features
- [ ] Enable backups
- [ ] Set up monitoring
- [ ] Configure alerts
- [ ] Test notifications
- [ ] Load testing

---

## Quick Troubleshooting

**Permission Denied?**
→ Redeploy security rules

**Function Not Triggering?**
→ Check Firebase Console → Functions → Logs

**Can't Connect?**
→ Check Firebase config in services/firebase.js

**Email Not Sending?**
→ Verify firebase functions:config:get

**Push Not Working?**
→ Check FCM token is saved in user document

---

## Support Resources

- README.md - Complete setup guide
- DEPLOYMENT.md - Deployment walkthrough
- API_REFERENCE.md - Full API docs
- Firebase Docs - firebase.google.com/docs

---

## Pro Tips

1. Always wrap async calls in try-catch
2. Unsubscribe from listeners on unmount
3. Cache frequently accessed data
4. Use transactions for critical operations
5. Validate inputs client-side first
6. Monitor Firebase Console regularly
7. Keep Firebase SDKs updated
8. Test on real devices
9. Handle offline scenarios
10. Log errors for debugging

---

**Save this cheat sheet for quick reference!**
