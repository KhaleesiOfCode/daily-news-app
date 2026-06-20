import ssl

if hasattr(ssl, '_create_unverified_context'):
    ssl._create_default_https_context = ssl._create_unverified_context

MARKETS = [
    {'name': 'FTSE MIB', 'ticker': 'FTSEMIB.MI', 'country': 'Italy'},
    {'name': 'DAX', 'ticker': '^GDAXI', 'country': 'Germany'},
    {'name': 'S&P 500', 'ticker': '^GSPC', 'country': 'USA'},
    {'name': 'EUR/USD', 'ticker': 'EURUSD=X', 'country': 'Forex'},
    {'name': 'Bitcoin', 'ticker': 'BTC-USD', 'country': 'Crypto'},
]


def fetch_markets():
    try:
        import yfinance as yf
    except ImportError:
        return {'error': 'yfinance not installed'}

    results = []
    for m in MARKETS:
        try:
            t = yf.Ticker(m['ticker'])
            info = t.info
            price = (
                info.get('regularMarketPrice')
                or info.get('currentPrice')
                or info.get('previousClose')
                or info.get('bid')
            )
            change = info.get('regularMarketChange')
            change_pct = info.get('regularMarketChangePercent')

            if change_pct is not None:
                change_pct = round(change_pct, 2)

            results.append({
                'name': m['name'],
                'ticker': m['ticker'],
                'country': m['country'],
                'price': price,
                'change': change,
                'change_pct': change_pct,
            })
        except Exception as e:
            results.append({
                'name': m['name'],
                'ticker': m['ticker'],
                'country': m['country'],
                'price': None,
                'change': None,
                'change_pct': None,
                'error': str(e)[:60],
            })

    return results
