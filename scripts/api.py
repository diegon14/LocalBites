from flask import Flask, request, jsonify
from flask_cors import CORS
from ranking import rank_restaurants, load_data

api = Flask(__name__)
CORS(api)

@api.route("/recommend", methods=["POST"])
def recommend():
    data = request.json
    lat = data["lat"]
    lon = data["lon"]

    restaurants = load_data("data/restaurants_filtered.csv")
    results = rank_restaurants(
        restaurants,
        lat,
        lon
    )

    formatted = []
    for r, dist in results:
        formatted.append({
            "name": r["name"],
        })

    return jsonify(formatted)

if __name__ == "__main__":
    api.run(debug=True)
