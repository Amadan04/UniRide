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
- User ratings and reviews system
- Gender-based ride filtering
- Verified driver profiles

### 🚙 **Ride Management**
- **Create Rides** (Drivers)
  - Multi-pickup point support
  - Schedule-based suggestions
  - Flexible seat management
  
- **Join Rides** (Riders)
  - Smart filters
  - Real-time availability
  - Custom pickup locations
  - Schedule conflict detection

### 💬 **Real-time Features**
- In-app chat with typing indicators
- Live GPS tracking during rides
- Interactive maps
- System notifications

### 🤖 **AI Assistant**
- GPT-4 powered chatbot
- Context-aware responses
- Ride recommendations
- Natural language queries

### 📅 **Schedule Integration**
- Upload class schedules
- Automatic conflict detection
- Smart ride matching

### 🏆 **Gamification**
- Carpool score system
- Achievement badges (10 unique)
- Weekly leaderboard
- Environmental impact tracking

---

## 🛠️ Tech Stack

**Frontend:** React + TypeScript + Vite + TailwindCSS + Framer Motion  
**Backend:** Firebase (Auth, Firestore, Realtime DB, Storage)  
**AI:** OpenRouter API (GPT-4)  
**Maps:** React Leaflet + Google Maps API

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase account
- Git

### Installation

\`\`\`bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/SWEN360.git
cd SWEN360/App/carpooling-frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your Firebase credentials

# Run development server
npm run dev
# Opens at http://localhost:5173
\`\`\`

---

## 🔧 Environment Setup

Create \`App/carpooling-frontend/.env\`:

\`\`\`env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your-project.firebasedatabase.app
VITE_OPENROUTER_API_KEY=your_openrouter_key
\`\`\`

**Get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable Auth, Firestore, Realtime DB, Storage
4. Copy config from Project Settings

---

## 📁 Project Structure

\`\`\`
SWEN360/
├── App/
│   ├── carpooling-frontend/     # React + TypeScript app
│   │   ├── src/
│   │   │   ├── components/      # UI components
│   │   │   ├── pages/           # Page components
│   │   │   ├── services/        # Business logic
│   │   │   └── firebase.js      # Firebase config
│   │   ├── .env.example         # Environment template
│   │   └── package.json         # Dependencies
│   │
│   └── carpooling-backend/      # Backend services
│       ├── services/
│       ├── functions/
│       └── firestore.rules      # Security rules
│
└── README.md
\`\`\`

---

## 🎯 Key Features Details

### Score System
\`\`\`javascript
score = (ridesJoined×5 + ridesCreated×8 + 
         passengersCarried×3 + fuelSaved×10 + 
         co2Saved×3) / 6
\`\`\`

### Environmental Impact
\`\`\`javascript
fuelSaved (L) = distance (km) / 14
co2Saved (kg) = fuelSaved × 2.31
moneySaved = fuelSaved × 0.20 BHD
\`\`\`

### Badges (10 Total)
🏆 Trusted Driver | 🌿 Eco Driver | ⭐ Veteran Driver  
🎓 Campus Hero | ⏰ On-Time Driver | 🚗 Active Rider  
♻️ Eco Rider | 👥 Community Rider | 🌍 Green Student | ⚡ Fast Booker

---

## 📦 Deployment

### Vercel (Frontend)
\`\`\`bash
npm install -g vercel
cd App/carpooling-frontend
vercel
# Add environment variables in Vercel dashboard
\`\`\`

### Firebase (Backend)
\`\`\`bash
cd App/carpooling-backend/functions
firebase deploy --only functions
firebase deploy --only firestore:rules,database:rules
\`\`\`

---

## 🔒 Security

✅ All secrets in environment variables  
✅ Firestore security rules enforced  
✅ Realtime DB rules for live features  
✅ Authentication required for all operations  

⚠️ **Never commit .env files**  
⚠️ **Never hardcode API keys**

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (\`git checkout -b feature/Feature\`)
3. Commit changes (\`git commit -m 'Add Feature'\`)
4. Push to branch (\`git push origin feature/Feature\`)
5. Open Pull Request

---

## 📄 License

University coursework project - SWEN360

---

## 🙏 Acknowledgments

Firebase | OpenRouter | OpenStreetMap | React | Vite | TailwindCSS

---

**Built with ❤️ for the university community**
