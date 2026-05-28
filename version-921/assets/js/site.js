(function () {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-site-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function initSearchForms() {
    selectAll("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[name='q'], input[type='search']");
        var query = input ? input.value.trim() : "";
        var target = form.getAttribute("action") || "./search.html";
        if (query) {
          window.location.href = target + "?q=" + encodeURIComponent(query);
        } else {
          window.location.href = target;
        }
      });
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = selectAll(".hero-slide", hero);
    var dots = selectAll("[data-hero-dot]", hero);
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        if (timer) {
          window.clearInterval(timer);
        }
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5200);
      });
    });

    timer = window.setInterval(function () {
      show(index + 1);
    }, 5200);
  }

  function cardText(card) {
    return normalize([
      card.getAttribute("data-title"),
      card.getAttribute("data-region"),
      card.getAttribute("data-type"),
      card.getAttribute("data-year"),
      card.getAttribute("data-genre"),
      card.getAttribute("data-tags"),
      card.textContent
    ].join(" "));
  }

  function initFilters() {
    var panel = document.querySelector("[data-filter-panel]");
    var cards = selectAll("[data-movie-card]");
    if (!panel || !cards.length) {
      return;
    }
    var input = panel.querySelector("[data-live-search]");
    var buttons = selectAll("[data-filter]", panel);
    var noResults = document.querySelector("[data-no-results]");
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q") || "";
    var activeFilter = "all";

    if (input && initialQuery) {
      input.value = initialQuery;
    }

    function apply() {
      var query = normalize(input ? input.value : "");
      var filter = normalize(activeFilter === "all" ? "" : activeFilter);
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = cardText(card);
        var matchQuery = !query || haystack.indexOf(query) !== -1;
        var matchFilter = !filter || haystack.indexOf(filter) !== -1;
        var show = matchQuery && matchFilter;
        card.style.display = show ? "" : "none";
        if (show) {
          visible += 1;
        }
      });
      if (noResults) {
        noResults.classList.toggle("is-visible", visible === 0);
      }
    }

    if (input) {
      input.addEventListener("input", apply);
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        activeFilter = button.getAttribute("data-filter") || "all";
        buttons.forEach(function (item) {
          item.classList.toggle("is-selected", item === button);
        });
        apply();
      });
    });

    apply();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initSearchForms();
    initHero();
    initFilters();
  });
})();
