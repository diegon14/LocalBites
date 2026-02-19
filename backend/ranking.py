import csv 
from datetime import datetime
from geopy import distance
import re

def tokenize(text: str):
    """Lowercase, split into alphanumeric tokens."""
    if not text:
        return []
    return re.findall(r"[a-z0-9]+", text.lower())

def relevance_score(restaurant: dict, query_tokens: list[str]) -> int:
    """
    Simple scoring:
    - Name match is strong
    - Cuisine match is weaker
    - Multiple tokens accumulate
    """
    if not query_tokens:
        return 0

    name_tokens = set(tokenize(restaurant.get("name", "")))
    cuisine_tokens = set(tokenize(restaurant.get("cuisine", "")))

    score = 0
    for t in query_tokens:
        if t in name_tokens:
            score += 10
        if t in cuisine_tokens:
            score += 3

    return score



def distance_in_miles(point1, point2):
    # given two points (lat, lon), returns the distance of the two points in miles
    return distance.distance(point1, point2).miles

def is_open(hours, current_time):
    # to be implemented later
    # parse time from csv to datetime and check 
    # if opening hour fall into current time
    if not hours:
        return True
    
    return False

def load_data(csv_file):
    # takes in restaruant csv, cast coordinates to floats
    # stores data in array
    restaurants = []
    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row["lat"] = float(row["lat"])
            row["lon"] = float(row["lon"])
            row["price"] = int(row["price"])
            restaurants.append(row)
    return restaurants

def filter_by_cuisine(ranked_restaurants, cuisine):
    """
    ranked_restaurants: list of (restaurant_dict, dist)
    cuisine: optional string
    """
    if not cuisine:
        return ranked_restaurants

    cuisine_lower = cuisine.strip().lower()
    filtered = []
    for r, dist in ranked_restaurants:
        c = (r.get("cuisine") or "").lower()
        # partial match so "mex" can match "Mexican", etc.
        if cuisine_lower in c:
            filtered.append((r, dist))
    return filtered

def rank_restaurants(restaurants, user_lat, user_lon, cuisine=None, q=None, current_time=None):
    query_tokens = tokenize(q)

    ranked_restaurants = []
    for r in restaurants:
        dist = distance_in_miles((user_lat, user_lon), (r["lat"], r["lon"]))
        score = relevance_score(r, query_tokens)
        ranked_restaurants.append((r, dist, score))
        # to be implemented
        # if restuarant not open, do not include in ranking (not a valid choice for lunch

    # weighted score based on: distance, and cuisine preference
    # Filter by cuisine AFTER computing distance/score
    if cuisine:
        cuisine_lower = cuisine.strip().lower()
        ranked_restaurants = [
            (r, dist, score)
            for (r, dist, score) in ranked_restaurants
            if cuisine_lower in (r.get("cuisine") or "").lower()
        ]

    # If q is provided, sort by (score desc, distance asc). Otherwise distance only.
    if query_tokens:
        ranked_restaurants.sort(key=lambda x: (-x[2], x[1]))
    else:
        ranked_restaurants.sort(key=lambda x: x[1])
    
    # Return (restaurant, dist) pairs to match api.py format. hides score
    return [(r, dist) for (r, dist, score) in ranked_restaurants[:15]]
        

if __name__ == "__main__":
    restaurants = load_data("data/new_restaurant_data.csv")
    results = rank_restaurants(restaurants, 33.64931, -117.84638) # uci coordinates for testing
    print(results)
