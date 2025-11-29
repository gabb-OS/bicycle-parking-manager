from flask import Flask
from flaskr.config import Config
from flaskr.extensions import db, migrate
from flask_cors import CORS
from flaskr.models import areas, users
from flaskr.models import areas as areas_model, users as users_model


# Initialize Flask app
app = Flask(__name__)

# Enable CORS
CORS(app)

app.register_blueprint(areas.areas_bp)
app.register_blueprint(users.users_bp)


app.config.from_object(Config)
app.config["SQLALCHEMY_DATABASE_URI"] = app.config.get("DB_URL")
app.config['SQLALCHEMY_ECHO'] = False
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate.init_app(app, db)

with app.app_context():
    db.create_all()


# MISC
@app.get("/")
def hello_world():
    return f"<p>Hello, World!</p>"


