(function () {
    var menuButton = document.querySelector('.menu-toggle');
    var mobilePanel = document.querySelector('.mobile-panel');

    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', function () {
            var expanded = menuButton.getAttribute('aria-expanded') === 'true';
            menuButton.setAttribute('aria-expanded', String(!expanded));
            mobilePanel.hidden = expanded;
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var activeSlide = 0;
    var heroTimer = null;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }
        activeSlide = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle('is-active', slideIndex === activeSlide);
        });
        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle('is-active', dotIndex === activeSlide);
        });
    }

    function startHero() {
        if (slides.length < 2) {
            return;
        }
        heroTimer = window.setInterval(function () {
            showSlide(activeSlide + 1);
        }, 5200);
    }

    dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
            var index = Number(dot.getAttribute('data-hero-dot')) || 0;
            showSlide(index);
            if (heroTimer) {
                window.clearInterval(heroTimer);
            }
            startHero();
        });
    });

    startHero();

    function textOfCard(card) {
        return [
            card.getAttribute('data-title') || '',
            card.getAttribute('data-region') || '',
            card.getAttribute('data-type') || '',
            card.getAttribute('data-year') || '',
            card.getAttribute('data-tags') || '',
            card.textContent || ''
        ].join(' ').toLowerCase();
    }

    function runFilter(scope) {
        var input = scope.querySelector('.movie-filter');
        var target = scope.querySelector('.filter-target');
        var empty = scope.querySelector('.empty-state');
        if (!target) {
            return;
        }
        var cards = Array.prototype.slice.call(target.querySelectorAll('.movie-card'));
        var activeChip = scope.querySelector('.filter-chips button.is-active');
        var query = input ? input.value.trim().toLowerCase() : '';
        var chipValue = activeChip ? activeChip.getAttribute('data-filter') : 'all';
        var shown = 0;

        cards.forEach(function (card) {
            var content = textOfCard(card);
            var matchQuery = !query || content.indexOf(query) !== -1;
            var matchChip = chipValue === 'all' || content.indexOf(String(chipValue).toLowerCase()) !== -1;
            var visible = matchQuery && matchChip;
            card.hidden = !visible;
            if (visible) {
                shown += 1;
            }
        });

        if (empty) {
            empty.hidden = shown !== 0;
        }
    }

    document.querySelectorAll('.page-section, .library-band').forEach(function (scope) {
        var input = scope.querySelector('.movie-filter');
        var chips = Array.prototype.slice.call(scope.querySelectorAll('.filter-chips button'));

        if (input) {
            input.addEventListener('input', function () {
                runFilter(scope);
            });
        }

        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                chips.forEach(function (item) {
                    item.classList.remove('is-active');
                });
                chip.classList.add('is-active');
                runFilter(scope);
            });
        });

        runFilter(scope);
    });

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q');
    var globalQuery = document.querySelector('.global-query');
    if (query && globalQuery) {
        globalQuery.value = query;
        document.querySelectorAll('.page-section').forEach(function (scope) {
            var input = scope.querySelector('.movie-filter');
            if (input) {
                input.value = query;
                runFilter(scope);
            }
        });
    }
})();
