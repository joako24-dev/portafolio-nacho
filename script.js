const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles=[];

for(let i=0;i<100;i++){

particles.push({

x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
vx:(Math.random()-0.5)*0.5,
vy:(Math.random()-0.5)*0.5,
size:2

});

}

function animate(){

ctx.clearRect(0,0,canvas.width,canvas.height);

ctx.fillStyle="rgba(139,92,246,0.7)";

particles.forEach(p=>{

p.x+=p.vx;
p.y+=p.vy;

if(p.x<0||p.x>canvas.width)p.vx*=-1;
if(p.y<0||p.y>canvas.height)p.vy*=-1;

ctx.beginPath();
ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
ctx.fill();

});

requestAnimationFrame(animate);

}

animate();
// 🔥 Control profesional de controles
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