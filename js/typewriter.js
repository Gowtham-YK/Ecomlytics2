/**
 * ECOMLYTICS — Signature Typewriter Intro Effect
 * Runs precisely once per initial page load with natural blinking cursor
 */

(function (window) {
  'use strict';

  function initTypewriter() {
    const textTarget = document.getElementById('typewriter-text');
    const cursor = document.getElementById('typewriter-cursor');
    const heroContent = document.getElementById('hero-main-content');

    if (!textTarget || !cursor) return;

    const fullWord = 'ECOMLYTICS';
    
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      textTarget.textContent = fullWord;
      cursor.style.display = 'inline-block';
      if (heroContent) {
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'none';
      }
      return;
    }

    // Step sequence requested by specification:
    // Initial blinking caret pause before typing begins
    cursor.style.display = 'inline-block';
    textTarget.textContent = '';

    let currentIndex = 0;
    const initialDelayMs = 350; // brief natural pause
    const letterSpeedMs = 70;   // fast, elegant cadence

    setTimeout(() => {
      const typeInterval = setInterval(() => {
        currentIndex++;
        textTarget.textContent = fullWord.slice(0, currentIndex);

        if (currentIndex >= fullWord.length) {
          clearInterval(typeInterval);
          
          // Animation complete: leave completed word visible
          // Allow the caret to continue blinking
          if (heroContent) {
            heroContent.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
          }
        }
      }, letterSpeedMs);
    }, initialDelayMs);
  }

  // Ensure DOM is ready before firing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTypewriter);
  } else {
    initTypewriter();
  }
})(window);
