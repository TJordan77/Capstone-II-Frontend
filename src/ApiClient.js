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
const _raw = ((fromEnv || fromWindow) || "").replace(/\/$/, "");     
// ADDED: If someone sets REACT_APP_API_URL to ".../api", strip it to avoid "/api/api"
const origin = _raw.replace(/\/api$/, "");                                     

// If we have an origin, pin to `${origin}/api`; else same-origin "/api"
const baseURL = origin ? `${origin}/api` : "/api";

// Single Axios instance for the whole app
export const api = axios.create({
  baseURL,                 // CRA dev can use proxy if no baseURL is set
  withCredentials: true,   // Send cookies with every request
});

// ADDED: Just a helpful header that some CSRF middlewares look for
api.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";  

// CSRF support here
// We fetch a CSRF token once from the backend and attach it on mutating requests.
// Backend route used: GET /auth/csrf (provided by your CSRF middleware)
let CSRF_TOKEN = null;

// Call this once before any mutating requests (ex., at app startup)
// Example: in App.jsx -> useEffect(() => { initCsrf().then(checkAuth); }, [])
export async function initCsrf() {
  try {
    const { data } = await api.get("/auth/csrf");
    CSRF_TOKEN = data?.csrfToken || null;
    if (CSRF_TOKEN) {
      // Set default header so every request picks it up by default
      api.defaults.headers.common["X-CSRF-Token"] = CSRF_TOKEN;
    }
  } catch (e) {
    console.error("Failed to init CSRF token", e);
  }
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
        config._csrfRetried = true;       // Note: guard to prevent infinite loop is already here
        return api(config);
      } catch (e) {
        // fall through to reject
      }
    }
    return Promise.reject(error);
  }
);
