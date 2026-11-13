"""MongoDB persistence adapter for TrustHire collections and uploaded files."""

from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from gridfs import GridFSBucket
from pymongo import ASCENDING, MongoClient
from pymongo.errors import CollectionInvalid

from app.config import settings


class MongoDB:
    COLLECTIONS = (
        "users",
        "auth_otps",
        "auth_links",
        "candidates",
        "documents",
        "verifications",
        "interviews",
        "ai_history",
    )

    def __init__(self):
        self.client = None
        self.db = None
        self.files = None

    def initialize(self):
        if self.db is not None:
            return
        if not settings.MONGODB_URI:
            raise RuntimeError("Set MONGODB_URI in backend/.env to use MongoDB.")
        parsed = urlparse(settings.MONGODB_URI)
        database_name = settings.MONGODB_DATABASE or parsed.path.lstrip("/").split("/")[0]
        if not database_name:
            raise RuntimeError("Set MONGODB_DATABASE in backend/.env (for example: trusthire).")
        self.client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=8000)
        self.client.admin.command("ping")
        self.db = self.client[database_name]
        self.files = GridFSBucket(self.db, bucket_name="candidate_documents")
        self._ensure_collections_and_indexes()

    def _ensure_collections_and_indexes(self):
        existing = set(self.db.list_collection_names())
        for name in self.COLLECTIONS:
            if name not in existing:
                try:
                    self.db.create_collection(name)
                except CollectionInvalid:
                    # Another application worker may have created it concurrently.
                    pass

        self.db.users.create_index([("email", 1), ("role", 1)], unique=True, name="email_role_unique")
        self.db.auth_otps.create_index("expires_at", expireAfterSeconds=0, name="auth_otp_expiry")
        self.db.auth_links.create_index("expires_at", expireAfterSeconds=0, name="auth_link_expiry")
        self.db.candidates.create_index("email", name="candidate_email")
        self.db.candidates.create_index("user_id", name="candidate_user")
        self.db.documents.create_index("candidate_id", name="documents_candidate")
        self.db.verifications.create_index([("candidate_id", 1), ("module", 1)], name="verification_candidate_module")
        self.db.interviews.create_index("candidate_id", name="interview_candidate")
        self.db.ai_history.create_index("candidate_id", unique=True, name="ai_history_candidate_unique")
        self.db["candidate_documents.files"].create_index(
            [("filename", ASCENDING), ("uploadDate", ASCENDING)], name="gridfs_filename_upload_date"
        )
        self.db["candidate_documents.chunks"].create_index(
            [("files_id", ASCENDING), ("n", ASCENDING)], unique=True, name="gridfs_file_chunk_unique"
        )

    def _collection(self, collection: str):
        if self.db is None:
            self.initialize()
        return self.db[collection]

    @staticmethod
    def _clean(document: Optional[dict]) -> Optional[dict]:
        if document is None:
            return None
        document.pop("_id", None)
        return document

    def add(self, collection: str, item: dict) -> dict:
        import uuid

        data = dict(item)
        data.setdefault("id", str(uuid.uuid4()))
        self._collection(collection).replace_one({"_id": data["id"]}, {**data, "_id": data["id"]}, upsert=True)
        return data

    def get(self, collection: str, item_id: str) -> Optional[dict]:
        return self._clean(self._collection(collection).find_one({"_id": item_id}))

    def list(self, collection: str, filter_by: Optional[Dict[str, Any]] = None) -> List[dict]:
        query = self._collection(collection).find(filter_by or {})
        return [self._clean(item) for item in query]

    def update(self, collection: str, item_id: str, data: dict) -> Optional[dict]:
        result = self._collection(collection).update_one({"_id": item_id}, {"$set": data})
        return self.get(collection, item_id) if result.matched_count else None

    def delete(self, collection: str, item_id: str) -> bool:
        return self._collection(collection).delete_one({"_id": item_id}).deleted_count > 0

    def store_file(self, candidate_id: str, document_id: str, filename: str, content_type: str, content: bytes) -> str:
        if self.files is None:
            self.initialize()
        file_id = self.files.upload_from_stream(
            filename,
            content,
            metadata={"candidate_id": candidate_id, "document_id": document_id, "content_type": content_type},
        )
        return f"gridfs:{file_id}"

    def delete_file(self, storage_path: str) -> None:
        if not storage_path or not storage_path.startswith("gridfs:"):
            return
        from bson import ObjectId

        self.files.delete(ObjectId(storage_path.removeprefix("gridfs:")))

    def close(self):
        if self.client is not None:
            self.client.close()
            self.client = None
            self.db = None
            self.files = None
