from datetime import datetime
from .database import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(
        db.String(80),
        unique=True,
        nullable=False
    )

    email = db.Column(
        db.String(150),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    trades = db.relationship(
        "Trade",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan"
    )


class Trade(db.Model):
    __tablename__ = "trades"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    trade_date = db.Column(
        db.String(30),
        nullable=False
    )

    symbol = db.Column(
        db.String(30),
        nullable=False
    )

    direction = db.Column(
        db.String(10),
        nullable=False
    )

    entry_price = db.Column(
        db.Float,
        nullable=True
    )

    stop_loss = db.Column(
        db.Float,
        nullable=True
    )

    take_profit = db.Column(
        db.Float,
        nullable=True
    )

    lot_size = db.Column(
        db.Float,
        nullable=True
    )

    profit_loss = db.Column(
        db.Float,
        default=0
    )

    result = db.Column(
        db.String(20),
        nullable=False
    )

    strategy = db.Column(
        db.String(100),
        nullable=True
    )

    entry_reason = db.Column(
        db.Text,
        nullable=True
    )

    emotion = db.Column(
        db.String(100),
        nullable=True
    )

    mistakes = db.Column(
        db.Text,
        nullable=True
    )

    lesson = db.Column(
        db.Text,
        nullable=True
    )

    # Legacy screenshot field.
    # Kept so old trades remain compatible.
    screenshot = db.Column(
        db.String(255),
        nullable=True
    )

    # New screenshot fields.
    before_screenshot = db.Column(
        db.String(255),
        nullable=True
    )

    after_screenshot = db.Column(
        db.String(255),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )
