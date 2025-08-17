import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, initCsrf } from '../ApiClient';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import './CreateHunt.css'; // reuse the same map/modal/mini-map styles as CreateHunt

function EditHunt() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hunt, setHunt] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [checkpoints, setCheckpoints] = useState([]);

  // Align new checkpoint fields with backend model (lat/lng)
  const [newCheckpoint, setNewCheckpoint] = useState({
    title: 'New Checkpoint',
    riddle: '',
    answer: '',
    hint: '',
    lat: '',
    lng: '',
    tolerance: 25,
  });

  useEffect(() => {
    fetchHuntDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchHuntDetails = async () => {
    try {
      const { data } = await api.get(`/hunts/${id}`);
      setHunt(data);
      setTitle(data.title || '');
      setDescription(data.description || '');
      const cps = Array.isArray(data.checkpoints) ? data.checkpoints.slice() : [];
      cps.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setCheckpoints(cps);
    } catch (error) {
      console.error('Error fetching hunt details:', error);
      // navigate('/creator/hunts');
    }
  };

  const handleUpdateHunt = async (e) => {
    e.preventDefault();
    try {
      await initCsrf();
      const { data } = await api.patch(`/hunts/${id}`, { title, description });
      setHunt(data);
      alert('Hunt updated successfully!');
    } catch (error) {
      console.error('Error updating hunt:', error);
      alert(error?.response?.data?.error || 'Error updating hunt');
    }
  };

  const handleAddCheckpoint = async (e) => {
    e.preventDefault();
    if (
      !newCheckpoint.riddle.trim() ||
      !newCheckpoint.answer.trim() ||
      newCheckpoint.lat === '' ||
      newCheckpoint.lng === ''
    ) {
      alert('Riddle, Answer, Latitude, and Longitude are required for a checkpoint.');
      return;
    }

    const body = {
      title: newCheckpoint.title || `Checkpoint ${checkpoints.length + 1}`,
      riddle: newCheckpoint.riddle.trim(),
      answer: newCheckpoint.answer.trim(),
      hint: newCheckpoint.hint || null,
      lat: Number(newCheckpoint.lat),
      lng: Number(newCheckpoint.lng),
      tolerance: Number(newCheckpoint.tolerance) || 25,
      order: (checkpoints.length || 0) + 1,
    };

    try {
      await initCsrf();
      try {
        const { data } = await api.post(`/hunts/${id}/checkpoints`, body);
        setCheckpoints((prev) => [...prev, data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      } catch (e1) {
        const { data } = await api.post(`/checkpoints`, { ...body, huntId: Number(id) });
        setCheckpoints((prev) => [...prev, data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      }

      setNewCheckpoint({
        title: 'New Checkpoint',
        riddle: '',
        answer: '',
        hint: '',
        lat: '',
        lng: '',
        tolerance: 25,
      });
    } catch (error) {
      console.error('Error adding checkpoint:', error);
      alert(error?.response?.data?.error || 'Error adding checkpoint');
    }
  };

  const handleUpdateCheckpoint = async (checkpointId, field, value) => {
    const updatedCheckpoints = checkpoints.map((cp) =>
      cp.id === checkpointId ? { ...cp, [field]: value } : cp
    );
    setCheckpoints(updatedCheckpoints);

    const payload = {};
    if (['title', 'riddle', 'answer', 'hint', 'tolerance', 'order', 'lat', 'lng'].includes(field)) {
      payload[field] = ['tolerance', 'order', 'lat', 'lng'].includes(field) ? Number(value) : value;
    }

    try {
      await initCsrf();
      await api.patch(`/checkpoints/${checkpointId}`, payload);
    } catch (error) {
      console.error('Error updating checkpoint:', error);
      fetchHuntDetails();
    }
  };

  const handleDeleteCheckpoint = async (checkpointId) => {
    if (!window.confirm('Delete this checkpoint?')) return;
    try {
      await initCsrf();
      await api.delete(`/checkpoints/${checkpointId}`);
      setCheckpoints((prev) => prev.filter((cp) => cp.id !== checkpointId));
    } catch (error) {
      console.error('Error deleting checkpoint:', error);
      alert(error?.response?.data?.error || 'Error deleting checkpoint');
    }
  };

  // Click map to pick coords for the "new checkpoint" form
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setNewCheckpoint((prev) => ({
          ...prev,
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6)),
        }));
      },
    });
    return null;
  };

  if (!hunt) {
    return <div>Loading hunt details...</div>;
  }

  const center = checkpoints.length
    ? [checkpoints[0].lat || 40.7128, checkpoints[0].lng || -74.006]
    : [40.7128, -74.006];

  return (
    <div className="create-page">
      <header className="create-brand">
        <img src="/whitelogo2.png" alt="SideQuest logo" className="create-logo" />
        <h1 className="create-wordmark">SIDEQUEST</h1>
      </header>

      <main className="create-card" role="main">
        <h2 className="create-title">Edit Hunt</h2>

        <form className="create-form" onSubmit={handleUpdateHunt}>
          <div className="field span-2">
            <label>Hunt Name <span className="req">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Downtown Dash" />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              rows={3}
              placeholder="What should players expect?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="actions-row">
            <div className="left" />
            <div className="right">
              <button type="submit" className="btn cta">Save Hunt Details</button>
            </div>
          </div>
        </form>

        <h3 className="section-title">Checkpoints ({checkpoints.length})</h3>

        {/* Map area – styled with the same classes used in CreateHunt */}
        <div className="map-modal" style={{ padding: 0 }}>
          <MapContainer center={center} zoom={13} className="map-canvas" scrollWheelZoom>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <MapClickHandler />
            {checkpoints.map((cp) =>
              cp.lat != null && cp.lng != null ? (
                <Marker key={cp.id} position={[Number(cp.lat), Number(cp.lng)]} />
              ) : null
            )}
            {newCheckpoint.lat !== '' && newCheckpoint.lng !== '' && (
              <Marker position={[Number(newCheckpoint.lat), Number(newCheckpoint.lng)]} />
            )}
          </MapContainer>

          <div className="map-actions">
            <div className="coords-readout">
              New CP Lat: {newCheckpoint.lat || '—'} · Lng: {newCheckpoint.lng || '—'}
            </div>
            <div className="map-actions-right">
              <button
                type="button"
                className="btn cta"
                onClick={(e) => {
                  if (newCheckpoint.lat === '' || newCheckpoint.lng === '') {
                    alert('Click the map to pick a location first.');
                    return;
                  }
                  // small helper: push picked coords into the form fields below
                  const i = checkpoints.length;
                  setCheckpoints((prev) => [
                    ...prev,
                    {
                      id: `new-${i}`, // local temp id
                      title: newCheckpoint.title || `Checkpoint ${i + 1}`,
                      riddle: newCheckpoint.riddle,
                      answer: newCheckpoint.answer,
                      hint: newCheckpoint.hint,
                      lat: newCheckpoint.lat,
                      lng: newCheckpoint.lng,
                      tolerance: newCheckpoint.tolerance,
                      order: i + 1,
                    },
                  ]);
                }}
              >
                Use this location (stage)
              </button>
            </div>
          </div>
        </div>

        {/* New Checkpoint form (posts to backend) */}
        <h3>Add New Checkpoint</h3>
        <form onSubmit={handleAddCheckpoint} className="cp-fields">
          <div className="field">
            <label>Title</label>
            <input
              placeholder="Checkpoint title"
              value={newCheckpoint.title}
              onChange={(e) => setNewCheckpoint({ ...newCheckpoint, title: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Riddle / Clue <span className="req">*</span></label>
            <textarea
              rows={3}
              value={newCheckpoint.riddle}
              onChange={(e) => setNewCheckpoint({ ...newCheckpoint, riddle: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Answer <span className="req">*</span></label>
            <input
              value={newCheckpoint.answer}
              onChange={(e) => setNewCheckpoint({ ...newCheckpoint, answer: e.target.value })}
              required
            />
          </div>

          <div className="inline-3">
            <div className="field">
              <label>Latitude <span className="req">*</span></label>
              <input
                placeholder="40.712800"
                value={newCheckpoint.lat}
                onChange={(e) => setNewCheckpoint({ ...newCheckpoint, lat: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Longitude <span className="req">*</span></label>
              <input
                placeholder="-74.006000"
                value={newCheckpoint.lng}
                onChange={(e) => setNewCheckpoint({ ...newCheckpoint, lng: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Tolerance (m)</label>
              <input
                placeholder="25"
                value={newCheckpoint.tolerance}
                onChange={(e) => setNewCheckpoint({ ...newCheckpoint, tolerance: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn cta">Add Checkpoint</button>
        </form>

        {/* Existing Checkpoints editor */}
        <h3>Existing Checkpoints</h3>
        {checkpoints.length === 0 ? (
          <p>No checkpoints yet. Pick a spot on the map and add one.</p>
        ) : (
          <ul>
            {checkpoints
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((cp) => (
                <li key={cp.id} className="checkpoint-block" style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
                  <h4>Checkpoint {cp.order}</h4>

                  <div className="cp-fields">
                    <div className="field">
                      <label>Title</label>
                      <input
                        value={cp.title || ''}
                        onChange={(e) => handleUpdateCheckpoint(cp.id, 'title', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Riddle</label>
                      <textarea
                        value={cp.riddle || ''}
                        onChange={(e) => handleUpdateCheckpoint(cp.id, 'riddle', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Answer</label>
                      <input
                        value={cp.answer || ''}
                        onChange={(e) => handleUpdateCheckpoint(cp.id, 'answer', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Hint</label>
                      <input
                        value={cp.hint || ''}
                        onChange={(e) => handleUpdateCheckpoint(cp.id, 'hint', e.target.value)}
                      />
                    </div>

                    <div className="inline-3">
                      <div className="field">
                        <label>Lat</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={cp.lat ?? ''}
                          onChange={(e) => handleUpdateCheckpoint(cp.id, 'lat', e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Lng</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={cp.lng ?? ''}
                          onChange={(e) => handleUpdateCheckpoint(cp.id, 'lng', e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Tolerance (m)</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={cp.tolerance ?? 25}
                          onChange={(e) => handleUpdateCheckpoint(cp.id, 'tolerance', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="inline-3">
                      <div className="field">
                        <label>Order</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={cp.order ?? 1}
                          onChange={(e) => handleUpdateCheckpoint(cp.id, 'order', e.target.value)}
                        />
                      </div>
                      <div />
                      <div />
                    </div>

                    <p>Coords: {cp.lat}, {cp.lng}</p>

                    <button type="button" className="btn danger-sm" onClick={() => handleDeleteCheckpoint(cp.id)}>
                      Delete Checkpoint
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default EditHunt;
