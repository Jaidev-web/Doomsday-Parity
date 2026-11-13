from typing import Dict, List, Optional, Any
import uuid


class MockDB:
    def __init__(self):
        self.candidates: Dict[str, dict] = {}
        self.documents: Dict[str, dict] = {}
        self.verifications: Dict[str, dict] = {}
        self.interviews: Dict[str, dict] = {}
        self.ai_history: Dict[str, dict] = {}
        self.users: Dict[str, dict] = {}

    def _get_collection(self, collection: str) -> Dict[str, dict]:
        return getattr(self, collection, {})

    # Generic CRUD
    def add(self, collection: str, item: dict) -> dict:
        col = self._get_collection(collection)
        if "id" not in item:
            item["id"] = str(uuid.uuid4())
        col[item["id"]] = item
        return item

    def get(self, collection: str, item_id: str) -> Optional[dict]:
        return self._get_collection(collection).get(item_id)

    def list(self, collection: str, filter_by: Optional[Dict[str, Any]] = None) -> List[dict]:
        items = list(self._get_collection(collection).values())
        if filter_by:
            for key, value in filter_by.items():
                items = [i for i in items if i.get(key) == value]
        return items

    def update(self, collection: str, item_id: str, data: dict) -> Optional[dict]:
        col = self._get_collection(collection)
        if item_id not in col:
            return None
        col[item_id].update(data)
        return col[item_id]

    def delete(self, collection: str, item_id: str) -> bool:
        col = self._get_collection(collection)
        if item_id in col:
            del col[item_id]
            return True
        return False


db = MockDB()
