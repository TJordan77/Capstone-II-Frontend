import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, initCsrf } from "../ApiClient";

export default function JoinHunt() {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function handleJoin(e) {
    e.preventDefault();
    setErr("");

    const code = (joinCode || "").trim().toUpperCase();
    if (!code) {
      setErr("Please enter a join code.");
      return;
    }

    try {
      setLoading(true);
      await initCsrf();

      const res = await api.post("/hunts/join", { joinCode: code });
      const data = res?.data;

      // Ensure we actually received JSON
      if (!data || typeof data !== "object") {
        throw new Error("Bad response (not JSON)");
      }

      const { huntId } = data;

      // Only require huntId for now; backend may return userHuntId null
      if (!Number.isFinite(huntId)) {
        throw new Error("Missing huntId");
      }

      // Navigate by numeric id; switch to slug routing only if you’ve implemented it
      navigate(`/hunts/${huntId}`);
    } catch (e2) {
      console.error("Join failed:", e2);
      setErr("Failed to join hunt. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="join-hunt-page" style={{ display: "grid", placeItems: "center", minHeight: "60vh", padding: "2rem" }}>
      <form
        onSubmit={handleJoin}
        className="join-hunt-card"
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(0,0,0,0.35)",
          borderRadius: 16,
          padding: "1.5rem",
          color: "#fff",
          boxShadow: "0 10px 24px rgba(0,0,0,.25)",
          backdropFilter: "blur(6px)",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: "0.75rem", fontSize: "1.5rem" }}>Join a Hunt</h2>
        <p style={{ margin: 0, marginBottom: "1rem", opacity: 0.9 }}>
          Enter your access code to join the SideQuest Tutorial or any public hunt.
        </p>

        <label htmlFor="joinCode" style={{ display: "block", marginBottom: 8 }}>
          Access Code
        </label>
        <input
          id="joinCode"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="e.g. TUTORIAL"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem 0.9rem",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,.2)",
            outline: "none",
            background: "rgba(255,255,255,.08)",
            color: "#fff",
            fontSize: "1rem",
            letterSpacing: "0.06em",
            marginBottom: "0.75rem",
          }}
        />

        {err ? (
          <div
            role="alert"
            style={{
              background: "rgba(255, 71, 87, .12)",
              border: "1px solid rgba(255, 71, 87, .5)",
              color: "#ff6b81",
              padding: "0.6rem 0.8rem",
              borderRadius: 10,
              marginBottom: "0.75rem",
            }}
          >
            {err}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.8rem 1rem",
            borderRadius: 12,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            background: "#ffcb13",
            color: "#0e606c",
            fontWeight: 700,
            letterSpacing: "0.04em",
            boxShadow: "0 8px 18px rgba(0,0,0,.22)",
            transition: "transform .06s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          {loading ? "Joining…" : "Join Hunt"}
        </button>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
          Tip: The seeded tutorial code is <code style={{ color: "#ffd23a" }}>TUTORIAL</code>
        </div>
      </form>
    </div>
  );
}
