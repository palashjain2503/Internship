# LiveCase.ai (Static Demo + Flask Skeleton)

This repo contains a static React-in-HTML frontend mock and a minimal Flask backend scaffold. No features are implemented yet; this is a visual and structural baseline.

## Structure
- `frontend/` static demo (open in a browser)
- `backend/` Flask API skeleton

## Run the frontend (static demo)
Option A: Open the HTML file directly
- Open `frontend/LiveCase.ai.html` in a browser.

Option B: Serve with a simple static server (recommended)
- From the repo root, run:

```powershell
# Python 3
python -m http.server 8080
```

- Then open: `http://localhost:8080/frontend/LiveCase.ai.html`

## Run the backend (Flask skeleton)
- From the repo root, run:

```powershell
# Create a virtual environment (optional)
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r backend\requirements.txt

# Start the API
python backend\app.py
```

- Health check: `http://localhost:5000/api/health`

## Notes
- Frontend uses React via CDN and Babel in the browser. It is not wired to the backend yet.
- Backend routes currently return `not_implemented` placeholders.
