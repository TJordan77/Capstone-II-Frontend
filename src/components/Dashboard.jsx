import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../ApiClient";
//import " ./Dashboard.css";

const Dashboard = () => {
  const [huntsCreated, setHuntsCreated] = useState([]);
  const [huntsJoined, setHuntsJoined] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const createdResponse = await api.get("/hunts/created");
        setHuntsCreated(createdResponse.data);

        const joinedResponse = await api.get("/hunts/joined");
        setHuntsJoined(joinedResponse.data);
      } catch (err) {
        setError("Failed to fetch dashboard data. Please try again later.");
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-gray-700">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-3xl font-bold text-gray-800 mb-8">
          Your Dashboard
        </div>
        
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Hunts You've Created
          </h2>
          {huntsCreated.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {huntsCreated.map((hunt) => (
                <div key={hunt.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{hunt.name}</h3>
                    <p className="mt-2 text-gray-600">{hunt.description}</p>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Link to={`/hunts/${hunt.id}`} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                      View
                    </Link>
                    <Link to={`/hunts/${hunt.id}/edit`} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">You haven't created any hunts yet. <Link to="/create" className="text-blue-500 hover:underline">Create your first one now!</Link></p>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Hunts You've Joined
          </h2>
          {huntsJoined.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {huntsJoined.map((hunt) => (
                <div key={hunt.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{hunt.name}</h3>
                    <p className="mt-2 text-gray-600">{hunt.description}</p>
                  </div>
                  <div className="mt-4">
                    <Link to={`/play/${hunt.id}`} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                      Continue Play
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">You haven't joined any hunts yet. <Link to="/join" className="text-blue-500 hover:underline">Find a hunt to join!</Link></p>
          )}
        </div>

        <div className="flex justify-center mt-12">
            <Link to="/create" className="bg-sidequest-green text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-opacity-80 transition-opacity mr-4">
                Create a Hunt
            </Link>
            <Link to="/join" className="bg-sidequest-yellow text-gray-800 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-opacity-80 transition-opacity">
                Join a Hunt
            </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
