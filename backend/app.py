import os

from flask import Flask, send_from_directory
from flask_cors import CORS

from .config import Config
from .database import db
from .routes import api


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")


def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    CORS(
        app,
        supports_credentials=True
    )

    db.init_app(app)

    app.register_blueprint(api)

    os.makedirs(
        app.config["UPLOAD_FOLDER"],
        exist_ok=True
    )

    with app.app_context():
        db.create_all()

    @app.get("/")
    def index():
        return send_from_directory(
            FRONTEND_DIR,
            "index.html"
        )

    @app.get("/<path:path>")
    def frontend(path):
        file_path = os.path.join(
            FRONTEND_DIR,
            path
        )

        if os.path.isfile(file_path):
            return send_from_directory(
                FRONTEND_DIR,
                path
            )

        return send_from_directory(
            FRONTEND_DIR,
            "index.html"
        )

    @app.get("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(
            app.config["UPLOAD_FOLDER"],
            filename
        )

    @app.get("/health")
    def health():
        return {
            "status": "ok",
            "application": "KarimiTrader.Journal"
        }

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
