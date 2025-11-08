# 🚀 Deployment Guide - University Carpooling Backend

Complete step-by-step guide to deploy your carpooling app backend to Firebase.

## 📋 Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] Firebase account created
- [ ] Firebase CLI installed globally (`npm install -g firebase-tools`)
- [ ] React Native (Expo) project ready
- [ ] Gmail account for email notifications (optional)

## 🔧 Step-by-Step Deployment

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enter project name: `university-carpooling`
4. Enable Google Analytics (optional)
5. Click "Create Project"

### 2. Enable Firebase Services

#### A. Authentication
1. Go to **Authentication** → **Get Started**
2. Click **Sign-in method** tab
3. Enable **Email/Password** provider
4. Save

#### B. Firestore Database
1. Go to **Firestore Database** → **Create database**
2. Start in **production mode**
3. Choose location (closest to your users)
4. Click **Enable**

#### C. Realtime Database
1. Go to **Realtime Database** → **Create database**
2. Start in **locked mode**
3. Choose location
4. Click **Enable**

#### D. Storage (Optional - for profile pictures)
1. Go to **Storage** → **Get Started**
2. Start in **production mode**
3. Click **Done**

#### E. Cloud Functions (Requires Blaze Plan)
1. Go to **Functions** → **Get Started**
2. Upgrade to **Blaze Plan** (pay-as-you-go)
   - Don't worry: Firebase has a generous free tier
   - Most startups stay within free limits
3. Click **Continue**

### 3. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Web** icon (</>)
4. Register app name: `carpooling-web`
5. Copy the `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "university-carpooling.firebaseapp.com",
  projectId: "university-carpooling",
  storageBucket: "university-carpooling.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  databaseURL: "https://university-carpooling-default-rtdb.firebaseio.com"
};
```

### 4. Configure Your Backend Code

1. Open `services/firebase.js`
2. Replace the firebaseConfig with your actual values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
};
```

3. Save the file

### 5. Install Dependencies

```bash
# Navigate to project root
cd carpooling-backend

# Install client-side dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

### 6. Initialize Firebase CLI

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select these services:
# ✓ Firestore
# ✓ Realtime Database
# ✓ Functions
# ✓ Storage (optional)

# Follow the prompts:
# - Use an existing project: Select your project
# - Firestore rules: firestore.rules
# - Firestore indexes: firestore.indexes.json (default)
# - Database rules: database.rules.json
# - Functions language: JavaScript
# - ESLint: No
# - Install dependencies: Yes
```

### 7. Deploy Security Rules

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Realtime Database security rules
firebase deploy --only database

# Verify deployment in Firebase Console
```

### 8. Configure Email Notifications

#### Option A: Gmail (Recommended for testing)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate App Password:
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select app: "Mail"
   - Select device: "Other" → Enter "Carpooling App"
   - Copy the 16-character password

3. Set Firebase config:
```bash
firebase functions:config:set email.user="your.email@gmail.com"
firebase functions:config:set email.password="your-app-password"
```

#### Option B: SendGrid (Recommended for production)

