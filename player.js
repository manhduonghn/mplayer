function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}

function setupResponsiveControls(art) {
    const container = art.template.$container;
    const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
            const width = entry.contentRect.width;
            if (width < 300) {
                container.classList.add('mini-controls');
            } else {
                container.classList.remove('mini-controls');
            }
        }
    });
    observer.observe(container);
}

const m3u8Url = getQueryParam('url');

if (!m3u8Url) {
    document.body.innerHTML = "<h2 style='color:white;text-align:center;margin-top:20px;'>Thiếu tham số ?url=...</h2>";
    throw new Error("Missing M3U8 URL parameter.");
}

if (Hls.isSupported()) {
    const hls = new Hls();
    
    const art = new Artplayer({
        container: '#player',
        url: '', // The URL will be set dynamically
        type: 'm3u8',
        autoplay: true,
        screenshot: true,
        fullscreen: true,
        setting: true,
        playbackRate: true,
        aspectRatio: true,
        airplay: true,
        theme: '#ff4747',
        customType: {
            m3u8: (video, url) => {
                // Use the CDN function to fetch and process the manifest
                window.fetchAndProcessPlaylist(url).then(processedUrl => {
                    hls.loadSource(processedUrl);
                    hls.attachMedia(video);
                }).catch(error => {
                    console.error("Failed to process manifest:", error);
                    // Fallback to original URL if processing fails
                    hls.loadSource(url);
                    hls.attachMedia(video);
                });
            }
        },
        controls: [
            {
                position: 'right',
                html: `<div class="art-skip-icon" id="rewind-btn">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 4V1L8 5l4 4V6
                            c3.31 0 6 2.69 6 6 0 1.74-.76 3.3-1.96 4.39l1.42 1.42
                            A7.963 7.963 0 0020 12c0-4.42-3.58-8-8-8z"/>
                        </svg>
                       </div>`,
                click: () => {
                    art.currentTime -= 10;
                    const btn = document.querySelector('#rewind-btn svg');
                    btn.classList.remove('spin-left'); 
                    void btn.offsetWidth;
                    btn.classList.add('spin-left');
                    btn.addEventListener('animationend', () => {
                        btn.classList.remove('spin-left');
                    }, { once: true });
                }
            },
            {
                position: 'right',
                html: `<div class="art-skip-icon" id="forward-btn">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 4V1l4 4-4 4V6
                            c-3.31 0-6 2.69-6 6 0 1.74.76 3.3 1.96 4.39l-1.42 1.42
                            A7.963 7.963 0 014 12c0-4.42 3.58-8 8-8z"/>
                        </svg>
                       </div>`,
                click: () => {
                    art.currentTime += 10;
                    const btn = document.querySelector('#forward-btn svg');
                    btn.classList.remove('spin-right');
                    void btn.offsetWidth;
                    btn.classList.add('spin-right');
                    btn.addEventListener('animationend', () => {
                        btn.classList.remove('spin-right');
                    }, { once: true });
                }
            }
        ]
    });
    
    art.switchUrl(m3u8Url);

    setupResponsiveControls(art);

    art.on('destroy', () => { try { hls.destroy(); } catch {} });
} else {
    document.body.innerHTML = `<h2 class='msg'>Trình duyệt không hỗ trợ HLS</h2>`;
}
