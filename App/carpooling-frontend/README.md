# UniCarpool - University Carpooling & Ride-Sharing App

A visually stunning, fully animated React frontend for university carpooling with cinematic 3D effects and smooth transitions.

## Features

- **3D Animated Splash Screen** with rotating sphere and particle effects
- **Glassmorphism Auth Page** with animated backgrounds and floating inputs
- **Ride Creation Page** with card-based forms and success animations
- **Real-time Chat Page** with animated message bubbles
- **Smooth Page Transitions** using Framer Motion
- **GSAP Animations** for hero elements and background effects
- **Three.js 3D Visuals** for immersive experiences
- **Dark Futuristic Theme** with neon glows and gradients
- **Fully Responsive** design for all devices

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for UI animations
- **GSAP** for advanced animations
- **Three.js** & **@react-three/fiber** for 3D graphics
- **React Router** for navigation
- **Firebase** (backend integration ready)

## Project Structure

```
src/
├── pages/
│   ├── AuthPage.jsx          # Login/Signup with glassmorphism
│   ├── CreateRidePage.jsx    # Ride creation form
│   └── ChatPage.jsx          # Real-time chat interface
├── components/
│   ├── SplashScreen.jsx      # 3D animated splash screen
│   ├── AnimatedHeader.jsx    # Navigation header
│   └── Loader.jsx            # Loading animation
├── animations/
│   ├── motionVariants.js     # Framer Motion variants
│   └── gsapAnimations.js     # GSAP animation functions
├── router/
│   └── Routes.jsx            # React Router setup
├── firebase.js               # Firebase service imports
├── App.tsx                   # Main app component
└── index.css                 # Global styles & utilities
```

## Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Your Firebase backend in `../carpooling-backend/` directory

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:5173` (or another available port).

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Routes

- `/` - Authentication (Login/Signup)
- `/ride` - Create Ride
- `/chat` - Chat Interface

## Firebase Integration

This frontend connects to your existing Firebase backend located at `../carpooling-backend/`. It imports services from:

- `authService.js` - Authentication
- `rideService.js` - Ride operations
- `chatService.js` - Real-time chat

Make sure your Firebase backend is properly configured before running the frontend.

## Animations

### Framer Motion
- Page transitions (slide, fade)
- Component entrance animations
- Button hover effects
- Message bubble animations

### GSAP
- Hero title animations
- Background particle motion
- Success checkmark animation
- Parallax effects

### Three.js
- 3D rotating sphere in splash screen
- Particle system
- Ambient lighting effects
- Auto-rotating camera

## Customization

### Colors
The app uses a blue-purple gradient theme. To customize, update the colors in:
- Tailwind config (`tailwind.config.js`)
- Global styles (`src/index.css`)
- Component gradient classes

### Animations
Modify animation variants in:
- `src/animations/motionVariants.js` - Framer Motion
- `src/animations/gsapAnimations.js` - GSAP timelines

### 3D Effects
Customize the splash screen 3D scene in:
- `src/components/SplashScreen.jsx`

## Design Features

- **Glassmorphism** - Frosted glass effect cards
- **Neon Glows** - Blue and purple glowing elements
- **Gradient Buttons** - Smooth color transitions
- **Backdrop Blur** - Modern depth effects
- **Custom Scrollbars** - Themed scrollbar design
- **Responsive Grid** - Mobile-first layout

## Performance

The build is optimized with:
- Code splitting ready (dynamic imports can be added)
- Tree shaking via Vite
- CSS purging via Tailwind
- Optimized 3D rendering with Three.js

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT

## Credits

Built with modern web technologies for an immersive user experience.
