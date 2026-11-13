import firebase_admin
from firebase_admin import credentials, firestore
from app.config import settings
from typing import Dict, List, Optional, Any

class FirebaseDB:
    def __init__(self):
        self.db = None
        self.initialized = False

    def initialize(self, credentials_path: str = None):
        if self.initialized:
            return

        cred_path = credentials_path or settings.FIREBASE_CREDENTIALS_PATH
        if not cred_path:
            raise ValueError("FIREBASE_CREDENTIALS_PATH must be set")

        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        self.db = firestore.client()
        self.initialized = True

    def _collection(self, collection: str):
        return self.db.collection(collection)

    def add(self, collection: str, item: dict) -> dict:
        if "id" not in item:
            import uuid
            item["id"] = str(uuid.uuid4())

        self._collection(collection).document(item["id"]).set(item)
        return item

    def get(self, collection: str, item_id: str) -> Optional[dict]:
        doc = self._collection(collection).document(item_id).get()
        return doc.to_dict() if doc.exists else None

    def list(self, collection: str, filter_by: Optional[Dict[str, Any]] = None) -> List[dict]:
        query = self._collection(collection)
        if filter_by:
            for key, value in filter_by.items():
                query = query.where(key, "==", value)

        docs = query.stream()
        return [doc.to_dict() for doc in docs]

    def update(self, collection: str, item_id: str, data: dict) -> Optional[dict]:
        doc_ref = self._collection(collection).document(item_id)
        if not doc_ref.get().exists:
            return None
        doc_ref.update(data)
        return doc_ref.get().to_dict()

    def delete(self, collection: str, item_id: str) -> bool:
        doc_ref = self._collection(collection).document(item_id)
        if not doc_ref.get().exists:
            return False
        doc_ref.delete()
        return True
