import json
from pathlib import Path

TRANSLATIONS_DIR = Path(__file__).parent / 'translations'

SUPPORTED_LANGS = ['en', 'it', 'de']
DEFAULT_LANG = 'en'  # English is the default UI language

_cache = {}


def _load_lang(lang):
    if lang in _cache:
        return _cache[lang]
    filepath = TRANSLATIONS_DIR / '{}.json'.format(lang)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        _cache[lang] = data
        return data
    except (FileNotFoundError, json.JSONDecodeError):
        _cache[lang] = {}
        return {}


def get_text(key, lang=DEFAULT_LANG, **kwargs):
    translations = _load_lang(lang)
    text = translations.get(key)
    if text is None:
        fallback = _load_lang(DEFAULT_LANG)
        text = fallback.get(key, key)
    if kwargs:
        try:
            text = text.format(**kwargs)
        except KeyError:
            pass
    return text


def make_t(lang):
    def t(key, **kwargs):
        return get_text(key, lang=lang, **kwargs)
    return t


def lang_name(lang):
    names = {'en': 'English', 'it': 'Italiano', 'de': 'Deutsch'}
    return names.get(lang, lang.upper())
