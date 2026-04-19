// ════════════════════════════════════════════════
//  CONFIGURACIÓN — Editá estos valores
// ════════════════════════════════════════════════
const CONFIG = {
  nombre:  "Nacho Bagnato",
  rol:     "Editor de Video",
  tagline: "Historias que <em>mueven</em><br>al mundo",
  bio: `Especialista en edición de reels/tik tok con más de <strong>3 años</strong> de experiencia.<br><br>
        Trabajé con marcas, músicos y directores independientes para crear piezas que
        <strong>conectan emocionalmente</strong> con su audiencia.`,

  // ─── Google Sheets CSV ───────────────────────────────────────
  // Pasos para obtener tu URL:
  //  1. Abrí tu Google Sheet
  //  2. Archivo → Compartir → Publicar en la web
  //  3. Elegí "Hoja 1" y formato "Valores separados por comas (.csv)"
  //  4. Copiá el link y pegalo acá:
  sheetsCSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRrWpQFT1CBhr8LyDC0zbIvGktabPITUFCD3VdKMjFkT83IZLqAuGAW_M2JIN1yyIPOmh0M8aROjovY/pub?gid=0&single=true&output=csv",

  // Columnas esperadas en el Sheet (fila 1 = cabecera, ignorada):
  //  A: Título  |  B: Descripción  |  C: URL del video  |  D: Categoría
};

// ════════════════════════════════════════════════
//  ESTADO GLOBAL
// ════════════════════════════════════════════════
let allVideos  = [];
let categories = new Set();

// ════════════════════════════════════════════════
//  INIT — Ejecuta todo al cargar la página
// ════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Inyectar textos del CONFIG en el HTML
  document.getElementById('siteName').textContent  = CONFIG.nombre;
  document.getElementById('siteRole').textContent  = CONFIG.rol;
  document.getElementById('heroTagline').innerHTML = CONFIG.tagline;
  document.getElementById('heroBio').innerHTML     = CONFIG.bio;
  document.getElementById('footerName').textContent =
    '© ' + new Date().getFullYear() + ' ' + CONFIG.nombre;

  // Cargar videos
  loadVideos();

  // Cerrar lightbox con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Scroll reveal
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    .forEach(el => revealObserver.observe(el));
});

// ════════════════════════════════════════════════
//  CARGA DE DATOS DESDE GOOGLE SHEETS
// ════════════════════════════════════════════════
async function loadVideos() {
  const grid = document.getElementById('videoGrid');

  try {
    const res = await fetch(CONFIG.sheetsCSV);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    const rows = parseCSV(text);

    if (rows.length <= 1) {
      showState(grid, 'El sheet está vacío. Agregá videos en tu Google Sheet.');
      return;
    }

    // Fila 0 = cabecera → ignorar
    allVideos = rows.slice(1)
      .filter(r => r[0] && r[2])
      .map((r, i) => ({
        index:    String(i + 1).padStart(2, '0'),
        title:    (r[0] || '').trim(),
        desc:     (r[1] || '').trim(),
        url:      (r[2] || '').trim(),
        category: (r[3] || 'General').trim(),
      }));

    allVideos.forEach(v => categories.add(v.category));

    buildFilters();
    renderVideos(allVideos);

  } catch (err) {
    grid.innerHTML = `
      <div class="state-msg">
        <p>⚠️ No se pudo conectar con Google Sheets.</p>
        <p>Verificá que el Sheet esté publicado como CSV y que la URL en CONFIG.sheetsCSV sea correcta.</p>
        <p class="error-detail">Error: ${err.message}</p>
      </div>`;
  }
}

// ════════════════════════════════════════════════
//  PARSEAR CSV (respeta comillas y comas internas)
// ════════════════════════════════════════════════
function parseCSV(text) {
  const rows = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const cols = [];
    let cur = '', inQ = false;
    for (const c of line) {
      if (c === '"') { inQ = !inQ; continue; }
      if (c === ',' && !inQ) { cols.push(cur); cur = ''; continue; }
      cur += c;
    }
    cols.push(cur);
    rows.push(cols);
  }
  return rows;
}

