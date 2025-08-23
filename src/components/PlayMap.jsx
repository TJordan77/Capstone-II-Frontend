import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/** Checkpoint pin (one and only pin on the map) */
const cpIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

/** User dot (pulsing circular div icon, never a pin) */
const userDotIcon = L.divIcon({
  className: "sq-user-dot",
  html: '<span class="sq-user-dot__pulse"></span>',
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

/* Renders a map ONLY when we have a real center (checkpoint OR user). */
export default function PlayMap({ userPos, checkpointPos, radius = 25, style }) {
  // Prefer centering on checkpoint, else user. No default coordinates.
  const center = checkpointPos || userPos || null;

  if (!center) {
    // Waiting placeholder
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
            "repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6 10px,#eef0f3 10px,#eef0f3 20px)",
          ...style,
        }}
      >
        <span style={{ color: "#6b7280", fontSize: 14 }}>Waiting for GPS…</span>
      </div>
    );
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={16}
      style={{
        width: "100%",
        height: 280,
        borderRadius: 12,
        overflow: "hidden",
        ...style,
      }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Checkpoint: single pin + tolerance circle */}
      {checkpointPos && (
        <>
          <Marker
            key="cp"
            position={[checkpointPos.lat, checkpointPos.lng]}
            icon={cpIcon}
            zIndexOffset={200}
          />
          <Circle
            center={[checkpointPos.lat, checkpointPos.lng]}
            radius={Number(radius) || 25}
            pathOptions={{ weight: 2, fillOpacity: 0.1 }}
          />
        </>
      )}

      {/* User: pulsing dot (never a pin) */}
      {userPos && (
        <Marker
          key="user"
          position={[userPos.lat, userPos.lng]}
          icon={userDotIcon}
          interactive={false}
          zIndexOffset={400}
        />
      )}

      <FitBounds userPos={userPos} checkpointPos={checkpointPos} />
    </MapContainer>
  );
}
