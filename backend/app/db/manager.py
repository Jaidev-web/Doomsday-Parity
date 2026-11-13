from app.config import settings
from app.db.mock_db import MockDB
from app.db.mongodb import MongoDB

class DatabaseManager:
    def __init__(self):
        self._db = None

    @property
    def db(self):
        if self._db is None:
            if settings.DEMO_MODE:
                self._db = MockDB()
            elif settings.DATABASE_BACKEND.lower() == "mongodb":
                self._db = MongoDB()
                self._db.initialize()
            else:
                raise RuntimeError("DATABASE_BACKEND must be 'mongodb'.")
        return self._db

db_manager = DatabaseManager()
db = db_manager.db # Backward compatibility for direct imports
