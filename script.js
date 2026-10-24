document.addEventListener("DOMContentLoaded", () => {

  // ... reveal observer ...

  const eyes = document.querySelectorAll('.eye');
  const strength = 0.02;
  const maxOffset = 20;
  const orientationStrength = 1.5;

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
                   || ('ontouchstart' in window && window.innerWidth < 1024);

  function moveEyes(dx, dy) {
    const clampedX = Math.max(-maxOffset, Math.min(maxOffset, dx));
    const clampedY = Math.max(-maxOffset, Math.min(maxOffset, dy));
    eyes.forEach(eye => {
      eye.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
    });
  }

  function initMouseTracking() {
    document.addEventListener("mousemove", (e) => {
      const eye = eyes[0];
      if (!eye) return;
      const eyeRect = eye.getBoundingClientRect();
      const eyeCenterX = eyeRect.left + eyeRect.width / 2;
      const eyeCenterY = eyeRect.top + eyeRect.height / 2;

      const moveX = (e.clientX - eyeCenterX) * strength;
      const moveY = (e.clientY - eyeCenterY) * strength;

      moveEyes(moveX, moveY);
    });
  }

  function initOrientationTracking() {
    let baseBeta = null;
    let baseGamma = null;

    function handleOrientation(e) {
      if (e.gamma === null || e.beta === null) return;
      if (baseBeta === null) {
        baseBeta = e.beta;
        baseGamma = e.gamma;
      }
      const dx = (e.gamma - baseGamma) * orientationStrength;
      const dy = (e.beta - baseBeta) * orientationStrength;
      moveEyes(dx, dy);
    }

    const requestPermission = () => {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(state => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    window.addEventListener('touchstart', function onFirstTouch() {
      requestPermission();
      window.removeEventListener('touchstart', onFirstTouch);
    }, { once: true });
  }

  if (isMobile) {
    initOrientationTracking();
  } else {
    initMouseTracking();
  }
});


// === Деликатный scroll-reveal для картинок на главной ===
document.addEventListener("DOMContentLoaded", () => {
  if (!document.body.classList.contains('page-home')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const figures = Array.from(document.querySelectorAll('figure'));
  if (!figures.length) return;

  const INITIAL_SCALE = 0.93; // 0.96 — если хочется ещё деликатнее
  const RANGE_FACTOR  = 0.5;  // «длина» анимации в долях высоты вьюпорта

  const active = new Set();

  const clamp01    = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const smoothstep = t => t * t * (3 - 2 * t);

  const setScale = (el, scale) => {
    el.style.setProperty('--scroll-scale', scale);
  };

  function update() {
    const vh      = window.innerHeight;
    const vCenter = vh / 2;
    const range   = vh * RANGE_FACTOR;

    active.forEach(el => {
      const rect     = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const delta    = elCenter - vCenter;

      // 1 — центр картинки совпадает с центром экрана,
      // 0 — картинка далеко вверх ИЛИ вниз (симметрично)
      const p = smoothstep(clamp01(1 - Math.abs(delta) / range));

      setScale(el, INITIAL_SCALE + (1 - INITIAL_SCALE) * p);
    });
  }

  let ticking = false;
  function scheduleUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) active.add(e.target);
      else                  active.delete(e.target);
    }
    scheduleUpdate();
  }, { rootMargin: '20% 0px 20% 0px' });

  figures.forEach(f => {
    setScale(f, INITIAL_SCALE);
    io.observe(f);
  });

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });

  scheduleUpdate();
});