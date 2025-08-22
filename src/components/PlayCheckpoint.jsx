import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, initCsrf } from "../ApiClient";
import "./PlayCheckpoint.css";
/* NEW: lightweight map component */
import PlayMap from "./PlayMap";

export default function Play() {
  const params = useParams();
  const checkpointId = params.checkpointId;
  const huntRef = params.idOrSlug || params.huntId || params.slug || params.id;
  const navigate = useNavigate();

  const [answer, setAnswer] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [gpsErr, setGpsErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [huntTitle, setHuntTitle] = useState("");
  const [totalCheckpoints, setTotalCheckpoints] = useState(null);

  /* NEW: checkpoint metadata for title/riddle/map */
  const [checkpoint, setCheckpoint] = useState(null); // {title,riddle,lat,lng,toleranceRadius,...}
  const [loadingCp, setLoadingCp] = useState(true);
  const [cpErr, setCpErr] = useState("");

  const joined =
    !!localStorage.getItem("userHuntId") ||
    localStorage.getItem(`joined:hunt:${huntRef}`) === "1";

  // Get a location fix
  const watcher = useRef(null);
  function startWatch() {
    /* NEW: avoid stacked geolocation watchers on retry */
    stopWatch();
    setGpsErr("");
    if (!("geolocation" in navigator)) {
      setGpsErr("Geolocation not supported on this device.");
      return;
    }
    watcher.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      (err) => {
        setGpsErr(err.message || "Failed to fetch location.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }
  function stopWatch() {
    if (watcher.current) {
      navigator.geolocation.clearWatch(watcher.current);
      watcher.current = null;
    }
  }

  useEffect(() => {
    startWatch();
    return stopWatch;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [huntRef, checkpointId]);

  /* NEW: fetch checkpoint details (title/riddle/lat/lng/toleranceRadius) */
  useEffect(() => {
  let ignore = false;
  (async () => {
    // Only run when we know which hunt this checkpoint belongs to
    const id = checkpoint?.huntId;
    if (!id) return;

    try {
      // Your app already uses /hunts/:id in HuntPage.jsx
      const res = await api.get(`/hunts/${id}`);
      if (ignore) return;

      // Backend returns either {hunt: {...}} or a flat object; normalize
      const h = res?.data?.hunt ?? res?.data ?? null;
      setHuntTitle(h?.title || "");
      const count =
        h?.checkpointCount ??
        (Array.isArray(h?.checkpoints) ? h.checkpoints.length : null);
      setTotalCheckpoints(
        typeof count === "number" && Number.isFinite(count) ? count : null
      );
    } catch (e) {
      if (ignore) return;
      // Don’t block page on this—fallbacks will kick in
      setHuntTitle("");
      setTotalCheckpoints(null);
    }
  })();
  return () => {
    ignore = true;
  };
}, [checkpoint?.huntId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    if (!answer.trim()) {
      setStatus("Please enter an answer.");
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setStatus("Waiting for GPS fix… tap Retry GPS.");
      return;
    }

    try {
      setSubmitting(true);
      await initCsrf();

      const payload = {
        answer: answer.trim(),
        lat,
        lng,
        userHuntId: localStorage.getItem("userHuntId") || null,
        huntRef: huntRef,
      };

      const res = await api.post(
        `/play/checkpoints/${checkpointId}/attempt`,
        payload
      );

      const data = res?.data || {};
      const correct = data.correct ?? data.wasCorrect ?? false;

      if (correct) {
        setStatus("✅ Correct! Moving to the next checkpoint…");
        const nextId =
          data.nextCheckpointId ??
          data.nextCheckpoint?.id ??
          data.unlockNextCheckpointId ??
          null;

        if (nextId) {
          // tiny pause so users can see success
          setTimeout(
            () => navigate(`/play/${huntRef}/checkpoints/${nextId}`),
            650
          );
        } else {
          // No next checkpoint = finished
          setStatus("🏁 Hunt complete! Great job.");
        }
      } else {
        setStatus(data.message || "❌ Not quite. Try again!");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to submit attempt.";
      /* Optional: helpful redirect if they somehow lost membership */
      if (/userHuntId/i.test(msg)) {
        setStatus("You need to start this hunt from its page first. Taking you there…");
        setTimeout(() => navigate(`/hunts/${huntRef}`), 900);
      } else {
        setStatus(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="play-page">
      <div className="play-card">
        {/* NEW: use checkpoint title/clue when available */}
        <h1 className="play-title">
          {checkpoint?.title || "Ready, Set, Start!"}
        </h1>
        <p className="play-sub">
          {loadingCp
            ? "Loading checkpoint…"
            : cpErr
            ? cpErr
            : checkpoint?.riddle
            ? checkpoint.riddle
            : (
                <>
                  You’re already here. Type <strong>ready</strong> to begin your
                  SideQuest.
                </>
              )}
          <br />
          Hunt: <strong>{String(huntRef)}</strong> · Checkpoint:{" "}
          <strong>{String(checkpointId)}</strong>
        </p>

        {/* NEW: live map with user + checkpoint + tolerance circle */}
        <div className="map-wrap" style={{ margin: "12px 0 18px" }}>
          <PlayMap
            userPos={
              Number.isFinite(lat) && Number.isFinite(lng)
                ? { lat, lng }
                : null
            }
            checkpointPos={
              checkpoint?.lat && checkpoint?.lng
                ? { lat: checkpoint.lat, lng: checkpoint.lng }
                : null
            }
            radius={checkpoint?.toleranceRadius ?? 25}
          />
        </div>

        <div className="gps-row">
          <div className="gps">
            Location:{" "}
            {Number.isFinite(lat) && Number.isFinite(lng)
              ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
              : "waiting…"}
          </div>
          <button type="button" className="btn ghost" onClick={startWatch}>
            Retry GPS
          </button>
        </div>
        {gpsErr ? <div className="hint error">{gpsErr}</div> : null}

        {!joined ? (
          <div className="hint warn">
            You haven’t started the hunt from its page. You can still attempt;
            progress tracking may be limited.
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <label className="label" htmlFor="answer">
            Your Answer
          </label>
          <input
            id="answer"
            type="text"
            className="input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer"
            disabled={submitting}
            autoComplete="off"
          />

          <button
            className="btn primary wide"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit Attempt"}
          </button>
        </form>

        {status ? <div className="status">{status}</div> : null}

        {!joined ? (
          <div className="footnote">
            You must join this hunt before attempting checkpoints.{" "}
            <span style={{ opacity: 0.85 }}>
              (Tip: tap “Start hunt” on the hunt page — we’ll enable full
              tracking. You can still try answers here.)
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
