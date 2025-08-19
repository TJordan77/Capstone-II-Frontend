import React, { useEffect, useState} from 'react';

// mock Api for demo 
const api = {
    get: async (url) => {
        console.log(`API GET request to : ${url}`);
        //simulated data forbadges
        return {
            data: [
                {
                    id: 1,
                    name : 'First Quest',
                    description: 'Completed your first quest',
                    icon : '',
                },
                {
                    id: 2,
                    name: 'City Explorer',
                    description: 'Found all checkpoint in a hunt',
                    icon : '',
                },
                {
                    id: 3,
                    name: 'NIght Owl',
                    description: 'Completed a hunt after midnight',
                    icon : '',
                },
            ],
        };
    },
};

const PlayerDashboard = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // May need to be replace 
  const playerId = 1;

  useEffect(() => {
    fetchBadges();
  }, [playerId]);

  const fetchBadges = async () => {
    setLoading(true);
    setError('');
    try {
      // This is a conceptual API endpoint. Your backend should implement it.
      const { data } = await api.get(`/badges/player/${playerId}`);
      const list = Array.isArray(data) ? data : [];
      setBadges(list);
    } catch (err) {
      console.error('Error fetching badges:', err);
      setError(err?.response?.data?.error || 'Error fetching badges');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2d2243] text-white p-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="w-full md:w-64 bg-[#46395c] rounded-xl p-6">
          <div className="flex items-center mb-10">
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mr-4">
              {/* User profile image placeholder */}
            </div>
            <span className="text-xl font-semibold">
              Player
            </span>
          </div>
          <nav className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Menu</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="flex items-center p-2 rounded-lg hover:bg-[#5a4872] transition-colors">
                  <span className="ml-3">Hunts</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center p-2 rounded-lg hover:bg-[#5a4872] transition-colors">
                  <span className="ml-3">Badges</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">{error}</div>}
          
          <h2 className="text-3xl font-bold mb-6">Badge Gallery</h2>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-xl font-semibold text-gray-400">Loading your badges...</div>
            </div>
          ) : badges.length === 0 ? (
            <p className="text-gray-400 italic">You haven't earned any badges yet. Start a hunt to get some!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {badges.map((badge) => (
                <div key={badge.id} className="bg-[#46395c] rounded-xl p-4 text-center flex flex-col items-center">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h3 className="text-lg font-semibold">{badge.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{badge.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;