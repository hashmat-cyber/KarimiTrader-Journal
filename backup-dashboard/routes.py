from functools import wraps
from pathlib import Path
from datetime import datetime

from flask import (
    Blueprint,
    request,
    jsonify,
    session,
    current_app
)

from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from .database import db
from .models import User, Trade


api = Blueprint(
    "api",
    __name__,
    url_prefix="/api"
)


def login_required(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({
                "error": "Login required"
            }), 401

        return function(*args, **kwargs)

    return wrapper


def allowed_file(filename):
    if not filename or "." not in filename:
        return False

    extension = filename.rsplit(
        ".",
        1
    )[1].lower()

    return extension in current_app.config[
        "ALLOWED_EXTENSIONS"
    ]


# -------------------------
# AUTH
# -------------------------

@api.post("/register")
def register():
    data = request.get_json() or {}

    username = data.get(
        "username",
        ""
    ).strip()

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

    if not username or not email or not password:
        return jsonify({
            "error": "All fields are required"
        }), 400

    if len(password) < 6:
        return jsonify({
            "error": "Password must be at least 6 characters"
        }), 400

    existing_user = User.query.filter(
        (User.username == username) |
        (User.email == email)
    ).first()

    if existing_user:
        return jsonify({
            "error": "Username or email already exists"
        }), 409

    user = User(
        username=username,
        email=email,
        password=generate_password_hash(password)
    )

    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id
    session["username"] = user.username

    return jsonify({
        "message": "Registration successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }), 201


@api.post("/login")
def login():
    data = request.get_json() or {}

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

    user = User.query.filter_by(
        email=email
    ).first()

    if not user or not check_password_hash(
        user.password,
        password
    ):
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    session["user_id"] = user.id
    session["username"] = user.username

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    })


@api.post("/logout")
def logout():
    session.clear()

    return jsonify({
        "message": "Logged out successfully"
    })


@api.get("/me")
def current_user():
    if "user_id" not in session:
        return jsonify({
            "authenticated": False
        })

    user = User.query.get(
        session["user_id"]
    )

    if not user:
        session.clear()

        return jsonify({
            "authenticated": False
        })

    return jsonify({
        "authenticated": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    })


# -------------------------
# TRADES
# -------------------------

def save_trade_image(file, image_type):
    """
    Save one trade screenshot and return its filename.
    image_type is either 'before' or 'after'.
    """

    if not file or not file.filename:
        return None

    if not allowed_file(file.filename):
        raise ValueError(
            f"Invalid {image_type} screenshot format"
        )

    upload_folder = Path(
        current_app.config["UPLOAD_FOLDER"]
    )

    upload_folder.mkdir(
        parents=True,
        exist_ok=True
    )

    original_filename = secure_filename(
        file.filename
    )

    timestamp = datetime.utcnow().strftime(
        "%Y%m%d%H%M%S%f"
    )

    filename = (
        f"{session['user_id']}_"
        f"{image_type}_"
        f"{timestamp}_"
        f"{original_filename}"
    )

    file.save(
        upload_folder / filename
    )

    return filename


@api.post("/trades")
@login_required
def create_trade():
    data = request.form.to_dict()

    required_fields = [
        "trade_date",
        "symbol",
        "direction",
        "result"
    ]

    for field in required_fields:
        if not data.get(field):
            return jsonify({
                "error": f"{field} is required"
            }), 400

    before_file = request.files.get(
        "before_screenshot"
    )

    after_file = request.files.get(
        "after_screenshot"
    )

    # Validate both files before saving anything.
    for file, image_type in [
        (before_file, "before"),
        (after_file, "after")
    ]:
        if file and file.filename:
            if not allowed_file(file.filename):
                return jsonify({
                    "error": (
                        f"Invalid {image_type} "
                        "screenshot format"
                    )
                }), 400

    before_filename = None
    after_filename = None

    try:
        if before_file and before_file.filename:
            before_filename = save_trade_image(
                before_file,
                "before"
            )

        if after_file and after_file.filename:
            after_filename = save_trade_image(
                after_file,
                "after"
            )

    except ValueError as error:
        return jsonify({
            "error": str(error)
        }), 400

    trade = Trade(
        user_id=session["user_id"],

        trade_date=data.get(
            "trade_date"
        ),

        symbol=data.get(
            "symbol"
        ),

        direction=data.get(
            "direction"
        ),

        entry_price=to_float(
            data.get("entry_price")
        ),

        stop_loss=to_float(
            data.get("stop_loss")
        ),

        take_profit=to_float(
            data.get("take_profit")
        ),

        lot_size=to_float(
            data.get("lot_size")
        ),

        profit_loss=(
            to_float(
                data.get("profit_loss")
            ) or 0
        ),

        result=data.get(
            "result"
        ),

        strategy=data.get(
            "strategy"
        ),

        entry_reason=data.get(
            "entry_reason"
        ),

        emotion=data.get(
            "emotion"
        ),

        mistakes=data.get(
            "mistakes"
        ),

        lesson=data.get(
            "lesson"
        ),

        # Keep legacy field empty for new trades.
        screenshot=None,

        before_screenshot=before_filename,

        after_screenshot=after_filename
    )

    db.session.add(trade)
    db.session.commit()

    return jsonify({
        "message": "Trade saved successfully",
        "trade": trade_to_dict(trade)
    }), 201


@api.get("/trades")
@login_required
def get_trades():
    trades = Trade.query.filter_by(
        user_id=session["user_id"]
    ).order_by(
        Trade.created_at.desc()
    ).all()

    return jsonify([
        trade_to_dict(trade)
        for trade in trades
    ])


@api.get("/trades/<int:trade_id>")
@login_required
def get_trade(trade_id):
    trade = Trade.query.filter_by(
        id=trade_id,
        user_id=session["user_id"]
    ).first()

    if not trade:
        return jsonify({
            "error": "Trade not found"
        }), 404

    return jsonify(
        trade_to_dict(trade)
    )


@api.delete("/trades/<int:trade_id>")
@login_required
def delete_trade(trade_id):
    trade = Trade.query.filter_by(
        id=trade_id,
        user_id=session["user_id"]
    ).first()

    if not trade:
        return jsonify({
            "error": "Trade not found"
        }), 404

    db.session.delete(trade)
    db.session.commit()

    return jsonify({
        "message": "Trade deleted successfully"
    })


# -------------------------
# DASHBOARD
# -------------------------

@api.get("/stats")
@login_required
def statistics():
    trades = Trade.query.filter_by(
        user_id=session["user_id"]
    ).all()

    total = len(trades)

    wins = sum(
        1
        for trade in trades
        if trade.result
        and trade.result.lower() == "win"
    )

    losses = sum(
        1
        for trade in trades
        if trade.result
        and trade.result.lower() == "loss"
    )

    breakeven = sum(
        1
        for trade in trades
        if trade.result
        and trade.result.lower() == "breakeven"
    )

    total_profit = sum(
        trade.profit_loss or 0
        for trade in trades
    )

    win_rate = (
        (wins / total) * 100
        if total > 0
        else 0
    )

    return jsonify({
        "total_trades": total,
        "wins": wins,
        "losses": losses,
        "breakeven": breakeven,
        "win_rate": round(
            win_rate,
            2
        ),
        "total_profit_loss": round(
            total_profit,
            2
        )
    })


# -------------------------
# HELPERS
# -------------------------

def to_float(value):
    if value in (
        None,
        "",
        "null"
    ):
        return None

    try:
        return float(value)

    except (
        TypeError,
        ValueError
    ):
        return None


def datetime_now_string():
    return datetime.utcnow().strftime(
        "%Y%m%d%H%M%S%f"
    )


def trade_to_dict(trade):
    return {
        "id": trade.id,

        "trade_date": trade.trade_date,

        "symbol": trade.symbol,

        "direction": trade.direction,

        "entry_price": trade.entry_price,

        "stop_loss": trade.stop_loss,

        "take_profit": trade.take_profit,

        "lot_size": trade.lot_size,

        "profit_loss": trade.profit_loss,

        "result": trade.result,

        "strategy": trade.strategy,

        "entry_reason": trade.entry_reason,

        "emotion": trade.emotion,

        "mistakes": trade.mistakes,

        "lesson": trade.lesson,

        # Legacy field.
        "screenshot": trade.screenshot,

        # New fields.
        "before_screenshot": (
            trade.before_screenshot
        ),

        "after_screenshot": (
            trade.after_screenshot
        ),

        "created_at": (
            trade.created_at.isoformat()
            if trade.created_at
            else None
        )
    }
