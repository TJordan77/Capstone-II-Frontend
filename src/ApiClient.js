// Gonna house all the api calls here, otherwise we'll have to do it for every page
// If we forget to do a fetch with credentials once in any of the pages, the cookies'll break
// Easier to just import this file
import axios from "axios";

// Read compile-time envs directly so webpack/Vercel can replace them
const fromEnv = process.env.REACT_APP_API_URL || "";
const fromWindow =
  typeof window !== "undefined" ? window.REACT_APP_API_URL : undefined;

// Remove any trailing slash
const _raw = ((fromEnv || fromWindow) || "").replace(/\/$/, "");
// If someone sets REACT_APP_API_URL to ".../api", we'll strip it to avoid "/api/api"
const origin = _raw.replace(/\/api$/, "");

// If we have an origin, pin to `${origin}/api`; else same-origin "/api"
const baseURL = origin ? `${origin}/api` : "/api";

// Single Axios instance for the whole app
export const api = axios.create({
  baseURL,                 // CRA dev can use proxy if no baseURL is set
  withCredentials: true,   // Send cookies with every request
});

// CSRF support here
// We fetch a CSRF token once from the backend and attach it on mutating requests.
// Backend route used: GET /auth/csrf (provided by your CSRF middleware)
let CSRF_TOKEN = null;
let csrfInitPromise = null; // ensure concurrent calls reuse one request

// Call this once before any mutating requests (ex., at app startup)
// Example: in App.jsx -> useEffect(() => { initCsrf().then(checkAuth); }, [])
export async function initCsrf() {
  if (CSRF_TOKEN) return CSRF_TOKEN;           // already have it
  if (csrfInitPromise) return csrfInitPromise; // a call is in-flight

  csrfInitPromise = (async () => {
    try {
      const { data } = await api.get("/auth/csrf");
      CSRF_TOKEN = data?.csrfToken || null;
      if (CSRF_TOKEN) {
        // Set default header so every request picks it up by default
        api.defaults.headers.common["X-CSRF-Token"] = CSRF_TOKEN;
      }
      return CSRF_TOKEN;
    } catch (e) {
      console.error("Failed to init CSRF token", e);
      throw e;
    } finally {
      csrfInitPromise = null; // allow future refreshes if needed
    }
  })();

  return csrfInitPromise;
}

// Attach CSRF token for mutating methods as a safety net
api.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  const needsToken = ["post", "put", "patch", "delete"].includes(method);
  if (needsToken && CSRF_TOKEN) {
    config.headers = config.headers || {};
    config.headers["X-CSRF-Token"] = CSRF_TOKEN;
  }
  return config;
});

// Just an optional feature: auto-retry once on 403 CSRF failure by refreshing token
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error || {};
    if (!config || !response) return Promise.reject(error);

    // If CSRF token is missing/expired, refresh once and retry the original request
    if (response.status === 403 && !config._csrfRetried) {
      try {
        await initCsrf();
        config._csrfRetried = true; // guard to prevent infinite loop
        return api(config);
      } catch (e) {
        // fall through to reject
      }
    }

    /* Optional: handle expired session gently (leave redirects to route guards)
       if (response.status === 401) {
       // e.g., clear any local user state here if you keep it in a store
     }
    */

    return Promise.reject(error);
  }
);
