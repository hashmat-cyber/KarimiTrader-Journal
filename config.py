import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "karimi-trader-journal-secret-key")

    DATABASE_PATH = BASE_DIR / "journal.db"
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DATABASE_PATH}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = BASE_DIR / "uploads"
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024

    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
