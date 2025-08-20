import React, { useEffect, useState } from "react";
import { api } from "../ApiClient";
import "./PlayerDashboard.css";

export default function PlayerDashboard() {
  const [me, setMe] = useState(null);
  const [hunts, setHunts] = useState([]);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({ inProgress: 0, completed: 0, badges: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);

        // who am i
        const meRes = await api.get("/auth/me");
        const user = meRes?.data?.user || meRes?.data || {};
        const userId = user.id || user.userId;
        setMe(user);

        // fetch hunts & badges separately (robust to backend diffs)
        const [joinedRes, badgesRes] = await Promise.all([
          api.get(`/users/${userId}/hunts/joined`),
          api.get(`/users/${userId}/badges`),
        ]);

        const joined = Array.isArray(joinedRes?.data) ? joinedRes.data : [];
        const myBadges = Array.isArray(badgesRes?.data) ? badgesRes.data : [];

        setHunts(joined);
        setBadges(myBadges);

        const inProgress = joined.filter(h => !h.completedAt).length;
        const completed  = joined.filter(h => !!h.completedAt).length;
        setStats({ inProgress, completed, badges: myBadges.length });
      } catch (e) {
        console.error(e);
        setErr(e?.response?.data?.error || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onJoin = async () => {
    const joinCode = window.prompt("Enter join code");
    if (!joinCode) return;
    try {
      await api.post("/hunts/join", { joinCode });
      // quick refresh after join
      const meRes = await api.get("/auth/me");
      const userId = meRes?.data?.user?.id || meRes?.data?.id || meRes?.data?.userId;
      const [joinedRes, badgesRes] = await Promise.all([
        api.get(`/users/${userId}/hunts/joined`),
        api.get(`/users/${userId}/badges`),
      ]);
      const joined = Array.isArray(joinedRes.data) ? joinedRes.data : [];
      const myBadges = Array.isArray(badgesRes.data) ? badgesRes.data : [];
      setHunts(joined);
      setBadges(myBadges);
      setStats({
        inProgress: joined.filter(h => !h.completedAt).length,
        completed: joined.filter(h => !!h.completedAt).length,
        badges: myBadges.length,
      });
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to join hunt");
    }
  };

  return (
    <div className="pd-root">
      <div className="pd-content">
        {/* Sidebar */}
        <aside className="pd-sidebar">
          <nav className="pd-nav">
            <button className="pd-nav-item pd-nav-item--active">Hunts</button>
            <button className="pd-nav-item">Badges</button>
            <button className="pd-nav-item">Leaderboard</button>
          </nav>
          <button className="pd-join-btn" onClick={onJoin}>+ Join Hunt</button>
        </aside>

        {/* Main */}
        <main className="pd-main">
          <h1 className="pd-title">Player Dashboard</h1>
          {err && <div className="pd-alert">{err}</div>}
          {loading ? (
            <div className="pd-loading">Loading…</div>
          ) : (
            <>
              {/* Tiles */}
              <section className="pd-stats">
                <div className="pd-stat">
                  <div className="pd-stat-number">{stats.inProgress}</div>
                  <div className="pd-stat-label">Hunts in Progress</div>
                </div>
                <div className="pd-stat">
                  <div className="pd-stat-number">{stats.completed}</div>
                  <div className="pd-stat-label">Hunts Completed</div>
                </div>
                <div className="pd-stat">
                  <div className="pd-stat-number">{stats.badges}</div>
                  <div className="pd-stat-label">Badges Earned</div>
                </div>
              </section>

              {/* Your Hunts */}
              <section className="pd-card">
                <div className="pd-card-title">Your Hunts</div>
                <div className="pd-hunts">
                  {hunts.length === 0 ? (
                    <div className="pd-empty">You haven’t joined any hunts yet.</div>
                  ) : (
                    hunts.map(h => (
                      <div className="pd-hunt" key={h.id}>
                        <div className="pd-hunt-icon" aria-hidden>
                          <div className="pd-hunt-icon-badge" />
                        </div>
                        <div className="pd-hunt-meta">
                          <div className="pd-hunt-title">{h.title}</div>
                          <div className="pd-hunt-desc">
                            {h.description || "No description."}
                          </div>
                        </div>
                        <div className={`pd-hunt-status ${h.completedAt ? "pd-hunt-status--done" : "pd-hunt-status--active"}`}>
                          {h.completedAt ? "Completed" : "In Progress"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Badge Gallery */}
              <section className="pd-card pd-card--badges">
                <div className="pd-card-title">Badges</div>
                {badges.length === 0 ? (
                  <div className="pd-empty">No badges yet. Start a hunt!</div>
                ) : (
                  <div className="pd-badges">
                    {badges.map(b => {
                      const src = b.imageUrl || b.image; // support both shapes
                      return (
                        <div key={b.id} className="pd-badge">
                          <div className="pd-badge-icon">
                            {src ? <img src={src} alt={b.name} /> : <div className="pd-badge-placeholder" />}
                          </div>
                          <div className="pd-badge-name">{b.name || b.title}</div>
                          {b.description && (
                            <div className="pd-badge-desc">{b.description}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
