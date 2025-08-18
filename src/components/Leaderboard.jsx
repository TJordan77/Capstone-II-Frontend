import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../ApiClient";
import "./Leaderboard.css";

export default function Leaderboard() {
  const { huntId } = useParams();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(Boolean(huntId));
  const [error, setError] = useState("");
  const [idInput, setIdInput] = useState("");

  // Only fetch when we actually have a huntId (table mode)
  useEffect(() => {
    if (!huntId) return; // landing mode (no fetch)
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const { data } = await api.get(`/leaderboard/${huntId}`);
        // Accept either an array or an object with { rows }
        const list = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
        if (alive) {
          setRows(list);
          setError("");
        }
      } catch (e) {
        if (alive) setError(e?.response?.data?.error || "Failed to load leaderboard");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [huntId]);

  const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "");
  const fmtUser = (r) => r?.username || r?.user?.username || r?.user?.email || "Unknown";

  // ----- Landing mode (no :huntId) -----
  if (!huntId) {
    const last = localStorage.getItem("lastHuntId");
    return (
      <div className="leaderboard">
        <h2>Leaderboards</h2>
        <p>Select a hunt to view its leaderboard.</p>

        <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
          {last && (
            <button className="btn cta" onClick={() => navigate(`/leaderboard/${last}`)}>
              Open last viewed leaderboard
            </button>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              placeholder="Enter Hunt ID…"
              className="input"
              style={{ flex: 1, padding: "10px 12px", borderRadius: 8 }}
            />
            <button
              className="btn"
              onClick={() => idInput && navigate(`/leaderboard/${idInput.trim()}`)}
            >
              Go
            </button>
          </div>

          <div style={{ opacity: 0.8 }}>
            Or <Link to="/">browse hunts</Link> and use the hunt’s Leaderboard link.
          </div>
        </div>
      </div>
    );
  }

  // ----- Table mode (with :huntId) -----
  if (loading) return <div className="leaderboard">Loading…</div>;
  if (error) return <div className="leaderboard error">{error}</div>;

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>

      {rows.length === 0 ? (
        <div className="leaderboard-empty">No results yet. Be the first to finish!</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Badges</th>
              <th>Time (s)</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.userId ?? row.user?.id ?? i}-${row.huntId ?? huntId}-${i}`}>
                <td>{row.rank ?? i + 1}</td>
                <td>{fmtUser(row)}</td>
                <td>{row.badgeCount ?? row.totalBadges ?? 0}</td>
                <td>{row.timeSeconds ?? row.completionTime ?? "—"}</td>
                <td>{fmtDate(row.completedAt ?? row.completionDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
