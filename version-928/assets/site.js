(function () {
    function selectAll(selector, scope) {
        return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
    }

    function setupNavigation() {
        var toggle = document.querySelector('[data-nav-toggle]');
        var menu = document.querySelector('[data-nav-menu]');
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    function setupHero() {
        var root = document.querySelector('[data-hero]');
        if (!root) {
            return;
        }
        var slides = selectAll('[data-hero-slide]', root);
        var dots = selectAll('[data-hero-dot]', root);
        if (slides.length <= 1) {
            return;
        }
        var index = 0;
        var timer = null;
        function show(next) {
            slides[index].classList.remove('is-active');
            if (dots[index]) {
                dots[index].classList.remove('is-active');
            }
            index = (next + slides.length) % slides.length;
            slides[index].classList.add('is-active');
            if (dots[index]) {
                dots[index].classList.add('is-active');
            }
        }
        function start() {
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }
        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                if (timer) {
                    window.clearInterval(timer);
                }
                show(dotIndex);
                start();
            });
        });
        start();
    }

    function setupFilters() {
        selectAll('[data-filter-root]').forEach(function (root) {
            var input = root.querySelector('[data-filter-input]');
            var typeSelect = root.querySelector('[data-filter-type]');
            var yearSelect = root.querySelector('[data-filter-year]');
            var count = root.querySelector('[data-filter-count]');
            var items = selectAll('.filter-item', root);
            function matchYear(itemYear, selectedYear) {
                if (!selectedYear) {
                    return true;
                }
                if (selectedYear === '2020') {
                    return Number(itemYear) <= 2020;
                }
                return itemYear === selectedYear;
            }
            function update() {
                var keyword = input ? input.value.trim().toLowerCase() : '';
                var typeValue = typeSelect ? typeSelect.value.trim() : '';
                var yearValue = yearSelect ? yearSelect.value.trim() : '';
                var visible = 0;
                items.forEach(function (item) {
                    var text = item.getAttribute('data-filter-text') || '';
                    var itemType = item.getAttribute('data-type') || '';
                    var itemYear = item.getAttribute('data-year') || '';
                    var ok = true;
                    if (keyword && text.indexOf(keyword) === -1) {
                        ok = false;
                    }
                    if (typeValue && itemType.indexOf(typeValue) === -1) {
                        ok = false;
                    }
                    if (!matchYear(itemYear, yearValue)) {
                        ok = false;
                    }
                    item.classList.toggle('is-filter-hidden', !ok);
                    if (ok) {
                        visible += 1;
                    }
                });
                if (count) {
                    count.textContent = '当前显示 ' + visible + ' 部影片';
                }
            }
            [input, typeSelect, yearSelect].forEach(function (control) {
                if (control) {
                    control.addEventListener('input', update);
                    control.addEventListener('change', update);
                }
            });
            update();
        });
    }

    function cardTemplate(movie) {
        return [
            '<article class="movie-card">',
            '    <a class="poster-link" href="' + movie.url + '" aria-label="观看' + escapeHtml(movie.title) + '">',
            '        <img src="./' + movie.cover + '.jpg" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
            '        <span class="poster-badge">' + escapeHtml(movie.type) + '</span>',
            '        <span class="poster-play">▶</span>',
            '    </a>',
            '    <div class="movie-card-body">',
            '        <a class="movie-title" href="' + movie.url + '">' + escapeHtml(movie.title) + '</a>',
            '        <p>' + escapeHtml(movie.oneLine) + '</p>',
            '        <div class="movie-meta">',
            '            <span>' + escapeHtml(movie.region) + '</span>',
            '            <span>' + escapeHtml(movie.year) + '</span>',
            '        </div>',
            '    </div>',
            '</article>'
        ].join('');
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function setupSearch() {
        var form = document.querySelector('[data-search-form]');
        var input = document.querySelector('[data-search-input]');
        var resultBox = document.querySelector('[data-search-results]');
        var count = document.querySelector('[data-search-count]');
        var data = window.SITE_SEARCH_DATA || [];
        if (!form || !input || !resultBox) {
            return;
        }
        function render(items) {
            resultBox.innerHTML = items.map(cardTemplate).join('');
            if (count) {
                count.textContent = '找到 ' + items.length + ' 部影片';
            }
        }
        function search() {
            var keyword = input.value.trim().toLowerCase();
            if (!keyword) {
                render(data.slice(0, 24));
                if (count) {
                    count.textContent = '显示推荐影片 24 部，可继续输入关键词搜索全站。';
                }
                return;
            }
            var matched = data.filter(function (movie) {
                return movie.search.indexOf(keyword) !== -1;
            }).slice(0, 120);
            render(matched);
        }
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            search();
        });
        input.addEventListener('input', search);
        search();
    }

    setupNavigation();
    setupHero();
    setupFilters();
    setupSearch();
}());

window.initMoviePlayer = function (videoId, sourceUrl) {
    var video = document.getElementById(videoId);
    if (!video || !sourceUrl) {
        return;
    }
    var frame = video.closest('[data-player]');
    var overlay = frame ? frame.querySelector('.play-overlay') : null;
    var hlsInstance = null;
    var initialized = false;

    function attachSource() {
        if (initialized) {
            return;
        }
        initialized = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = sourceUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsInstance.loadSource(sourceUrl);
            hlsInstance.attachMedia(video);
        } else {
            video.src = sourceUrl;
        }
    }

    function play() {
        attachSource();
        if (overlay) {
            overlay.classList.add('is-hidden');
        }
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
                if (overlay) {
                    overlay.classList.remove('is-hidden');
                }
            });
        }
    }

    if (overlay) {
        overlay.addEventListener('click', play);
    }
    video.addEventListener('click', function () {
        if (!initialized) {
            play();
        }
    });
    video.addEventListener('play', function () {
        if (overlay) {
            overlay.classList.add('is-hidden');
        }
    });
    window.addEventListener('pagehide', function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
};
