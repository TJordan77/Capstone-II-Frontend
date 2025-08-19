import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, initCsrf } from '../ApiClient';

function CreatorDashboard({ user }) {
  const [hunts, setHunts] = useState([]);
  const [newHuntTitle, setNewHuntTitle] = useState('');
  const [newHuntDescription, setNewHuntDescription] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Replace with actual creator ID from auth context
  const creatorId = user?.id ?? user?.userId ?? null; // tolerate variations

  useEffect(() => {
    if (!creatorId) return;        // Gotta guard this until user is ready
    fetchHunts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatorId]);

  const fetchHunts = async () => {
    if (!creatorId) return;        // A little extra safety
    setError('');
    try {
      const { data } = await api.get(`/hunts/creator/${creatorId}`);
      const list = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
      setHunts(list);
    } catch (err) {
      // Fallback: try a query-param variant if the above route isn't present
      try {
        const { data } = await api.get(`/hunts`, { params: { creatorId } });
        const list = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
        setHunts(list);
      } catch (e2) {
        console.error('Error fetching hunts:', e2);
        setError(e2?.response?.data?.error || 'Error fetching hunts');
      }
    }
  };

  const handleCreateHunt = async (e) => {
    e.preventDefault();
    setError('');
    if (!newHuntTitle.trim()) {
      alert('Hunt title cannot be empty.');
      return;
    }
    try {
      await initCsrf(); // ensure CSRF cookie
      // NOTE: backend POST /api/hunts requires at least one checkpoint.
      // We create a minimal draft checkpoint; the creator can edit it later.
      const body = {
        title: newHuntTitle,
        description: newHuntDescription,
        creatorId,
        checkpoints: [
          {
            title: 'Draft Start',
            riddle: 'Edit me in the builder.',
            answer: 'ready',
            lat: 0,
            lng: 0,
            tolerance: 25,
            order: 1,
          },
        ],
      };
      const { data } = await api.post('/hunts', body);
      // data is expected to be { id, accessCode }
      // Immediately refetch to get the hunt object (with fields like isPublished), or append a stub
      await fetchHunts();
      setNewHuntTitle('');
      setNewHuntDescription('');
      navigate(`/creator/hunt/${data.id}/edit`);
    } catch (error) {
      console.error('Error creating hunt:', error);
      setError(error?.response?.data?.error || 'Error creating hunt');
    }
  };

  const handleDeleteHunt = async (huntId) => {
    if (!window.confirm('Are you sure you want to delete this hunt?')) return;
    setError('');
    try {
      await initCsrf();
      await api.delete(`/hunts/${huntId}`);
      setHunts((prev) => prev.filter((h) => h.id !== huntId));
    } catch (error) {
      console.error('Error deleting hunt:', error);
      setError(error?.response?.data?.error || 'Error deleting hunt');
    }
  };

  const handleTogglePublish = async (huntId, currentStatus) => {
    setError('');
    try {
      await initCsrf();
      // Keep the original endpoint first-
      try {
        const { data } = await api.patch(`/hunts/${huntId}/publish`);
        setHunts((prev) => prev.map((h) => (h.id === huntId ? data : h)));
        return;
      } catch (e1) {
        // -fallback to a generic PATCH if /publish isn't implemented on the backend
        const { data } = await api.patch(`/hunts/${huntId}`, { isPublished: !currentStatus });
        setHunts((prev) => prev.map((h) => (h.id === huntId ? data : h)));
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      setError(error?.response?.data?.error || 'Error toggling publish status');
    }
  };

  return (
    <div>
      <div className="home-bg" style={{ backgroundImage: 'url("/background.png")' }} />
      <h1>Creator Dashboard</h1>

      <h2>Create New Hunt</h2>
      <form onSubmit={handleCreateHunt}>
        <input
          type="text"
          placeholder="Hunt Title"
          value={newHuntTitle}
          onChange={(e) => setNewHuntTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Hunt Description (Optional)"
          value={newHuntDescription}
          onChange={(e) => setNewHuntDescription(e.target.value)}
        ></textarea>
        <button type="submit">Create Hunt</button>
      </form>

      {error && <div style={{ color: '#b33', marginTop: 8 }}>{error}</div>}

      <h2>Your Hunts</h2>
      {hunts.length === 0 ? (
        <p>No hunts created yet.</p>
      ) : (
        <ul>
          {hunts.map((hunt) => (
            <li key={hunt.id}>
              <h3>{hunt.title}</h3>
              <p>{hunt.description}</p>
              <p>Status: {hunt.isPublished ? 'Published' : 'Draft'}</p>
              <Link to={`/creator/hunt/${hunt.id}/edit`}>Edit</Link>
              <button onClick={() => handleTogglePublish(hunt.id, hunt.isPublished)}>
                {hunt.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => handleDeleteHunt(hunt.id)}>Delete</button>
              {hunt.isPublished && (
                <div>
                  {/* If backend returns accessCode, you can show a join URL here */}
                  {hunt.accessCode ? (
                    <>
                      <p>Join Code: <code>{hunt.accessCode}</code></p>
                      <p>Join URL: <code>{`${window.location.origin}/join/${hunt.accessCode}`}</code></p>
                    </>
                  ) : (
                    <>
                      <p>QR Link: (TODO: Generate QR link)</p>
                      <p>Join URL: (TODO: Generate Join URL)</p>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CreatorDashboard;
