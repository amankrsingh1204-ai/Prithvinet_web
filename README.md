# Prithvinet_web

PrithviNet12 is now organized as a structured full-stack project:

- Frontend: React + Vite + TypeScript
- Backend: FastAPI + PostgreSQL + Gemini integration
- Realtime: WebSocket stream from FastAPI backend

## Project Structure

```text
ptithvinet12/
  backend/
    app/
      main.py
      db.py
      schemas.py
      services/
        ai_service.py
        water_quality.py
    requirements.txt
    .env.example
  src/
    App.tsx
    main.tsx
    index.css
    components/
      ComplianceCopilot.tsx
  index.html
  package.json
  vite.config.ts
  schema.sql
  sql/
    prithvinet_hierarchy_seed.sql
  README.md
```

## What Was Migrated

The old Node/Express backend in `server.ts` was removed and replaced by FastAPI.

Migrated backend features:

- Sensor APIs:
  - `GET /api/sensors`
  - `GET /api/logs/{sensor_id}`
  - `POST /api/simulate`
- Water quality API:
  - `GET /api/water-quality`
- AI APIs moved from frontend to backend:
  - `POST /api/ai/noise-forecast`
  - `POST /api/ai/generate-global-data`
  - `POST /api/ai/location-profile`
  - `POST /api/ai/forecast`
  - `POST /api/ai/dashboard-search`
  - `POST /api/ai/compliance-copilot`
  - `POST /api/ai/indian-industries`
- Realtime stream:
  - `WS /ws`

## Prerequisites

- Node.js 18+
- Python 3.10+

## Backend Setup (FastAPI)

1. Open terminal and go to backend folder:

```bash
cd backend
```

2. Create and activate virtual environment:

```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Create backend env file from template:

```bash
copy .env.example .env
```

5. Update `.env` values:

- `GEMINI_API_KEY`
- `DATA_GOV_IN_API_KEY` (optional fallback is present)
- `DATABASE_URL=postgresql://postgres:aman1204@localhost:5432/prithvinet`

6. Create PostgreSQL database:

```bash
psql -U postgres
CREATE DATABASE prithvinet;
```

7. Run hierarchy seed file:

```bash
psql -U postgres -d prithvinet -f sql/prithvinet_hierarchy_seed.sql
```

8. Run backend server:

```bash
uvicorn app.main:app --reload
```

## Frontend Setup (React + Vite)

1. Open another terminal in project root:

```bash
npm install
```

2. Start frontend + backend together (one command):

```bash
npm run dev
```

This runs:

- FastAPI backend on `http://127.0.0.1:8000`
- Vite frontend on `http://localhost:5173`

3. Optional: run services individually:

- Frontend only:

```bash
npm run dev:frontend
```

- Backend only:

```bash
npm run dev:backend
```

Vite is configured to proxy:

- `/api` -> `http://127.0.0.1:8000`
- `/ws` -> `http://127.0.0.1:8000`

So the frontend runs on `http://localhost:5173` and talks to FastAPI automatically.

## Environment Notes

- Frontend no longer exposes `GEMINI_API_KEY`.
- AI calls now happen on backend only.

## Development Notes

- PostgreSQL is used through psycopg2 with RealDictCursor.
- Database tables are auto-created on backend startup if missing.
- Hierarchy seed SQL can be imported from `sql/prithvinet_hierarchy_seed.sql`.

## API Quick Check

After backend starts, test:

- `GET http://127.0.0.1:8000/health`
- `GET http://127.0.0.1:8000/api/sensors`

## Next Improvements (Optional)

- Add backend routers (`app/routers/*`) for cleaner API separation.
- Add pydantic response models for all endpoints.
- Add pytest tests for API and service layers.
- Add Docker compose for one-command startup.
