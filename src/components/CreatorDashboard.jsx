import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, initCsrf } from "../ApiClient";
import "./CreatorDashboard.css";

export default function CreatorDashboard({ user }) {
  const navigate = useNavigate();
  const [hunts, setHunts] = useState([]);
  const [error, setError] = useState("");

  // Replace with actual creator ID from auth context
  const creatorId = user?.id ?? user?.userId ?? null;

  useEffect(() => {
    if (!creatorId) return;
    fetchHunts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatorId]);

  const fetchHunts = async () => {
    if (!creatorId) return;
    setError("");
    try {
      const { data } = await api.get(`/hunts/creator/${creatorId}`);
      const list = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
      setHunts(list);
    } catch (err) {
      try {
        const { data } = await api.get(`/hunts`, { params: { creatorId } });
        const list = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
        setHunts(list);
      } catch (e2) {
        console.error("Error fetching hunts:", e2);
        setError(e2?.response?.data?.error || "Error fetching hunts");
      }
    }
  };

  function normalizeIsActive(h) {
    if (typeof h.isActive === "boolean") return h.isActive;
    if (h.endsAt) return new Date(h.endsAt).getTime() > Date.now();
    return true;
  }

  const stats = useMemo(() => {
    const totalHunts = hunts.length;
    const completedHunts = hunts.filter(h => !normalizeIsActive(h)).length;
    const activePlayers = hunts.reduce((sum, h) => {
      if (normalizeIsActive(h)) {
        const players = Number(h.playersCount ?? h.players ?? 0);
        return sum + (Number.isFinite(players) ? players : 0);
      }
      return sum;
    }, 0);
    return { totalHunts, activePlayers, completedHunts };
  }, [hunts]);

  const handleDeleteHunt = async (huntId) => {
    if (!window.confirm("Delete this hunt?")) return;
    setError("");
    try {
      await initCsrf();
      await api.delete(`/hunts/${huntId}`);
      setHunts(prev => prev.filter(h => h.id !== huntId));
    } catch (error) {
      console.error("Error deleting hunt:", error);
      setError(error?.response?.data?.error || "Error deleting hunt");
    }
  };

  const handleTogglePublish = async (huntId, currentStatus) => {
    setError("");
    try {
      await initCsrf();
      try {
        const { data } = await api.patch(`/hunts/${huntId}/publish`);
        setHunts(prev => prev.map(h => (h.id === huntId ? data : h)));
      } catch {
        const { data } = await api.patch(`/hunts/${huntId}`, { isPublished: !currentStatus });
        setHunts(prev => prev.map(h => (h.id === huntId ? data : h)));
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      setError(error?.response?.data?.error || "Error toggling publish status");
    }
  };

  return (
    <>
      {/* fixed page background shared with Home */}
      <div className="home-bg" style={{ backgroundImage: 'url("/background.png")' }} aria-hidden />

      <div className="cd-layout">
        {/* Sidebar */}
        <aside className="cd-sidebar">
          <div className="cd-brand">
            <img className="cd-logo" src="/SideQuestLogo.png" alt="SideQuest" />
            <span className="cd-brand-text">SIDEQUEST</span>
          </div>

          <nav className="cd-nav">
            <Link to="/creator/hunts" className="cd-nav-item cd-nav-item--active">
              <span className="cd-nav-icon" aria-hidden>📍</span>
              <span>Hunts</span>
            </Link>
            <Link to="/creator/checkpoints" className="cd-nav-item">
              <span className="cd-nav-icon" aria-hidden>🏁</span>
              <span>Checkpoints</span>
            </Link>
            <Link to="/leaderboard" className="cd-nav-item">
              <span className="cd-nav-icon" aria-hidden>🏆</span>
              <span>Leaderboard</span>
            </Link>
          </nav>

          <button className="cd-new-hunt" onClick={() => navigate("/creator/hunts/new")}>
            + New Hunt
          </button>
        </aside>

        {/* Main column */}
        <main className="cd-main">
          {/* Header */}
          <header className="cd-header">
            <h1 className="cd-title">CREATOR DASHBOARD</h1>
            <div className="cd-avatar-wrap" title="Your profile">
              <img className="cd-avatar" src="https://i.pravatar.cc/80?img=5" alt="User avatar" />
            </div>
          </header>

          {/* Stat tiles */}
          <section className="cd-stats">
            <div className="cd-stat">
              <div className="cd-stat-number">{stats.totalHunts}</div>
              <div className="cd-stat-label">Total Hunts</div>
            </div>
            <div className="cd-stat">
              <div className="cd-stat-number">{stats.activePlayers}</div>
              <div className="cd-stat-label">Active Players</div>
            </div>
            <div className="cd-stat">
              <div className="cd-stat-number">{stats.completedHunts}</div>
              <div className="cd-stat-label">Completed Hunts</div>
            </div>
          </section>

          <h2 className="cd-section-title">Your Hunts</h2>

          {/* Hunts grid */}
          <section className="cd-hunts-grid">
            {error && <div className="cd-error">{error}</div>}
            {!error && hunts.length === 0 && (
              <div className="cd-empty">You don’t have any hunts yet. Click <strong>+ New Hunt</strong> to create one.</div>
            )}

            {hunts.map(h => {
              const isActive = normalizeIsActive(h);
              const players = Number(h.playersCount ?? h.players ?? 0) || 0;
              return (
                <article className="cd-hunt-card" key={h.id}>
                  <h3 className="cd-hunt-title">{h.title || h.name || "Untitled Hunt"}</h3>
                  <p className="cd-hunt-desc">{h.description || "No description provided."}</p>

                  <div className="cd-hunt-meta">
                    <span className={`cd-badge ${isActive ? "cd-badge--active" : "cd-badge--inactive"}`}>
                      {isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="cd-players">
                      {players} {players === 1 ? "Player" : "Players"}
                    </span>
                  </div>

                  <div className="cd-card-actions">
                    <Link to={`/creator/hunt/${h.id}/edit`} className="cd-link">Edit</Link>
                    <button
                      type="button"
                      className="cd-link"
                      onClick={() => handleTogglePublish(h.id, h.isPublished)}
                    >
                      {h.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      className="cd-link cd-link--danger"
                      onClick={() => handleDeleteHunt(h.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </main>
      </div>
    </>
  );
}
