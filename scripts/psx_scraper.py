import urllib.request

import json

import sys



# Official PSX Data Portal Timeseries Endpoint

BASE_URL = "https://dps.psx.com.pk/timeseries/int/"



def fetch_precise_price(symbol):

    """

    Fetches the precise Last Traded Price (LTP) from the official PSX timeseries feed.

    This corresponds to the 136.45-style floor prices.

    """

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

               

                # IMPORTANT: THE PSX TIMESERIES DATA IS ORDERED [LATEST -> OLDEST]

                # data['data'][0] is the Last Traded Price (LTP)

                if data and "data" in data and len(data["data"]) > 0:

                    latest_trade = data["data"][0] # Take the FIRST element (Latest)

                    price = latest_trade[1]

                    return {"price": price, "source": "Official PSX Floor (Real-Time)"}

            return None

    except Exception:

        return None



if __name__ == "__main__":

    if len(sys.argv) < 2:

        print(json.dumps({"error": "Symbol required"}))

        sys.exit(1)

       

    symbol = sys.argv[1].upper()

    result = fetch_precise_price(symbol)

   

    if result:

        print(json.dumps(result))

    else:

        print(json.dumps({"error": "Official price unavailable"}))

