from flask import Blueprint, request, jsonify
from flaskr.extensions import db
from flaskr.models.users import User
from datetime import date
from sqlalchemy.exc import IntegrityError

users_bp = Blueprint('users', __name__, url_prefix='/users')

# ----------------------------------------------------------------------
#                               USERS
# ----------------------------------------------------------------------
@users_bp.route("/", methods=["GET"])
def get_all_users():
    users = User.query.all()
    # Convert list of objects to list of dictionaries
    return jsonify({"users": [user.to_dict() for user in users]})

@users_bp.route("/signup", methods=["POST"])
def user_signup():
    data = request.get_json()
    
    # Basic Validation
    if not data or "username" not in data:
        return jsonify({"error": "Username is required"}), 400
        
    username = data["username"]
    
    # Check if user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "User already exists"}), 409

    # Create new user
    new_user = User(username=username, created_at=date.today())
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify(new_user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@users_bp.route("/signin", methods=["POST"])
def user_signin():
    return {"user": []}