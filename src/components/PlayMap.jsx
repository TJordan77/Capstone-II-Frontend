import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* Basic icons; swap to custom pins later if you want */
const userIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
const cpIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

/* Distinct user dot (divIcon) so it doesn't look like a second checkpoint */
const userDotIcon = L.divIcon({
  className: "user-dot",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FitBounds({ userPos, checkpointPos }) {
  const map = useMap();
  useEffect(() => {
    const pts = [];
    if (checkpointPos) pts.push([checkpointPos.lat, checkpointPos.lng]);
    if (userPos) pts.push([userPos.lat, userPos.lng]);
    if (pts.length === 0) return;
    if (pts.length === 1) map.setView(pts[0], 16);
    else map.fitBounds(L.latLngBounds(pts).pad(0.25));
  }, [map, userPos, checkpointPos]);
  return null;
}

export default function PlayMap({ userPos, checkpointPos, radius = 25 }) {
  const center = checkpointPos || userPos || { lat: 40.7128, lng: -74.006 };
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={15}
      style={{ width: "100%", height: 280, borderRadius: 12, overflow: "hidden" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {checkpointPos && (
        <>
          <Marker position={[checkpointPos.lat, checkpointPos.lng]} icon={cpIcon} />
          <Circle center={[checkpointPos.lat, checkpointPos.lng]} radius={Number(radius) || 25} />
        </>
      )}

      {/* User shown as a pulsing dot + optional accuracy circle (if provided) */}
      {userPos && (
        <>
          {Number.isFinite(userPos.accuracy) && userPos.accuracy > 0 && (
            <Circle
              center={[userPos.lat, userPos.lng]}
              radius={userPos.accuracy}
              pathOptions={{ color: "#2a9df4", weight: 1, fillOpacity: 0.08 }}
            />
          )}
          <Marker position={[userPos.lat, userPos.lng]} icon={userDotIcon} />
        </>
      )}

      <FitBounds userPos={userPos} checkpointPos={checkpointPos} />
    </MapContainer>
  );
}
