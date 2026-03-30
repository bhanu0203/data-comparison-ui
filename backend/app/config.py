from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "datadiff.db"
UPLOAD_DIR = BASE_DIR / "app" / "uploads"
DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
]

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
