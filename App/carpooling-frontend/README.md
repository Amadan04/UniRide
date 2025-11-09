# UniCarpool 🚗

A cinematic, futuristic React-based university carpooling and ride-sharing application with real-time features, 3D animations, and Firebase backend integration.

## Features

### 🎨 Visual Experience
- **Cinematic 3D Splash Screen** with Three.js floating car and particles
- **GSAP & Framer Motion animations** for smooth page transitions
- **Glassmorphism UI** with neon accents and glowing effects
- **Dark/Light mode** support
- **Responsive design** for all devices

### 🚗 Core Functionality
- **Role-based authentication** (Driver/Rider)
- **Ride creation** for drivers with pickup, destination, date, time, seats, and cost
- **Ride discovery** for riders with smart filters (destination, date, cost)
- **Real-time chat** between drivers and passengers
- **Live GPS tracking** with driver location updates
- **Rating & review system** for completed rides
- **Activity dashboard** showing active and completed rides

### 🔐 Authentication
- Firebase Authentication with email/password
- Secure user registration with profile data
- Protected routes based on user roles
- Automatic session management

### 💬 Real-Time Features
- Live chat using Firebase Realtime Database
- Real-time driver location tracking
- Animated message bubbles with smooth transitions

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS
- **Animations**:
  - Framer Motion (page transitions, UI animations)
  - GSAP (hero animations, parallax effects)
  - Three.js + React Three Fiber (3D graphics)
- **Backend**: Firebase
  - Authentication
  - Firestore (rides, users, ratings)
  - Realtime Database (chat, location tracking)
  - Storage (profile images)
- **Icons**: Lucide React
- **Effects**: Canvas Confetti

## Project Structure

\`\`\`
src/
├── animations/           # Animation utilities
│   ├── gsapAnimations.ts
│   └── motionVariants.ts
├── components/          # Reusable components
│   ├── Sidebar.tsx
│   └── SplashScreen.tsx
├── context/            # React context providers
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── pages/              # Page components
│   ├── HomePage.tsx
│   ├── AuthPage.tsx
│   ├── CreateRidePage.tsx
│   ├── JoinRidePage.tsx
│   ├── ChatPage.tsx
│   ├── ProfilePage.tsx
│   ├── ActivityPage.tsx
│   └── MapPage.tsx
├── router/             # Routing utilities
│   └── ProtectedRoute.tsx
├── firebase.js         # Firebase configuration
├── App.tsx            # Main app component
└── main.tsx           # App entry point
\`\`\`

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Firebase Configuration

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Realtime Database
   - Storage

3. Copy your Firebase config and create a \`.env\` file:

\`\`\`env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=your_database_url
\`\`\`

### 3. Firestore Collections

The app uses the following Firestore collections:

#### Users Collection (\`users\`)
\`\`\`javascript
{
  uid: string,
  email: string,
  name: string,
  age: number,
  gender: string,
  university: string,
  role: 'driver' | 'rider',
  rating: number,
  totalRatings: number,
  createdAt: string
}
\`\`\`

#### Rides Collection (\`rides\`)
\`\`\`javascript
{
  driverId: string,
  driverName: string,
  driverRating: number,
  pickup: string,
  destination: string,
  date: string,
  time: string,
  totalSeats: number,
  availableSeats: number,
  cost: number,
  passengers: [{uid: string, name: string, joinedAt: string}],
  status: 'active' | 'completed',
  createdAt: timestamp
}
\`\`\`

#### Ratings Collection (\`ratings\`)
\`\`\`javascript
{
  rideId: string,
  ratedBy: string,
  raterName: string,
  rating: number,
  review: string,
  createdAt: string
}
\`\`\`

### 4. Realtime Database Structure

\`\`\`
chats/
  {rideId}/
    messages/
      {messageId}/
        senderId: string
        senderName: string
        text: string
        timestamp: number

locations/
  {rideId}/
    lat: number
    lng: number
    timestamp: number
\`\`\`

### 5. Run the App

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:5173](http://localhost:5173)

## User Journey

### Driver Flow
1. Sign up as a Driver
2. Create a ride with details
3. View ride in Activity page
4. Chat with passengers
5. Start GPS tracking for live location sharing
6. Complete the ride

### Rider Flow
1. Sign up as a Rider
2. Browse available rides with filters
3. Join a ride
4. Chat with driver and other passengers
5. View live driver location on map
6. Rate and review after ride completion

## Key Features Explained

### 🎬 Cinematic Splash Screen
- 3D car model with floating animation
- Particle system with wireframe cubes
- Auto-rotates and fades out after 4 seconds

### 🔒 Protected Routes
- Authentication required for all main pages
- Role-based access control (driver vs rider)
- Automatic redirect to login if not authenticated

### 💬 Real-Time Chat
- Messages slide in from opposite sides
- Glowing neon message bubbles
- Auto-scroll to latest message
- Timestamp display

### 📍 Live Location Tracking
- Uses browser Geolocation API
- Updates every few seconds
- Stored in Firebase Realtime Database
- Real-time updates for passengers

### ⭐ Rating System
- 5-star rating with visual stars
- Optional text review
- Stored in Firestore
- Updates user's average rating

### 🎨 Animations
- Page transitions with Framer Motion
- GSAP hero animations with glow effects
- Floating shapes on home page
- Button hover and tap effects
- Confetti on ride creation success

## Customization

### Colors
Main color scheme uses cyan/blue gradient. To change:
- Update gradient classes in components (from-cyan-500 to-blue-500)
- Modify border colors (border-cyan-400/30)
- Update glow effects in animations

### Theme
Toggle between dark and light mode using the sidebar button. Themes are persisted in localStorage.

## Production Deployment

### Build for Production
\`\`\`bash
npm run build
\`\`\`

### Deploy to Firebase Hosting
\`\`\`bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
\`\`\`

## Future Enhancements

- [ ] Integrate Google Maps/Mapbox for visual route display
- [ ] Push notifications for ride updates
- [ ] Payment integration
- [ ] Advanced ride matching algorithm
- [ ] Driver verification system
- [ ] Emergency contact features
- [ ] Trip history export
- [ ] Social features (friend requests, favorite drivers)

## Troubleshooting

### Build Warnings
The build may show chunk size warnings due to Three.js and animation libraries. This is normal for development. For production, consider:
- Code splitting with dynamic imports
- Lazy loading pages
- Manual chunk optimization

### Firebase Connection Issues
Ensure:
- All environment variables are set correctly
- Firebase services are enabled in console
- Realtime Database rules allow authenticated read/write
- Firestore rules are properly configured

## License

MIT License - feel free to use this project for your university or personal projects!

## Credits

Built with React, Firebase, Three.js, GSAP, and Framer Motion.
Icons by Lucide React.
