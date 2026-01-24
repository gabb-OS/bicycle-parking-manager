from flask import Flask
from flaskr.config import Config
from flaskr.extensions import db, migrate
from flask_cors import CORS
from flaskr.api.users_routes import users_bp
from flaskr.api.areas_routes import areas_bp
from flaskr.api.events_routes import events_bp
from flaskr.commands import seed_db_command
from flaskr.models import parking_areas as areas_model, users as users_model, events as events_model
from flaskr.privacy_stats.privacy_scripts.privacy_perturbation import calculate_privacy_perturbation, generate_privacy_plots
import firebase_admin
from firebase_admin import credentials


# Initialize Flask app
app = Flask(__name__)

# Enable CORS
CORS(app)

app.register_blueprint(areas_bp)
app.register_blueprint(users_bp)
app.register_blueprint(events_bp)


app.config.from_object(Config)
app.config["SQLALCHEMY_DATABASE_URI"] = app.config.get("DB_URL")
app.config['SQLALCHEMY_ECHO'] = False
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate.init_app(app, db)
app.cli.add_command(seed_db_command)

# Firebase initialization with private key
cred = credentials.Certificate("flaskr/keys/firebase-private-key.json")
firebase_admin.initialize_app(cred)

# with app.app_context():
#     db.create_all()


# MISC
@app.get("/")
def hello_world():
    return f"<p>Hello, World!</p>"

# MISC
@app.get("/geoprivacy")


@app.route("/geoprivacy")
def geoprivacy():
    target_dir = "flaskr/privacy_stats/privacy_plots"
    data = calculate_privacy_perturbation(output_dir=target_dir)
    msg = generate_privacy_plots(data, output_dir=target_dir)
    
    return {
        "message": msg,
        "data": data
    }



