(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  function initMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    if (!button) {
      return;
    }
    button.addEventListener('click', function () {
      document.body.classList.toggle('menu-open');
    });
    document.querySelectorAll('[data-mobile-nav] a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
      });
    });
  }

  function initTopSearch() {
    document.querySelectorAll('[data-site-search]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = form.querySelector('input[name="q"]');
        var query = input ? input.value.trim() : '';
        var target = 'search.html';
        if (query) {
          target += '?q=' + encodeURIComponent(query);
        }
        window.location.href = target;
      });
    });
  }

  function cardText(card) {
    return normalize([
      card.getAttribute('data-title'),
      card.getAttribute('data-tags'),
      card.getAttribute('data-region'),
      card.getAttribute('data-year'),
      card.getAttribute('data-genre')
    ].join(' '));
  }

  function applyFilter(input, forcedTag) {
    var list = document.querySelector('[data-search-list]');
    if (!list) {
      return;
    }
    var query = normalize(input ? input.value : '');
    var tag = normalize(forcedTag || '');
    list.querySelectorAll('.movie-card').forEach(function (card) {
      var haystack = cardText(card);
      var matchedQuery = !query || haystack.indexOf(query) !== -1;
      var matchedTag = !tag || haystack.indexOf(tag) !== -1;
      card.classList.toggle('is-hidden', !(matchedQuery && matchedTag));
    });
  }

  function initFiltering() {
    var input = document.querySelector('[data-filter-input]');
    var activeTag = '';
    if (input) {
      var params = new URLSearchParams(window.location.search);
      var query = params.get('q') || '';
      if (query) {
        input.value = query;
      }
      input.addEventListener('input', function () {
        applyFilter(input, activeTag);
      });
      if (input.hasAttribute('data-auto-focus') && query) {
        input.focus();
      }
      applyFilter(input, activeTag);
    }
    document.querySelectorAll('[data-tag-filter]').forEach(function (button) {
      button.addEventListener('click', function () {
        activeTag = button.getAttribute('data-tag-filter') || '';
        document.querySelectorAll('[data-tag-filter]').forEach(function (item) {
          item.classList.toggle('active', item === button);
        });
        applyFilter(input, activeTag);
      });
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, current) {
        slide.classList.toggle('active', current === index);
      });
      dots.forEach(function (dot, current) {
        dot.classList.toggle('active', current === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        restart();
      });
    });
    restart();
  }

  function initPlayers() {
    document.querySelectorAll('[data-player]').forEach(function (player) {
      var video = player.querySelector('video');
      var button = player.querySelector('[data-play-button]');
      var source = player.getAttribute('data-src');
      var hlsInstance = null;
      if (!video || !button || !source) {
        return;
      }
      function startPlayback() {
        button.classList.add('is-hidden');
        video.controls = true;
        if (window.Hls && window.Hls.isSupported()) {
          if (hlsInstance) {
            hlsInstance.destroy();
          }
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
        } else {
          video.src = source;
          video.addEventListener('loadedmetadata', function () {
            video.play().catch(function () {});
          }, { once: true });
          video.load();
        }
      }
      button.addEventListener('click', startPlayback);
      video.addEventListener('click', function () {
        if (video.paused) {
          video.play().catch(function () {});
        }
      });
    });
  }

  ready(function () {
    initMenu();
    initTopSearch();
    initFiltering();
    initHero();
    initPlayers();
  });
})();
