function initMoviePlayer(streamUrl) {
    var video = document.getElementById('movieVideo');
    var overlay = document.getElementById('playOverlay');
    var hlsInstance = null;
    var initialized = false;

    function bindStream() {
        if (initialized || !video) {
            return;
        }
        initialized = true;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsInstance.loadSource(streamUrl);
            hlsInstance.attachMedia(video);
        } else {
            video.src = streamUrl;
        }
    }

    function startPlayback() {
        if (!video) {
            return;
        }
        bindStream();
        if (overlay) {
            overlay.classList.add('is-hidden');
        }
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {});
        }
    }

    if (overlay) {
        overlay.addEventListener('click', startPlayback);
    }

    if (video) {
        video.addEventListener('click', function () {
            if (!initialized) {
                startPlayback();
            }
        });
        video.addEventListener('play', function () {
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
        });
    }

    window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
