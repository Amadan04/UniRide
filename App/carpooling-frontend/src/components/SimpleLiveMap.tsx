import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  lat: number;
  lng: number;
}

interface SimpleLiveMapProps {
  driverLocation: Location | null;
  pickup?: string;
  destination?: string;
  pickupCoords?: Location;
  destinationCoords?: Location;
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#22d3ee" stroke="#0891b2" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2 L12 12 L17 12" fill="none" stroke="#0891b2" stroke-width="2"/>
      </svg>
    `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Custom pickup icon (green)
const pickupIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981" stroke="#ffffff" stroke-width="2">
        <circle cx="12" cy="12" r="8"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">P</text>
      </svg>
    `),
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

// Custom destination icon (red)
const destinationIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" stroke-width="2">
        <circle cx="12" cy="12" r="8"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">D</text>
      </svg>
    `),
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

// Component to update map center when driver moves
const MapUpdater: React.FC<{ center: Location }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), {
      animate: true,
      duration: 1,
    });
  }, [center.lat, center.lng, map]);
  return null;
};

export const SimpleLiveMap: React.FC<SimpleLiveMapProps> = ({
  driverLocation,
  pickupCoords,
  destinationCoords,
  pickup,
  destination,
}) => {
  const defaultCenter: Location = { lat: 26.4207, lng: 50.0888 }; // Dammam
  const center = driverLocation || defaultCenter;

  return (
    <>
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
        {/* OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Update map center when driver moves */}
        {driverLocation && <MapUpdater center={driverLocation} />}

        {/* Driver Marker */}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>
              <span>
                🚗 <strong>Driver Location</strong>
                <br />
                Live tracking active
              </span>
            </Popup>
          </Marker>
        )}

        {/* Pickup Marker */}
        {pickupCoords && (
          <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon}>
            <Popup>
              <span>
                📍 <strong>Pickup Point</strong>
                <br />
                {pickup}
              </span>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destinationCoords && (
          <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={destinationIcon}>
            <Popup>
              <span>
                🎯 <strong>Destination</strong>
                <br />
                {destination}
              </span>
            </Popup>
          </Marker>
        )}

        {/* Route Line (Pickup → Destination) */}
        {pickupCoords && destinationCoords && (
          <Polyline
            positions={[
              [pickupCoords.lat, pickupCoords.lng],
              [destinationCoords.lat, destinationCoords.lng],
            ]}
            color="#22d3ee"
            weight={4}
            opacity={0.7}
          />
        )}

        {/* Driver → Destination Line */}
        {driverLocation && destinationCoords && (
          <Polyline
            positions={[
              [driverLocation.lat, driverLocation.lng],
              [destinationCoords.lat, destinationCoords.lng],
            ]}
            color="#10b981"
            weight={3}
            opacity={0.5}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </>
  );
};