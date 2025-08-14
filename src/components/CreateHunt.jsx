import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CreateHunt.css";

/* ==== Leaflet (interactive map) ==== */
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

import { api, ensureCsrf } from "../ApiClient";

const DEFAULT_CENTER = [40.7128, -74.006]; // NYC-ish

function MapClicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function MiniMapPreview({ coords }) {
  const [latRaw, lngRaw] = coords;
  const lat = Number.isFinite(latRaw) ? latRaw : DEFAULT_CENTER[0];
  const lng = Number.isFinite(lngRaw) ? lngRaw : DEFAULT_CENTER[1];
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;

  return (
    <MapContainer
      key={key}
      center={[lat, lng]}
      zoom={15}
      className="mini-leaflet"
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      zoomControl={false}
      keyboard={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]} />
    </MapContainer>
  );
}

function MapModal({ open, initial, onUse, onClose }) {
  const [picked, setPicked] = useState(initial ?? DEFAULT_CENTER);
  if (!open) return null;

  return (
    <div className="map-modal-overlay" role="dialog" aria-modal="true">
      <div className="map-modal">
        <button
          type="button"
          className="map-close"
          aria-label="Close map"
          onClick={onClose}
        >
          ×
        </button>

        <MapContainer center={picked} zoom={14} className="map-canvas" scrollWheelZoom>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <MapClicker onPick={setPicked} />
          <Marker position={picked} />
        </MapContainer>

        <div className="map-actions">
          <div className="coords-readout">
            Lat: {picked[0].toFixed(6)} · Lng: {picked[1].toFixed(6)}
          </div>
          <div className="map-actions-right">
            <button type="button" className="btn ghost-lg" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn cta" onClick={() => onUse(picked)}>
              Use this location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateHunt() {
  // ----- NEW: multiple checkpoints state -----
  const emptyCp = () => ({
    title: "",
    riddle: "",
    answer: "",
    tolerance: "25",
    lat: "",
    lng: "",
  });

  const [checkpoints, setCheckpoints] = useState([emptyCp()]);

  // ADDED Hunt-level state so we can post these values
  const [hunt, setHunt] = useState({
    title: "",
    description: "",
    endsAt: "",
    maxPlayers: "",
    visibility: "public",
    coverUrl: "",
  });  

  const setField = (k) => (e) => setHunt((h) => ({ ...h, [k]: e.target.value })); // [ADDED]
  const [submitting, setSubmitting] = useState(false); // [ADDED]
  const navigate = useNavigate();

  // modal control per checkpoint
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  const openMap = (i) => {
    setModalIndex(i);
    setIsMapOpen(true);
  };
  const closeMap = () => setIsMapOpen(false);

  // ----- helpers -----
  const updateCp = (i, patch) =>
    setCheckpoints((cps) => cps.map((cp, idx) => (idx === i ? { ...cp, ...patch } : cp)));

  const useMyLocation = (i) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updateCp(i, {
          lat: Number(latitude).toFixed(6),
          lng: Number(longitude).toFixed(6),
        });
      },
      () => {}
    );
  };

  const addCheckpoint = () => {
    setCheckpoints((cps) => [...cps, emptyCp()]);
    // Optionally scroll to new block
    setTimeout(() => {
      const el = document.querySelector(`.checkpoint-block[data-idx="${checkpoints.length}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleUseLocationFromMap = ([lat, lng]) => {
    updateCp(modalIndex, { lat: lat.toFixed(6), lng: lng.toFixed(6) });
    closeMap();
  };

  // ADDED very small validator (kept minimal to avoid breakages)
  function validate(h, cps) {
    if (!h.title.trim()) return "Hunt name is required";
    if (!Array.isArray(cps) || cps.length === 0) return "Add at least one checkpoint";
    for (const cp of cps) {
      if (!cp.title.trim() || !cp.riddle.trim() || !cp.answer.trim()) {
        return "Each checkpoint needs a title, riddle, and answer";
      }
      if (!cp.lat || !cp.lng) return "Each checkpoint needs coordinates";
    }
    return null;
  }

  // ADDED in submit handler: posts to /api/hunts, then navigates
  async function handleSubmit(e) {
    e.preventDefault();

    const err = validate(hunt, checkpoints);
    if (err) {
      alert(err);
      return;
    }

    const payload = {
      title: hunt.title.trim(),
      description: hunt.description.trim(),
      endsAt: hunt.endsAt ? new Date(hunt.endsAt).toISOString() : null,
      maxPlayers: hunt.maxPlayers ? Number(hunt.maxPlayers) : null,
      visibility: hunt.visibility,
      coverUrl: hunt.coverUrl || null,
      checkpoints: checkpoints.map((cp, idx) => ({
        order: idx + 1,
        title: cp.title.trim(),
        riddle: cp.riddle.trim(),
        answer: cp.answer.trim(),
        lat: Number(cp.lat),
        lng: Number(cp.lng),
        tolerance: Number(cp.tolerance || 25),
      })),
    };

    try {
      setSubmitting(true);
      await ensureCsrf(); // fetch CSRF token once
      const { data } = await api.post("/hunts", payload);
      const id = data?.id || data?.hunt?.id;
      navigate(id ? `/hunts/${id}` : "/"); 
    } catch (e2) {
      console.error(e2);
      alert(e2?.response?.data?.error || "Failed to create hunt"); // minimal UX
    } finally {
      setSubmitting(false);
    }
  }


  // initial center for modal taken from the checkpoint currently being edited
  const current = checkpoints[modalIndex] ?? emptyCp();
  const initialForMap =
    current.lat !== "" && current.lng !== ""
      ? [parseFloat(current.lat), parseFloat(current.lng)]
      : DEFAULT_CENTER;

  return (
    <div className="create-page">
      <div
        className="create-bg"
        style={{ backgroundImage: 'url("/background.png")' }}
        aria-hidden="true"
      />

      <header className="create-brand">
        <img src="/whitelogo2.png" alt="SideQuest logo" className="create-logo" />
        <h1 className="create-wordmark">SIDEQUEST</h1>
      </header>

      <main className="create-card" role="main">
        <h2 className="create-title">Create a Hunt</h2>

        <form className="create-form" onSubmit={handleSubmit}>
          {/* ===== Hunt Info ===== */}
          <div className="field span-2">
            <label>
              Hunt Name <span className="req">*</span>
            </label>
            <input
              placeholder="e.g. Downtown Dash"
              value={hunt.title} 
              onChange={setField("title")} 
            />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              rows={3}
              placeholder="What should players expect?"
              value={hunt.description}  
              onChange={setField("description")}
            />
          </div>

          <div className="field">
            <label>
              Ends At <span className="req">*</span>
            </label>
            <input
              type="datetime-local"           
              value={hunt.endsAt}              
              onChange={setField("endsAt")}   
              placeholder="MM / DD"
            />
          </div>

          <div className="field">
            <label>Max Players</label>
            <input
              inputMode="numeric"             
              placeholder="Optional"
              value={hunt.maxPlayers}           
              onChange={setField("maxPlayers")}
            />
          </div>

          <div className="field">
            <label>Visibility</label>
            <select
              value={hunt.visibility}         
              onChange={setField("visibility")} 
            >
              <option value="public">Public (anyone can join)</option>
              <option value="private">Private (invite only)</option>
              <option value="unlisted">Unlisted (link only)</option>
            </select>
          </div>

          <div className="field">
            <label>Cover Image URL</label>
            <input
              placeholder="/images/cover.jpg"
              value={hunt.coverUrl}            
              onChange={setField("coverUrl")} 
            />
          </div>

          {/* ===== Checkpoint Header + Add ===== */}
          <div className="section-row">
            <h3 className="section-title">Checkpoints ({checkpoints.length})</h3>
            <button type="button" className="btn add-checkpoint" onClick={addCheckpoint}>
              <span className="plus" aria-hidden>+</span> Add Checkpoint
            </button>
          </div>

          {/* ===== Checkpoint Blocks (repeatable) ===== */}
          {checkpoints.map((cp, i) => {
            const latNum = parseFloat(cp.lat);
            const lngNum = parseFloat(cp.lng);
            const mapCoords =
              Number.isFinite(latNum) && Number.isFinite(lngNum)
                ? [latNum, lngNum]
                : DEFAULT_CENTER;

            return (
              <div className="checkpoint-block" data-idx={i} key={i}>
                {/* Left: fields */}
                <div className="cp-fields">
                  <div className="field">
                    <label>
                      Title <span className="req">*</span>
                    </label>
                    <input
                      placeholder="e.g. Library Steps"
                      value={cp.title}
                      onChange={(e) => updateCp(i, { title: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <label>
                      Riddle / Clue <span className="req">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Write a clue players must solve on-site"
                      value={cp.riddle}
                      onChange={(e) => updateCp(i, { riddle: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <label>
                      Answer <span className="req">*</span>
                    </label>
                    <input
                      placeholder="Expected answer"
                      value={cp.answer}
                      onChange={(e) => updateCp(i, { answer: e.target.value })}
                    />
                  </div>

                  <div className="inline-3">
                    <div className="field">
                      <label>
                        Latitude <span className="req">*</span>
                      </label>
                      <input
                        placeholder="40.712800"
                        value={cp.lat}
                        onChange={(e) => updateCp(i, { lat: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>
                        Longitude <span className="req">*</span>
                      </label>
                      <input
                        placeholder="-74.006000"
                        value={cp.lng}
                        onChange={(e) => updateCp(i, { lng: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>
                        Tolerance (m) <span className="req">*</span>
                      </label>
                      <input
                        placeholder="25"
                        value={cp.tolerance}
                        onChange={(e) => updateCp(i, { tolerance: e.target.value })}
                      />
                    </div>
                  </div>

                  <button type="button" className="btn subtle" onClick={() => useMyLocation(i)}>
                    <span className="pin" aria-hidden>📍</span> Use My Location
                  </button>
                </div>

                {/* Right: map preview + arrows */}
                <div className="map-col">
                  <div
                    role="button"
                    tabIndex={0}
                    className="mini-map"
                    aria-label="Open map to pick location"
                    onClick={() => openMap(i)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openMap(i); }}
                  >
                    <MiniMapPreview coords={mapCoords} />
                  </div>

                  <div className="arrows">
                    <button type="button" className="arrow" aria-label="Move checkpoint up" disabled={i === 0}
                      onClick={() =>
                        setCheckpoints((cps) => {
                          if (i === 0) return cps;
                          const next = [...cps];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          return next;
                        })
                      }>
                      ▲
                    </button>
                    <button
                      type="button"
                      className="arrow"
                      aria-label="Move checkpoint down"
                      disabled={i === checkpoints.length - 1}
                      onClick={() =>
                        setCheckpoints((cps) => {
                          if (i === cps.length - 1) return cps;
                          const next = [...cps];
                          [next[i], next[i + 1]] = [next[i + 1], next[i]];
                          return next;
                        })
                      }
                    >
                      ▼
                    </button>
                    {/* REMOVE BUTTON directly under the mini map */}  
                    {checkpoints.length > 1 && (
                        <button
                        type="button"
                        className="btn danger-sm remove-checkpoint"
                        onClick={() =>
                            setCheckpoints((cps) => cps.filter((_, idx) => idx !== i))
                        }
                        >
                        ✕ Remove Checkpoint
                        </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* ===== Actions ===== */}
          <div className="actions-row">
            <div className="left" />
            <div className="right">
              <Link to="/" className="btn ghost-lg">Cancel</Link>
              <button type="submit" className="btn cta" disabled={submitting}>{submitting ? "Creating…" : "Create Hunt"}</button>
            </div>
          </div>
        </form>
      </main>

      {/* Map Modal (controlled for the active checkpoint) */}
      <MapModal
        open={isMapOpen}
        initial={initialForMap}
        onUse={handleUseLocationFromMap}
        onClose={closeMap}
      />
    </div>
  );
}

