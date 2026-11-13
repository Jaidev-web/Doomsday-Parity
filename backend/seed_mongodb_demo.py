"""Seed missing demo records into MongoDB without overwriting existing records.

Run from the backend directory after configuring MONGODB_URI:
    python seed_mongodb_demo.py
"""

from app.config import settings
from app.db.mongodb import MongoDB
from app.demo.seed import seed_demo_data


def main():
    if not settings.MONGODB_URI:
        raise SystemExit("Set MONGODB_URI in backend/.env before seeding MongoDB.")

    database = MongoDB()
    try:
        database.initialize()
        seed_demo_data(database)
        candidate_ids = ("cand-sarah-001", "cand-marcus-002", "cand-priya-003")
        print("MongoDB demo seed finished (existing records were left unchanged).")
        print(f"Demo candidate records present: {sum(database.get('candidates', item_id) is not None for item_id in candidate_ids)}/3")
        for collection in ("verifications", "interviews", "ai_history"):
            print(f"{collection}: {len(database.list(collection))} records currently stored")
    except Exception as exc:
        raise SystemExit(f"Could not seed MongoDB ({type(exc).__name__}): {exc}") from exc
    finally:
        database.close()


if __name__ == "__main__":
    main()
