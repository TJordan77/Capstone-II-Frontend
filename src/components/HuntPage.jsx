import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, initCsrf } from "../ApiClient";
import "./HuntPage.css";

export default function HuntPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hunt, setHunt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await api.get(`/hunts/${id}`);
        if (alive) setHunt(data);
        localStorage.setItem("lastHuntId", String(id));
      } catch (e) {
        if (alive) setError(e?.response?.data?.error || "Failed to load hunt");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [id]);

  async function handleStart() {
    try {
      await initCsrf();
      const { data } = await api.post(`/hunts/${id}/join`, {});
      if (data?.userHuntId) {
        localStorage.setItem("userHuntId", String(data.userHuntId));
      }
      if (data?.firstCheckpointId) {
        navigate(`/play/${id}/checkpoints/${data.firstCheckpointId}`);
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
          <button className="btn primary" onClick={handleStart}>Start hunt</button>
        </div>
      </div>
    </div>
  );
}
