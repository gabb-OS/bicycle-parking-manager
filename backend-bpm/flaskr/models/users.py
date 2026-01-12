from datetime import date
from flaskr.extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(), unique=True, nullable=True) 
    email = db.Column(db.String(), unique=True, nullable=False) 
    created_at = db.Column(db.Date, nullable=False)


    def __init__(self, username, email, created_at):
        self.username = username
        self.email = email
        self.created_at = created_at        
    
    @staticmethod
    def get_all():
        return User.query.all()

    @staticmethod
    def get_by_email(email):
        return User.query.filter_by(email=email).first()

    @staticmethod
    def get_by_username(username):        
        db_user = User.query.filter(User.username == username).first()
        return db_user
    
    @staticmethod
    def create_new_user(email, username):
        """Gestisce la creazione e il salvataggio di un nuovo utente."""
        new_user = User(
            username=username,
            email=email,
            created_at=date.today()
        )
        try:
            db.session.add(new_user)
            db.session.commit()
            return new_user, None
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    def to_dict(self):
        """Converts the object to a dictionary for JSON responses."""
        return {
            "id": self.id,
            "username": self.username if self.username else None,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<User {self.username}>"