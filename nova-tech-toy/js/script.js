/* ==========================================================================
   NOVA TECH TOY — script.js
   JavaScript puro (sem dependências externas).

   Índice:
   1. Inicialização
   2. Utilitário de throttle para eventos de scroll
   3. setupHeaderScroll()   — efeito dinâmico no header ao rolar
   4. setupMobileMenu()     — menu hamburger responsivo
   5. setupSmoothScroll()   — rolagem suave entre seções
   6. setupScrollAnimations() — revelação de elementos ao entrar no viewport
   7. setupImpactCounters() — contadores animados da seção de impacto
   8. setupBackToTop()      — botão flutuante de voltar ao topo
   9. setupFooterYear()     — atualiza o ano no rodapé
   ========================================================================== */

'use strict';

/* ==========================================================================
   1. INICIALIZAÇÃO
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  setupHeaderScroll();
  setupMobileMenu();
  setupSmoothScroll();
  setupScrollAnimations();
  setupImpactCounters();
  setupBackToTop();
  setupFooterYear();
});

/* ==========================================================================
   2. UTILITÁRIO DE THROTTLE
   Agrupa callbacks de scroll em requestAnimationFrame para evitar
   recalcular estilos/layout mais do que uma vez por frame.
   ========================================================================== */
function onScrollThrottled(callback) {
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ==========================================================================
   3. HEADER DINÂMICO
   Adiciona sombra, leve blur e reduz a altura do header após rolar a página.
   ========================================================================== */
function setupHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;

  const SCROLL_THRESHOLD = 24;

  const updateHeaderState = () => {
    header.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
  };

  updateHeaderState();
  onScrollThrottled(updateHeaderState);
}

/* ==========================================================================
   4. MENU MOBILE
   Controla a abertura/fechamento do menu hamburger, incluindo suporte
   a teclado (Esc fecha o menu) e fechamento automático ao navegar.
   ========================================================================== */
function setupMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navWrap = document.getElementById('navWrap');
  if (!hamburger || !navWrap) return;

  const closeMenu = () => {
    navWrap.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Abrir menu de navegação');
  };

  const openMenu = () => {
    navWrap.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Fechar menu de navegação');
  };

  hamburger.addEventListener('click', () => {
    const isOpen = navWrap.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  });

  navWrap.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navWrap.classList.contains('is-open')) {
      closeMenu();
      hamburger.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860 && navWrap.classList.contains('is-open')) {
      closeMenu();
    }
  });
}

/* ==========================================================================
   5. ROLAGEM SUAVE
   Intercepta cliques em links internos (#âncora) e rola suavemente até a
   seção, compensando a altura do header fixo.
   ========================================================================== */
function setupSmoothScroll() {
  const header = document.getElementById('header');
  const internalLinks = document.querySelectorAll('a[href^="#"]');

  internalLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId.length < 2) return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();

      const headerHeight = header ? header.offsetHeight : 0;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight + 1;

      window.scrollTo({ top: targetPosition, behavior: 'smooth' });

      // Move o foco para a seção após a rolagem, preservando a navegação por teclado
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      window.setTimeout(() => target.focus({ preventScroll: true }), 550);
    });
  });
}

/* ==========================================================================
   6. ANIMAÇÕES AO SCROLL
   Usa IntersectionObserver para revelar suavemente elementos marcados
   com a classe ".reveal" conforme entram no viewport.
   ========================================================================== */
function setupScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length) return;

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  });

  revealElements.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   7. CONTADORES DE IMPACTO
   Anima os números da seção de impacto do zero até o valor definido em
   data-target quando a seção entra no viewport. Os valores são placeholders
   editáveis (ver atributos data-target/data-suffix no HTML).
   ========================================================================== */
function setupImpactCounters() {
  const counters = document.querySelectorAll('.impact-value');
  if (!counters.length) return;

  const animateCounter = (element) => {
    const target = parseInt(element.dataset.target, 10) || 0;
    const suffix = element.dataset.suffix || '';
    const duration = 1800;
    let startTime = null;

    const step = (timestamp) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(eased * target);

      element.textContent = currentValue.toLocaleString('pt-BR') + suffix;

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = target.toLocaleString('pt-BR') + suffix;
      }
    };

    window.requestAnimationFrame(step);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((counter) => observer.observe(counter));
}

/* ==========================================================================
   8. BOTÃO VOLTAR AO TOPO
   Exibe um botão discreto após determinado ponto de rolagem, que leva
   suavemente o usuário de volta ao início da página.
   ========================================================================== */
function setupBackToTop() {
  const button = document.getElementById('backToTop');
  if (!button) return;

  const SHOW_AFTER = 480;

  const toggleVisibility = () => {
    button.classList.toggle('is-visible', window.scrollY > SHOW_AFTER);
  };

  toggleVisibility();
  onScrollThrottled(toggleVisibility);

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ==========================================================================
   9. ANO DO RODAPÉ
   Mantém o ano do aviso de direitos autorais sempre atualizado.
   ========================================================================== */
function setupFooterYear() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}
