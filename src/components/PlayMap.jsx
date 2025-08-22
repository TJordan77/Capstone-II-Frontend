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

/**
 * Renders a map ONLY when we have a center (checkpoint OR user).
 * - No default fallback center.
 * - Shows one checkpoint pin (if provided) and one user pin (if provided).
 */
export default function PlayMap({ userPos, checkpointPos, radius = 25, style }) {
  // Decide center: prefer checkpoint (if set), else user
  const center = checkpointPos || userPos || null;

  if (!center) {
    // No GPS yet and no checkpoint: show a lightweight placeholder
    return (
      <div
        style={{
          width: "100%",
          height: 280,
          borderRadius: 12,
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          background:
            "repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 10px, #eef0f3 10px, #eef0f3 20px)",
          ...style,
        }}
      >
        <span style={{ color: "#6b7280", fontSize: 14 }}>
          Waiting for GPS…
        </span>
      </div>
    );
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={15}
      style={{ width: "100%", height: 280, borderRadius: 12, overflow: "hidden", ...style }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {checkpointPos && (
        <>
          <Marker position={[checkpointPos.lat, checkpointPos.lng]} icon={cpIcon} />
          <Circle
            center={[checkpointPos.lat, checkpointPos.lng]}
            radius={Number(radius) || 25}
          />
        </>
      )}
      {userPos && <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />}
      <FitBounds userPos={userPos} checkpointPos={checkpointPos} />
    </MapContainer>
  );
}
