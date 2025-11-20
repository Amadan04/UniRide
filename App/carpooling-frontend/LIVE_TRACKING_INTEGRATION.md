# Live Tracking System - Integration Guide

## 🚀 Overview

This document explains how to integrate the complete multi-pickup live tracking system into your UniCarpool app.

## 📁 Files Created

### Services
- `src/services/routingService.ts` - OSRM routing with fallback to straight-line
- `src/services/locationService.ts` - Live GPS tracking via Realtime Database

### Components
- `src/components/LiveMap.tsx` - Enhanced map with multi-pickup support
- `src/components/RiderLocationTracker.tsx` - Rider location sharing widget

### Hooks
- `src/hooks/useDriverTracking.ts` - Custom hook for driver GPS tracking

### Pages
- `src/pages/LiveTrackingPage.tsx` - Complete driver tracking page example

---

## 🔧 Integration Steps

### Step 1: Add Route to App.tsx

```typescript
import { LiveTrackingPage } from './pages/LiveTrackingPage';

// Inside your Routes:
<Route
  path="/tracking/:rideID"
  element={
    <ProtectedRoute>
      <LiveTrackingPage />
    </ProtectedRoute>
  }
/>
```

### Step 2: Update Firestore Schema

Add these fields to your ride documents:

```typescript
// In rides collection:
{
  id: string;
  driverID: string;
  pickup: string;
  pickupLat: number;
  pickupLng: number;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  // ... existing fields
}

// In bookings collection:
{
  id: string;
  rideID: string;
  riderID: string;
  status: 'active' | 'completed' | 'cancelled';
  seatsBooked: number;
  // ... existing fields
}
```

### Step 3: Add Realtime Database Rules

In Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "locations": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### Step 4: Request Notification Permissions

Add this to your `ActivityPage.tsx` or `CreateRidePage.tsx`:

```typescript
useEffect(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, []);
```

---

## 📊 How It Works

### Architecture

```
┌─────────────────┐
│   Driver App    │
│                 │
│  1. Gets GPS    │──────┐
│  2. Sends to DB │      │
└─────────────────┘      │
                         │
                         ▼
                ┌────────────────┐
                │  Firebase RTDB │
                │  /locations/   │
                │    /{userID}   │
                └────────────────┘
                         │
                         │
                         ▼
┌─────────────────────────────────────┐
│         LiveMap Component           │
│                                     │
│  1. Subscribes to driver location  │
│  2. Builds waypoints array         │
│  3. Calls OSRM API                 │
│  4. Renders route polyline         │
│  5. Checks geofencing              │
│  6. Auto-detects pickups           │
└─────────────────────────────────────┘
```

### Data Flow

1. **Driver starts tracking** → GPS coordinates sent to `/locations/{driverID}`
2. **LiveMap subscribes** → Listens for real-time updates
3. **Route calculation** → OSRM API called with: driver → pickup1 → pickup2 → destination
4. **Geofencing** → Distance calculated every update
5. **Alerts** → Triggered at 500m (nearby) and 100m (arrived)
6. **Auto-pickup detection** → When driver within 50m for 10 seconds

---

## 🎯 Usage Examples

### Example 1: Basic Live Tracking (Driver View)

```typescript
import { LiveMap, Passenger } from '../components/LiveMap';
import { useDriverTracking } from '../hooks/useDriverTracking';

function MyTrackingPage() {
  const { startTracking, stopTracking } = useDriverTracking(driverID);

  const passengers: Passenger[] = [
    {
      id: 'user1',
      name: 'John Doe',
      pickupLocation: { lat: 26.4207, lng: 50.0888 },
      pickupAddress: 'Dammam University Gate 1',
      status: 'pending'
    },
    {
      id: 'user2',
      name: 'Jane Smith',
      pickupLocation: { lat: 26.4250, lng: 50.0920 },
      pickupAddress: 'Dammam Mall',
      status: 'pending'
    }
  ];

  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, []);

  return (
    <LiveMap
      rideID="ride123"
      driverID={driverID}
      passengers={passengers}
      destinationCoords={{ lat: 26.4300, lng: 50.1000 }}
      destination="King Fahd Airport"
      onPassengerPickedUp={(id) => console.log('Picked up:', id)}
      onGeofenceAlert={(alert) => console.log('Alert:', alert)}
    />
  );
}
```