1. Sign up at [SendGrid](https://sendgrid.com)
2. Get API key
3. Update `functions/index.js` transporter:

```javascript
const emailTransporter = nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: functions.config().sendgrid.apikey
  }
});
```

4. Set config:
```bash
firebase functions:config:set sendgrid.apikey="YOUR_SENDGRID_API_KEY"
```

### 9. Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:notifyDriverOnBooking

# Monitor deployment
# Check Firebase Console → Functions for status
```

### 10. Test Your Backend

#### A. Test Authentication

Create a test file `test.js`:

```javascript
const { createUser, loginUser } = require('./index');

async function testAuth() {
  try {
    // Create user
    const user = await createUser({
      email: 'test@test.com',
      password: 'test123456',
      name: 'Test User',
      phone: '+1234567890',
      role: 'driver'
    });
    console.log('✅ User created:', user.user.uid);

    // Login
    const loggedIn = await loginUser('test@test.com', 'test123456');
    console.log('✅ Login successful:', loggedIn.user.name);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAuth();
```

Run test:
```bash
node test.js
```

#### B. Test in Firebase Console

1. Go to **Authentication** → **Users**
   - You should see your test user

2. Go to **Firestore Database** → **users**
   - You should see user document with all fields

3. Go to **Functions** → **Logs**
   - Monitor function executions

### 11. Integrate with React Native

In your React Native (Expo) project:

```bash
# Install Firebase
npm install firebase

# Copy the entire backend folder
cp -r carpooling-backend /path/to/your/react-native-app/src/backend
```

Use in your app:

```javascript
// src/services/auth.js
import { createUser, loginUser, logoutUser } from '../backend';

export const signup = async (email, password, name, phone, role) => {
  try {
    const result = await createUser({ email, password, name, phone, role });
    return result;
  } catch (error) {
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const result = await loginUser(email, password);
    return result;
  } catch (error) {
    throw error;
  }
};
```

### 12. Setup Push Notifications (React Native)

```bash
# Install Expo notifications
npx expo install expo-notifications expo-device expo-constants
```

```javascript
// src/utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { updateFCMToken } from '../backend';

export async function registerForPushNotifications(userID) {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push notification permissions');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    
    // Save to Firebase
    await updateFCMToken(userID, token);
    
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
```

### 13. Production Checklist

Before launching:

#### Security
- [ ] Review and test all security rules
- [ ] Enable Firebase App Check
- [ ] Set up rate limiting in Cloud Functions
- [ ] Remove all test accounts
- [ ] Enable audit logging

#### Performance
- [ ] Create Firestore composite indexes for queries
- [ ] Enable Firestore caching in app
- [ ] Optimize Cloud Function memory allocation
- [ ] Set appropriate timeout values

#### Monitoring
- [ ] Enable Firebase Performance Monitoring
- [ ] Set up Crashlytics
- [ ] Configure alerting for errors
- [ ] Set budget alerts for Firebase billing

#### Backup
- [ ] Enable automated Firestore backups
- [ ] Export important configuration
- [ ] Document all environment variables

#### Email
- [ ] Switch to production email service (SendGrid/AWS SES)
- [ ] Set up email templates
- [ ] Configure SPF/DKIM records
- [ ] Test all email notifications

### 14. Monitoring & Maintenance

#### Daily
- Check Firebase Console → Functions → Logs
- Monitor authentication errors
- Review Cloud Function execution counts

#### Weekly
- Check Firebase Console → Usage and billing
- Review Crashlytics reports
- Check database query performance

#### Monthly
- Review security rules audit logs
- Update Firebase SDKs to latest versions
- Archive old data (handled automatically by cleanupOldRides function)
- Review and optimize costs

### 15. Troubleshooting Common Issues

#### "Permission Denied" Errors
```bash
# Redeploy security rules
firebase deploy --only firestore:rules
firebase deploy --only database
```

#### Cloud Functions Not Triggering
```bash
# Check logs
firebase functions:log

# Redeploy specific function
firebase deploy --only functions:notifyDriverOnBooking

# Check function status in console
# Firebase Console → Functions
```

#### "Billing account not configured"
- Upgrade to Blaze plan in Firebase Console
- Add payment method

#### Email Not Sending
```bash
# Check configuration
firebase functions:config:get

# Update email config
firebase functions:config:set email.user="new-email@gmail.com"

# Redeploy functions
firebase deploy --only functions
```

### 16. Scaling Considerations

#### When You Reach 10,000+ Users

1. **Implement Caching**
   - Use Redis for frequently accessed data
   - Cache user profiles and ratings client-side

2. **Optimize Queries**
   - Create composite indexes for complex queries
   - Implement pagination everywhere
   - Use Cloud Functions for heavy computations

3. **Split Functions**
   - Separate functions by trigger type
   - Use Cloud Tasks for delayed operations
   - Implement function chaining for complex workflows

4. **Database Sharding**
   - Consider splitting data by region
   - Use subcollections for large datasets
   - Archive old data to separate collections

### 17. Cost Optimization

#### Free Tier Limits (As of 2024)
- **Firestore:** 1GB storage, 50K reads/day, 20K writes/day
- **Realtime DB:** 1GB storage, 10GB bandwidth/month
- **Functions:** 2M invocations/month, 400K GB-seconds
- **Authentication:** Unlimited

#### Optimization Tips
1. Use Firestore wisely - cache on client
2. Batch writes where possible
3. Limit real-time listeners
4. Clean up old location data
5. Use scheduled functions instead of real-time triggers where possible

### 18. Support Resources

- **Firebase Docs:** https://firebase.google.com/docs
- **Status Page:** https://status.firebase.google.com
- **Stack Overflow:** Tag questions with `firebase`
- **Discord:** Firebase Community Discord
- **GitHub Issues:** For SDK bugs

### 19. Emergency Rollback

If something goes wrong after deployment:

```bash
# Rollback functions
firebase functions:log --only notifyDriverOnBooking
# Find previous version in logs, then:
firebase deploy --only functions --force

# Rollback security rules
# Go to Firebase Console → Firestore → Rules → History
# Select previous version → Publish
```

### 20. Success Metrics

After deployment, track:
- User signup conversion rate
- Average rides created per driver
- Booking success rate
- User retention (7-day, 30-day)
- Average rating scores
- Function execution times
- Error rates

---

## 🎉 Deployment Complete!

Your carpooling backend is now live on Firebase. Users can:
- ✅ Sign up and login
- ✅ Create and search rides
- ✅ Book seats
- ✅ Track live location
- ✅ Chat in-app
- ✅ Rate each other
- ✅ Receive notifications

## 📞 Next Steps

1. Build your React Native frontend
2. Test with real users
3. Gather feedback
4. Iterate and improve
5. Scale as you grow

Happy coding! 🚀
