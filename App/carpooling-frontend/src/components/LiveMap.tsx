import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getMultiStopRoute,
  RouteResult,
  formatDistance,
  formatDuration
} from '../services/routingService';
import {
  subscribeToUserLocation,
  LocationData,
  calculateDistance,
  checkGeofenceAlert,
  GeofenceAlert
} from '../services/locationService';

export interface Location {
  lat: number;
  lng: number;
}

export interface Passenger {
  id: string;
  name: string;
  pickupLocation: Location;
  pickupAddress: string;
  status: 'pending' | 'picked_up' | 'completed';
}

interface LiveMapProps {
  rideID: string;
  driverID: string;
  passengers: Passenger[];
  destinationCoords: Location;
  destination: string;
  onPassengerPickedUp?: (passengerID: string) => void;
  onGeofenceAlert?: (alert: GeofenceAlert) => void;
}

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom driver icon (cyan)
const driverIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="#22d3ee" stroke="#0891b2" stroke-width="3">
        <circle cx="20" cy="20" r="18"/>
        <path d="M20 8 L20 20 L28 20" fill="none" stroke="#0891b2" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Custom rider icon (blue)
const riderIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="#3b82f6" stroke="#ffffff" stroke-width="2">
        <circle cx="16" cy="16" r="14"/>
        <circle cx="16" cy="12" r="5" fill="white"/>
        <path d="M8 26 C8 20 24 20 24 26" fill="white"/>
      </svg>
    `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Custom pickup icon (green) with number
const createPickupIcon = (number: number) => new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="#10b981" stroke="#ffffff" stroke-width="2">
        <circle cx="16" cy="16" r="14"/>
        <text x="16" y="21" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${number}</text>
      </svg>
    `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Custom destination icon (red)
const destinationIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="#ef4444" stroke="#ffffff" stroke-width="2">
        <path d="M16 4 L16 28 M4 16 L28 16" stroke="white" stroke-width="4" stroke-linecap="round"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Component to update map view
const MapUpdater: React.FC<{ center: Location; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], zoom || map.getZoom(), {
      animate: true,
      duration: 0.5,
    });
  }, [center.lat, center.lng, zoom, map]);

  return null;
};

// Component to fit bounds to show all markers
const BoundsFitter: React.FC<{ bounds: L.LatLngBounds | null }> = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [bounds, map]);

  return null;
};

