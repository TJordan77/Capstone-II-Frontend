import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, initCsrf } from "../ApiClient";
import "./PlayCheckpoint.css";
/* Map component */
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

  // checkpoint metadata for title/riddle/map
  const [checkpoint, setCheckpoint] = useState(null); // {id,title,riddle,lat,lng,toleranceRadius,order,sequenceIndex,huntId}
  const [loadingCp, setLoadingCp] = useState(true);
  const [cpErr, setCpErr] = useState("");

  // distance + anchor UX
  const [distMeters, setDistMeters] = useState(null);
  const [anchoring, setAnchoring] = useState(false);
  const [anchorErr, setAnchorErr] = useState("");

  // Badge unlock modal state
  const [unlockedBadges, setUnlockedBadges] = useState([]);

  const joined =
    !!localStorage.getItem("userHuntId") ||
    localStorage.getItem(`joined:hunt:${huntRef}`) === "1";

  // Helpers
  const watcher = useRef(null);

  // Flat-earth distance (fine for small radii)
  function metersBetween(lat1, lng1, lat2, lng2) {
    if (
      !Number.isFinite(lat1) ||
      !Number.isFinite(lng1) ||
      !Number.isFinite(lat2) ||
      !Number.isFinite(lng2)
    )
      return null;
    const dLat = (lat2 - lat1) * 111_111;
    const dLng =
      (lng2 - lng1) * 111_111 * Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  function startWatch() {
    // avoid stacked geolocation watchers on retry
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

  // Load checkpoint details
  useEffect(() => {
    let ignore = false;
    setLoadingCp(true);
    setCpErr("");
    setCheckpoint(null);

    (async () => {
      try {
        const res = await api.get(`/play/checkpoints/${checkpointId}`);
        if (ignore) return;

        const data = res?.data ?? {};
        const cp = data.checkpoint ?? data;

        if (!cp || !cp.id) {
          setCpErr("Failed to load checkpoint.");
          setCheckpoint(null);
        } else {
          setCheckpoint(cp);
          // If backend already provides these, fast-path them
          if (cp.huntTitle) setHuntTitle(cp.huntTitle);
          if (Number.isFinite(cp.checkpointCount))
            setTotalCheckpoints(cp.checkpointCount);
        }
      } catch (e) {
        setCpErr(e?.response?.data?.error || "Failed to load checkpoint.");
        setCheckpoint(null);
      } finally {
        if (!ignore) setLoadingCp(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [checkpointId]);

  // Fetch hunt title / checkpoint count once checkpoint.huntId is known
  useEffect(() => {
    let ignore = false;
    (async () => {
      const id = checkpoint?.huntId;
      if (!id) return;
      try {
        const res = await api.get(`/hunts/${id}`);
        if (ignore) return;
        const h = res?.data?.hunt ?? res?.data ?? null;
        setHuntTitle(h?.title || "");
        const count =
          h?.checkpointCount ??
          (Array.isArray(h?.checkpoints) ? h.checkpoints.length : null);
        setTotalCheckpoints(
          typeof count === "number" && Number.isFinite(count) ? count : null
        );
      } catch {
        if (ignore) return;
        setHuntTitle("");
        setTotalCheckpoints(null);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [checkpoint?.huntId]);

  // Live distance to checkpoint (if it exists)
  useEffect(() => {
    if (!checkpoint?.lat || !checkpoint?.lng) {
      setDistMeters(null);
      return;
    }
    const d = metersBetween(lat, lng, checkpoint.lat, checkpoint.lng);
    setDistMeters(Number.isFinite(d) ? Math.round(d) : null);
  }, [lat, lng, checkpoint?.lat, checkpoint?.lng]);

  // Tutorial detection (for any CP in the tutorial hunt)
  const isTutorial =
    (huntTitle || "").toLowerCase().includes("tutorial") ||
    String(huntRef || "").toLowerCase().includes("tutorial");

  // Anchor to player's current GPS (works for any tutorial CP; backend re-bases neighbors when far)
  async function anchorCheckpoint({ force = false, forceNeighbors = true } = {}) {
    setAnchorErr("");
    if (!isTutorial) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setAnchorErr("Need a GPS fix first.");
      return;
    }
    try {
      setAnchoring(true);
      await initCsrf();
      const userHuntId = localStorage.getItem("userHuntId") || null;
      const res = await api.post(`/play/checkpoints/${checkpoint.id}/anchor`, {
        lat,
        lng,
        userHuntId,
        force,
        forceNeighbors, // let backend rebase CP2/CP3 too when far
      });
      const cp = res?.data?.checkpoint;
      if (cp && Number.isFinite(cp.lat) && Number.isFinite(cp.lng)) {
        setCheckpoint((prev) => (prev ? { ...prev, ...cp } : prev));
        setStatus("✅ Tutorial anchored to your location.");
      }
    } catch (e) {
      setAnchorErr(e?.response?.data?.error || e?.message || "Failed to anchor.");
    } finally {
      setAnchoring(false);
    }
  }

  // Auto-anchor once if: tutorial AND (coords missing OR distance > 1000m) AND we have a GPS fix
  useEffect(() => {
    if (!isTutorial) return;
    const noCoords =
      !Number.isFinite(checkpoint?.lat) || !Number.isFinite(checkpoint?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return; // no GPS yet
    if (noCoords || (Number.isFinite(distMeters) && distMeters > 1000)) {
      anchorCheckpoint({ forceNeighbors: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTutorial, checkpoint?.lat, checkpoint?.lng, lat, lng, distMeters]);

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

        // Show badge unlocks if any
        if (Array.isArray(data.awardedBadges) && data.awardedBadges.length > 0) {
          setUnlockedBadges(data.awardedBadges);
          // auto-hide after 3 seconds
          setTimeout(() => setUnlockedBadges([]), 3000);
        }

        const nextId =
          data.nextCheckpointId ??
          data.nextCheckpoint?.id ??
          data.unlockNextCheckpointId ??
          null;

        if (nextId) {
          setTimeout(
            () => navigate(`/play/${huntRef}/checkpoints/${nextId}`),
            650
          );
        } else {
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
      if (/userHuntId/i.test(msg)) {
        setStatus(
          "You need to start this hunt from its page first. Taking you there…"
        );
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
        {/* use checkpoint title/clue when available */}
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
          Hunt: <strong>{huntTitle || String(huntRef)}</strong> · Checkpoint:{" "}
          <strong>
            {checkpoint?.sequenceIndex ??
              checkpoint?.order ??
              Number(checkpointId)}
          </strong>
          {typeof totalCheckpoints === "number"
            ? ` of ${totalCheckpoints}`
            : ""}
        </p>

        {/* Map only renders when we have a real center (user or checkpoint). No defaults. */}
        <div className="map-wrap" style={{ margin: "12px 0 18px" }}>
          <PlayMap
            userPos={
              Number.isFinite(lat) && Number.isFinite(lng)
                ? { lat, lng }
                : null
            }
            checkpointPos={
              Number.isFinite(checkpoint?.lat) && Number.isFinite(checkpoint?.lng)
                ? { lat: checkpoint.lat, lng: checkpoint.lng }
                : null
            }
            radius={checkpoint?.toleranceRadius ?? checkpoint?.tolerance ?? 35}
          />
        </div>

        <div className="gps-row" style={{ alignItems: "center", gap: 12 }}>
          <div className="gps">
            Location:{" "}
            {Number.isFinite(lat) && Number.isFinite(lng)
              ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
              : "waiting…"}
            {Number.isFinite(distMeters) && Number.isFinite(checkpoint?.lat) && Number.isFinite(checkpoint?.lng)
              ? ` · You are ~${distMeters}m away`
              : ""}
          </div>

          <button type="button" className="btn ghost" onClick={startWatch}>
            Retry GPS
          </button>

          {/* Anchor button for ANY Tutorial CP when coords missing OR far away */}
          {isTutorial &&
            (
              (!Number.isFinite(checkpoint?.lat) || !Number.isFinite(checkpoint?.lng)) ||
              (Number.isFinite(distMeters) && distMeters > 200)
            ) && (
              <button
                type="button"
                className="btn"
                onClick={() => anchorCheckpoint({ forceNeighbors: true })}
                disabled={anchoring || !Number.isFinite(lat) || !Number.isFinite(lng)}
                title="Snap this tutorial checkpoint (and neighbors) to your current location"
              >
                {anchoring ? "Anchoring…" : "Anchor to my location"}
              </button>
            )}
        </div>
        {gpsErr ? <div className="hint error">{gpsErr}</div> : null}
        {anchorErr ? <div className="hint error">{anchorErr}</div> : null}

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

        {/* Simple badge unlock display */}
        {unlockedBadges.length > 0 && (
          <div className="badge-unlock-modal">
            {unlockedBadges.map((b, idx) => (
              <div key={idx} className="badge-unlock">
                🎉 New badge unlocked! (id: {b.badgeId})
              </div>
            ))}
          </div>
        )}

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
