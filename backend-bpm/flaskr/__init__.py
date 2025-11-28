from flask import Flask
from flaskr.config import Config
from flaskr.database import db
from flask_cors import CORS
from app.modules import areas

# Initialize Flask app
app = Flask(__name__)

# Enable CORS
CORS(app)

app.register_blueprint(areas.blueprint)


app.config.from_object(Config)
app.config["SQLALCHEMY_DATABASE_URI"] = app.config.get("DB_URL")

# db.init_app(app)

# Table users
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def json(self):
        return {'id': self.id,'username': self.username, 'email': self.email}
# db.create_all()



# MISC
@app.get("/")
def hello_world():
    return f"<p>Hello, World!</p>"

# ----------------------------------------------------------------------
#                               USERS
# ----------------------------------------------------------------------
@app.post("/user/signup/")
def user_signup():
    return {"areas": []}

@app.post("/user/signin/")
def user_signin():
    return {"areas": []}




# ----------------------------------------------------------------------
#                           PARKING EVENTS
# ----------------------------------------------------------------------
# Signal a 'parking event' (from the App)
# Incoming request payload must contain:
#  - user id
#  - gps coordinates
#  - timestamp
@app.post("/event/parking/")
def parking_event():
    return {"status": "success"}

# Get all user 'parking events' (from the App)
@app.get("/event/parking/<userId>")
def get_user_parking_events():
    return {"status": "success"}