import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../ApiClient";
import "./Leaderboard.css";

export default function Leaderboard() {
  const { huntId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/leaderboard/${huntId}`);
        // Accept either an array or an object with { rows }
        const list = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
        if (alive) setRows(list);
      } catch (e) {
        if (alive) setError(e?.response?.data?.error || "Failed to load leaderboard");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [huntId]);

  if (loading) return <div className="leaderboard">Loading…</div>;
  if (error) return <div className="leaderboard error">{error}</div>;

  const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "");
  const fmtUser = (r) => r?.username || r?.user?.username || r?.user?.email || "Unknown";

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>

      {rows.length === 0 ? (
        <div className="leaderboard-empty">No results yet. Be the first to finish!</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th><th>User</th><th>Badges</th><th>Time (s)</th><th>Date</th>
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
