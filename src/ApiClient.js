// Gonna house all the api calls here, otherwise we'll have to do it for every page
// If we forget to do a fetch with credentials once in any of the pages, the cookies'll break
// Easier to just import this file
import axios from "axios";

const env =
  (typeof process !== "undefined" && process && process.env) ? process.env : {};

const fromEnv = env.REACT_APP_API_URL;
const fromWindow =
  typeof window !== "undefined" ? window.REACT_APP_API_URL : undefined;

// Remove any trailing slash
const origin = ((fromEnv || fromWindow) || "").replace(/\/$/, "");

// If we have an origin, pin to `${origin}/api`; else same-origin "/api"
const baseURL = origin ? `${origin}/api` : "/api";

export const api = axios.create({
  baseURL, // CRA dev can use proxy if no baseURL is set
  withCredentials: true,         // Send cookies with every request
});
