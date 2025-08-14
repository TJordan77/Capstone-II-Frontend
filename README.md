# SideQuest — Frontend

SideQuest is a **GPS-based treasure hunt web app**. Players join hunts, travel to real-world checkpoints, solve riddles, and earn badges — all in a responsive, mobile-first interface.

This repository contains the **React frontend**.

---

## ✨ Features

- **Mobile-first UI**, custom CSS with flat, minimalist icons and soft gradient accents
- **Authentication** via Google OAuth (`@react-oauth/google`) and secure cookie-based sessions
- **Interactive maps** with Leaflet / React-Leaflet (player GPS, checkpoints, tolerance/geo-fence feedback)
- **Riddle flow** with location validation and clear error states (“You’re too far away”, retry, spinners)
- **Badges system** (locked/earned states, hover tooltips, grayscale for locked)
- **Leaderboard & progress** (ranks, badge counts, completion times)
- **Protected views** (role-aware: Admin, Creator, Player)

---

## 🧰 Tech Stack

- **React** + **React Router**
- **Google OAuth** (`@react-oauth/google`)
- **Leaflet / React-Leaflet** for maps & geolocation UI
- **Axios** for API calls
- **Custom CSS** (no framework required)
- **Deployment:** Vercel (recommended) or any static hosting + API base URL

---

## 📦 Project Structure (frontend)

```
Capstone-II-Frontend-main/
├── .env.example
├── .gitignore
├── README.md
├── eslint.config.mjs
├── package-lock.json
├── package.json
├── vercel.json
├── webpack.config.js
├── dist/
│   ├── index.html
│   ├── react-logo.svg
│   └── spongebob-404.webp
├── public/
│   ├── background.png
│   ├── hero-map-illustration.png
│   ├── icon-badge-collector.png
│   ├── icon-badges.png
│   ├── icon-mountain.png
│   ├── icon-pathfinder.png
│   ├── icon-progress.png
│   ├── icon-sharpeye.png
│   ├── icon-speedrunner.png
│   ├── icon-trailblazer.png
│   ├── index.html
│   ├── react.svg
│   ├── whitelogo2.png
│   └── leaflet/
│       ├── marker-icon-2x.png
│       ├── marker-icon.png
│       └── marker-shadow.png
└── src/
    ├── ApiClient.js
    ├── App.jsx
    ├── AppStyles.css
    ├── UseSSE.js
    ├── auth0-config.js
    ├── shared.js
    └── components/
        ├── AuthStyles.css
        ├── CheckpointFieldset.jsx
        ├── CreateHunt.css
        ├── CreateHunt.jsx
        ├── Home.css
        ├── Home.jsx
        ├── Login.jsx
        ├── NavBar.jsx
        ├── NavBarStyles.css
        ├── NotFound.jsx
        └── Signup.jsx
```

> **Note:** Image assets are expected in `/public` so they can be referenced with `/filename.png` paths (e.g., `/whitelogo2.png`).

---

## 🔧 Environment Variables

Create a `.env` file at the frontend root. Since this is a React app without Vite, use the **`REACT_APP_`** prefix:

```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_FRONTEND_URL=http://localhost:3000
```

- `REACT_APP_BACKEND_URL` should match your Express API base (local or production).
- Your backend should also be configured with proper CORS to allow the `REACT_APP_FRONTEND_URL` origin.

---

## ▶️ Run Locally

> Requires **Node 18+** and **npm 9+**.

```bash
# 1) Install dependencies
npm install

# 2) Start the dev server
npm run start-dev

# 3) Build for production
npm run build

# 4) (Optional) Run tests / lint
npm test
npm run lint
```

The app should be available at **http://localhost:3000**.

---

## 🔐 Authentication (Google OAuth)

- Uses `@react-oauth/google`. Wrap the app with `GoogleOAuthProvider` using `REACT_APP_GOOGLE_CLIENT_ID`.
- After successful OAuth, the backend issues a **secure, HTTP-only cookie** (JWT session). The frontend reads auth state via a `/me` (or similar) endpoint — not from localStorage.
- Ensure your **OAuth Authorized JavaScript origins** and **redirect URIs** include local and production URLs.

---

## 🗺️ Maps & Geolocation

- Add Leaflet styles once in your app entry (e.g., `import 'leaflet/dist/leaflet.css';`).
- For built-in marker assets, many bundlers require explicit imports. If you see missing marker icons, you can either:
  - rely on default assets provided by your bundler, **or**
  - import and wire them:

    ```js
    import L from 'leaflet';
    import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
    import markerIcon from 'leaflet/dist/images/marker-icon.png';
    import markerShadow from 'leaflet/dist/images/marker-shadow.png';

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
    ```

- Use `navigator.geolocation.getCurrentPosition()` and/or `watchPosition()` for live player location (with clear loading and error states).
- Checkpoint validation uses `{ lat, lng, toleranceRadius }` (server-authoritative).

---

## 🔒 Protected Views & Roles

Use an auth guard or hook (e.g., `useAuth`) to gate routes:

- **Player:** `/play`, `/badges`, `/join`
- **Creator:** `/create` (and creator dashboard)
- **Admin:** admin tools (if present)

If you prefer to avoid a wrapper component, redirect inline based on auth state in each protected page.

---

## 🧩 API Endpoints (expected)

These are typical endpoints the frontend calls (adjust to match your backend):

- `POST /api/auth/google` — exchanges Google token for session cookie
- `GET /api/auth/me` — returns current user
- `POST /api/hunts` — create a hunt (creator)
- `GET /api/hunts/:huntId` — fetch hunt info + checkpoints
- `POST /api/hunts/:huntId/submit` — submit riddle answer + GPS
- `GET /api/users/:id/badges` — list earned badges
- `GET /api/leaderboard` or `/api/leaderboard/:huntId` — ranks & stats

---

## 🧭 Routes

| Route            | Access             | Description                                        |
|------------------|--------------------|----------------------------------------------------|
| `/`              | Public             | Home (hero/CTAs/features)                          |
| `/login`         | Public             | Google sign-in                                     |
| `/signup`        | Public             | (If separate from login)                           |
| `/create`        | Creator            | Create hunt with interactive map                   |
| `/join`          | Player             | Join by code / (optional) QR scan                  |
| `/play`          | Player             | Live play view (GPS + riddle flow)                 |
| `/leaderboard`   | Public / Player    | Rankings, times, badge counts                      |
| `/badges`        | Player             | Earned vs locked badges                            |

---

## 🎨 Design Notes

- **Assets:** `/public/whitelogo2.png`, `/public/hero-map-illustration.png`, `/public/background.png`
- **Style:** flat vector + soft glow highlights; readable contrasts for outdoor/bright conditions
- **CTA Buttons:** stacked on mobile, generous hit areas, consistent width with hero text
- **Badges:** grayscale when locked; hover tooltips show source checkpoint & description

---

## 🧪 QA Checklist

- [ ] OAuth sign-in works locally and in production
- [ ] CORS allows the frontend origin; session cookie is set (Secure + HTTP-only in prod)
- [ ] Leaflet map and markers render correctly on all pages
- [ ] Riddle submission handles loading, “too far” error, and retry
- [ ] Protected views redirect when unauthenticated
- [ ] Images load from `/public` paths in both dev and prod
- [ ] Layout matches mockups at **375px**, **768px**, **1024px**, **1440px**

---

## 🤝 Contributing

1. Create a feature branch:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Commit changes:
   ```bash
   git commit -m "feat: add my-feature"
   ```
3. Push and open a Pull Request:
   ```bash
   git push origin feat/my-feature
   ```

---

## 📄 License


MIT
