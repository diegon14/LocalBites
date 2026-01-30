###
# Converts restaurant data exported from Overpass Turbo (GeoJSON file)
# into a CSV file with all restuarants that provide at least:  
# name, cuisine, longitude, and latitude
#
# Extracted fields:
# "name", "cuisine",
# "lat", "lon",
# "city", "street", "postcode", "state",
# "opening_hours", "phone", "website"
###
import json
import csv

INPUT_FILE = "data/export.geojson"
OUTPUT_FILE = "data/restaurants_filtered.csv"

# would make hours required but very few have their hours posted
# bare minimum for search: name, cuisine, location (search purely on distance)
REQUIRED_PROPERTIES = ["name", "cuisine"]

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

features = data.get("features", [])
filtered_rows = []

for feature in features:
    properties = feature.get("properties", {})
    geometry = feature.get("geometry", {})

    if not all(field in properties for field in REQUIRED_PROPERTIES):
        continue

    if geometry.get("type") != "Point":
        continue

    coordinates = geometry.get("coordinates", [])
    if len(coordinates) != 2:
        continue
    lon, lat = coordinates
    if lat is None or lon is None:
        continue

    row = {
        "name": properties.get("name"),
        "cuisine": properties.get("cuisine", ""),
        "lat": lat,
        "lon": lon,
        "city": properties.get("addr:city", ""),
        "street": properties.get("addr:street", ""),
        "postcode": properties.get("addr:postcode", ""),
        "state": properties.get("addr:state", ""),
        "opening_hours": properties.get("opening_hours", ""),
        "phone": properties.get("phone", ""),
        "website": properties.get("website", "")
    }

    filtered_rows.append(row)

fieldnames = [
    "name", "cuisine",
    "lat", "lon",
    "city", "street", "postcode", "state",
    "opening_hours", "phone", "website"
]

with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(filtered_rows)

print(f"Saved {len(filtered_rows)} valid restaurants to {OUTPUT_FILE}")
