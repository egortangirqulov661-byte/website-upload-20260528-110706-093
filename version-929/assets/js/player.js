function initMoviePlayer(id, streamUrl) {
    var wrap = document.getElementById(id);
    if (!wrap) {
        return;
    }

    var video = wrap.querySelector('video');
    var cover = wrap.querySelector('.play-cover');
    if (!video) {
        return;
    }

    function attachStream() {
        if (video.getAttribute('data-ready') === '1') {
            return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
        } else if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            var hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            video.hlsPlayer = hls;
        } else {
            video.src = streamUrl;
        }

        video.setAttribute('data-ready', '1');
    }

    function startPlay() {
        attachStream();
        if (cover) {
            cover.classList.add('is-hidden');
        }
        video.controls = true;
        var playTask = video.play();
        if (playTask && typeof playTask.catch === 'function') {
            playTask.catch(function () {});
        }
    }

    if (cover) {
        cover.addEventListener('click', startPlay);
    }

    video.addEventListener('click', function () {
        if (video.paused) {
            startPlay();
        }
    });
}
