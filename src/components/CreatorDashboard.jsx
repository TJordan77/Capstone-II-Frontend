import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreatorDashboard() {
  const [hunts, setHunts] = useState([]);
  const [newHuntTitle, setNewHuntTitle] = useState('');
  const [newHuntDescription, setNewHuntDescription] = useState('');
  const navigate = useNavigate();

  // TODO: Replace with actual creator ID from auth context
  const creatorId = 1; 

  useEffect(() => {
    fetchHunts();
  }, [creatorId]);

  const fetchHunts = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/hunts/creator/${creatorId}`);
      setHunts(response.data);
    } catch (error) {
      console.error('Error fetching hunts:', error);
    }
  };

  const handleCreateHunt = async (e) => {
    e.preventDefault();
    if (!newHuntTitle.trim()) {
      alert('Hunt title cannot be empty.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3001/api/hunts', {
        title: newHuntTitle,
        description: newHuntDescription,
        creatorId: creatorId,
      });
      setHunts([...hunts, response.data]);
      setNewHuntTitle('');
      setNewHuntDescription('');
      navigate(`/creator/hunt/${response.data.id}/edit`);
    } catch (error) {
      console.error('Error creating hunt:', error);
    }
  };

  const handleDeleteHunt = async (huntId) => {
    if (window.confirm('Are you sure you want to delete this hunt?')) {
      try {
        await axios.delete(`http://localhost:3001/api/hunts/${huntId}`);
        setHunts(hunts.filter((hunt) => hunt.id !== huntId));
      } catch (error) {
        console.error('Error deleting hunt:', error);
      }
    }
  };

  const handleTogglePublish = async (huntId, currentStatus) => {
    try {
      const response = await axios.patch(`http://localhost:3001/api/hunts/${huntId}/publish`);
      setHunts(hunts.map((hunt) => (hunt.id === huntId ? response.data : hunt)));
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  return (
    <div>
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
                  <p>QR Link: (TODO: Generate QR link)</p>
                  <p>Join URL: (TODO: Generate Join URL)</p>
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