### Example 2: Rider Location Sharing

```typescript
import { RiderLocationTracker } from '../components/RiderLocationTracker';

function RiderPage() {
  return (
    <div>
      <h1>Your Ride</h1>

      <RiderLocationTracker
        userID={currentUser.uid}
        rideID={rideID}
      />

      {/* Other ride info */}
    </div>
  );
}
```

### Example 3: Manual Route Calculation

```typescript
import { getMultiStopRoute, formatDistance, formatDuration } from '../services/routingService';

async function calculateMyRoute() {
  const waypoints = [
    { lat: 26.4207, lng: 50.0888 }, // Start
    { lat: 26.4250, lng: 50.0920 }, // Pickup 1
    { lat: 26.4280, lng: 50.0950 }, // Pickup 2
    { lat: 26.4300, lng: 50.1000 }  // Destination
  ];

  const route = await getMultiStopRoute(waypoints);

  console.log('Distance:', formatDistance(route.distance)); // "12.5 km"
  console.log('Duration:', formatDuration(route.duration)); // "18 min"
  console.log('Polyline:', route.geometry); // Array of {lat, lng}
}
```

---

## 🔔 Geofencing Alerts

### Alert Types

1. **Nearby** (500m radius)
   - Triggered once when driver enters 500m zone
   - Message: "Approaching {passenger}'s pickup"

2. **Arrived** (100m radius)
   - Triggered once when driver enters 100m zone
   - Message: "You've arrived at {passenger}'s pickup!"

3. **Auto-Pickup** (50m radius)
   - Automatically marks passenger as picked up after 10 seconds
   - Recalculates route without that pickup

### Example Alert Handler

```typescript
function handleGeofenceAlert(alert: GeofenceAlert) {
  if (alert.type === 'nearby') {
    // Show notification
    showToast(`Approaching ${alert.targetName}'s pickup (${Math.round(alert.distance)}m)`);
  } else if (alert.type === 'arrived') {
    // Play sound + vibration
    playArrivalSound();
    navigator.vibrate([200, 100, 200]);
    showToast(`Arrived at ${alert.targetName}'s pickup!`);
  }
}
```

---

## 🗺️ OSRM API Details

### Endpoints Used

1. **Single Route**: `GET /route/v1/driving/{lng},{lat};{lng},{lat}`
2. **Multi-Stop**: `GET /route/v1/driving/{lng},{lat};{lng},{lat};{lng},{lat}`

### Response Format

```json
{
  "code": "Ok",
  "routes": [
    {
      "distance": 12547.3,
      "duration": 891.2,
      "geometry": "encoded_polyline_string",
      "legs": [
        {
          "distance": 5234.1,
          "duration": 342.5
        }
      ]
    }
  ]
}
```

### Fallback Behavior

If OSRM fails:
- Uses Haversine formula for straight-line distance
- Assumes 50 km/h average speed for duration
- Returns simple two-point polyline

---

## 📱 Firebase Realtime Database Structure

```
/locations
  /{userID}
    lat: 26.4207
    lng: 50.0888
    timestamp: 1234567890
    accuracy: 15
