import csv 
from datetime import datetime
from geopy import distance

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

def rank_restaurants(restaurants, user_lat, user_lon, cuisine=None, current_time=None):
    ranked_restaurants = []
    for r in restaurants:
        dist = distance_in_miles((user_lat, user_lon), (r["lat"], r["lon"]))
        ranked_restaurants.append((r, dist))
        # to be implemented
        # if restuarant not open, do not include in ranking (not a valid choice for lunch

        # weighted score based on: distance, and cuisine preference
    ranked_restaurants.sort(key=lambda x: x[1])

    # cuisine filtering
    ranked_restaurants = filter_by_cuisine(ranked_restaurants, cuisine)
    
    return ranked_restaurants[:15]
        

if __name__ == "__main__":
    restaurants = load_data("data/restaurants_filtered.csv")
    results = rank_restaurants(restaurants, 33.64931, -117.84638) # uci coordinates for testing
    print(results)
