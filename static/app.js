(function() {
  'use strict';

  /* === Service Worker Registration === */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/static/sw.js');
    });
  }

  /* === Mobile Nav Toggle === */
  var nav = document.querySelector('.nav');
  var navToggle = document.querySelector('.nav-toggle');

  if (navToggle && nav) {
    navToggle.addEventListener('click', function() {
      nav.classList.toggle('nav-open');
      navToggle.classList.toggle('open');
    });

    document.addEventListener('click', function(e) {
      if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
        nav.classList.remove('nav-open');
        navToggle.classList.remove('open');
      }
    });
  }

  /* === Spinner === */
  var spinnerHTML = '<div class="spinner-overlay" id="spinner"><div class="spinner"></div></div>';

  function showSpinner() {
    if (!document.getElementById('spinner')) {
      document.body.insertAdjacentHTML('beforeend', spinnerHTML);
    }
  }

  function hideSpinner() {
    var el = document.getElementById('spinner');
    if (el) el.remove();
  }

  /* === Auto-Refresh News (only on news page) === */
  var articlesSection = document.querySelector('.articles');
  var refreshBtn = document.querySelector('.refresh-btn');
  var newsForm = document.querySelector('.filter-form');

  if (newsForm && articlesSection) {
    var currentUrl = window.location.href;

    function reloadNews() {
      showSpinner();
      var xhr = new XMLHttpRequest();
      xhr.open('GET', currentUrl, true);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.onload = function() {
        if (xhr.status === 200) {
          var temp = document.createElement('div');
          temp.innerHTML = xhr.responseText;
          var newArticles = temp.querySelector('.articles');
          if (newArticles) {
            articlesSection.innerHTML = newArticles.innerHTML;
          }
          var newErrors = temp.querySelector('.errors');
          var oldErrors = document.querySelector('.errors');
          if (newErrors) {
            if (oldErrors) oldErrors.replaceWith(newErrors);
            else document.querySelector('main').appendChild(newErrors);
          } else if (oldErrors) {
            oldErrors.remove();
          }
        }
        hideSpinner();
      };
      xhr.onerror = function() {
        hideSpinner();
      };
      xhr.send();
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', function(e) {
        e.preventDefault();
        reloadNews();
      });
    }

    setInterval(reloadNews, 300000);
  }

  /* === Pull-to-Refresh === */
  var pullStartY = 0;
  var pullMoveY = 0;
  var pullDist = 0;
  var pullEnabled = true;
  var pullEl = document.querySelector('.pull-indicator');

  if (!pullEl) {
    pullEl = document.createElement('div');
    pullEl.className = 'pull-indicator';
    pullEl.innerHTML = '<div class="pull-spinner"></div><span class="pull-text">Pull to refresh</span>';
    document.body.insertBefore(pullEl, document.body.firstChild);
  }

  document.addEventListener('touchstart', function(e) {
    if (window.scrollY === 0 && pullEnabled) {
      pullStartY = e.touches[0].clientY;
      pullDist = 0;
    }
  }, {passive: true});

  document.addEventListener('touchmove', function(e) {
    if (pullStartY > 0) {
      pullMoveY = e.touches[0].clientY;
      pullDist = pullMoveY - pullStartY;
      if (pullDist > 0) {
        pullEl.classList.add('visible');
        if (pullDist > 80) {
          pullEl.classList.add('ready');
          pullEl.querySelector('.pull-text').textContent = 'Release to refresh';
        } else {
          pullEl.classList.remove('ready');
          pullEl.querySelector('.pull-text').textContent = 'Pull to refresh';
        }
      }
    }
  }, {passive: true});

  document.addEventListener('touchend', function() {
    if (pullDist > 80) {
      pullEl.classList.add('loading');
      pullEl.querySelector('.pull-text').textContent = 'Refreshing...';
      location.reload();
    } else {
      pullEl.classList.remove('visible', 'ready');
    }
    pullStartY = 0;
    pullDist = 0;
  }, {passive: true});

})();
