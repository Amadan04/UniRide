# Firestore Index Setup

The Carpool Score System requires composite indexes for optimal performance.

## Required Indexes

### Option 1: Automatic Creation via Console Links
When you see index errors in the console, click the provided Firebase Console links to automatically create the required indexes.

### Option 2: Manual Index Creation

Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Firestore Database → Indexes

Create the following composite indexes:

#### 1. Rides Collection - Driver + CreatedAt
- **Collection**: `rides`
- **Fields**:
  - `driverID` (Ascending)
  - `createdAt` (Ascending)
- **Query Scope**: Collection

#### 2. Bookings Collection - Rider + Status
- **Collection**: `bookings`
- **Fields**:
  - `riderID` (Ascending)
  - `status` (Ascending)
- **Query Scope**: Collection

### Option 3: Deploy via Firebase CLI

If you have Firebase CLI installed:

```bash
firebase deploy --only firestore:indexes
```

This will deploy the indexes defined in `firestore.indexes.json`.

## Why These Indexes Are Needed

- **Rides Index**: Required for calculating weekly stats (filtering rides by driver and date range)
- **Bookings Index**: Required for fetching active bookings by rider

## Note

The app will work without indexes, but queries may be slower and you'll see warnings in the console. The `getWeeklyStats` function now uses client-side filtering as a fallback, so it will work even without the index.