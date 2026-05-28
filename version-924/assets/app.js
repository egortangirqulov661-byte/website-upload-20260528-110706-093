(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMobileMenu() {
    var header = document.querySelector(".site-header");
    var button = document.querySelector(".mobile-menu-button");

    if (!header || !button) {
      return;
    }

    button.addEventListener("click", function () {
      var open = header.classList.toggle("menu-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHeroSlider() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));

    if (!slides.length) {
      return;
    }

    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    show(0);
    start();
  }

  function setupCardFilter() {
    var forms = Array.prototype.slice.call(document.querySelectorAll("[data-filter-form]"));

    forms.forEach(function (form) {
      var scopeSelector = form.getAttribute("data-filter-scope") || "body";
      var scope = document.querySelector(scopeSelector) || document;
      var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-card]"));
      var empty = scope.querySelector("[data-empty-state]");

      function normalize(value) {
        return String(value || "").trim().toLowerCase();
      }

      function applyFilter() {
        var keyword = normalize(form.querySelector("[name='keyword']") && form.querySelector("[name='keyword']").value);
        var year = normalize(form.querySelector("[name='year']") && form.querySelector("[name='year']").value);
        var region = normalize(form.querySelector("[name='region']") && form.querySelector("[name='region']").value);
        var type = normalize(form.querySelector("[name='type']") && form.querySelector("[name='type']").value);
        var visibleCount = 0;

        cards.forEach(function (card) {
          var haystack = normalize(card.getAttribute("data-search"));
          var matchKeyword = !keyword || haystack.indexOf(keyword) >= 0;
          var matchYear = !year || normalize(card.getAttribute("data-year")) === year;
          var matchRegion = !region || normalize(card.getAttribute("data-region")) === region;
          var matchType = !type || normalize(card.getAttribute("data-type")) === type;
          var visible = matchKeyword && matchYear && matchRegion && matchType;

          card.style.display = visible ? "" : "none";

          if (visible) {
            visibleCount += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("show", visibleCount === 0);
        }
      }

      form.addEventListener("input", applyFilter);
      form.addEventListener("change", applyFilter);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        applyFilter();
      });

      applyFilter();
    });
  }

  function setupVideoPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));

    players.forEach(function (player) {
      var video = player.querySelector("video");
      var button = player.querySelector(".play-trigger");
      var note = player.querySelector(".player-note");

      if (!video || !button) {
        return;
      }

      var source = button.getAttribute("data-src") || video.getAttribute("data-src");

      function setNote(message) {
        if (note) {
          note.textContent = message;
        }
      }

      function startPlayback() {
        if (!source) {
          setNote("当前播放源暂不可用。");
          return;
        }

        player.classList.add("is-playing");
        button.disabled = true;
        button.textContent = "正在加载";

        if (video.dataset.loaded === "true") {
          video.play().catch(function () {
            setNote("请再次点击播放器开始播放。");
          });
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });

          hls.loadSource(source);
          hls.attachMedia(video);

          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.dataset.loaded = "true";
            video.play().catch(function () {
              setNote("浏览器阻止了自动播放，请点击播放器继续。");
            });
          });

          hls.on(window.Hls.Events.ERROR, function (eventName, data) {
            if (data && data.fatal) {
              setNote("播放源加载失败，请稍后重试。");
              button.disabled = false;
              button.textContent = "重新播放";
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          video.dataset.loaded = "true";
          video.play().catch(function () {
            setNote("请再次点击播放器开始播放。");
          });
        } else {
          video.src = source;
          video.dataset.loaded = "true";
          video.play().catch(function () {
            setNote("当前浏览器可能需要 HLS 支持组件。");
          });
        }
      }

      button.addEventListener("click", startPlayback);
      video.addEventListener("play", function () {
        player.classList.add("is-playing");
      });
    });
  }

  function setupSearchPage() {
    var root = document.querySelector("[data-search-page]");

    if (!root || !window.MOVIE_SEARCH_DATA) {
      return;
    }

    var data = window.MOVIE_SEARCH_DATA;
    var queryInput = root.querySelector("[name='keyword']");
    var regionSelect = root.querySelector("[name='region']");
    var typeSelect = root.querySelector("[name='type']");
    var yearSelect = root.querySelector("[name='year']");
    var results = root.querySelector("[data-search-results]");
    var count = root.querySelector("[data-search-count]");
    var empty = root.querySelector("[data-empty-state]");
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q") || "";

    if (queryInput && initialQuery) {
      queryInput.value = initialQuery;
    }

    function text(value) {
      return String(value || "").trim().toLowerCase();
    }

    function createBadge(value) {
      var span = document.createElement("span");
      span.textContent = value;
      return span;
    }

    function createMovieCard(movie) {
      var article = document.createElement("article");
      article.className = "movie-card";

      var posterLink = document.createElement("a");
      posterLink.className = "poster-link";
      posterLink.href = movie.url;
      posterLink.setAttribute("aria-label", "查看《" + movie.title + "》详情");

      var ratio = document.createElement("span");
      ratio.className = "poster-ratio";

      var img = document.createElement("img");
      img.src = movie.cover;
      img.alt = movie.title;
      img.loading = "lazy";
      img.onerror = function () {
        img.classList.add("image-missing");
      };

      var score = document.createElement("span");
      score.className = "score-badge";
      score.textContent = movie.score;

      ratio.appendChild(img);
      posterLink.appendChild(ratio);
      posterLink.appendChild(score);

      var body = document.createElement("div");
      body.className = "movie-card-body";

      var meta = document.createElement("div");
      meta.className = "meta-row";
      meta.appendChild(createBadge(movie.year));
      meta.appendChild(createBadge(movie.type));
      meta.appendChild(createBadge(movie.region));

      var h3 = document.createElement("h3");
      var titleLink = document.createElement("a");
      titleLink.href = movie.url;
      titleLink.textContent = movie.title;
      h3.appendChild(titleLink);

      var desc = document.createElement("p");
      desc.textContent = movie.oneLine;

      var tags = document.createElement("div");
      tags.className = "tag-row";

      (movie.tags || []).slice(0, 3).forEach(function (tag) {
        tags.appendChild(createBadge(tag));
      });

      body.appendChild(meta);
      body.appendChild(h3);
      body.appendChild(desc);
      body.appendChild(tags);

      article.appendChild(posterLink);
      article.appendChild(body);

      return article;
    }

    function render() {
      var keyword = text(queryInput && queryInput.value);
      var region = text(regionSelect && regionSelect.value);
      var type = text(typeSelect && typeSelect.value);
      var year = text(yearSelect && yearSelect.value);

      var filtered = data.filter(function (movie) {
        var haystack = text([
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.oneLine,
          (movie.tags || []).join(" ")
        ].join(" "));

        return (!keyword || haystack.indexOf(keyword) >= 0)
          && (!region || text(movie.region) === region)
          && (!type || text(movie.type) === type)
          && (!year || text(movie.year) === year);
      }).slice(0, 120);

      results.innerHTML = "";

      filtered.forEach(function (movie) {
        results.appendChild(createMovieCard(movie));
      });

      if (count) {
        count.textContent = String(filtered.length);
      }

      if (empty) {
        empty.classList.toggle("show", filtered.length === 0);
      }
    }

    [queryInput, regionSelect, typeSelect, yearSelect].forEach(function (control) {
      if (control) {
        control.addEventListener("input", render);
        control.addEventListener("change", render);
      }
    });

    render();
  }

  ready(function () {
    setupMobileMenu();
    setupHeroSlider();
    setupCardFilter();
    setupVideoPlayers();
    setupSearchPage();
  });
})();
