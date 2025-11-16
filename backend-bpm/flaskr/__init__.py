from flask import Flask
from flaskr.config import Config
from flaskr.database import db

app = Flask(__name__)
app.config.from_object(Config)
app.config["SQLALCHEMY_DATABASE_URI"] = app.config.get("DB_URL")
# db.init_app(app)

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def json(self):
        return {'id': self.id,'username': self.username, 'email': self.email}
    
# db.create_all()


@app.route("/")
def hello_world():
    return f"<p>Hello, World!</p>"
