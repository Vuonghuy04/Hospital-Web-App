# Hospital Web App

A full-stack demo with React (frontend), Node/Express (backend), MongoDB (behavior tracking), and Keycloak (auth).

## Quick Start (Docker Compose)

1) Create a `.env` file in the project root with your MongoDB connection string (Atlas or local):

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/hospital_analytics?retryWrites=true&w=majority
```

2) Start the stack:

```
docker compose up -d --build
```

3) Open the apps:
- Frontend: http://localhost:5173
- Backend health: http://localhost:5050/api/health
- Database viewer: http://localhost:5050/api/database-viewer
- Keycloak: http://localhost:8080 (user: admin / pass: admin)

Note: If port 5000 is reserved by macOS Control Center, backend is exposed on 5050.

## MongoDB Options

- Atlas (recommended): Use your Atlas connection string in `MONGO_URI`.
- Local Docker Mongo: A `mongo` service is included in compose; switch backend env to `mongodb://mongo:27017/hospital_analytics` if desired.

## Frontend Only (local dev)

```
npm install
npm start
```
- CRA dev server runs on http://localhost:3000
- API base is configured in `src/services/behaviorTracking.ts` via `REACT_APP_API_BASE_URL` (defaults used in Docker Compose).

## Backend Only (local dev)

```
cd backend
npm install
MONGO_URI="<your-connection-string>" npm run dev
```
- Backend runs on http://localhost:5000 (or set `PORT`)
- Health: `/api/health`, DB viewer: `/api/database-viewer`

## Keycloak

- Compose imports realm from `demo-realm.json` and starts Keycloak at http://localhost:8080
- Frontend defaults: realm `demo`, client `demo-client`, URL `http://localhost:8080`

## Production Frontend Image

A multi-stage Dockerfile builds the React app and serves it via nginx.

Build and run frontend image only:
```
docker build -t hospital-frontend .
docker run -p 3000:3000 hospital-frontend
```

## Troubleshooting

- Port 5000 in use: backend is exposed on 5050 in compose.
- Keycloak realm import error: ensure image `quay.io/keycloak/keycloak:26.2.5` is used.
- Mongo connection errors: verify `MONGO_URI` credentials, IP allowlist, and network access in Atlas.