```

### Security Rules

```json
{
  "rules": {
    "locations": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid",
        ".validate": "newData.hasChildren(['lat', 'lng', 'timestamp'])"
      }
    }
  }
}
```

---

## 🎨 UI Components Included

### Status Panel (Overlay)
- Next stop name and address
- Distance to next stop
- Total route distance
- ETA calculation
- Remaining pickups counter

### Live Indicator
- Green pulsing dot
- "Live" text
- Bottom-right corner

### Custom Markers
- **Driver**: Cyan circle with compass needle
- **Pickup**: Green circle with number (1, 2, 3...)
- **Destination**: Red crosshair
- **Rider**: Blue person icon

---

## 🐛 Troubleshooting

### Issue: "Location permission denied"
**Solution**: User must allow location in browser settings
```typescript
if (navigator.permissions) {
  navigator.permissions.query({ name: 'geolocation' }).then(result => {
    if (result.state === 'denied') {
      alert('Please enable location access');
    }
  });
}
```

### Issue: OSRM returns no route
**Solution**: Automatic fallback to straight-line is built-in
```typescript
// Already handled in routingService.ts
// Falls back to Haversine distance
```

### Issue: Map not updating
**Solution**: Check Realtime DB connection
```typescript
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../firebase';

const testRef = ref(realtimeDb, '.info/connected');
onValue(testRef, (snapshot) => {
  console.log('Connected:', snapshot.val());
});
```

### Issue: Polyline not showing
**Solution**: Ensure geometry array has valid coordinates
```typescript
console.log('Route geometry:', route.geometry);
// Should be: [{lat: 26.4207, lng: 50.0888}, ...]
```

---

## 📊 Performance Optimization

### Reduce API Calls
```typescript
// Debounce route recalculation
const debouncedCalculate = debounce(calculateRoute, 2000);

useEffect(() => {
  if (driverLocation) {
    debouncedCalculate();
  }
}, [driverLocation]);
```

### Limit Location Updates
```typescript
// In locationService.ts, already configured:
{
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 5000 // Only update if position changed
}
```

### Cache Routes
```typescript
const routeCache = useRef<Map<string, RouteResult>>(new Map());

const getCachedRoute = (waypoints: LatLng[]) => {
  const key = waypoints.map(w => `${w.lat},${w.lng}`).join('|');
  return routeCache.current.get(key);
};
```

---

## 🧪 Testing

### Test with Fake GPS Location

Chrome DevTools → More Tools → Sensors → Geolocation:

```
Dammam University: 26.4207, 50.0888
Dammam Mall: 26.4250, 50.0920
King Fahd Airport: 26.4300, 50.1000
```

### Test Geofencing

Set driver location near pickup:
```typescript
// In browser console:
firebase.database().ref('locations/driverID').set({
  lat: 26.4205, // Very close to pickup
  lng: 50.0887,
  timestamp: Date.now()
});
```

### Test Multi-Pickup

Create multiple test bookings with different pickup coordinates.

---

## 🚦 Production Checklist

- [ ] Firebase Realtime DB rules configured
- [ ] Location permissions requested in UI
- [ ] Notification permissions requested
- [ ] Error handling for denied permissions
- [ ] Fallback for OSRM failures implemented
- [ ] Cleanup functions for location listeners
- [ ] Privacy notice added for riders
- [ ] Testing with real GPS on mobile devices
- [ ] Battery usage optimized (5s update interval)
- [ ] Network error handling for offline mode

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Verify Firebase config in `.env`
3. Test OSRM API manually: `https://router.project-osrm.org/route/v1/driving/50.0888,26.4207;50.1000,26.4300`
4. Check Realtime DB data in Firebase Console

---

## 🎉 Features Implemented

✅ Live driver GPS tracking
✅ Multi-stop routing (OSRM)
✅ Automatic route recalculation
✅ Geofencing alerts (500m, 100m)
✅ Auto-pickup detection (50m)
✅ Real-time status panel
✅ Custom map markers
✅ Distance and ETA calculations
✅ Fallback to straight-line routing
✅ Rider location sharing (optional)
✅ Browser notifications
✅ Error handling for all APIs

---

## 📝 License

This code is part of the UniCarpool project.