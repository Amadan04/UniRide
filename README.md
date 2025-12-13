# 🚗 UniRide - University Carpooling & Ride Sharing Platform

> A secure, feature-rich carpooling platform designed exclusively for university students to share rides, reduce costs, and build community.

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.5.0-orange.svg)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-38B2AC.svg)](https://tailwindcss.com/)

---

## ✨ Features

### 🔐 **Authentication & Safety**
- University email verification
- Role-based access (Driver/Rider)
- **Dynamic role switching** - Switch between driver and rider modes
- User ratings and reviews system
- **Smart profanity filter** - Context-aware content moderation
- Gender-based ride filtering
- Verified driver profiles

### 🚙 **Ride Management**
- **Create Rides** (Drivers)
  - Multi-pickup point support
  - Schedule-based suggestions
  - Flexible seat management
  - 2-hour cancellation window enforcement

- **Join Rides** (Riders)
  - Smart filters (date, destination, cost, gender, university)
  - Real-time seat availability
  - Custom pickup locations
  - Schedule conflict detection
  - Booking cancellation with time restrictions

### 💬 **Real-time Features**
- In-app chat with typing indicators
- **Profanity-filtered messaging** - Keeps conversations respectful
- Live GPS tracking during rides
- Interactive maps with route visualization
- System notifications
- Real-time ride status updates
- Auto-completion of rides 2 hours after scheduled time

### 🤖 **AI Assistant**
- GPT-4 powered chatbot
- Context-aware responses
- Ride recommendations
- Natural language queries

### 📅 **Schedule Integration**
- Upload class schedules
- Automatic conflict detection
- Smart ride matching

### 🏆 **Gamification & Analytics**
- Carpool score system with multiple factors
- Achievement badges (10 unique achievements)
- **Weekly leaderboard** with automatic reset every 7 days
- Environmental impact tracking (CO₂, fuel, money saved)
- **Public user profiles** with stats and reviews
- Progress tracking and level system

### 🎨 **Theme Customization**
- **Dual theme system** - Neon (vibrant gradients) & Clean (minimalist)
- Light/Dark mode support for both themes
- Cross-device preference sync
- Persistent theme settings via Firebase
- Theme-aware components across all pages

---

## 🛠️ Tech Stack

**Frontend:** React 18 + TypeScript + Vite + TailwindCSS + Framer Motion
**Backend:** Firebase (Authentication, Firestore, Realtime Database, Storage)
**AI:** OpenRouter API (GPT-4)
**Maps:** React Leaflet + Leaflet.js + Google Maps API
**3D Graphics:** Three.js + React Three Fiber
**Animations:** Framer Motion + GSAP

---

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (version 18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (version 9.0.0 or higher) - comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Firebase Account** (free tier works) - [Sign up](https://console.firebase.google.com/)
- **OpenRouter API Key** (optional, for AI assistant) - [Get key](https://openrouter.ai/keys)

To verify installations:
```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 9.0.0 or higher
git --version   # Any recent version
```

---

## 🚀 Complete Setup Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/Amadan04/SWEN360.git
cd SWEN360
```

### Step 2: Set Up Firebase

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" or "Create a project"
   - Enter project name (e.g., "uniride-app")
   - Disable Google Analytics (optional)
   - Click "Create project"

2. **Enable Required Services:**
   - **Authentication:**
     - Go to Build → Authentication → Get Started
     - Click "Email/Password" → Enable → Save

   - **Firestore Database:**
     - Go to Build → Firestore Database → Create database
     - Select "Start in test mode" (for development)
     - Choose your region
     - Click "Enable"

   - **Realtime Database:**
     - Go to Build → Realtime Database → Create database
     - Select "Start in test mode"
     - Click "Enable"

   - **Storage:**
     - Go to Build → Storage → Get Started
     - Start in test mode → Done

3. **Get Firebase Configuration:**
   - Go to Project Settings (⚙️ icon) → General
   - Scroll down to "Your apps"
   - Click the Web icon (`</>`)
   - Register app with nickname "UniRide Web"
   - Copy the `firebaseConfig` object values

### Step 3: Configure Frontend Environment

```bash
# Navigate to frontend directory
cd App/carpooling-frontend

# Copy environment template
cp .env.example .env

# Edit .env file with your credentials
# On Windows: notepad .env
# On Mac/Linux: nano .env
```

**Edit `.env` file with your Firebase config:**
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

# Optional: For AI Assistant feature
VITE_OPENROUTER_API_KEY=sk-or-v1-...
```

### Step 4: Install Dependencies

```bash
# Make sure you're in App/carpooling-frontend
npm install
```

This will install all required packages (~150 dependencies):
- React, React DOM, React Router
- Firebase SDK
- TypeScript and type definitions
- Vite build tool
- TailwindCSS
- Framer Motion, GSAP (animations)
- Three.js, React Three Fiber (3D graphics)
- Leaflet (maps)
- Lucide React (icons)

**Expected installation time:** 2-5 minutes depending on internet speed.

### Step 5: Run Development Server

```bash
npm run dev
```

**Expected output:**
```
VITE v5.4.2  ready in 790 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Open your browser and navigate to:** `http://localhost:5173`

> **Note:** If port 5173 is already in use, Vite will automatically use the next available port (5174, 5175, etc.)

### Step 6: Create Your First Account

1. Click "Sign Up" on the auth page
2. Enter your email and password
3. Choose your role (Driver or Rider)
4. Check your email for verification link (may take 1-2 minutes)
5. Click the verification link
6. Log in with your credentials

---

## 🏗️ Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

Build output will be in `App/carpooling-frontend/dist/`

---

## 📁 Project Structure

```
SWEN360/
├── App/
│   ├── carpooling-frontend/          # Main React Application
│   │   ├── src/
│   │   │   ├── components/           # Reusable UI components
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── SplashScreen.tsx
│   │   │   │   ├── FloatingChatButton.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── pages/                # Page components (16 pages)
│   │   │   │   ├── HomePage.tsx
│   │   │   │   ├── AuthPage.tsx
│   │   │   │   ├── CreateRidePage.tsx
│   │   │   │   ├── JoinRidePage.tsx
│   │   │   │   ├── ActivityPage.tsx
│   │   │   │   ├── ChatPage.tsx
│   │   │   │   ├── ProfilePage.tsx
│   │   │   │   ├── LeaderboardPage.tsx
│   │   │   │   ├── UserStatsPage.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── services/             # Business logic
│   │   │   │   └── scoreService.ts   # Scoring, badges, stats
│   │   │   │
│   │   │   ├── context/              # React Context providers
│   │   │   │   ├── AuthContext.tsx
│   │   │   │   ├── ToastContext.tsx
│   │   │   │   └── UIThemeContext.tsx
│   │   │   │
│   │   │   ├── utils/                # Utility functions
│   │   │   │   └── profanityFilter.ts
│   │   │   │
│   │   │   ├── themes/               # Theme system
│   │   │   │   ├── ThemedPages.tsx
│   │   │   │   └── newUI/
│   │   │   │
│   │   │   ├── animations/           # Animation configs
│   │   │   ├── router/               # Route protection
│   │   │   ├── firebase.js           # Firebase configuration
│   │   │   ├── App.tsx               # Main app component
│   │   │   └── main.tsx              # Entry point
│   │   │
│   │   ├── public/                   # Static assets
│   │   ├── .env.example              # Environment template
│   │   ├── .gitignore                # Git ignore rules
│   │   ├── package.json              # Dependencies & scripts
│   │   ├── vite.config.ts            # Vite configuration
│   │   ├── tsconfig.json             # TypeScript config
│   │   └── tailwind.config.js        # TailwindCSS config
│   │
│   └── carpooling-backend/           # Backend services
│       ├── .env.example              # Backend env template
│       ├── functions/                # Firebase Cloud Functions
│       └── firestore.rules           # Security rules
│
├── docs/                             # Documentation
├── .gitignore                        # Root gitignore
├── package.json                      # Root package (test scripts)
└── README.md                         # This file
```

---

## 🎯 Key Features Implementation Details

### Weekly Leaderboard Reset
- Automatically resets every 7 days
- Checks on leaderboard page load
- Recalculates weekly scores based on last 7 days of activity
- Preserves lifetime stats (only weekly scores reset)
- Timestamp tracking: `stats.lastWeeklyReset`

### Ride Cancellation Rules
- **Riders:** Can cancel bookings more than 2 hours before ride time
- **Drivers:** Can cancel rides anytime (with passenger notification)
- Automatic seat return on cancellation
- Stats adjusted on cancellation
- Auto-completion: Rides automatically complete 2 hours after scheduled time

### Rating & Review System
- Only riders can rate completed rides
- Duplicate rating prevention via query
- Reviews include: rating (1-5 stars), comment, ride route, date
- Profanity filter applied to review comments
- Reviews displayed publicly on user profile pages
- Average rating calculation with weighted scoring

### Role Switching
Users can switch between driver and rider roles:
1. Navigate to Profile page
2. Click "Switch to Driver/Rider" button
3. System validates no active rides exist
4. Role updated in Firebase
5. UI updates dynamically
6. Available in both theme systems

### Smart Profanity Filter
Context-aware content moderation:
- **Location:** `src/utils/profanityFilter.ts`
- Allows mild words in normal contexts (bad, terrible, damn, hell)
- Blocks severe profanity, hate speech, harassment
- Word boundary detection prevents false positives
- Applied to: chat messages, ride reviews
- Returns structured validation: `{ isProfane: boolean, message: string }`

### Score Calculation Formula
```javascript
// Overall Score (0-100)
score = Math.min(100, (
  ridesJoined × 5 +
  ridesCreated × 8 +
  passengersCarried × 3 +
  fuelSaved × 10 +
  co2Saved × 3
) / 6)

// Environmental Impact
fuelSaved (L) = totalDistance (km) / 14     // 14 km/L average
co2Saved (kg) = fuelSaved × 2.31            // 2.31 kg CO₂ per liter
moneySaved (BHD) = fuelSaved × 0.20         // 0.20 BHD per liter
```

### Achievement Badges (10 Total)

**Driver Badges:**
- 🏆 **Trusted Driver:** 5+ successful rides created
- 🌿 **Eco Driver:** Saved over 10kg of CO₂
- ⭐ **Veteran Driver:** Created 20+ rides
- 🎓 **Campus Hero:** Carried 10+ passengers in a week
- ⏰ **On-Time Driver:** Consistently punctual (10+ rides)

**Rider Badges:**
- 🚗 **Active Rider:** Joined 5+ rides
- ♻️ **Eco Rider:** Saved over 5kg of CO₂
- 👥 **Community Rider:** Joined 10+ unique rides
- 🌍 **Green Student:** Traveled 15+ km via carpool
- ⚡ **Fast Booker:** Quickly joined 3+ rides

---

## 📦 Available Scripts

In the `App/carpooling-frontend` directory:

```bash
# Development
npm run dev          # Start dev server (http://localhost:5173)

# Production
npm run build        # Build for production (output: dist/)
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

---

## 🔧 Troubleshooting

### Issue: "Firebase: Error (auth/configuration-not-found)"
**Solution:**
- Ensure `.env` file exists in `App/carpooling-frontend/`
- Verify all `VITE_FIREBASE_*` variables are set correctly
- Restart dev server: `Ctrl+C` then `npm run dev`

### Issue: Build fails with "Cannot find module"
**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 5173 already in use
**Solution:**
- Vite will automatically use next available port (5174, 5175, etc.)
- Or manually kill the process using port 5173

### Issue: "Module not found: Can't resolve 'firebase'"
**Solution:**
```bash
npm install firebase@12.5.0
```

### Issue: TypeScript errors on build
**Solution:**
```bash
# Run type checking
npm run typecheck

# If errors persist, check tsconfig.json
```

### Issue: Map not displaying
**Solution:**
- Check internet connection (Leaflet tiles require internet)
- Verify Firebase Realtime Database is enabled
- Check browser console for errors

### Issue: Chat messages not sending
**Solution:**
- Verify Firebase Realtime Database rules allow read/write
- Check Firebase Realtime Database URL in `.env`
- Ensure user is authenticated

---

## 🔒 Security Best Practices

✅ **Environment Variables:** All secrets stored in `.env` (not committed to Git)
✅ **Firebase Rules:** Firestore and Realtime DB security rules enforced
✅ **Authentication:** All operations require valid authentication
✅ **Input Validation:** Profanity filter, email validation, data sanitization
✅ **HTTPS Only:** Production deployment uses HTTPS

⚠️ **Important Reminders:**
- **NEVER** commit `.env` files to Git
- **NEVER** hardcode API keys in source code
- **ALWAYS** use environment variables for secrets
- Enable Firebase Security Rules before production deployment

---

## 📊 Firestore Database Collections

```
users/                          # User profiles
  ├── uid: string
  ├── name: string
  ├── email: string
  ├── role: 'driver' | 'rider'
  ├── avgRating: number
  └── stats: {
      ridesJoined, ridesCreated, passengersCarried,
      totalDistanceKm, fuelSaved, co2Saved, moneySaved,
      score, weeklyScore, badges[], lastUpdated
    }

rides/                          # All rides
  ├── rideID: string
  ├── driverID: string
  ├── driverName: string
  ├── pickup: string
  ├── destination: string
  ├── date: string
  ├── time: string
  ├── cost: number
  ├── seatsAvailable: number
  ├── passengers: array
  └── status: 'active' | 'completed' | 'cancelled'

bookings/                       # Ride bookings
  ├── bookingID: string
  ├── rideID: string
  ├── riderID: string
  ├── riderName: string
  ├── seatsBooked: number
  └── status: 'active' | 'cancelled'

ratings/                        # User ratings & reviews
  ├── ratingID: string
  ├── fromUserID: string
  ├── toUserID: string
  ├── rideID: string
  ├── rating: number (1-5)
  ├── comment: string
  └── createdAt: timestamp
```

---

## 🌐 Deployment

### Vercel (Frontend - Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd App/carpooling-frontend
vercel

# Follow prompts, then add environment variables in Vercel dashboard
```

### Firebase Hosting (Alternative)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting
firebase init hosting

# Deploy
firebase deploy --only hosting
```

**Important:** Add all environment variables in your hosting platform's dashboard.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

University Project - Educational Use Only

---

## 👨‍💻 Authors

**SWEN360 Project Team**


---

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- React Three Fiber for 3D graphics
- Leaflet.js for mapping functionality
- OpenRouter for AI capabilities
- University of Bahrain for project inspiration

---

## 📞 Support

For issues, questions, or contributions:
- Open an issue on [GitHub](https://github.com/Amadan04/SWEN360/issues)
- Check the [Troubleshooting](#-troubleshooting) section
- Review Firebase Console logs for backend errors

---

