// Script básico para futuras animaciones o interacciones

document.addEventListener('DOMContentLoaded', () => {
    console.log('Portafolio cargado correctamente');

  // Ejemplo: animación simple al hacer hover en videos
    const cards = document.querySelectorAll('.video-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
        card.style.transform = 'scale(1.03)';
        card.style.transition = '0.3s ease';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'scale(1)';
    });
});
});
