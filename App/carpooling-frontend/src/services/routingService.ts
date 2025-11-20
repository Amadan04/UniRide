/**
 * OSRM Routing Service
 *
 * Provides routing capabilities using the free OSRM API
 * Falls back to straight-line distance if OSRM fails
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteSegment {
  distance: number; // meters
  duration: number; // seconds
  geometry: LatLng[]; // polyline coordinates
}

export interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  geometry: LatLng[]; // full route polyline
  legs?: RouteSegment[]; // individual segments for multi-stop
}

const OSRM_API_URL = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Haversine formula for straight-line distance
 */
function calculateHaversineDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

/**
 * Decode OSRM polyline geometry (polyline6 format)
 */
function decodePolyline(encoded: string, precision: number = 6): LatLng[] {
  const factor = Math.pow(10, precision);
  const coordinates: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    // Decode latitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const latChange = result & 1 ? ~(result >> 1) : result >> 1;
    lat += latChange;

    shift = 0;
    result = 0;

    // Decode longitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const lngChange = result & 1 ? ~(result >> 1) : result >> 1;
    lng += lngChange;

    coordinates.push({
      lat: lat / factor,
      lng: lng / factor
    });
  }

  return coordinates;
}

/**
 * Get route between two points
 */
export async function getRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult> {
  try {
    const url = `${OSRM_API_URL}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=polyline6`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('OSRM API request failed');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];

    return {
      distance: route.distance, // meters
      duration: route.duration, // seconds
      geometry: decodePolyline(route.geometry)
    };
  } catch (error) {
    console.warn('OSRM routing failed, falling back to straight line:', error);

    // Fallback to straight line
    const distance = calculateHaversineDistance(origin, destination);

    return {
      distance,
      duration: distance / 13.89, // Assume ~50 km/h average speed
      geometry: [origin, destination]
    };
  }
}

/**
 * Get route with multiple waypoints (multi-pickup)
 */
export async function getMultiStopRoute(
  waypoints: LatLng[]
): Promise<RouteResult> {
  if (waypoints.length < 2) {
    throw new Error('At least 2 waypoints required');
  }

  try {
    // Build coordinates string: lng,lat;lng,lat;...
    const coords = waypoints
      .map(point => `${point.lng},${point.lat}`)
      .join(';');

    const url = `${OSRM_API_URL}/${coords}?overview=full&geometries=polyline6&steps=true`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('OSRM API request failed');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];

    // Extract individual leg information
    const legs: RouteSegment[] = route.legs.map((leg: any) => ({
      distance: leg.distance,
      duration: leg.duration,
      geometry: [] // Individual leg geometries not needed for now
    }));

    return {
      distance: route.distance,
      duration: route.duration,
      geometry: decodePolyline(route.geometry),
      legs
    };
  } catch (error) {
    console.warn('OSRM multi-stop routing failed, falling back to straight lines:', error);

    // Fallback: calculate total distance as sum of segments
    let totalDistance = 0;
    const geometry: LatLng[] = [];
    const legs: RouteSegment[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const distance = calculateHaversineDistance(waypoints[i], waypoints[i + 1]);
      totalDistance += distance;

      geometry.push(waypoints[i]);

      legs.push({
        distance,
        duration: distance / 13.89,
        geometry: [waypoints[i], waypoints[i + 1]]
      });
    }

    geometry.push(waypoints[waypoints.length - 1]);

    return {
      distance: totalDistance,
      duration: totalDistance / 13.89,
      geometry,
      legs
    };
  }
}

/**
 * Calculate distance between two points (utility)
 */
export function calculateDistance(point1: LatLng, point2: LatLng): number {
  return calculateHaversineDistance(point1, point2);
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}