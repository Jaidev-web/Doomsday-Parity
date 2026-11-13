"""
Firebase stub — placeholder for future Firestore integration.
"""


class FirebaseDB:
    def __init__(self):
        self.initialized = False

    def initialize(self, credentials_path: str = None):
        """Initialize Firebase connection (stub)."""
        self.initialized = True

    def get_collection(self, name: str):
        raise NotImplementedError("Firebase integration not yet implemented. Using MockDB.")
