import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ensureCsrf } from "../ApiClient";

export default function HuntPage() {
  const { id } = useParams();
  const [hunt, setHunt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await ensureCsrf();
        const { data } = await api.get(`/hunts/${id}`); // expects { id, title, description, checkpoints: [...] }
        setHunt(data);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load hunt");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="page">Loading hunt…</div>;
  if (err) return <div className="page"><p>{err}</p><Link to="/">Back home</Link></div>;
  if (!hunt) return <div className="page">Not found</div>;

  return (
    <div className="page">
      <h1>{hunt.title}</h1>
      {hunt.description && <p>{hunt.description}</p>}
      <h3>Checkpoints ({hunt.checkpoints?.length || 0})</h3>
      <ol>
        {(hunt.checkpoints || []).sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).map(cp => (
          <li key={cp.id}>
            <strong>{cp.title}</strong>
            <div>{cp.riddle}</div>
            <small>lat {cp.lat}, lng {cp.lng}, tol {cp.tolerance}m</small>
          </li>
        ))}
      </ol>
      <Link to="/">← Back</Link>
    </div>
  );
}
