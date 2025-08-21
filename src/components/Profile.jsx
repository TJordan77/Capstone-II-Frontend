import React, { useState, useEffect } from "react";
import { api } from "../ApiClient";

const Profile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  const [badges, setBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setProfile(data.user);
        setFormData({ name: data.user.name, email: data.user.email });
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setBadgesLoading(true);
        const { data } = await api.get(`/badges/user/${profile.id}`);
        if (!cancelled) setBadges(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load user badges:", err);
        if (!cancelled) setBadges([]);
      } finally {
        if (!cancelled) setBadgesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put("/auth/profile", formData);
      setProfile(data.user);
      setEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-gray-700">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-red-500">
          Profile not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Your Profile
        </h1>
        {!editing ? (
          <div>
            <div className="mb-4">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Name:</span>{" "}
                {profile.name}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Email:</span>{" "}
                {profile.email}
              </p>
            </div>

            <div className="mb-6">
              <p className="font-semibold text-gray-800 mb-2">Badges</p>
              {badgesLoading ? (
                <p className="text-gray-500">Loading badges…</p>
              ) : badges.length === 0 ? (
                <p className="text-gray-500">No badges yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {badges.map((b) => (
                    <span
                      key={b.id}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-800 border border-gray-200"
                      title={b.description || b.name}
                    >
                      {b.imageUrl ? (
                        <img
                          src={b.imageUrl}
                          alt={b.name}
                          className="w-5 h-5 rounded shrink-0 object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <span>{b.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <div className="mb-4">
              <label
                className="block text-gray-700 font-semibold mb-2"
                htmlFor="name"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-6">
              <label
                className="block text-gray-700 font-semibold mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
