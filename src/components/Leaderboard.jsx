import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { huntId } = useParams(); // Get huntId from the URL

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/hunts/${huntId}/leaderboard`);
        setLeaderboardData(response.data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [huntId]);

  if (loading) return <div>Loading leaderboard...</div>;
  if (leaderboardData.length === 0) return <div>No scores have been submitted for this hunt yet.</div>;

  return (
    <div>
      <h2>Leaderboard for Hunt #{huntId}</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Time (seconds)</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((score, index) => (
            <tr key={score.id}>
              <td>{index + 1}</td>
              <td>{score.User.username}</td>
              <td>{score.completionTime}</td>
              <td>{new Date(score.completionDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;