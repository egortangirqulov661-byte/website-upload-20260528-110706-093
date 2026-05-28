const MovieSite = (() => {
  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  };

  const normalize = (value) => String(value || "").trim().toLowerCase();

  const activateMenu = () => {
    const toggle = document.querySelector("[data-menu-toggle]");
    const panel = document.querySelector("[data-mobile-menu]");
    if (!toggle || !panel) return;
    toggle.addEventListener("click", () => {
      panel.classList.toggle("open");
    });
  };

  const activateSearchForms = () => {
    document.querySelectorAll("[data-search-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = form.querySelector("input[name='q']");
        const query = input ? input.value.trim() : "";
        const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
        window.location.href = `./search.html${suffix}`;
      });
    });
  };

  const activateHero = () => {
    const hero = document.querySelector("[data-hero]");
    if (!hero) return;
    const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
    const prev = hero.querySelector("[data-hero-prev]");
    const next = hero.querySelector("[data-hero-next]");
    if (!slides.length) return;
    let index = 0;
    let timer = null;
    const show = (target) => {
      index = (target + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
      dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
    };
    const move = (step) => show(index + step);
    const start = () => {
      stop();
      timer = window.setInterval(() => move(1), 5600);
    };
    const stop = () => {
      if (timer) window.clearInterval(timer);
    };
    dots.forEach((dot, i) => dot.addEventListener("click", () => {
      show(i);
      start();
    }));
    if (prev) prev.addEventListener("click", () => {
      move(-1);
      start();
    });
    if (next) next.addEventListener("click", () => {
      move(1);
      start();
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    start();
  };

  const matchYear = (year, rule) => {
    if (!rule) return true;
    const numeric = Number(year);
    if (!Number.isFinite(numeric)) return false;
    if (rule === "2010-2019") return numeric >= 2010 && numeric <= 2019;
    if (rule === "2000-2009") return numeric >= 2000 && numeric <= 2009;
    if (rule === "before-2000") return numeric < 2000;
    return String(year) === rule;
  };

  const activateFilters = () => {
    document.querySelectorAll("[data-filter-section]").forEach((section) => {
      const keywordInput = section.querySelector("[data-filter-keyword]");
      const yearSelect = section.querySelector("[data-filter-year]");
      const cards = Array.from(section.querySelectorAll("[data-movie-card]"));
      const apply = () => {
        const keyword = normalize(keywordInput ? keywordInput.value : "");
        const yearRule = yearSelect ? yearSelect.value : "";
        cards.forEach((card) => {
          const haystack = normalize([
            card.dataset.title,
            card.dataset.genre,
            card.dataset.region,
            card.dataset.year
          ].join(" "));
          const matchedKeyword = !keyword || haystack.includes(keyword);
          const matchedYear = matchYear(card.dataset.year, yearRule);
          card.classList.toggle("hidden", !(matchedKeyword && matchedYear));
        });
      };
      if (keywordInput) keywordInput.addEventListener("input", apply);
      if (yearSelect) yearSelect.addEventListener("change", apply);
      apply();
    });
  };

  const createSearchCard = (movie) => {
    const tags = [movie.region, movie.year, movie.type].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
    return `<article class="movie-card" data-movie-card>
        <a class="poster-link" href="./${movie.file}" aria-label="${escapeHtml(movie.title)}">
          <img src="${movie.cover}" alt="${escapeHtml(movie.title)}" loading="lazy">
          <span class="poster-shade"></span>
          <span class="play-dot">▶</span>
        </a>
        <div class="card-body">
          <div class="card-tags">${tags}</div>
          <h3><a href="./${movie.file}">${escapeHtml(movie.title)}</a></h3>
          <p>${escapeHtml(movie.oneLine)}</p>
        </div>
      </article>`;
  };

  const escapeHtml = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const activateSearchPage = () => {
    const mount = document.querySelector("[data-search-results]");
    if (!mount || !Array.isArray(window.MOVIE_SEARCH_DATA)) return;
    const title = document.querySelector("[data-search-title]");
    const params = new URLSearchParams(window.location.search);
    const query = normalize(params.get("q"));
    const list = query
      ? window.MOVIE_SEARCH_DATA.filter((movie) => normalize([movie.title, movie.region, movie.year, movie.genre, movie.oneLine].join(" ")).includes(query))
      : window.MOVIE_SEARCH_DATA.slice(0, 48);
    mount.innerHTML = list.length
      ? list.map(createSearchCard).join("")
      : `<div class="copy-card"><h2>暂无匹配影片</h2><p>可以尝试更换片名、年份、地区或题材关键词。</p></div>`;
    if (title) title.textContent = query ? "搜索结果" : "精选影片";
  };

  const bindPlayer = ({ videoId, overlayId, source }) => {
    const video = document.getElementById(videoId);
    const overlay = document.getElementById(overlayId);
    if (!video || !overlay || !source) return;
    let ready = false;
    const prepare = () => {
      if (ready) return;
      ready = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({ enableWorker: true });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    };
    const play = () => {
      prepare();
      overlay.classList.add("hidden");
      const action = video.play();
      if (action && typeof action.catch === "function") {
        action.catch(() => overlay.classList.remove("hidden"));
      }
    };
    overlay.addEventListener("click", play);
    video.addEventListener("click", () => {
      if (video.paused) play();
    });
    video.addEventListener("play", () => overlay.classList.add("hidden"));
    video.addEventListener("pause", () => {
      if (!video.ended) overlay.classList.remove("hidden");
    });
  };

  ready(() => {
    activateMenu();
    activateSearchForms();
    activateHero();
    activateFilters();
    activateSearchPage();
  });

  return { bindPlayer };
})();
