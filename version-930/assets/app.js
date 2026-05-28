(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-button]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
      document.body.classList.toggle("menu-open", nav.classList.contains("is-open"));
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
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
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(parseInt(dot.getAttribute("data-hero-dot"), 10) || 0);
        start();
      });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initFilters() {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-search-card]"));
    if (!cards.length) {
      return;
    }
    var input = document.querySelector("[data-search-input]");
    var categorySelect = document.querySelector("[data-filter-select='category']");
    var yearSelect = document.querySelector("[data-filter-select='year']");

    function normalize(value) {
      return String(value || "").toLowerCase().trim();
    }

    function apply() {
      var keyword = normalize(input ? input.value : "");
      var category = categorySelect ? categorySelect.value : "";
      var year = yearSelect ? yearSelect.value : "";
      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags"),
          card.getAttribute("data-year")
        ].join(" "));
        var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchCategory = !category || card.getAttribute("data-category") === category;
        var matchYear = !year || card.getAttribute("data-year") === year;
        card.classList.toggle("hidden-card", !(matchKeyword && matchCategory && matchYear));
      });
    }

    if (input) {
      input.addEventListener("input", apply);
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q");
      if (q) {
        input.value = q;
      }
    }
    if (categorySelect) {
      categorySelect.addEventListener("change", apply);
    }
    if (yearSelect) {
      yearSelect.addEventListener("change", apply);
    }
    apply();
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
  });

  window.initMoviePlayer = function (source) {
    ready(function () {
      var video = document.getElementById("movie-video");
      var overlay = document.getElementById("play-overlay");
      if (!video || !overlay || !source) {
        return;
      }
      var hls = null;
      var loaded = false;

      function attach() {
        if (loaded) {
          return;
        }
        loaded = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(source);
          hls.attachMedia(video);
        } else {
          video.src = source;
        }
      }

      function begin() {
        attach();
        overlay.classList.add("is-hidden");
        var result = video.play();
        if (result && typeof result.catch === "function") {
          result.catch(function () {
            overlay.classList.remove("is-hidden");
          });
        }
      }

      overlay.addEventListener("click", begin);
      video.addEventListener("click", function () {
        if (!loaded) {
          begin();
          return;
        }
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      });
      video.addEventListener("play", function () {
        overlay.classList.add("is-hidden");
      });
      window.addEventListener("pagehide", function () {
        if (hls && typeof hls.destroy === "function") {
          hls.destroy();
        }
      });
    });
  };
})();
