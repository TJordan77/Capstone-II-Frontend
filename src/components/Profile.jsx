import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../ApiClient";
import { Link } from "react-router-dom";
import "./Profile.css";

function slugifyName(name = "") {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getBadgeIcon(badge) {
  if (badge?.imageUrl) return badge.imageUrl;
  const slug = slugifyName(badge?.name || "");
  return `/icon-${slug}.png`;
}

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const [createdCount, setCreatedCount] = useState(0);
  const [playedCount, setPlayedCount] = useState(0);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const meResp = await api.get("/auth/me");
        const me = meResp?.data?.user || meResp?.data || null;
        if (!me) throw new Error("No user in /auth/me response");

        setProfile(me);
        setFormData({
          name:
            me.name ||
            [me.firstName, me.lastName].filter(Boolean).join(" ") ||
            me.username ||
            "",
          email: me.email || "",
        });

        const userId = me.id;
        const [createdRes, joinedRes, badgesRes] = await Promise.all([
          api.get(`/users/${userId}/hunts/created`),
          api.get(`/users/${userId}/hunts/joined`),
          api.get(`/users/${userId}/badges`),
        ]);

        setCreatedCount(createdRes?.data?.length || 0);
        setPlayedCount(joinedRes?.data?.length || 0);
        setBadges(Array.isArray(badgesRes?.data) ? badgesRes.data : []);
      } catch (e) {
        console.error("Failed to load profile:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const badgesCount = badges.length;

  const displayName = useMemo(() => {
    if (!profile) return "";
    return (
      profile.name ||
      [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
      profile.username ||
      "Adventurer"
    );
  }, [profile]);

  const roleText = useMemo(() => {
    if (!profile?.role) return "Adventurer";
    const r = String(profile.role).trim();
    return r.charAt(0).toUpperCase() + r.slice(1);
  }, [profile]);

  const avatarSrc = useMemo(() => {
    if (avatarPreview) return avatarPreview;
    return profile?.profilePicture || profile?.avatarUrl || null;
  }, [avatarPreview, profile]);

  const userInitial = useMemo(() => {
    const name = displayName || profile?.username || "U";
    return String(name).trim().charAt(0).toUpperCase();
  }, [displayName, profile]);

  const topBadges = useMemo(() => {
    const take = 6;
    const earned = badges.slice(0, take).map((b) => ({
      key: `b-${b.id}-${b.earnedAt || ""}`,
      locked: false,
      src: getBadgeIcon(b),
      alt: b.name,
    }));
    const placeholders = Array.from({ length: Math.max(0, take - earned.length) }).map(
      (_, i) => ({ key: `lock-${i}`, locked: true })
    );
    return [...earned, ...placeholders];
  }, [badges]);

  const onPickImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(String(ev.target?.result || ""));
    reader.readAsDataURL(f);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { name: formData.name, email: formData.email };
      if (avatarPreview) body.profilePicture = avatarPreview;

      const { data } = await api.put("/auth/profile", body);
      const updated = data?.user || data;
      setProfile((p) => ({ ...p, ...updated }));
      setEditing(false);
      setAvatarPreview(null);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading-wrap">
        <div className="profile-loading-text">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-loading-wrap">
        <div className="profile-error-text">Profile not found.</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Background like Home: inline style so it loads correctly */}
      <div
        className="profile-bg"
        style={{ backgroundImage: 'url("/background.png")' }}
        aria-hidden="true"
      />
      <div className="profile-container">
        <div className="profile-title">PROFILE</div>

        <div className="profile-card">
          {/* Avatar */}
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName} />
              ) : (
                <div className="profile-avatar-initial">{userInitial}</div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="profile-file-input"
                onChange={onPickImage}
              />
              <button
                type="button"
                className="profile-avatar-edit"
                onClick={() => fileRef.current?.click()}
                title="Upload profile picture"
              >
                Edit
              </button>
            </div>

            <div className="profile-name">{displayName}</div>
            <div className="profile-role">{roleText}</div>
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div className="profile-stat-tile">
              <div className="profile-stat-value">{createdCount}</div>
              <div className="profile-stat-label">Hunts Created</div>
            </div>
            <div className="profile-stat-tile">
              <div className="profile-stat-value">{playedCount}</div>
              <div className="profile-stat-label">Hunts Played</div>
            </div>
            <div className="profile-stat-tile">
              <div className="profile-stat-value">{badgesCount}</div>
              <div className="profile-stat-label">Badges Earned</div>
            </div>
          </div>

          {/* Badges */}
          <div className="profile-badges-section">
            <div className="profile-badges-title">Badges Earned</div>
            <div className="profile-badges-grid">
              {topBadges.map((b) =>
                b.locked ? (
                  <div className="profile-badge-tile" key={b.key}>
                    <img
                      src="/icon-badges.png"
                      alt="Locked"
                      className="profile-badge-img locked"
                    />
                  </div>
                ) : (
                  <div className="profile-badge-tile" key={b.key}>
                    <img
                      src={b.src}
                      alt={b.alt}
                      className="profile-badge-img"
                      onError={(e) => {
                        if (!e.currentTarget.dataset.fallback) {
                          e.currentTarget.dataset.fallback = "1";
                          e.currentTarget.src = "/icon-badges.png";
                        }
                      }}
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="profile-actions">
            <button
              className="profile-edit-btn"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Close Editor" : "Edit Profile"}
            </button>
            <Link to="/badges" className="profile-viewall-link">
              View All Badges
            </Link>
          </div>

          {/* Editor */}
          {editing && (
            <form className="profile-form" onSubmit={handleUpdate}>
              <div className="profile-form-row">
                <label htmlFor="name" className="profile-label">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, name: e.target.value }))
                  }
                  className="profile-input"
                />
              </div>

              <div className="profile-form-row">
                <label htmlFor="email" className="profile-label">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, email: e.target.value }))
                  }
                  className="profile-input"
                />
              </div>

              <div className="profile-upload-row">
                <button
                  type="button"
                  className="profile-upload-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  Upload New Photo
                </button>
                {avatarPreview ? (
                  <span className="profile-preview-note">Preview ready</span>
                ) : null}
              </div>

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-cancel-btn"
                  onClick={() => {
                    setEditing(false);
                    setAvatarPreview(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="profile-save-btn" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