// ════════════════════════════════════════════════
//  DETECCIÓN DE PLATAFORMA
// ════════════════════════════════════════════════
function getYoutubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getVimeoId(url) {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

function isCloudinary(url) {
  return url.includes('res.cloudinary.com');
}

// ════════════════════════════════════════════════
//  THUMBNAILS
// ════════════════════════════════════════════════
function getThumbnail(url) {
  const ytId = getYoutubeId(url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

  if (isCloudinary(url)) {
    // Inserta so_0 para capturar el primer frame y cambia la extensión a .jpg
    return url
      .replace('/upload/', '/upload/so_0,q_80,w_800/')
      .replace(/\.(mp4|mov|webm|avi|mkv)(\?.*)?$/i, '.jpg');
  }

  return '';
}

async function loadVimeoThumbnail(videoId, imgEl) {
  try {
    const res  = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`);
    const data = await res.json();
    if (data.thumbnail_url) imgEl.src = data.thumbnail_url;
  } catch {}
}

// ════════════════════════════════════════════════
//  EMBED — YouTube, Vimeo y Cloudinary
// ════════════════════════════════════════════════
function getEmbedUrl(url) {
  const ytId = getYoutubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;

  const vmId = getVimeoId(url);
  if (vmId) return `https://player.vimeo.com/video/${vmId}?autoplay=1`;

  return url; // Cloudinary devuelve la URL directa
}

// ════════════════════════════════════════════════
//  FILTROS POR CATEGORÍA
// ════════════════════════════════════════════════
function buildFilters() {
  const bar = document.getElementById('filterBar');
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className    = 'filter-btn';
    btn.dataset.cat  = cat;
    btn.textContent  = cat;
    btn.onclick      = () => filterVideos(cat, btn);
    bar.appendChild(btn);
  });
}

function filterVideos(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = cat === 'all'
    ? allVideos
    : allVideos.filter(v => v.category === cat);
  renderVideos(filtered);
}

// ════════════════════════════════════════════════
//  RENDER DE CARDS
// ════════════════════════════════════════════════
function renderVideos(videos) {
  const grid = document.getElementById('videoGrid');

  if (!videos.length) {
    showState(grid, 'No hay videos en esta categoría.');
    return;
  }

  grid.innerHTML = videos.map((v, i) => {
    const thumb = getThumbnail(v.url);
    const imgId = `thumb-${i}`;

    const thumbContent = thumb
      ? `<img id="${imgId}" src="${thumb}" alt="${esc(v.title)}" loading="lazy"
             onerror="this.style.display='none'">`
      : placeholderSVG();

    return `
    <div class="video-card" style="animation-delay:${i * 0.06}s"
         onclick="openLightbox('${esc(v.title)}','${esc(v.desc)}','${esc(v.url)}')">
      <div class="video-thumb">
        ${thumbContent}
        <span class="video-index">${v.index}</span>
        ${v.category ? `<span class="video-category-badge">${esc(v.category)}</span>` : ''}
        <div class="play-btn">
          <div class="play-icon">
            <svg width="14" height="14" viewBox="0 0 10 12">
              <path d="M0 0l10 6L0 12z"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="video-info">
        <div class="video-title">${esc(v.title)}</div>
        <div class="video-desc">${esc(v.desc)}</div>
      </div>
    </div>`;
  }).join('');

  // Cargar miniaturas de Vimeo de forma asíncrona
  videos.forEach((v, i) => {
    const vmId = getVimeoId(v.url);
    if (vmId) {
      const img = document.getElementById(`thumb-${i}`);
      if (img) loadVimeoThumbnail(vmId, img);
    }
  });
}

function placeholderSVG() {
  return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
         stroke="#9b59f5" stroke-width="1" opacity="0.35">
      <path d="M15 10l-4-2.27v8.54L15 14l4-2-4-2z"/>
      <rect x="2" y="2" width="20" height="20" rx="2.18"/>
    </svg>
  </div>`;
}

function showState(grid, msg) {
  grid.innerHTML = `<div class="state-msg"><p>${msg}</p></div>`;
}

// ════════════════════════════════════════════════
//  LIGHTBOX
// ════════════════════════════════════════════════
function openLightbox(title, desc, url) {
  document.getElementById('lbTitle').textContent = title;
  document.getElementById('lbDesc').textContent  = desc;

  const videoEl = isCloudinary(url)
    ? `<video src="${url}" controls autoplay playsinline style="width:100%;height:100%;object-fit:contain;background:#000"></video>`
    : `<iframe src="${getEmbedUrl(url)}" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;

  document.getElementById('lbVideo').innerHTML = videoEl;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lbVideo').innerHTML = '';
  document.body.style.overflow = '';
}

// ════════════════════════════════════════════════
//  UTILIDAD — Escapar HTML
// ════════════════════════════════════════════════
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
