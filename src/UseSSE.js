/*
UseSSE - React hook for subscribing to Server-Sent Events from the backend.

Connects to `${REACT_APP_API_URL}/api/events` and listens for named events
broadcast by the server via publish(eventName, data) in backend controllers.

Automatically includes credentials (cookies) for authenticated sessions.
Cleans up on unmount and will reconnect if the tab regains focus after being hidden.

Example:
UseSSE({
   events: {
     "leaderboard:update": (payload) => setLeaderboard(payload.top),
     "badge:awarded": (payload) => showToast(payload.badgeName),
   },
   onError: () => setStatus("Reconnecting...")
 });
 */

import { useEffect, useRef } from "react";

export default function UseSSE(options = {}) {
  const { events = {}, onOpen, onError } = options;
  const esRef = useRef(null);

  useEffect(() => {
    // Build base URL from CRA env; remove trailing slash if present
    const base = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
    const url = `${base}/api/events`;

    // Native EventSource auto‑reconnects on network hiccups.
    // The { withCredentials: true } option is supported in modern browsers
    // and lets cookies be sent for auth (ensure CORS + cookie settings on server).
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    // Wire named event listeners
    Object.entries(events).forEach(([eventName, handler]) => {
      if (typeof handler !== "function") return;
      es.addEventListener(eventName, (e) => {
        try {
          const data = e.data ? JSON.parse(e.data) : null;
          handler(data, e);
        } catch {
          // Non-JSON payloads still delivered
          handler(e.data, e);
        }
      });
    });

    // Tossed in some optional open/error handlers
    if (typeof onOpen === "function") {
      es.onopen = onOpen;
    }
    if (typeof onError === "function") {
      es.onerror = onError;
    } else {
      // Silent by default: you can add a console if you want
      es.onerror = () => {};
    }

    // Helpful: if the tab was hidden during a network blip,
    // closing/reopening EventSource can force a fast resubscribe.
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && es.readyState === 2) {
        es.close();
        esRef.current = new EventSource(url, { withCredentials: true });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      try {
        es.close();
      } catch {}
      esRef.current = null;
    };
  }, [JSON.stringify(Object.keys(events))]); // re-init only if event set changes
}
