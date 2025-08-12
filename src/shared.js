// shared.js
const env = (typeof process !== "undefined" && process && process.env) ? process.env : {};
const win = (typeof window !== "undefined") ? window : {};

// Prefer REACT_APP_* because webpack injects those via EnvironmentPlugin
export const API_URL    = env.REACT_APP_API_URL || win.REACT_APP_API_URL || "";
export const SOCKETS_URL = env.SOCKETS_URL || win.SOCKETS_URL || "http://localhost:8080";
export const NODE_ENV   = env.NODE_ENV || "development";
