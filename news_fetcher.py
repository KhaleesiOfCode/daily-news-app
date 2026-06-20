import json
import hashlib
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

import feedparser
import ssl

if hasattr(ssl, '_create_unverified_context'):
    ssl._create_default_https_context = ssl._create_unverified_context

SOURCES_FILE = Path(__file__).parent / 'sources.json'

LANG_NAMES = {'it': 'Italiano', 'de': 'Deutsch', 'en': 'English'}
CATEGORY_NAMES = {
    'bolzano': 'Bolzano',
    'local': 'Alto Adige / Südtirol',
    'news': 'Notizie / Nachrichten',
    'sport': 'Sport',
    'culture': 'Cultura / Kultur',
}


def load_sources():
    with open(SOURCES_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def _article_id(entry, source_name):
    raw = entry.get('id') or entry.get('link') or (source_name + entry.get('title', ''))
    return hashlib.md5(raw.encode()).hexdigest()[:12]


def _parse_entry(entry, source):
    title = entry.get('title', 'Senza titolo')
    link = entry.get('link', '#')
    summary_raw = entry.get('summary') or entry.get('description') or ''

    summary = re.sub(r'<[^>]+>', '', summary_raw)
    summary = summary.strip()[:500]

    published = entry.get('published_parsed') or entry.get('updated_parsed')
    published_dt = None
    if published:
        try:
            published_dt = datetime(*published[:6], tzinfo=timezone.utc)
        except Exception:
            published_dt = None

    media = None
    if 'media_content' in entry:
        for m in entry.media_content:
            if m.get('type', '').startswith('image'):
                media = m.get('url')
                break
    if not media and 'links' in entry:
        for lnk in entry.links:
            if lnk.get('type', '').startswith('image'):
                media = lnk.get('href')
                break

    return {
        'id': _article_id(entry, source['name']),
        'title': title,
        'summary': summary,
        'link': link,
        'media': media,
        'published': published_dt.isoformat() if published_dt else None,
        'published_ts': published_dt.timestamp() if published_dt else 0,
        'source': source['name'],
        'source_url': source.get('site_url', ''),
        'lang': source['lang'],
        'category': source['category'],
    }


def _do_fetch(filtered_sources):
    articles = []
    errors = []

    for source in filtered_sources:
        try:
            feed = feedparser.parse(source['feed_url'])
            if feed.bozo and not feed.entries:
                errors.append("{}: {}".format(source['name'], feed.bozo_exception))
            for entry in feed.entries:
                articles.append(_parse_entry(entry, source))
        except Exception as e:
            errors.append("{}: {}".format(source['name'], e))

    articles.sort(key=lambda a: a['published_ts'], reverse=True)
    return articles, errors


def fetch_all(category=None, lang=None):
    sources = load_sources()

    filtered = sources
    if category and category != 'all':
        filtered = [s for s in filtered if s['category'] == category]
    if lang and lang != 'all':
        filtered = [s for s in filtered if s['lang'] == lang]

    return _do_fetch(filtered)


def search_articles(query, category=None, lang=None):
    if not query:
        return [], []

    articles, errors = fetch_all(category=category, lang=lang)
    q = query.lower()
    results = [
        a for a in articles
        if q in a['title'].lower() or q in a['summary'].lower()
    ]
    return results, errors


def fetch_briefing(hours=24, max_articles=10):
    articles, errors = fetch_all()
    cutoff = datetime.now(timezone.utc).timestamp() - (hours * 3600)
    recent = [a for a in articles if a['published_ts'] >= cutoff]
    return recent[:max_articles], errors


def get_categories():
    sources = load_sources()
    return sorted(set(s['category'] for s in sources))


def get_languages():
    sources = load_sources()
    return sorted(set(s['lang'] for s in sources))


def get_category_name(cat):
    return CATEGORY_NAMES.get(cat, cat.capitalize())


def get_language_name(lang):
    return LANG_NAMES.get(lang, lang.upper())
