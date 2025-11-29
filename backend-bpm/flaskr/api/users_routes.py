from flask import Blueprint

users_bp = Blueprint('users', __name__, url_prefix='/users')

# ----------------------------------------------------------------------
#                               USERS
# ----------------------------------------------------------------------
@users_bp.route("/", methods=["GET"])
def get_all_users():
    return {"users": []}

@users_bp.route("/signup", methods=["POST"])
def user_signup():
    return {"user": []}

@users_bp.route("/signin", methods=["POST"])
def user_signin():
    return {"user": []}