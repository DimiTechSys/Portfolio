/* Occitanie Verte — interactions globales */
(function () {
  'use strict';

  // --- Menu mobile ---
  var burger = document.querySelector('.burger');
  var mobileMenu = document.getElementById('mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Année dynamique dans le footer ---
  var y = document.getElementById('year');
  if (y) { y.textContent = new Date().getFullYear(); }

  // --- Apparition au scroll ---
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // --- Formulaire de contact ---
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (ev) {
      var success = document.getElementById('form-success');
      // Si Netlify est actif, on laisse la soumission native se faire.
      // Sinon (test local / pas de backend), on affiche la confirmation et on bascule vers WhatsApp.
      var isNetlify = form.getAttribute('data-netlify') === 'true' && location.hostname.indexOf('localhost') === -1;
      if (!isNetlify) {
        ev.preventDefault();
        var data = new FormData(form);
        var msg = 'Bonjour Occitanie Verte, je souhaite un devis gratuit.%0A'
          + 'Prénom : ' + encodeURIComponent(data.get('firstName') || '') + '%0A'
          + 'Nom : ' + encodeURIComponent(data.get('lastName') || '') + '%0A'
          + 'Téléphone : ' + encodeURIComponent(data.get('phone') || '') + '%0A'
          + 'Message : ' + encodeURIComponent(data.get('message') || '');
        if (success) { success.classList.add('show'); }
        form.reset();
        window.open('https://wa.me/33665337166?text=' + msg, '_blank');
      }
    });
  }
})();
