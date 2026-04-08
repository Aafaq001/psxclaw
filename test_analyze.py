import urllib.request
import json

url = "http://localhost:3000/api/analyze"
data = {
  "ticker": "SYS",
  "strategy": "Growth",
  "timeframe": "1 year",
  "risk": "Medium",
  "messages": [{"role": "user", "content": "Analyze SYS for me."}]
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})

print("--- Testing 5-Agent Debate Pipeline ---")
try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        print(f"Model Used: {res.get('modelUsed')}")
        print("\nReport Excerpt:\n")
        print(res.get('content', [{}])[0].get('text', '')[:500] + "...")
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR: {e.code}")
    print(e.read().decode())
except Exception as e:
    print(f"ERROR: {str(e)}")
