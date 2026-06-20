import requests
import ssl
from datetime import datetime

if hasattr(ssl, '_create_unverified_context'):
    ssl._default_https_context = ssl._create_unverified_context

AIR_QUALITY_CACHE = None
AIR_QUALITY_TIME = 0


def fetch_air_quality():
    global AIR_QUALITY_CACHE, AIR_QUALITY_TIME
    now = datetime.now().timestamp()
    if AIR_QUALITY_CACHE and (now - AIR_QUALITY_TIME) < 1800:
        return AIR_QUALITY_CACHE

    try:
        r = requests.get(
            'https://api.waqi.info/feed/geo:46.5;11.35/?token=',
            timeout=8,
            headers={'User-Agent': 'Mozilla/5.0'},
        )
        data = r.json()
        if data.get('status') == 'ok':
            aq = data['data']
            result = {
                'aqi': aq.get('aqi'),
                'pm25': aq.get('iaqi', {}).get('pm25', {}).get('v'),
                'pm10': aq.get('iaqi', {}).get('pm10', {}).get('v'),
                'o3': aq.get('iaqi', {}).get('o3', {}).get('v'),
                'no2': aq.get('iaqi', {}).get('no2', {}).get('v'),
                'so2': aq.get('iaqi', {}).get('so2', {}).get('v'),
                'level': _aqi_level(aq.get('aqi')),
                'updated': aq.get('time', {}).get('s', ''),
            }
            AIR_QUALITY_CACHE = result
            AIR_QUALITY_TIME = now
            return result
    except Exception:
        pass

    return {'aqi': None, 'level': 'unavailable', 'error': True}


def _aqi_level(aqi):
    if aqi is None:
        return 'unknown'
    if aqi <= 50:
        return 'good'
    if aqi <= 100:
        return 'moderate'
    if aqi <= 150:
        return 'unhealthy_sensitive'
    if aqi <= 200:
        return 'unhealthy'
    if aqi <= 300:
        return 'very_unhealthy'
    return 'hazardous'


PRACTICAL_LINKS = [
    {
        'name': 'SASA Bus',
        'url': 'https://www.sasabz.it',
        'desc': 'Orari e percorsi autobus Bolzano',
        'lang': 'it',
        'icon': 'bus',
    },
    {
        'name': 'Comune di Bolzano',
        'url': 'https://www.comune.bolzano.it',
        'desc': 'Albo pretorio, avvisi, servizi comunali',
        'lang': 'it',
        'icon': 'government',
    },
    {
        'name': 'Provincia Autonoma',
        'url': 'https://www.provincia.bz.it',
        'desc': 'Servizi provinciali e informazioni',
        'lang': 'it',
        'icon': 'government',
    },
    {
        'name': 'Südtiroler Gemeinden',
        'url': 'https://www.gvcc.net',
        'desc': 'Gemeindedienste und Informationen',
        'lang': 'de',
        'icon': 'government',
    },
    {
        'name': 'Meteo Alto Adige',
        'url': 'https://www.meteo.provincia.bz.it',
        'desc': 'Bollettino meteorologico ufficiale',
        'lang': 'it',
        'icon': 'weather',
    },
    {
        'name': 'Wetter Südtirol',
        'url': 'https://wetter.provinz.bz.it',
        'desc': 'Amtliche Wettervorhersage',
        'lang': 'de',
        'icon': 'weather',
    },
    {
        'name': 'Emergency / Notfall',
        'url': 'https://www.provincia.bz.it/sicherheit-notfall',
        'desc': 'Numeri di emergenza / Notrufnummern',
        'lang': 'it',
        'icon': 'alert',
    },
    {
        'name': 'Trentino Trasporti',
        'url': 'https://www.trentinotrasporti.it',
        'desc': 'Trasporti regionali e orari treni',
        'lang': 'it',
        'icon': 'bus',
    },
    {
        'name': 'Open Data Alto Adige',
        'url': 'https://opendata.provincia.bz.it',
        'desc': 'Dati aperti della provincia',
        'lang': 'it',
        'icon': 'data',
    },
]

EVENTS_SOURCES = [
    {
        'name': 'Alto Adige Eventi',
        'url': 'https://www.altoadige.it/eventi',
        'desc': 'Eventi in Alto Adige',
    },
    {
        'name': 'Südtirol Events',
        'url': 'https://www.suedtirol.info/events',
        'desc': 'Veranstaltungen in Südtirol',
    },
]
