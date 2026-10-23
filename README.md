# SpendNest — Revenue Intelligence Inbox

### Manager Workspace & Conversation Triage

Turn sales calls and meetings into actionable insights. Review conversations, track next steps, apply routing decisions, and export structured reports from one workspace.

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=nodedotjs&logoColor=white)](https://expressjs.com/)
[![Vercel](https://img.shields.io/badge/Frontend%20Hosting-Vercel-black?logo=vercel)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Backend%20Hosting-Render-46E3B7?logo=render&logoColor=black)](https://render.com/)

**Live App:** https://app-eight-tan-46.vercel.app  
**Backend Health:** https://spendnest-z5jf.onrender.com/api/health  
**GitHub Repository:** https://github.com/srimathi412/SpendNest

---

## 1. Project Overview

SpendNest is a revenue-intelligence and conversation-triage workspace for reviewing sales calls and meetings. It helps managers identify important conversation signals, organize records into routes, review action items, replay updated data batches, and export reports.

The application uses a React frontend and a Node.js/Express REST API. The supplied dataset and data contract are treated as the source of truth. Missing transcripts are not fabricated, and unsupported revenue figures are not inferred.

## 2. System Architecture

![SpendNest System Architecture](spendnest-architecture%282%29.png)

**Request Flow:**

Browser → Vercel-hosted React frontend → HTTPS requests to the Render Express API → JSON responses and export files.

### Main Components

- **Frontend (`app/`)** — React, TypeScript, Vite, Tailwind CSS and JSZip.
- **Backend (`server/`)** — Node.js, Express, CORS and REST endpoints.
- **Input Data** — `01_initial.json` and `02_update.json` replay batches.
- **State Management** — Local development can persist state to a JSON file. The deployed Render free service uses ephemeral runtime storage, so state and manual overrides can reset when the service restarts.
- **Deployment** — Frontend hosted on Vercel and backend hosted on Render.

> **Persistence note:** The current Render deployment does not use a durable database. For persistent production use, integrate PostgreSQL or another persistent storage solution.

## 3. Key Features

### Dashboard
- View total records, calls and meetings.
- Monitor transcript coverage and reported connection rate.
- Review the action-item queue.
- View the manager daily brief.

### Conversation Inbox
- Search and filter call and meeting records.
- Inspect available transcript evidence.
- Review conversation details and important signals.

### Routing & Review
- Review suggested conversation routes.
- Apply manual route overrides.
- Organize conversations into relevant categories.

### Import & Replay
- Import the initial dataset and update batches.
- Prevent duplicate records during repeated imports.
- Apply newer record revisions according to the replay contract.

### Exports & Manifest
- Generate route-based Markdown briefs.
- Generate JSON and CSV manifests.
- Download structured ZIP exports.

### Dictionary & Rules
- Review classification categories.
- Inspect routing rules and terminology.

### Backend Health Check
- Verify API availability.
- Inspect record counts, transcript counts and storage status.

## 4. Data Integrity Rules

- Each record is identified by the composite key `(source_type, source_id)`.
- Re-importing the same batch must not create duplicate records.
- Newer revisions replace older revisions according to the replay contract.
- The manual route override for `M07` should survive the update workflow while its record advances to revision 2.
- Missing transcript content remains missing; the application must not invent transcript data.

### Initial Dataset Metrics

| Metric | Value |
|---|---:|
| Total records | 44 |
| Calls | 30 |
| Meetings | 14 |
| Usable transcripts | 17 |
| Transcript coverage | 38.6% |
| Reported connection rate | 36.7% (11/30) |

After applying the update batch, the expected dataset contains 44 records and 18 usable transcripts, giving transcript coverage of 40.9%.

## 5. Technology Stack

| Area | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| ZIP Export | JSZip |
| Backend | Node.js, Express |
| API | REST, CORS, JSON |
| Development Storage | JSON file and in-memory state |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Version Control | Git and GitHub |

## 6. Project Structure

```text
Revenue Intelligence Inbox/
├── app/                       # React + Vite frontend
│   ├── public/data/            # Initial and update JSON batches
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── utils/              # API, replay, metrics, search, storage
│   │   └── types/
│   ├── tests/
│   └── package.json
├── server/                    # Express backend
│   ├── routes/                 # Health, records, ingest, overrides, reset, exports
│   ├── services/               # Replay, storage, export logic
│   ├── data/                   # Seed datasets
│   ├── tests/
│   └── package.json
├── data/                      # Original assignment datasets
├── exports/                   # Generated route briefs and manifests
├── docs/
│   └── spendnest-architecture.png
├── DATA_CONTRACT.md
├── DATA_DICTIONARY.md
├── README.md
└── .gitignore
```

## 7. Getting Started Locally

### Prerequisites

- Node.js and npm
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/srimathi412/SpendNest.git
cd SpendNest
```

### Step 2: Start the Backend

Open a terminal and run:

```bash
cd server
npm install
npm start
```

The backend uses the configured local port during development and `process.env.PORT` in production. Check the startup logs for the exact port.

Test the health endpoint using the local port:

```text
http://localhost:5000/api/health
```

If the backend starts on a different port, use the port printed in the logs.

### Step 3: Start the Frontend

Open a second terminal from the repository root:

```bash
cd app
npm install
```

Create a file named `.env.local` inside the `app/` folder with:

```env
VITE_API_URL=http://localhost:5000
```

Use the actual backend port if it differs. Then start the frontend:

```bash
npm run dev -- --port 5174
```

Open the local URL printed by Vite, commonly:

```text
http://localhost:5174
```

If `VITE_API_URL` is not configured, the frontend can use its existing client-local mode. When configured, API operations use the backend.

## 8. Backend API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health and storage summary |
| GET | `/api/records` | List records and replay state |
| GET | `/api/records/:sourceType/:sourceId` | Retrieve a record |
| POST | `/api/ingest` | Ingest a supported batch |
| GET | `/api/overrides` | List manual route overrides |
| POST | `/api/overrides` | Save a manual route override |
| DELETE | `/api/overrides/:sourceType/:sourceId` | Remove a manual override |
| POST | `/api/reset` | Reset to the initial batch |
| GET | `/api/exports/manifest.json` | Retrieve JSON manifest |
| GET | `/api/exports/manifest.csv` | Retrieve CSV manifest |
| GET | `/api/exports/download` | Download ZIP export |

Refer to `DATA_CONTRACT.md` and `DATA_DICTIONARY.md` for the data schema and replay rules.

## 9. Testing and Production Build

### Backend Tests

```bash
cd server
npm test
```

### Frontend Tests

```bash
cd app
npm test
```

### Frontend Production Build

```bash
npm run build
```

The last reported local verification completed with:

- Backend: 10/10 tests passed.
- Frontend: 24/24 tests passed.
- Frontend production build: successful.

Re-run the tests after making code changes.

## 10. Deployment

### Backend Deployment — Render

1. Push the repository to GitHub.
2. Create a Render Web Service connected to the repository.
3. Set the **Root Directory** to `server`.
4. Set the **Build Command** to `npm install`.
5. Set the **Start Command** to `npm start`.
6. Configure the following environment variables:

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://app-eight-tan-46.vercel.app,https://app-62spwvkq2-srimathi412s-projects.vercel.app
```

7. Deploy and verify the `/api/health` endpoint.

**Deployed Backend:** https://spendnest-z5jf.onrender.com

### Frontend Deployment — Vercel

1. Import the GitHub repository into Vercel.
2. Configure the frontend project root directory as `app` if needed.
3. Add the following Production environment variable:

```env
VITE_API_URL=https://spendnest-z5jf.onrender.com
```

4. Redeploy after changing environment variables.
5. Verify API connectivity, replay behavior, manual overrides and ZIP exports.

**Deployed Frontend:** https://app-eight-tan-46.vercel.app

## 11. Known Limitations

- Render free-tier runtime storage is ephemeral. State and manual overrides may reset after a restart or redeploy.
- Login, authentication and multi-user role-based access are not implemented.
- The assignment dataset does not contain verified CRM deal values or margins; therefore, the application should not be used to claim actual revenue totals.
- AI/LLM capabilities should be described only to the extent implemented and configured in the current codebase.

## 12. Future Enhancements

- Add durable database storage.
- Implement authentication and role-based permissions if required.
- Expand automated integration and end-to-end testing.
- Improve monitoring, accessibility and responsive behavior.

## 13. Contributing

1. Create a branch for your change.
2. Make a focused update.
3. Run backend tests, frontend tests and the production build.
4. Document the changes in your pull request.

## License

No license has been specified. Add a license file before redistributing or reusing the project beyond its current intended scope.
