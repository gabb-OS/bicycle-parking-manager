from flask import Blueprint, request, jsonify
from flaskr.extensions import db
from flaskr.models.users import User
from datetime import date
from sqlalchemy.exc import IntegrityError
from flaskr.guards.firebase_guard import firebase_guard

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
@firebase_guard
def user_signup(token):
    email = token.get('email')
    if not email:
        return jsonify({"error": "The token does not contain a valid email address."}), 400

    if User.get_by_email(email):
        return jsonify({"error": "This email address has already been used"}), 400

    username = token.get('name', email.split('@')[0])
    new_user, error = User.create_new_user(email, username)
    
    if error:
        return jsonify({"error": error}), 500
        
    return jsonify(new_user.to_dict()), 201


@users_bp.route("/signin", methods=["POST"])
@firebase_guard
def user_signin(token):
    email = token.get('email')
    user = User.get_by_email(email)

    if not user:
        return jsonify({"error": "User not found in the database"}), 404
        
    return jsonify(user.to_dict()), 200