from http.server import BaseHTTPRequestHandler
import json
import urllib.request
from urllib.parse import urlparse, parse_qs

# Official PSX Data Portal Timeseries Endpoint
BASE_URL = "https://dps.psx.com.pk/timeseries/int/"

def fetch_precise_price(symbol):
    url = f"{BASE_URL}{symbol.upper()}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                body = response.read().decode()
                data = json.loads(body)
                if data and "data" in data and len(data["data"]) > 0:
                    # Latest trade is index 0
                    latest_trade = data["data"][0] 
                    price = latest_trade[1]
                    return {"price": price, "source": "Official PSX Floor (Real-Time)"}
    except Exception as e:
        return {"error": str(e)}
    return None

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse query params (e.g., ?symbol=ENGRO)
        query_components = parse_qs(urlparse(self.path).query)
        symbol = query_components.get("symbol", ["PSX"])[0].upper()

        result = fetch_precise_price(symbol)

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        # Essential for Vercel to allow the Node route to call this
        self.send_header('Access-Control-Allow-Origin', '*') 
        self.end_headers()
        
        self.wfile.write(json.dumps(result).encode('utf-8'))
        return