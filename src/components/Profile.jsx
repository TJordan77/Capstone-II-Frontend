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

/* --------------------------------------------------------
   Known core badges used by the app (id -> icon + title).
   This lets us recover when the API returns imageUrl="/icon-.png"
   or omits "title" for the badge.
--------------------------------------------------------- */
const KNOWN_BADGE_ICONS = {
  10: "/icon-trailblazer.png", // First checkpoint completed
  6: "/icon-pathfinder.png",   // First full hunt completed
  7: "/icon-speedrunner.png",  // Finished fast
};
const KNOWN_BADGE_TITLES = {
  10: "Trailblazer",
  6: "Pathfinder",
  7: "Speedrunner",
};

/* Prioritize which badges float to the top row in the profile grid */
const CORE_ORDER = { 10: 0, 6: 1, 7: 2 }; // Trailblazer, Pathfinder, Speedrunner

// Make icon lookup tolerant of bad/empty imageUrl ("/icon-.png")
// and fall back to known icons by badge id, then slug(name|title), then generic.
function getBadgeIcon(badge) {
  const isBad = (u) =>
    !u || u === "/icon-.png" || /\/icon-\.png$/i.test(u) || u === "/icon.png";
  const rawUrl =
    badge?.imageUrl ??
    badge?.image ??
    badge?.Badge?.image ??
    null;

  if (!isBad(rawUrl)) return rawUrl;

  const id = Number(badge?.id ?? badge?.badgeId ?? badge?.badge_id ?? badge?.BadgeId);
  if (id && KNOWN_BADGE_ICONS[id]) return KNOWN_BADGE_ICONS[id];

  const slug = slugifyName(badge?.name || badge?.title || "");
  return slug ? `/icon-${slug}.png` : "/icon-badges.png";
}

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const [createdCount, setCreatedCount] = useState(0);
  const [playedCount, setPlayedCount] = useState(0);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

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

        // Make profile resilient: if one call 500s, still render the others.
        const [createdRes, joinedRes, badgesRes] = await Promise.allSettled([
          api.get(`/users/${userId}/hunts/created`),
          api.get(`/users/${userId}/hunts/joined`),
          api.get(`/users/${userId}/badges`),
        ]);

        const created =
          createdRes.status === "fulfilled" ? createdRes.value?.data : [];
        const joined =
          joinedRes.status === "fulfilled" ? joinedRes.value?.data : [];
        const badgesRaw =
          badgesRes.status === "fulfilled" ? badgesRes.value?.data : [];

        setCreatedCount(Array.isArray(created) ? created.length : 0);
        setPlayedCount(Array.isArray(joined) ? joined.length : 0);

        // Normalize badge shape; fill missing title using known ids
        const normalizedBadges = Array.isArray(badgesRaw)
          ? badgesRaw.map((b) => {
              const id =
                b.id ??
                b.badgeId ??
                b.badge_id ??
                b.BadgeId ??
                b.Badge?.id ??
                null;

              const title =
                b.title ??
                b.name ??
                b.Badge?.title ??
                KNOWN_BADGE_TITLES[id] ??
                (typeof b.description === "string" &&
                /first checkpoint/i.test(b.description)
                  ? "Trailblazer"
                  : null);

              return {
                id,
                name: title ?? "Badge",
                title: title ?? "Badge",
                imageUrl: b.imageUrl ?? b.image ?? b.Badge?.image ?? null,
                image: b.image ?? b.imageUrl ?? b.Badge?.image ?? null,
                earnedAt:
                  b.earnedAt ??
                  b.earned_at ??
                  b.UserBadge?.earnedAt ??
                  b.user_badge?.earned_at ??
                  b.userBadge?.earnedAt ??
                  null,
              };
            })
          : [];

        setBadges(normalizedBadges);
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
    if (avatarFailed) return null;
    if (avatarPreview) return avatarPreview;
    return profile?.profilePicture || profile?.avatarUrl || null;
  }, [avatarPreview, profile, avatarFailed]);

  const userInitial = useMemo(() => {
    const name = displayName || profile?.username || "U";
    return String(name).trim().charAt(0).toUpperCase();
  }, [displayName, profile]);

  // Sort so core badges float into the first 6 before rendering
  const topBadges = useMemo(() => {
    const coreRank = (x) => CORE_ORDER[Number(x?.id)] ?? 999;
    const isCore = (x) => coreRank(x) !== 999;

    const sorted = [...badges].sort((a, b) => {
      const ac = isCore(a), bc = isCore(b);
      if (ac !== bc) return ac ? -1 : 1;            // core first
      if (ac && bc) return coreRank(a) - coreRank(b); // both core → rank order
      const ae = a?.earnedAt ? new Date(a.earnedAt).getTime() : 0;
      const be = b?.earnedAt ? new Date(b.earnedAt).getTime() : 0;
      if (ae !== be) return be - ae;                // newest first among non-core
      const ai = Number(a?.id) || 0;
      const bi = Number(b?.id) || 0;
      return bi - ai;
    });

    const take = 6;
    const earned = sorted.slice(0, take).map((b) => ({
      key: `b-${b.id}-${b.earnedAt || ""}`,
      locked: false,
      src: getBadgeIcon(b),
      alt: b.name || b.title || KNOWN_BADGE_TITLES[b.id] || "Badge",
    }));
    const placeholders = Array.from({
      length: Math.max(0, take - earned.length),
    }).map((_, i) => ({ key: `lock-${i}`, locked: true }));
    return [...earned, ...placeholders];
  }, [badges]);

  const onPickImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFailed(false);
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

      setProfile((p) => ({
        ...p,
        ...updated,
      }));

      // Keep form inputs in sync with any server-side normalization.
      setFormData({
        name:
          updated.name ||
          [updated.firstName, updated.lastName].filter(Boolean).join(" ") ||
          updated.username ||
          "",
        email: updated.email || "",
      });

      setEditing(false);
      setAvatarPreview(null);
      setAvatarFailed(false);
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
                <img
                  src={avatarSrc}
                  alt={displayName}
                  onError={() => setAvatarFailed(true)}
                />
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
                <label htmlFor="name" className="profile-label">
                  Name
                </label>
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
                <label htmlFor="email" className="profile-label">
                  Email
                </label>
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
                    setAvatarFailed(false);
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
