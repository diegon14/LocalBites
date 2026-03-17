import csv 
from geopy import distance
from business_hours import *
from scoring import *

def distance_in_miles(point1, point2):
    # given two points (lat, lon), returns the distance of the two points in miles
    return distance.distance(point1, point2).miles

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


def rank_restaurants(restaurants, user_lat, user_lon, cuisine=None, q=None, current_time=None, max_distance_miles=None, price_range=None):
    query_tokens = tokenize(q)
    ranked_restaurants = []

    for r in restaurants:
        # calculate max distance
        dist = distance_in_miles((user_lat, user_lon), (r["lat"], r["lon"]))
        
        # check if too far
        if max_distance_miles and dist > max_distance_miles:
            continue

        # check if open
        if current_time:
            if r.get("opening_hours") and r["opening_hours"].strip():
                if not is_open(current_time, r["opening_hours"]):
                    continue

        dist_score = calculate_distance_score(dist, max_distance_miles)
        price_score = calculate_price_score(r["price"], price_range)
        text_boost = calculate_text_match_score(r, query_tokens)
        cuisine_boost = calculate_cuisine_score(r.get("cuisine"), cuisine)
    
        score = dist_score * price_score * text_boost * cuisine_boost
        ranked_restaurants.append((r, dist, score))
    
    # Return top 15 results (restaurant, dist)
    ranked_restaurants.sort(key=lambda x: -x[2])
    return [(r, dist) for (r, dist, score) in ranked_restaurants[:15]]
        

if __name__ == "__main__":
    restaurants = load_data("data/new_restaurant_data.csv")
    results = rank_restaurants(restaurants, 33.6430, -117.8412)
    print(results)
