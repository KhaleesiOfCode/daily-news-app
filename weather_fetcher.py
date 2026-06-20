import requests
import ssl

if hasattr(ssl, '_create_unverified_context'):
    ssl._create_default_https_context = ssl._create_unverified_context

LOCATION = 'Bolzano'

def fetch_weather():
    try:
        r = requests.get(
            'https://wttr.in/{}?format=j1'.format(LOCATION),
            timeout=10,
            headers={'User-Agent': 'Mozilla/5.0'},
        )
        r.raise_for_status()
        data = r.json()

        current = data['current_condition'][0]

        forecasts = []
        for day in data['weather'][:4]:
            forecasts.append({
                'date': day['date'],
                'max': day['maxtempC'],
                'min': day['mintempC'],
                'avg': day['avgtempC'],
                'desc': day['hourly'][0]['weatherDesc'][0]['value'],
                'icon': day['hourly'][0]['weatherIconUrl'][0]['value'],
            })

        return {
            'location': LOCATION,
            'region': data['nearest_area'][0]['region'][0]['value'],
            'temp': current['temp_C'],
            'feels_like': current['FeelsLikeC'],
            'humidity': current['humidity'],
            'wind_speed': current['windspeedKmph'],
            'wind_dir': current['winddir16Point'],
            'pressure': current['pressure'],
            'visibility': current['visibility'],
            'desc': current['weatherDesc'][0]['value'],
            'icon': current['weatherIconUrl'][0]['value'],
            'forecast': forecasts,
        }
    except Exception as e:
        return {'error': str(e), 'location': LOCATION}
