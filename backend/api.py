from flask import Flask, request, jsonify
from flask_cors import CORS
from ranking import rank_restaurants, load_data

import os
import json
import uuid
from datetime import datetime, timezone

api = Flask(__name__)
CORS(api)

HISTORY_DIR = os.path.join(os.path.dirname(__file__), "history")
HISTORY_PATH = os.path.join(HISTORY_DIR, "search_history.jsonl")

def append_jsonl(path: str, record: dict) -> None:
    """Append one JSON record to a JSONL file."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

def now_utc_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


@api.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json(force=True)

    lat = data["lat"]
    lon = data["lon"]
    cuisine = data.get("cuisine", None)
    q = data.get("q")

    restaurants = load_data("data/restaurants_filtered.csv")

    results = rank_restaurants(
        restaurants,
        lat,
        lon,
        cuisine=cuisine,
        q=q
    )

    formatted = []
    for r, dist in results:
        formatted.append({
            "name": r["name"],
            "cuisine": r.get("cuisine"),
            "distance_miles": round(dist, 2),
        })

    # log the search event (JSONL append). Auto-create history directory and file if not exist.
    event = {
        "event_id": str(uuid.uuid4()),
        "ts": now_utc_iso(),
        "lat": lat,
        "lon": lon,
        "cuisine": cuisine,
        "result_count": len(formatted),
        # keep a small preview for later modeling; adjust as you like
        "top_results": formatted[:5],
        # optional metadata (useful later, but not required):
        # "ip": request.headers.get("X-Forwarded-For", request.remote_addr),
        # "user_agent": request.headers.get("User-Agent"),
    }
    append_jsonl(HISTORY_PATH, event)


    return jsonify(formatted)

if __name__ == "__main__":
    api.run(debug=True)
