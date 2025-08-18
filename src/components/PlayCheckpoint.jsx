import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, initCsrf } from "../ApiClient";

export default function PlayCheckpoint() {
  const { huntId, checkpointId } = useParams(); // e.x., /play/:huntId/checkpoints/:checkpointId
  const navigate = useNavigate();

  const [answer, setAnswer] = useState("");
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [geoErr, setGeoErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { wasCorrect, attemptsUsed, attemptsRemaining }
  const [error, setError] = useState("");

  // load checkpoint details for title/riddle display
  const [checkpoint, setCheckpoint] = useState(null);

  // replace this with the real userHuntId we get after the player joins a hunt
  const [userHuntId, setUserHuntId] = useState(() => {
    // If we already have it in auth/store, pull from there instead.
    const fromStorage = localStorage.getItem("userHuntId");
    return fromStorage ? Number(fromStorage) : null;
  });

  // Get current location (one-shot)
  const getLocation = () => {
    setGeoErr("");
    if (!("geolocation" in navigator)) {
      setGeoErr("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
      },
      (err) => {
        setGeoErr(err?.message || "Failed to get your location.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    getLocation(); // grab location on mount
  }, []);

  // auto-join the hunt if we don't have a userHuntId yet
  useEffect(() => {
    (async () => {
      try {
        if (!userHuntId) {
          await initCsrf(); // ensure CSRF cookie
          const { data } = await api.post(`/hunts/${huntId}/join`, {});
          if (data?.userHuntId) {
            localStorage.setItem("userHuntId", String(data.userHuntId));
            setUserHuntId(Number(data.userHuntId));
          }
        }
      } catch (e) {
        // non-blocking: user might not be logged in yet; submission will guard
        console.warn("join failed (non-blocking):", e?.response?.data || e?.message);
      }
    })();
  }, [huntId, userHuntId]);

  // load the hunt to get this checkpoint's title/riddle
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/hunts/${huntId}`);
        const cp = (data?.checkpoints || []).find((c) => String(c.id) === String(checkpointId));
        if (!cp) throw new Error("Checkpoint not found");
        if (alive) setCheckpoint(cp);
      } catch (e) {
        if (alive) setError(e?.response?.data?.error || e.message || "Failed to load checkpoint");
      }
    })();
    return () => {
      alive = false;
    };
  }, [huntId, checkpointId]);

  async function submitAttempt(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!userHuntId) {
      setError("You must join this hunt before attempting checkpoints.");
      return;
    }
    if (!answer.trim()) {
      setError("Please enter an answer.");
      return;
    }
    if (coords.lat == null || coords.lng == null) {
      setError("We need your location to verify proximity.");
      return;
    }

    try {
      setSubmitting(true);
      await initCsrf(); // fetch CSRF token if not already set
      const { data } = await api.post(`/play/checkpoints/${checkpointId}/attempt`, {
        userHuntId,
        answer: answer.trim(),
        // align with backend: use attemptLat/attemptLng
        attemptLat: coords.lat,
        attemptLng: coords.lng,
      });

      setResult({
        wasCorrect: !!data?.wasCorrect,
        attemptsUsed: data?.attemptsUsed ?? null,
        attemptsRemaining: data?.attemptsRemaining ?? null,
      });

      // navigation on success to next checkpoint or finish
      if (data?.wasCorrect) {
        setAnswer("");
        if (data?.finished) {
          // replace with a dedicated finish screen if/when you add it
          navigate(`/hunts/${huntId}`);
        } else if (data?.nextCheckpointId) {
          navigate(`/play/${huntId}/checkpoints/${data.nextCheckpointId}`);
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Submission failed.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="play-wrap" style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h2>{checkpoint?.title || "Checkpoint"}</h2>
      {checkpoint?.riddle && <p style={{ opacity: 0.95 }}>{checkpoint.riddle}</p>}

      <div style={{ opacity: 0.85, marginBottom: 8 }}>
        Hunt: <code>{huntId || "unknown"}</code> · Checkpoint: <code>{checkpointId}</code>
      </div>

      <div style={{ margin: "12px 0" }}>
        <strong>Location:</strong>{" "}
        {coords.lat != null && coords.lng != null
          ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
          : "Locating…"}
        <button
          type="button"
          onClick={getLocation}
          className="btn"
          style={{ marginLeft: 10 }}
          disabled={submitting}
        >
          Retry GPS
        </button>
        {geoErr && <div style={{ color: "#ffdddd", marginTop: 6 }}>{geoErr}</div>}
      </div>

      <form onSubmit={submitAttempt} style={{ display: "grid", gap: 10 }}>
        <label>
          Your Answer
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer"
            className="input"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8 }}
          />
        </label>

        <button type="submit" className="btn cta" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Attempt"}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: 12, color: "#ffd6d6", fontWeight: 700 }}>{error}</div>
      )}

      {result && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 10,
            background: result.wasCorrect ? "#1e7a46" : "#7a2b2b",
            color: "white",
            fontWeight: 800,
          }}
        >
          {result.wasCorrect ? "✅ Correct! " : "❌ Not quite."}
          {typeof result.attemptsUsed === "number" && (
            <>
              {" "}Attempts used: {result.attemptsUsed}
              {result.attemptsRemaining != null && ` · Remaining: ${result.attemptsRemaining}`}
            </>
          )}
        </div>
      )}
    </div>
  );
}
