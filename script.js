
const videos = document.querySelectorAll('video');

videos.forEach(video => {

    let controlsActivadosUnaVez = false;
    let timeout;

    // Click para reproducir o pausar
    video.addEventListener('click', () => {

        if (video.paused) {
            video.play();

            if (!controlsActivadosUnaVez) {
                video.setAttribute('controls', 'true');
                controlsActivadosUnaVez = true;
            }

            iniciarTemporizador();
        } else {
            video.pause();
        }

    });

    // Ocultar controles al pausar
    video.addEventListener('pause', () => {
        video.removeAttribute('controls');
        clearTimeout(timeout);
    });

    // Detectar movimiento del mouse
    video.addEventListener('mousemove', () => {
        if (!video.paused) {
            video.setAttribute('controls', 'true');
            iniciarTemporizador();
        }
    });

    function iniciarTemporizador() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (!video.paused) {
                video.removeAttribute('controls');
            }
        }, 3000); // 3 segundos
    }

});
