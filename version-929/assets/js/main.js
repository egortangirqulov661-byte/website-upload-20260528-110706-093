(function () {
    var toggle = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            nav.classList.toggle('open');
        });
    }

    var hero = document.querySelector('[data-hero]');
    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                clearInterval(timer);
            }
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                start();
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(parseInt(dot.getAttribute('data-hero-dot'), 10));
                start();
            });
        });

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    var searchInput = document.querySelector('[data-search-input]');
    var yearFilter = document.querySelector('[data-year-filter]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
    var emptyTip = document.querySelector('[data-empty-tip]');

    function applyFilters() {
        var keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
        var minYear = yearFilter && yearFilter.value ? parseInt(yearFilter.value, 10) : 0;
        var visible = 0;

        cards.forEach(function (card) {
            var text = (card.getAttribute('data-keywords') || '').toLowerCase();
            var year = parseInt(card.getAttribute('data-year') || '0', 10);
            var matchKeyword = !keyword || text.indexOf(keyword) !== -1;
            var matchYear = !minYear || year >= minYear;
            var showCard = matchKeyword && matchYear;
            card.style.display = showCard ? '' : 'none';
            if (showCard) {
                visible += 1;
            }
        });

        if (emptyTip) {
            emptyTip.classList.toggle('show', visible === 0);
        }
    }

    if (cards.length) {
        if (searchInput) {
            searchInput.addEventListener('input', applyFilters);
        }
        if (yearFilter) {
            yearFilter.addEventListener('change', applyFilters);
        }
    }
})();
