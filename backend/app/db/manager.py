from app.config import settings
from app.db.mock_db import MockDB
from app.db.firebase import FirebaseDB

class DatabaseManager:
    def __init__(self):
        self._db = None

    @property
    def db(self):
        if self._db is None:
            if settings.DEMO_MODE:
                self._db = MockDB()
            else:
                self._db = FirebaseDB()
                self._db.initialize()
        return self._db

db_manager = DatabaseManager()
db = db_manager.db # Backward compatibility for direct imports
