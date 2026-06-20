(function() {
  'use strict';

  var LS = window.localStorage;
  var PREFS_KEY = 'dn_preferences';
  var BOOKMARKS_KEY = 'dn_bookmarks';
  var STATS_KEY = 'dn_stats';
  var VOCAB_KEY = 'dn_vocabulary';

  /* ======================== PREFERENCES ======================== */
  var defaultPrefs = {
    categories: ['bolzano', 'news'],
    languages: ['all'],
    areas: ['bolzano'],
    digestTime: '08:00',
    learnMode: false,
  };

  function getPrefs() {
    try {
      return JSON.parse(LS.getItem(PREFS_KEY)) || defaultPrefs;
    } catch (e) { return defaultPrefs; }
  }

  function savePrefs(prefs) {
    LS.setItem(PREFS_KEY, JSON.stringify(prefs));
  }

  window.DN = window.DN || {};
  window.DN.getPrefs = getPrefs;
  window.DN.savePrefs = savePrefs;

  /* Apply saved preferences to page on load (auto-select filters) */
  function applyPrefsToFilters() {
    var prefs = getPrefs();
    var categorySelect = document.getElementById('category');
    var langSelect = document.getElementById('lang');
    if (categorySelect && prefs.categories.length === 1) {
      var val = prefs.categories[0];
      if (categorySelect.querySelector('option[value="' + val + '"]')) {
        if (!window.location.search.includes('category=')) {
          categorySelect.value = val;
        }
      }
    }
    if (langSelect && prefs.languages.length === 1) {
      var val = prefs.languages[0];
      if (langSelect.querySelector('option[value="' + val + '"]')) {
        if (!window.location.search.includes('lang=')) {
          langSelect.value = val;
        }
      }
    }
  }
  applyPrefsToFilters();

  /* ======================== BOOKMARKS ======================== */
  function getBookmarks() {
    try {
      return JSON.parse(LS.getItem(BOOKMARKS_KEY)) || [];
    } catch (e) { return []; }
  }

  function saveBookmarks(marks) {
    LS.setItem(BOOKMARKS_KEY, JSON.stringify(marks));
  }

  function toggleBookmark(article) {
    var marks = getBookmarks();
    var idx = marks.findIndex(function(m) { return m.id === article.id; });
    if (idx > -1) {
      marks.splice(idx, 1);
    } else {
      marks.unshift({
        id: article.id,
        title: article.title,
        link: article.link,
        source: article.source,
        summary: article.summary,
        savedAt: new Date().toISOString(),
        lang: article.lang,
      });
    }
    saveBookmarks(marks);
    return idx === -1;
  }

  function isBookmarked(id) {
    return getBookmarks().some(function(m) { return m.id === id; });
  }

  window.DN.toggleBookmark = toggleBookmark;
  window.DN.isBookmarked = isBookmarked;
  window.DN.getBookmarks = getBookmarks;

  /* Add bookmark + share buttons to article cards */
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.card').forEach(function(card) {
      var meta = card.querySelector('.card-meta');
      if (!meta) return;
      var id = card.dataset.articleId;
      if (!id) return;

      var shareUrl = (card.querySelector('.card-title a') || {}).href || '';
      var shareTitle = (card.querySelector('.card-title') || {}).textContent || '';

      var articleData = {
        id: id,
        title: shareTitle,
        link: shareUrl,
        source: (card.querySelector('.source') || {}).textContent || '',
        summary: (card.querySelector('.card-summary') || {}).textContent || '',
        lang: (card.querySelector('.lang-tag') || {}).className.match(/lang-(\w+)/) ? RegExp.$1 : '',
      };

      /* Bookmark button */
      var bmBtn = document.createElement('button');
      bmBtn.className = 'card-action-btn bookmark-btn';
      bmBtn.innerHTML = isBookmarked(id)
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
      bmBtn.title = isBookmarked(id) ? 'Remove bookmark' : 'Bookmark';
      bmBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var saved = toggleBookmark(articleData);
        bmBtn.innerHTML = saved
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
        bmBtn.title = saved ? 'Remove bookmark' : 'Bookmark';
      });
      meta.appendChild(bmBtn);

      /* Share button */
      var shareBtn = document.createElement('button');
      shareBtn.className = 'card-action-btn share-btn';
      shareBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
      shareBtn.title = 'Share';
      shareBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (navigator.share) {
          navigator.share({ title: shareTitle, url: shareUrl }).catch(function() {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl).then(function() {
            shareBtn.title = 'Copied!';
            setTimeout(function() { shareBtn.title = 'Share'; }, 2000);
          });
        }
      });
      meta.appendChild(shareBtn);
    });
  });

  /* ======================== READING STATS ======================== */
  function getStats() {
    try {
      return JSON.parse(LS.getItem(STATS_KEY)) || { reads: {}, streakStart: null, lastRead: null };
    } catch (e) { return { reads: {}, streakStart: null, lastRead: null }; }
  }

  function saveStats(stats) {
    LS.setItem(STATS_KEY, JSON.stringify(stats));
  }

  function trackRead(articleId, lang) {
    var stats = getStats();
    var today = new Date().toISOString().slice(0, 10);
    if (!stats.reads[today]) stats.reads[today] = { total: 0, it: 0, de: 0, en: 0 };
    stats.reads[today].total++;
    if (lang && stats.reads[today][lang] !== undefined) stats.reads[today][lang]++;
    stats.lastRead = today;
    if (!stats.streakStart) stats.streakStart = today;
    saveStats(stats);
  }

  function getStreak() {
    var stats = getStats();
    if (!stats.lastRead) return 0;
    var dates = Object.keys(stats.reads).sort();
    if (dates.length === 0) return 0;
    var streak = 1;
    var today = new Date();
    var check = new Date(today);
    for (var i = dates.length - 1; i >= 0; i--) {
      var d = new Date(dates[i] + 'T00:00:00');
      var diff = Math.round((today - d) / 86400000);
      if (diff === 0 || diff === 1) {
        if (diff === 1 && i === dates.length - 1) { streak = 1; break; }
        streak = dates.length - i;
      } else if (diff > 1) {
        break;
      }
    }
    return Math.min(streak, dates.length);
  }

  function getTotalReads() {
    var stats = getStats();
    return Object.values(stats.reads).reduce(function(sum, d) { return sum + (d.total || 0); }, 0);
  }

  function getLangBreakdown() {
    var stats = getStats();
    var breakdown = { it: 0, de: 0, en: 0 };
    Object.values(stats.reads).forEach(function(d) {
      breakdown.it += d.it || 0;
      breakdown.de += d.de || 0;
      breakdown.en += d.en || 0;
    });
    return breakdown;
  }

  window.DN.getStats = getStats;
  window.DN.trackRead = trackRead;
  window.DN.getStreak = getStreak;
  window.DN.getTotalReads = getTotalReads;
  window.DN.getLangBreakdown = getLangBreakdown;

  /* Track clicks on article links */
  document.addEventListener('click', function(e) {
    var link = e.target.closest('.card-title a');
    if (link) {
      var card = link.closest('.card');
      var id = card ? card.dataset.articleId : null;
      var lang = card ? (card.querySelector('.lang-tag') || {}).className.match(/lang-(\w+)/) : null;
      trackRead(id || 'unknown', lang ? RegExp.$1 : null);
    }
  });

  /* ======================== VOCABULARY (Language Learning) ======================== */
  function getVocab() {
    try {
      return JSON.parse(LS.getItem(VOCAB_KEY)) || [];
    } catch (e) { return []; }
  }

  function saveVocab(v) {
    LS.setItem(VOCAB_KEY, JSON.stringify(v));
  }

  function addWord(word, translation, fromLang) {
    var vocab = getVocab();
    var existing = vocab.find(function(w) { return w.word.toLowerCase() === word.toLowerCase(); });
    if (existing) {
      existing.count = (existing.count || 1) + 1;
    } else {
      vocab.unshift({
        word: word,
        translation: translation || '',
        fromLang: fromLang || 'de',
        added: new Date().toISOString(),
        count: 1,
      });
    }
    saveVocab(vocab);
  }

  window.DN.getVocab = getVocab;
  window.DN.addWord = addWord;

  /* ======================== BREAKING NEWS NOTIFICATIONS ======================== */
  var SEEN_KEY = 'dn_seen_articles';
  var NOTIF_PERMISSION_KEY = 'dn_notif_permission_asked';
  var CHECK_INTERVAL = 300000;

  function getSeenIds() {
    try { return JSON.parse(LS.getItem(SEEN_KEY)) || []; } catch (e) { return []; }
  }

  function addSeenIds(ids) {
    var seen = getSeenIds();
    ids.forEach(function(id) { if (seen.indexOf(id) === -1) seen.push(id); });
    if (seen.length > 500) seen = seen.slice(-500);
    LS.setItem(SEEN_KEY, JSON.stringify(seen));
  }

  function checkForNewArticles() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    var seen = getSeenIds();
    var url = window.location.pathname === '/news' || window.location.pathname === '/'
      ? '/api/news?limit=20'
      : '/api/news?category=bolzano&limit=10';

    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var articles = data.articles || [];
        var newArticles = articles.filter(function(a) { return seen.indexOf(a.id) === -1; });
        if (newArticles.length > 0) {
          var latest = newArticles[0];
          var count = newArticles.length;
          var body = count === 1
            ? latest.title.slice(0, 80)
            : count + ' new articles available';
          new Notification('Daily News - ' + latest.source, { body: body, icon: '/static/manifest.json' });
          addSeenIds(newArticles.map(function(a) { return a.id; }));
        }
      })
      .catch(function() {});
  }

  function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;
    if (LS.getItem(NOTIF_PERMISSION_KEY)) return;

    Notification.requestPermission();
    LS.setItem(NOTIF_PERMISSION_KEY, 'true');
  }

  document.addEventListener('DOMContentLoaded', function() {
    requestNotificationPermission();

    /* Add seen article IDs from current page */
    var ids = [];
    document.querySelectorAll('.card[data-article-id]').forEach(function(c) {
      ids.push(c.dataset.articleId);
    });
    addSeenIds(ids);

    /* Periodic check */
    setInterval(checkForNewArticles, CHECK_INTERVAL);

    /* Also check when page becomes visible again */
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) checkForNewArticles();
    });
  });

  /* Tap-to-translate on learn page */
  document.addEventListener('DOMContentLoaded', function() {
    var learnContainer = document.getElementById('learn-container');
    if (!learnContainer) return;

    var popup = document.createElement('div');
    popup.className = 'translate-popup';
    popup.style.display = 'none';
    document.body.appendChild(popup);

    learnContainer.addEventListener('click', function(e) {
      var target = e.target.closest('.learn-word');
      if (!target) return;
      var word = target.textContent.trim();
      var fromLang = learnContainer.dataset.lang || 'de';
      popup.innerHTML = '<div class="tp-word">' + word + '</div><div class="tp-loading">Looking up...</div><button class="tp-save">Save to vocab</button>';
      popup.style.display = 'block';
      popup.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
      popup.style.top = (e.clientY + 10) + 'px';

      /* Use a free dictionary API */
      var apiLang = fromLang === 'de' ? 'de' : 'it';
      fetch('https://api.dictionaryapi.dev/api/v2/entries/' + apiLang + '/' + encodeURIComponent(word))
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data[0]) {
            var meaning = data[0].meanings && data[0].meanings[0];
            var def = meaning && meaning.definitions && meaning.definitions[0];
            popup.querySelector('.tp-loading').textContent = def ? def.definition : (meaning ? meaning.partOfSpeech : '');
          } else {
            popup.querySelector('.tp-loading').textContent = 'No definition found';
          }
        })
        .catch(function() {
          popup.querySelector('.tp-loading').textContent = 'Translation unavailable';
        });

      popup.querySelector('.tp-save').onclick = function() {
        addWord(word, popup.querySelector('.tp-loading').textContent, fromLang);
        this.textContent = 'Saved!';
        this.disabled = true;
      };
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest('.translate-popup') && !e.target.closest('.learn-word')) {
        popup.style.display = 'none';
      }
    });
  });

})();
