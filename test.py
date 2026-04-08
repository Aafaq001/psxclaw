import urllib.request
import json

url = "http://localhost:3000/api/beginner"
data = {
  "budget": "a", "goal": "b", "riskComfort": "c", "horizon": "d"
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR: {e.code}")
    print(e.read().decode())
