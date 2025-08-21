import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, initCsrf } from "../ApiClient";
import "./HuntPage.css";

function isNumeric(v) {
  return typeof v === "string" && /^\d+$/.test(v);
}

export default function HuntPage() {
  // Accept any common param name
  const params = useParams();
  const idOrSlug =
    params.id ?? params.huntId ?? params.idOrSlug ?? params.slug ?? "";

  const navigate = useNavigate();
  const [hunt, setHunt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const ref = String(idOrSlug || "").trim();
        if (!ref) throw new Error("Invalid hunt reference");

        const path = isNumeric(ref) ? `/hunts/${ref}` : `/hunts/slug/${ref}`;
        const res = await api.get(path);
        if (!alive) return;
        if (!res || typeof res.data !== "object") {
          throw new Error("Bad response (not JSON)");
        }
        setHunt(res.data);
        localStorage.setItem("lastHuntRef", ref);
      } catch (e) {
        if (!alive) return;
        const msg =
          e?.response?.data?.error || e?.message || "Failed to load hunt";
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [idOrSlug]);

  async function handleStart() {
    try {
      await initCsrf();
      const ref = String(idOrSlug || "").trim();
      if (!ref) throw new Error("Invalid hunt reference");

      // Backend accepts id or slug
      const { data } = await api.post(`/hunts/${ref}/join`, {});
      // Store userHuntId if provided (when logged in)
      if (data?.userHuntId) {
        localStorage.setItem("userHuntId", String(data.userHuntId));
      }
      // Always set a lightweight “joined” flag so guests can attempt
      localStorage.setItem(`joined:hunt:${ref}`, "1");

      const next = data?.firstCheckpointId;
      if (next) {
        navigate(`/play/${ref}/checkpoints/${next}`);
      } else {
        alert("No checkpoints found for this hunt.");
      }
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to join hunt");
    }
  }

  if (loading) return <div className="hunt-page">Loading…</div>;
  if (error) return <div className="hunt-page error">{error}</div>;
  if (!hunt) return null;

  const checkpoints = (hunt.checkpoints || [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="page hunt-page">
      <div className="hunt-card">
        <header className="hunt-header">
          <div className="hunt-title">{hunt.title}</div>
          <div className="hunt-meta">Checkpoints: {checkpoints.length}</div>
        </header>

        {hunt.description && <p className="hunt-desc">{hunt.description}</p>}

        <ol className="checkpoint-list">
          {checkpoints.map((cp) => (
            <li key={cp.id} className="checkpoint-item">
              <div className="checkpoint-row">
                <div className="checkpoint-order">#{cp.order}</div>
                <div className="checkpoint-body">
                  <div className="checkpoint-title">{cp.title}</div>
                  <div className="checkpoint-meta">tol {cp.tolerance}m</div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="cta-row">
          <button className="btn primary" onClick={handleStart}>
            Start hunt
          </button>
        </div>
      </div>
    </div>
  );
}
