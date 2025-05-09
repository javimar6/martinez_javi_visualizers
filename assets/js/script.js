document.addEventListener('DOMContentLoaded', () => {
    // Navegación HOME / INDEX / ABOUT
    const homeButton  = document.querySelector('.menu-item:nth-child(1) .menu-item-text');
    const indexButton = document.querySelector('.menu-item:nth-child(2) .menu-item-text');
    const aboutButton = document.querySelector('.menu-item:nth-child(3) .menu-item-text');
    const sectionHome  = document.querySelector('.section-home');
    const sectionIndex = document.querySelector('.section-index');
    const sectionAbout = document.querySelector('.section-about');
  
    const setActiveButton = btn => {
      [homeButton, indexButton, aboutButton].forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  
    // Estado inicial
    sectionHome.classList.add('active');
    setActiveButton(homeButton);
  
    // Interacciones de índice
    const interactions = [
      { textClass: '.tipografias', descriptionClass: '.description-tipografias' },
      { textClass: '.contraste', descriptionClass: '.description-contraste' },
      { textClass: '.distorsion-visual', descriptionClass: '.description-distorsion-visual' },
      { textClass: '.distorsion-tipografica', descriptionClass: '.description-distorsion-tipografica' }
    ];
  
    interactions.forEach(({ textClass, descriptionClass }) => {
      const textEl = document.querySelector(`.section-index-text${textClass}`);
      const descEl = document.querySelector(descriptionClass);
      if (!textEl || !descEl) return;
  
      textEl.addEventListener('mouseenter', () => {
        if (!sectionHome.classList.contains('index-active')) return;
        sectionHome.style.top = '65vh';
        descEl.classList.add('visible');
        descEl.querySelectorAll('p span').forEach((word, i) => {
          word.style.animation = 'none';
          word.offsetHeight;
          word.style.animation = '';
          word.style.animationDelay = `${i * 0.05}s`;
        });
      });
  
      textEl.addEventListener('mouseleave', () => {
        if (!sectionHome.classList.contains('index-active')) return;
        sectionHome.style.top = '';
        descEl.classList.remove('visible');
      });
  
      textEl.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        e.stopPropagation();
        textEl.classList.toggle('active');
        descEl.classList.toggle('visible');
        if (textEl.classList.contains('active')) {
          descEl.querySelectorAll('p span').forEach((word, i) => {
            word.style.animationDelay = `${i * 0.05}s`;
          });
        }
      });
  
      document.addEventListener('click', (e) => {
        if (!descEl.contains(e.target) && !textEl.contains(e.target)) {
          textEl.classList.remove('active');
          descEl.classList.remove('visible');
        }
      });
    });
  
    // Botones HOME / INDEX / ABOUT
    homeButton.addEventListener('click', () => {
      sectionHome.classList.add('active');
      sectionHome.classList.remove('index-active', 'about-active');
      sectionIndex.classList.remove('active');
      sectionAbout.classList.remove('active');
      setActiveButton(homeButton);
    });
  
    indexButton.addEventListener('click', () => {
      sectionIndex.classList.toggle('active');
      sectionHome.classList.toggle('index-active');
      sectionHome.classList.remove('active', 'about-active');
      sectionAbout.classList.remove('active');
      setActiveButton(indexButton);
    });
  
    aboutButton.addEventListener('click', () => {
      sectionAbout.classList.toggle('active');
      sectionHome.classList.toggle('about-active');
      sectionHome.classList.remove('active', 'index-active');
      sectionIndex.classList.remove('active');
      setActiveButton(aboutButton);
      if (sectionAbout.classList.contains('active')) {
        sectionAbout.querySelectorAll('p span').forEach((word, i) => {
          word.style.animation = 'none';
          word.offsetHeight;
          word.style.animation = '';
          word.style.animationDelay = `${i * 0.05}s`;
        });
      }
    });
  
    // Custom cursor + lógica de inversión de color
    const customCursor = document.getElementById('custom-cursor');
    let lastEl = null;
  
    document.addEventListener('mousemove', e => {
      // 1) Mover el div del cursor
      if (customCursor) {
        customCursor.style.left = e.clientX + 'px';
        customCursor.style.top  = e.clientY + 'px';
      }
  

      
    });
  });
  
 