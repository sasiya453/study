# Spaced Repetition App (SM-2)

Features:
- JWT auth (email/password)
- Decks and cards CRUD
- Study mode with SM‑2 (Hard/Medium/Easy)
- Stats: due today, next 7 days, reviewed today, success rate

## Local dev

Backend:
1. cd backend
2. cp .env.example .env
3. npm ci
4. npm run dev (or npm start)
   - Default: http://localhost:4000

Frontend:
1. cd frontend
2. cp .env.example .env
3. npm ci
4. npm run dev
   - Default: http://localhost:5173

## Deploy

Backend → Render (free):
1. Push this repo to GitHub.
2. Create a new Render Web Service:
   - Choose "Build and deploy from a Git repo".
   - It will detect `render.yaml`. Select it.
   - After first deploy, set CORS_ORIGIN to your Pages URL (e.g., https://username.github.io/repo).
   - Render attaches a persistent disk for SQLite.
3. Note the public backend URL (e.g., https://srs-backend.onrender.com).

Frontend → GitHub Pages:
1. In your GitHub repo:
   - Settings → Pages → Build and deployment → GitHub Actions (no branch selection needed).
   - Settings → Secrets and variables → Actions → Variables → New variable:
     - Name: `VITE_API_URL`
     - Value: your deployed backend URL from Render (e.g., https://srs-backend.onrender.com)
2. If the repo is a project site (username.github.io/repo), update frontend/vite.config.js:
   - `base: "/your-repo-name/"`
3. Commit & push. The workflow `.github/workflows/frontend.yml` will build and deploy.
4. Visit your Pages URL.

## Notes
- For production, prefer httpOnly cookies over localStorage for JWTs and set proper CORS/CSRF. This demo keeps it simple.
- If you change the repo name or Pages URL, update:
  - Render env `CORS_ORIGIN`
  - GitHub repo variable `VITE_API_URL`
  - Vite `base` (if project site)
- SM‑2 tuning: mapping is Hard=2, Medium=3, Easy=5; min EF=1.3.