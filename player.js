const adsRegexList = [
    /(?<!#EXT-X-DISCONTINUITY[\s\S]*)#EXT-X-DISCONTINUITY\n(?:.*?\n){18,24}#EXT-X-DISCONTINUITY\n(?![\s\S]*#EXT-X-DISCONTINUITY)/g,
    /#EXT-X-DISCONTINUITY\n(?:#EXT-X-KEY:METHOD=NONE\n(?:.*\n){18,24})?#EXT-X-DISCONTINUITY\n|convertv7\//g,
    /#EXT-X-DISCONTINUITY\n#EXTINF:3\.920000,\n.*\n#EXTINF:0\.760000,\n.*\n#EXTINF:2\.000000,\n.*\n#EXTINF:2\.500000,\n.*\n#EXTINF:2\.000000,\n.*\n#EXTINF:2\.420000,\n.*\n#EXTINF:2\.000000,\n.*\n#EXTINF:0\.780000,\n.*\n#EXTINF:1\.960000,\n.*\n#EXTINF:2\.000000,\n.*\n#EXTINF:1\.760000,\n.*\n#EXTINF:3\.200000,\n.*\n#EXTINF:2\.000000,\n.*\n#EXTINF:1\.360000,\n.*\n#EXTINF:2\.000000,\n.*\n#EXTINF:2\.000000,\n.*\n#EXTINF:0\.720000,\n.*/g
];

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
    class CustomLoader extends Hls.DefaultConfig.loader {
        load(context, config, callbacks) {
            const originalOnSuccess = callbacks.onSuccess;
            const wrappedCallbacks = {
                ...callbacks,
                onSuccess: (response, stats, ctx, networkDetails) => {
                    if (ctx.type === 'manifest' || ctx.type === 'level') {
                        let text = response.data;
                        adsRegexList.forEach(r => {
                            text = text.replace(r, '');
                        });
                        response.data = text;
                    }
                    originalOnSuccess(response, stats, ctx, networkDetails);
                }
            };
            super.load(context, config, wrappedCallbacks);
        }
    }

    const hls = new Hls({
        loader: CustomLoader,
    });
    
    const art = new Artplayer({
        container: '#player',
        url: '',
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
                hls.loadSource(url);
                hls.attachMedia(video);
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

    hls.attachMedia(art.video);
    hls.loadSource(m3u8Url);
    
    setupResponsiveControls(art);

    art.on('destroy', () => { try { hls.destroy(); } catch {} });
} else {
    document.body.innerHTML = `<h2 class='msg'>Trình duyệt không hỗ trợ HLS</h2>`;
}
