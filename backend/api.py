from flask import Flask, request, jsonify
from flask_cors import CORS
from ranking import rank_restaurants, load_data

import os
import json
import uuid
import statistics
from collections import Counter
from datetime import datetime, timezone
from typing import Optional
from zoneinfo import ZoneInfo

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
    """Get the current time in UTC as an ISO 8601 string."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

def build_user_profile(history_path: str) -> Optional[dict]:
    """
    Read the search history JSONL and derive a soft preference profile.

    Returns a dict with keys:
      - top_cuisine: str | None   -- most frequently signalled cuisine
      - price:       int | None   -- modal price level seen in results
      - lat:         float        -- median search latitude
      - lon:         float        -- median search longitude
      - event_count: int          -- total number of history events

    Returns None if the history file doesn't exist or has no usable events.
    """
    if not os.path.exists(history_path):
        return None

    events = []
    with open(history_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    events.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    if not events:
        return None

    cuisine_counter: Counter = Counter()
    for event in events:
        if event.get("cuisine"):
            cuisine_counter[event["cuisine"].lower()] += 3
        for r in event.get("top_results", []):
            raw = r.get("cuisine") or ""
            for part in raw.replace(";", ",").split(","):
                part = part.strip().lower()
                if part:
                    cuisine_counter[part] += 1

    top_cuisine = cuisine_counter.most_common(1)[0][0] if cuisine_counter else None

    price_values = []
    for event in events:
        for r in event.get("top_results", []):
            p = r.get("price_range")
            if p is not None:
                try:
                    price_values.append(int(p))
                except (ValueError, TypeError):
                    pass

    price = statistics.mode(price_values) if price_values else None

    lats = [e["lat"] for e in events if "lat" in e]
    lons = [e["lon"] for e in events if "lon" in e]
    lat = statistics.median(lats) if lats else None
    lon = statistics.median(lons) if lons else None

    if lat is None or lon is None:
        return None

    return {
        "top_cuisine": top_cuisine,
        "price": price,
        "lat": lat,
        "lon": lon,
        "event_count": len(events),
    }

@api.route("/for-you", methods=["POST"])
def for_you():
    data = request.get_json(force=True, silent=True) or {}
    max_distance_miles = data.get("max_distance_miles", 10)

    profile = build_user_profile(HISTORY_PATH)

    if not profile:
        return ("", 204)

    current_time = datetime.now(ZoneInfo("America/Los_Angeles"))
    restaurants = load_data("data/new_restaurant_data.csv")

    results = rank_restaurants(
        restaurants,
        profile["lat"],
        profile["lon"],
        cuisine=profile["top_cuisine"],
        q=None,
        current_time=current_time,
        max_distance_miles=max_distance_miles,
        price_range=profile["price"],
    )

    formatted = []
    for r, dist in results:
        formatted.append({
            "name": r["name"],
            "lat": r["lat"],
            "lon": r["lon"],
            "cuisine": r.get("cuisine"),
            "distance_miles": round(dist, 2),
            "price_range": r.get("price"),
        })

    return jsonify({
        "profile": {
            "top_cuisine": profile["top_cuisine"],
            "price": profile["price"],
            "based_on_searches": profile["event_count"],
        },
        "results": formatted,
    })

@api.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json(force=True)

    lat = data["lat"]
    lon = data["lon"]
    cuisine = data.get("cuisine", None)
    q = data.get("q")
    max_distance_miles = data.get("max_distance_miles")
    current_time = datetime.now(ZoneInfo("America/Los_Angeles"))
    price_range = data.get("price_range", None)

    restaurants = load_data("data/new_restaurant_data.csv")

    results = rank_restaurants(
        restaurants,
        lat,
        lon,
        cuisine=cuisine,
        q=q,
        current_time=current_time,
        max_distance_miles=max_distance_miles,
        price_range=price_range
    )

    formatted = []
    for r, dist in results:
        formatted.append({
            "name": r["name"],
            "lat": r["lat"],
            "lon": r["lon"],
            "cuisine": r.get("cuisine"),
            "distance_miles": round(dist, 2),
            "price_range": r.get("price")
        })

    event = {
        "event_id": str(uuid.uuid4()),
        "ts": now_utc_iso(),
        "lat": lat,
        "lon": lon,
        "cuisine": cuisine,
        "result_count": len(formatted),
        "top_results": formatted[:5],
    }
    append_jsonl(HISTORY_PATH, event)

    return jsonify(formatted)

if __name__ == "__main__":
    api.run(debug=True)