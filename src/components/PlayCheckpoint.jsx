import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, initCsrf } from "../ApiClient";

export default function Play() {
  const { idOrSlug, checkpointId } = useParams();
  const navigate = useNavigate();

  const [answer, setAnswer] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [gpsErr, setGpsErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const joined =
    !!localStorage.getItem("userHuntId") ||
    localStorage.getItem(`joined:hunt:${idOrSlug}`) === "1";

  // Get a location fix
  const watcher = useRef(null);
  function startWatch() {
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
  }, [idOrSlug, checkpointId]);

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
        huntRef: idOrSlug,
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
            () => navigate(`/play/${idOrSlug}/checkpoints/${nextId}`),
            650
          );
        }
      } else {
        setStatus(data.message || "❌ Not quite. Try again!");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to submit attempt.";
      setStatus(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="play-page">
      <div className="play-card">
        <h1 className="play-title">Ready, Set, Start!</h1>
        <p className="play-sub">
          You’re already here. Type <strong>ready</strong> to begin your SideQuest.
          <br />
          Hunt: <strong>{String(idOrSlug)}</strong> · Checkpoint:{" "}
          <strong>{String(checkpointId)}</strong>
        </p>

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
