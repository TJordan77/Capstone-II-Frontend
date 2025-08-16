import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
// You'll need to install and import a mapping library like Leaflet or react-google-maps
// import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css'; // Don't forget to import Leaflet's CSS

function EditHunt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hunt, setHunt] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = '';
  const [checkpoints, setCheckpoints] = useState([]);
  const [newCheckpoint, setNewCheckpoint] = useState({
    riddle: '',
    hint: '',
    latitude: '',
    longitude: '',
    badgeImage: '',
    badgeTitle: '',
  });

  useEffect(() => {
    fetchHuntDetails();
  }, [id]);

  const fetchHuntDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/hunts/${id}`);
      setHunt(response.data);
      setTitle(response.data.title);
      setDescription(response.data.description);
      // Assuming checkpoints are nested or fetched separately
      setCheckpoints(response.data.Checkpoints || []);
    } catch (error) {
      console.error('Error fetching hunt details:', error);
      // navigate('/creator/hunts');
    }
  };

  const handleUpdateHunt = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3001/api/hunts/${id}`, { title, description });
      alert('Hunt updated successfully!');
    } catch (error) {
      console.error('Error updating hunt:', error);
    }
  };

  const handleAddCheckpoint = async (e) => {
    e.preventDefault();
    if (!newCheckpoint.riddle.trim() || !newCheckpoint.latitude || !newCheckpoint.longitude) {
      alert('Riddle, Latitude, and Longitude are required for a checkpoint.');
      return;
    }
    try {
      const response = await axios.post(`http://localhost:3001/api/hunts/${id}/checkpoints`, {
        ...newCheckpoint,
        order: checkpoints.length + 1, // Simple order for now
      });
      setCheckpoints([...checkpoints, response.data]);
      setNewCheckpoint({ riddle: '', hint: '', latitude: '', longitude: '', badgeImage: '', badgeTitle: '' });
    } catch (error) {
      console.error('Error adding checkpoint:', error);
    }
  };

  const handleUpdateCheckpoint = async (checkpointId, field, value) => {
    const updatedCheckpoints = checkpoints.map((cp) =>
      cp.id === checkpointId ? { ...cp, [field]: value } : cp
    );
    setCheckpoints(updatedCheckpoints);

    try {
      await axios.patch(`http://localhost:3001/api/checkpoints/${checkpointId}`, { [field]: value });
    } catch (error) {
      console.error('Error updating checkpoint:', error);
      // Revert if API call fails
      fetchHuntDetails();
    }
  };

  // Function to handle map clicks for setting checkpoint coordinates (conceptual)
  // const MapClickHandler = () => {
  //   useMapEvents({
  //     click(e) {
  //       setNewCheckpoint((prev) => ({
  //         ...prev,
  //         latitude: e.latlng.lat,
  //         longitude: e.latlng.lng,
  //       }));
  //     },
  //   });
  //   return null;
  // };

  if (!hunt) {
    return <div>Loading hunt details...</div>;
  }

  return (
    <div>
      <h1>Edit Hunt: {hunt.title}</h1>

      <form onSubmit={handleUpdateHunt}>
        <label>
          Title:
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Description:
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
        </label>
        <button type="submit">Save Hunt Details</button>
      </form>

      <h2>Checkpoints</h2>
      {/* Map Integration Placeholder */}
      {/* <div style={{ height: '400px', width: '100%' }}>
        <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapClickHandler />
          {checkpoints.map((cp) => (
            <Marker key={cp.id} position={[cp.latitude, cp.longitude]} />
          ))}
          {newCheckpoint.latitude && newCheckpoint.longitude && (
            <Marker position={[newCheckpoint.latitude, newCheckpoint.longitude]} />
          )}
        </MapContainer>
      </div> */}
      <p>Click on the map to set new checkpoint coordinates (Map integration needed)</p>

      <h3>Add New Checkpoint</h3>
      <form onSubmit={handleAddCheckpoint}>
        <label>
          Riddle:
          <textarea
            value={newCheckpoint.riddle}
            onChange={(e) => setNewCheckpoint({ ...newCheckpoint, riddle: e.target.value })}
            required
          ></textarea>
        </label>
        <label>
          Hint:
          <input
            type="text"
            value={newCheckpoint.hint}
            onChange={(e) => setNewCheckpoint({ ...newCheckpoint, hint: e.target.value })}
          />
        </label>
        <label>
          Latitude:
          <input
            type="number"
            step="0.000001"
            value={newCheckpoint.latitude}
            onChange={(e) => setNewCheckpoint({ ...newCheckpoint, latitude: parseFloat(e.target.value) })}
            required
          />
        </label>
        <label>
          Longitude:
          <input
            type="number"
            step="0.000001"
            value={newCheckpoint.longitude}
            onChange={(e) => setNewCheckpoint({ ...newCheckpoint, longitude: parseFloat(e.target.value) })}
            required
          />
        </label>
        <label>
          Badge Image URL:
          <input
            type="text"
            value={newCheckpoint.badgeImage}
            onChange={(e) => setNewCheckpoint({ ...newCheckpoint, badgeImage: e.target.value })}
          />
        </label>
        <label>
          Badge Title:
          <input
            type="text"
            value={newCheckpoint.badgeTitle}
            onChange={(e) => setNewCheckpoint({ ...newCheckpoint, badgeTitle: e.target.value })}
          />
        </label>
        <button type="submit">Add Checkpoint</button>
      </form>

      <h3>Existing Checkpoints</h3>
      {checkpoints.length === 0 ? (
        <p>No checkpoints added yet. Add one using the form above or by clicking on the map.</p>
      ) : (
        <ul>
          {checkpoints
            .sort((a, b) => a.order - b.order)
            .map((cp) => (
              <li key={cp.id}>
                <h4>Checkpoint {cp.order}</h4>
                <label>
                  Riddle:
                  <textarea
                    value={cp.riddle}
                    onChange={(e) => handleUpdateCheckpoint(cp.id, 'riddle', e.target.value)}
                  ></textarea>
                </label>
                <label>
                  Hint:
                  <input
                    type="text"
                    value={cp.hint}
                    onChange={(e) => handleUpdateCheckpoint(cp.id, 'hint', e.target.value)}
                  />
                </label>
                <p>Coords: {cp.latitude}, {cp.longitude}</p>
                {/* Add more fields for editing existing checkpoints */}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default EditHunt;