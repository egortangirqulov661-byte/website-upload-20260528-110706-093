(function () {
  'use strict';

  function query(selector, root) {
    return (root || document).querySelector(selector);
  }

  function queryAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initMobileMenu() {
    var toggle = query('[data-menu-toggle]');
    if (!toggle) {
      return;
    }
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('menu-open');
    });
  }

  function initHero() {
    var hero = query('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = queryAll('[data-hero-slide]', hero);
    var dots = queryAll('[data-hero-dot]', hero);
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initLocalFilters() {
    var panels = queryAll('[data-filter-panel]');
    panels.forEach(function (panel) {
      var root = panel.parentElement || document;
      var list = query('[data-card-list]', root) || document;
      var textInput = query('[data-local-filter]', panel);
      var regionSelect = query('[data-region-filter]', panel);
      var typeSelect = query('[data-type-filter]', panel);
      var sortSelect = query('[data-sort-select]', panel);

      function cards() {
        return queryAll('.movie-card, .rank-row', list);
      }

      function apply() {
        var term = normalize(textInput && textInput.value);
        var region = normalize(regionSelect && regionSelect.value);
        var type = normalize(typeSelect && typeSelect.value);

        cards().forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-year'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-genre'),
            card.textContent
          ].join(' '));
          var cardRegion = normalize(card.getAttribute('data-region'));
          var cardType = normalize(card.getAttribute('data-type'));
          var visible = true;

          if (term && haystack.indexOf(term) === -1) {
            visible = false;
          }
          if (region && cardRegion.indexOf(region) === -1) {
            visible = false;
          }
          if (type && cardType.indexOf(type) === -1) {
            visible = false;
          }
          card.classList.toggle('hidden-by-filter', !visible);
        });
      }

      function sortCards() {
        if (!sortSelect || !list) {
          return;
        }
        var value = sortSelect.value;
        var sorted = cards().sort(function (a, b) {
          if (value === 'year-asc') {
            return Number(a.getAttribute('data-year')) - Number(b.getAttribute('data-year'));
          }
          if (value === 'title-asc') {
            return String(a.getAttribute('data-title')).localeCompare(String(b.getAttribute('data-title')), 'zh-Hans-CN');
          }
          return Number(b.getAttribute('data-year')) - Number(a.getAttribute('data-year'));
        });
        sorted.forEach(function (card) {
          list.appendChild(card);
        });
        apply();
      }

      [textInput, regionSelect, typeSelect].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });
      if (sortSelect) {
        sortSelect.addEventListener('change', sortCards);
      }
      apply();
    });
  }

  function loadHlsLibrary() {
    return new Promise(function (resolve, reject) {
      if (window.Hls) {
        resolve(window.Hls);
        return;
      }
      var existing = query('script[data-hls-loader]');
      if (existing) {
        existing.addEventListener('load', function () {
          resolve(window.Hls);
        });
        existing.addEventListener('error', reject);
        return;
      }
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
      script.async = true;
      script.setAttribute('data-hls-loader', 'true');
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initPlayers() {
    queryAll('[data-player]').forEach(function (player) {
      var video = query('video', player);
      var button = query('[data-play-button]', player);
      var message = query('[data-player-message]', player);
      var src = player.getAttribute('data-video-src');
      var hlsInstance = null;

      function showMessage(text) {
        if (!message) {
          return;
        }
        message.textContent = text;
        message.classList.add('is-visible');
        window.setTimeout(function () {
          message.classList.remove('is-visible');
        }, 5200);
      }

      function playNative() {
        video.src = src;
        return video.play();
      }

      function playWithHls(Hls) {
        if (!Hls || !Hls.isSupported()) {
          return playNative();
        }
        if (hlsInstance) {
          hlsInstance.destroy();
        }
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {
            showMessage('浏览器阻止了自动播放，请再次点击播放按钮。');
          });
        });
        hlsInstance.on(Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hlsInstance.startLoad();
            showMessage('网络波动，正在重新加载播放源。');
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hlsInstance.recoverMediaError();
            showMessage('媒体解码异常，正在恢复播放。');
          } else {
            showMessage('当前播放源暂时无法加载，请稍后重试。');
            hlsInstance.destroy();
          }
        });
      }

      if (!video || !button || !src) {
        return;
      }

      button.addEventListener('click', function () {
        player.classList.add('is-playing');
        showMessage('正在初始化播放源。');
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          playNative().catch(function () {
            showMessage('播放未开始，请检查浏览器权限或网络。');
          });
          return;
        }
        loadHlsLibrary().then(playWithHls).catch(function () {
          showMessage('HLS 播放模块加载失败，请检查网络后重试。');
        });
      });
    });
  }

  function createCard(movie) {
    var link = document.createElement('a');
    link.href = movie.url;
    link.setAttribute('aria-label', '观看 ' + movie.title);

    var article = document.createElement('article');
    article.className = 'movie-card';
    article.setAttribute('data-title', movie.title);
    article.setAttribute('data-year', movie.year);
    article.setAttribute('data-region', movie.region);
    article.setAttribute('data-type', movie.type);
    article.setAttribute('data-genre', movie.genre);

    var poster = document.createElement('div');
    poster.className = 'poster-frame';

    var image = document.createElement('img');
    image.src = movie.image;
    image.alt = movie.title + ' 封面';
    image.loading = 'lazy';

    var year = document.createElement('span');
    year.className = 'year-badge';
    year.textContent = movie.year;

    var play = document.createElement('span');
    play.className = 'play-badge';
    play.textContent = '播放';

    var body = document.createElement('div');
    body.className = 'movie-card-body';

    var title = document.createElement('h3');
    title.textContent = movie.title;

    var desc = document.createElement('p');
    desc.textContent = movie.oneLine;

    var meta = document.createElement('div');
    meta.className = 'meta-line';
    meta.innerHTML = '<span>' + movie.region + '</span><span>' + movie.type + '</span>';

    poster.appendChild(image);
    poster.appendChild(year);
    poster.appendChild(play);
    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(meta);
    link.appendChild(poster);
    link.appendChild(body);
    article.appendChild(link);
    return article;
  }

  function initSearchPage() {
    var results = query('[data-search-results]');
    var status = query('[data-search-status]');
    var form = query('[data-search-page-form]');
    if (!results || !status || !window.MOVIE_SEARCH_INDEX) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q') || '';
    var input = form ? query('input[name="q"]', form) : null;
    if (input) {
      input.value = q;
    }

    function render(term) {
      var needle = normalize(term);
      results.innerHTML = '';
      if (!needle) {
        status.textContent = '请输入关键词开始搜索。';
        return;
      }
      var matched = window.MOVIE_SEARCH_INDEX.filter(function (movie) {
        return normalize([
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.tags,
          movie.oneLine,
          movie.summary
        ].join(' ')).indexOf(needle) !== -1;
      });
      status.textContent = '“' + term + '” 找到 ' + matched.length + ' 部影片。';
      matched.slice(0, 500).forEach(function (movie) {
        results.appendChild(createCard(movie));
      });
      if (matched.length > 500) {
        var note = document.createElement('div');
        note.className = 'search-status';
        note.textContent = '结果较多，已展示前 500 部，请继续输入更精确关键词。';
        results.appendChild(note);
      }
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var value = input ? input.value.trim() : '';
        var nextParams = new URLSearchParams();
        if (value) {
          nextParams.set('q', value);
        }
        history.replaceState(null, '', 'search.html' + (value ? '?' + nextParams.toString() : ''));
        render(value);
      });
    }
    render(q);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHero();
    initLocalFilters();
    initPlayers();
    initSearchPage();
  });
})();
