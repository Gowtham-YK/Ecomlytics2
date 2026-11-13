/**
 * ECOMLYTICS — Marketing Website Interactivity
 * Sticky nav, mobile drawer, contact modal, smooth scrolling
 */

(function (window) {
  'use strict';

  function initMarketing() {
    // 1. Sticky Header scroll listener
    const header = document.querySelector('.site-header');
    if (header) {
      const handleScroll = () => {
        if (window.scrollY > 24) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    // 2. Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileDrawer = document.querySelector('.mobile-nav-drawer');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (mobileToggle && mobileDrawer) {
      mobileToggle.addEventListener('click', () => {
        const isOpen = mobileDrawer.classList.toggle('active');
        mobileToggle.setAttribute('aria-expanded', isOpen);
        mobileToggle.textContent = isOpen ? 'CLOSE' : 'MENU';
      });

      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          mobileDrawer.classList.remove('active');
          mobileToggle.textContent = 'MENU';
          mobileToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // 3. Smooth scrolling for internal anchor links with sticky navbar offset
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || targetId === '') return;
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });

    // 4. Contact Modal Controller
    const contactModal = document.getElementById('contact-modal');
    const openContactBtns = document.querySelectorAll('[data-open-contact]');
    const closeContactBtn = document.getElementById('close-contact-modal');
    const contactForm = document.getElementById('contact-form');

    if (contactModal) {
      const openModal = () => {
        contactModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      };

      const closeModal = () => {
        contactModal.classList.remove('active');
        document.body.style.overflow = '';
      };

      openContactBtns.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      }));

      if (closeContactBtn) {
        closeContactBtn.addEventListener('click', closeModal);
      }

      contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
          closeModal();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && contactModal.classList.contains('active')) {
          closeModal();
        }
      });

      if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const emailInput = contactForm.querySelector('input[type="email"]');
          const messageInput = contactForm.querySelector('textarea');
          
          if (!emailInput.value) return;

          // Replace form with clean confirmation message
          contactForm.innerHTML = `
            <div style="text-align: center; padding: 24px 0;">
              <div style="font-family: var(--font-display); font-size: 1.125rem; letter-spacing: 0.08em; margin-bottom: 8px;">
                MESSAGE RECEIVED
              </div>
              <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;">
                Thank you for reaching out. The Ecomlytics product analytics team will review your inquiry and respond to <strong>${emailInput.value}</strong> promptly.
              </p>
              <button type="button" class="btn btn-secondary btn-sm" id="contact-done-btn" style="margin-top: 24px;">
                CLOSE
              </button>
            </div>
          `;

          const doneBtn = document.getElementById('contact-done-btn');
          if (doneBtn) {
            doneBtn.addEventListener('click', closeModal);
          }
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMarketing);
  } else {
    initMarketing();
  }
})(window);
