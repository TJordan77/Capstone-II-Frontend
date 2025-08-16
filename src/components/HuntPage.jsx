import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, initCsrf } from '../ApiClient';
import './HuntPage.css';

export default function HuntPage() {
  const { id } = useParams();
  const [hunt, setHunt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setErr('');
      try {
        try { await initCsrf(); } catch {}
        const res = await api.get(`/hunts/${id}`, { signal: controller.signal });
        if (!alive) return;
        setHunt(res.data);
      } catch (e) {
        if (!alive) return;
        if (e.name === 'CanceledError' || e.name === 'AbortError') return;
        const msg = e?.response?.data?.error ||
          (e?.response?.status ? `Error ${e.response.status}` : 'Failed to load hunt');
        setErr(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; controller.abort(); };
  }, [id]);

  if (loading) return <div className="page hunt-page loading">Loading hunt…</div>;

  if (err) {
    return (
      <div className="page hunt-page error">
        <p>{err}</p>
        <Link className="btn ghost" to="/">Back home</Link>
      </div>
    );
  }

  if (!hunt) return <div className="page hunt-page error">Not found</div>;

  const checkpoints = (hunt.checkpoints || [])
    .slice()
    .sort((a, b) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0));

  return (
    <div className="page hunt-page">
      <div className="hunt-card">
        <header className="hunt-header">
          <div className="hunt-title">{hunt.title}</div>
          <div className="hunt-meta">Checkpoints: {checkpoints.length}</div>
        </header>

        {hunt.description && <p className="hunt-desc">{hunt.description}</p>}

        <ol className="checkpoint-list">
          {checkpoints.map((cp, i) => (
            <li key={cp.id} className="checkpoint-item">
              <div className="checkpoint-index">{i + 1}</div>
              <div className="checkpoint-body">
                <div className="checkpoint-title">{cp.title}</div>
                {cp.riddle && <div className="checkpoint-riddle">{cp.riddle}</div>}
                <div className="checkpoint-meta">lat {cp.lat}, lng {cp.lng} · tol {cp.tolerance}m</div>
              </div>
            </li>
          ))}
        </ol>

        <div className="cta-row">
          <Link className="btn primary" to={`/play?hunt=${hunt.id}`}>Start hunt</Link>
          <Link className="btn ghost" to={`/leaderboard/${hunt.id}`}>Leaderboard</Link>
          <Link className="btn ghost" to="/">Back</Link>
        </div>
      </div>
    </div>
  );
}
