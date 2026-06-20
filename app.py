import os
from datetime import datetime, timezone

from flask import Flask, render_template, request, make_response

from i18n import make_t, lang_name as _lang_name, SUPPORTED_LANGS, DEFAULT_LANG
from news_fetcher import (
    fetch_all,
    search_articles,
    fetch_briefing,
    get_categories,
    get_languages,
    get_category_name,
    get_language_name,
)
from weather_fetcher import fetch_weather
from markets_fetcher import fetch_markets
from info_fetcher import fetch_air_quality, PRACTICAL_LINKS, EVENTS_SOURCES

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'daily-news-bolzano-dev')


def get_ui_lang():
    lang = request.args.get('ui_lang')
    if lang and lang in SUPPORTED_LANGS:
        return lang
    lang = request.cookies.get('ui_lang')
    if lang and lang in SUPPORTED_LANGS:
        return lang
    return DEFAULT_LANG


def _time_ago(dt_str, t):
    if not dt_str:
        return ''
    try:
        dt = datetime.fromisoformat(dt_str)
        delta = datetime.now(timezone.utc) - dt
        mins = int(delta.total_seconds() / 60)
        if mins < 1:
            return t('time.just_now')
        if mins < 60:
            return t('time.min_ago', m=mins)
        hours = mins // 60
        if hours < 24:
            return t('time.hour_ago', h=hours)
        days = hours // 24
        return t('time.day_ago', d=days)
    except Exception:
        return ''


def _category_name(cat, t):
    names = {
        'bolzano': t('filter.bolzano'),
        'news': t('filter.news'),
        'local': t('filter.local'),
        'sport': t('filter.sport'),
        'culture': t('filter.culture'),
    }
    return names.get(cat, cat.capitalize())


def inject_template_vars(route_func):
    def wrapper(*args, **kwargs):
        ui_lang = get_ui_lang()
        t = make_t(ui_lang)
        resp = route_func(ui_lang=ui_lang, t=t, *args, **kwargs)
        if isinstance(resp, tuple):
            template, ctx = resp
            ctx['t'] = t
            ctx['ui_lang'] = ui_lang
            ctx['lang_name'] = _lang_name
            ctx['SUPPORTED_LANGS'] = SUPPORTED_LANGS
            ctx['time_ago'] = lambda dt: _time_ago(dt, t)
            ctx['get_category_name'] = lambda cat: _category_name(cat, t)
            ctx['get_language_name'] = get_language_name
            rendered = render_template(template, **ctx)
            response = make_response(rendered)
            response.set_cookie('ui_lang', ui_lang, max_age=365*24*3600)
            return response
        return resp
    wrapper.__name__ = route_func.__name__
    return wrapper


@app.route('/')
@inject_template_vars
def dashboard(ui_lang, t):
    weather = fetch_weather()
    markets = fetch_markets()
    brief, _ = fetch_briefing(hours=48, max_articles=8)
    bolzano_news, _ = fetch_all(category='bolzano')

    return 'dashboard.html', {
        'weather': weather,
        'markets': markets,
        'brief': brief,
        'bolzano_news': bolzano_news,
    }


@app.route('/news')
@inject_template_vars
def news(ui_lang, t):
    category = request.args.get('category', 'all')
    lang = request.args.get('lang', 'all')

    articles, errors = fetch_all(category=category, lang=lang)
    categories = get_categories()
    languages = get_languages()

    return 'news.html', {
        'articles': articles,
        'categories': categories,
        'languages': languages,
        'selected_category': category,
        'selected_lang': lang,
        'errors': errors,
    }


@app.route('/briefing')
@inject_template_vars
def briefing(ui_lang, t):
    hours = request.args.get('hours', 24, type=int)
    articles, errors = fetch_briefing(hours=hours, max_articles=15)

    weather = fetch_weather()
    markets = fetch_markets()

    return 'briefing.html', {
        'articles': articles,
        'weather': weather,
        'markets': markets,
        'errors': errors,
        'hours': hours,
    }


@app.route('/search')
@inject_template_vars
def search(ui_lang, t):
    q = request.args.get('q', '').strip()
    category = request.args.get('category', 'all')
    lang = request.args.get('lang', 'all')

    results = []
    errors = []

    if q:
        results, errors = search_articles(q, category=category, lang=lang)

    categories = get_categories()
    languages = get_languages()

    return 'search.html', {
        'query': q,
        'results': results,
        'categories': categories,
        'languages': languages,
        'selected_category': category,
        'selected_lang': lang,
        'errors': errors,
    }


@app.route('/profile')
@inject_template_vars
def profile(ui_lang, t):
    categories = get_categories()
    languages = get_languages()
    return 'profile.html', {
        'categories': categories,
        'languages': languages,
        'get_category_name': lambda cat: _category_name(cat, t),
        'get_language_name': get_language_name,
    }


@app.route('/learn')
@inject_template_vars
def learn(ui_lang, t):
    return 'learn.html', {}


@app.route('/info')
@inject_template_vars
def info(ui_lang, t):
    air = fetch_air_quality()
    return 'info.html', {
        'aq': air,
        'links': PRACTICAL_LINKS,
        'events': EVENTS_SOURCES,
    }


@app.route('/stats')
@inject_template_vars
def stats(ui_lang, t):
    return 'stats.html', {}


@app.route('/digest')
@inject_template_vars
def digest(ui_lang, t):
    articles, errors = fetch_briefing(hours=24, max_articles=10)
    return 'digest.html', {
        'articles': articles,
        'errors': errors,
        'get_category_name': lambda cat: _category_name(cat, t),
        'get_language_name': get_language_name,
    }


@app.route('/api/news')
def api_news():
    from flask import jsonify
    category = request.args.get('category', 'all')
    lang = request.args.get('lang', 'all')
    articles, errors = fetch_all(category=category, lang=lang)
    return jsonify({'articles': articles, 'errors': errors})


@app.route('/api/weather')
def api_weather():
    from flask import jsonify
    return jsonify(fetch_weather())


@app.route('/api/markets')
def api_markets():
    from flask import jsonify
    return jsonify(fetch_markets())


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