export const LiveMap: React.FC<LiveMapProps> = ({
  rideID,
  driverID,
  passengers,
  destinationCoords,
  destination,
  onPassengerPickedUp,
  onGeofenceAlert,
}) => {
  const [driverLocation, setDriverLocation] = useState<LocationData | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [nextStop, setNextStop] = useState<Passenger | null>(null);
  const [distanceToNext, setDistanceToNext] = useState<number>(0);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const alertedPassengers = useRef<Set<string>>(new Set());
  const lastAlertType = useRef<Map<string, string>>(new Map());

  const defaultCenter: Location = { lat: 26.4207, lng: 50.0888 }; // Dammam
  const center = driverLocation || defaultCenter;

  // Get pending passengers
  const pendingPassengers = passengers.filter(p => p.status === 'pending');

  // Calculate route when driver location or passengers change
  useEffect(() => {
    if (!driverLocation) return;

    const calculateRoute = async () => {
      setIsLoadingRoute(true);

      try {
        // Build waypoints: driver -> pending pickups -> destination
        const waypoints: Location[] = [
          { lat: driverLocation.lat, lng: driverLocation.lng }
        ];

        // Add unique pickup locations only (avoid duplicates for single-pickup rides)
        const uniquePickups = new Map<string, Location>();
        pendingPassengers.forEach(passenger => {
          const key = `${passenger.pickupLocation.lat},${passenger.pickupLocation.lng}`;
          if (!uniquePickups.has(key)) {
            uniquePickups.set(key, passenger.pickupLocation);
          }
        });

        // Add unique pickups to waypoints
        uniquePickups.forEach(pickup => {
          waypoints.push(pickup);
        });

        // Add destination
        waypoints.push(destinationCoords);

        // Get route
        const routeResult = await getMultiStopRoute(waypoints);
        setRoute(routeResult);

        // Set next stop
        if (pendingPassengers.length > 0) {
          setNextStop(pendingPassengers[0]);
        } else {
          setNextStop(null);
        }

        // Calculate bounds to fit all markers
        const latLngs: L.LatLng[] = [
          L.latLng(driverLocation.lat, driverLocation.lng)
        ];

        pendingPassengers.forEach(p => {
          latLngs.push(L.latLng(p.pickupLocation.lat, p.pickupLocation.lng));
        });

        latLngs.push(L.latLng(destinationCoords.lat, destinationCoords.lng));

        setBounds(L.latLngBounds(latLngs));
      } catch (error) {
        console.error('Failed to calculate route:', error);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    calculateRoute();
  }, [driverLocation, pendingPassengers.length]);

  // Subscribe to driver location
  useEffect(() => {
    const unsubscribe = subscribeToUserLocation(driverID, (location) => {
      if (location) {
        setDriverLocation(location);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [driverID]);

  // Check geofencing and auto-detect pickups
  useEffect(() => {
    if (!driverLocation || pendingPassengers.length === 0) return;

    pendingPassengers.forEach(passenger => {
      const distance = calculateDistance(
        { lat: driverLocation.lat, lng: driverLocation.lng },
        passenger.pickupLocation
      );

      // Update distance to next stop
      if (nextStop && passenger.id === nextStop.id) {
        setDistanceToNext(distance);
      }

      // Check geofence alerts
      const prevAlertType = lastAlertType.current.get(passenger.id);
      const alert = checkGeofenceAlert(
        { lat: driverLocation.lat, lng: driverLocation.lng },
        passenger.pickupLocation,
        passenger.name,
        prevAlertType
      );

      if (alert && onGeofenceAlert) {
        onGeofenceAlert(alert);
        lastAlertType.current.set(passenger.id, alert.type);
      }

      // Auto-detect pickup completion (within 50m)
      if (distance <= 50 && !alertedPassengers.current.has(passenger.id)) {
        alertedPassengers.current.add(passenger.id);

        // Wait 10 seconds then mark as picked up
        setTimeout(() => {
          if (onPassengerPickedUp) {
            onPassengerPickedUp(passenger.id);
          }
        }, 10000);
      }
    });
  }, [driverLocation, pendingPassengers, nextStop, onGeofenceAlert, onPassengerPickedUp]);

  return (
    <div className="relative">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        zoomControl={true}
        style={{
          height: '600px',
          width: '100%',
          borderRadius: '1rem',
          overflow: 'hidden',
          border: '2px solid rgba(34,211,238,0.3)',
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit bounds on initial load */}
        <BoundsFitter bounds={bounds} />

        {/* Driver Marker */}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-sm">
                <strong className="text-cyan-600">🚗 Driver</strong>
                <br />
                <span className="text-gray-600">Live tracking active</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pending Pickup Markers - Group by location */}
        {(() => {
          // Group passengers by pickup location
          const locationGroups = new Map<string, typeof pendingPassengers>();
          pendingPassengers.forEach(passenger => {
            const key = `${passenger.pickupLocation.lat},${passenger.pickupLocation.lng}`;
            if (!locationGroups.has(key)) {
              locationGroups.set(key, []);
            }
            locationGroups.get(key)!.push(passenger);
          });

          // Render one marker per unique location
          return Array.from(locationGroups.entries()).map(([locationKey, passengersAtLocation], index) => {
            const firstPassenger = passengersAtLocation[0];
            const passengerCount = passengersAtLocation.length;

            return (
              <Marker
                key={locationKey}
                position={[firstPassenger.pickupLocation.lat, firstPassenger.pickupLocation.lng]}
                icon={createPickupIcon(passengerCount)}
              >
                <Popup>
                  <div className="text-sm">
                    <strong className="text-green-600">
                      📍 Pickup Location {passengerCount > 1 ? `(${passengerCount} passengers)` : ''}
                    </strong>
                    <br />
                    <span className="text-gray-600">{firstPassenger.pickupAddress}</span>
                    <br />
                    <br />
                    <strong>Passengers:</strong>
                    <ul className="list-disc pl-4 mt-1">
                      {passengersAtLocation.map(p => (
                        <li key={p.id}>{p.name}</li>
                      ))}
                    </ul>
                    {driverLocation && (
                      <>
                        <br />
                        <span className="text-cyan-600 font-semibold">
                          {formatDistance(calculateDistance(
                            { lat: driverLocation.lat, lng: driverLocation.lng },
                            firstPassenger.pickupLocation
                          ))} away
                        </span>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          });
        })()}

        {/* Destination Marker */}
        <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={destinationIcon}>
          <Popup>
            <div className="text-sm">
              <strong className="text-red-600">🎯 Destination</strong>
              <br />
              <span className="text-gray-600">{destination}</span>
            </div>
          </Popup>
        </Marker>

        {/* Route Polyline */}
        {route && route.geometry && (
          <Polyline
            positions={route.geometry.map(p => [p.lat, p.lng])}
            color="#22d3ee"
            weight={5}
            opacity={0.8}
          />
        )}
      </MapContainer>

      {/* Status Panel Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
        <div className="bg-gray-900/95 backdrop-blur-lg border border-cyan-500/30 rounded-xl p-4 shadow-2xl pointer-events-auto">
          {isLoadingRoute ? (
            <div className="text-cyan-400 text-sm">Calculating route...</div>
          ) : (
            <>
              {nextStop ? (
                <div>
                  <div className="text-cyan-400 text-xs font-semibold mb-1">PICKUP LOCATION</div>
                  <div className="text-white text-lg font-bold">{nextStop.pickupAddress}</div>
                  <div className="text-gray-300 text-sm mt-1">
                    {pendingPassengers.length} passenger{pendingPassengers.length > 1 ? 's' : ''} waiting
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div>
                      <div className="text-cyan-400 text-xs">Distance</div>
                      <div className="text-white font-semibold">{formatDistance(distanceToNext)}</div>
                    </div>
                    {route && (
                      <>
                        <div className="h-8 w-px bg-cyan-500/30"></div>
                        <div>
                          <div className="text-cyan-400 text-xs">Total Route</div>
                          <div className="text-white font-semibold">{formatDistance(route.distance)}</div>
                        </div>
                        <div className="h-8 w-px bg-cyan-500/30"></div>
                        <div>
                          <div className="text-cyan-400 text-xs">ETA</div>
                          <div className="text-white font-semibold">{formatDuration(route.duration)}</div>
                        </div>
                      </>
                    )}
                  </div>
                  {pendingPassengers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-cyan-500/20">
                      <div className="text-gray-400 text-xs font-semibold mb-1">Passengers at this stop:</div>
                      <div className="text-gray-300 text-sm">
                        {pendingPassengers.slice(0, 3).map(p => p.name).join(', ')}
                        {pendingPassengers.length > 3 && ` +${pendingPassengers.length - 3} more`}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-cyan-400 text-xs font-semibold mb-1">HEADING TO</div>
                  <div className="text-white text-lg font-bold">Final Destination</div>
                  <div className="text-gray-300 text-sm mt-1">{destination}</div>
                  {route && driverLocation && (
                    <div className="flex items-center gap-4 mt-3">
                      <div>
                        <div className="text-cyan-400 text-xs">Distance</div>
                        <div className="text-white font-semibold">
                          {formatDistance(calculateDistance(
                            { lat: driverLocation.lat, lng: driverLocation.lng },
                            destinationCoords
                          ))}
                        </div>
                      </div>
                      <div className="h-8 w-px bg-cyan-500/30"></div>
                      <div>
                        <div className="text-cyan-400 text-xs">ETA</div>
                        <div className="text-white font-semibold">{formatDuration(route.duration)}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tracking Status Indicator */}
      {driverLocation && (
        <div className="absolute bottom-4 right-4 z-[1000] pointer-events-none">
          <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm font-semibold">Live</span>
          </div>
        </div>
      )}
    </div>
  );
};