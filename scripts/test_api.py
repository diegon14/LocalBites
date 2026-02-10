import requests

# Flask server url
url = "http://127.0.0.1:5000/recommend"

payload = {
    "lat": 33.64931,
    "lon": -117.84638
}

# POST request
response = requests.post(url, json=payload)
print("Status Code:", response.status_code)
print("Response JSON:", response.json())