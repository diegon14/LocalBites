import requests

# Flask server url
url = "http://127.0.0.1:5000/recommend"

payload = {
    "lat": 33.64931,
    "lon": -117.84638,
    "cuisine": "mexican",
    "q": "tacos",
    "current_time": "2025-01-02T12:00:00Z",
    "max_distance_miles": 100,
}

# POST request
response = requests.post(url, json=payload)

print("Status Code:", response.status_code)

try:
    print("Response JSON:", response.json())
except Exception:
    print("Non-JSON response body:")
    print(response.text)