/* Brahmavidya: site.js
   Menu, sub-menus, Subscribe dialog, button ripples, tabs, click-to-play
   videos and the photo viewer. No libraries. Every feature checks that its
   elements exist, so pages without them are unaffected. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js');

  /* ---------- Mobile menu ---------- */
  var menuBtn = d.querySelector('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = !d.body.classList.contains('menu-open');
      d.body.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }
  var desktop = function () { return window.matchMedia('(min-width: 1081px)').matches; };
  /* On phones a sub-menu slides open: animate max-height to its real height. */
  var setOpen = function (item, open) {
    item.classList.toggle('is-open', open);
    var btn = item.querySelector('.sub-toggle'), sub = item.querySelector('.sub');
    if (btn) btn.setAttribute('aria-expanded', String(open));
    if (sub) sub.style.maxHeight = (!desktop() && open) ? sub.scrollHeight + 24 + 'px' : '';
  };
  d.querySelectorAll('.sub-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var item = btn.parentElement, open = !item.classList.contains('is-open');
      d.querySelectorAll('.has-sub.is-open').forEach(function (o) { if (o !== item) setOpen(o, false); });
      setOpen(item, open);
    });
  });
  d.addEventListener('click', function (e) {
    if (!e.target.closest('.has-sub') && desktop()) {
      d.querySelectorAll('.has-sub.is-open').forEach(function (o) { setOpen(o, false); });
    }
  });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    d.querySelectorAll('.has-sub.is-open').forEach(function (o) { setOpen(o, false); });
    if (d.body.classList.contains('menu-open') && menuBtn) menuBtn.click();
  });

  /* ---------- Desktop: a pill indicator glides to the hovered menu item ----------
     It rests on the current section's item and glides back when the pointer leaves. */
  var list = d.querySelector('.site-nav .nav-list');
  if (list) {
    var ind = d.createElement('span');
    ind.className = 'nav-ind';
    ind.setAttribute('aria-hidden', 'true');
    list.insertBefore(ind, list.firstChild);
    var items = Array.prototype.filter.call(list.children, function (li) { return li.classList && li.classList.contains('nav-item'); });
    var home = list.querySelector('.nav-item.is-active');
    var place = function (li, instant) {
      if (!desktop()) return;
      if (!li) { ind.style.opacity = '0'; return; }
      if (instant) ind.classList.add('no-anim');
      ind.style.width = li.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + li.offsetLeft + 'px)';
      ind.style.opacity = '1';
      if (instant) { void ind.offsetWidth; ind.classList.remove('no-anim'); }
    };
    items.forEach(function (li) {
      li.addEventListener('mouseenter', function () { list.classList.add('is-hovering'); place(li); });
      li.addEventListener('focusin', function () { place(li); });
    });
    list.addEventListener('mouseleave', function () { list.classList.remove('is-hovering'); place(home); });
    list.addEventListener('focusout', function (e) { if (!list.contains(e.relatedTarget)) place(home); });
    var settle = function () { place(home, true); };
    settle();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(settle);
    window.addEventListener('resize', settle);
  }

  /* ---------- Header lifts with a soft shadow once the page scrolls ---------- */
  var header = d.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Material ripple on buttons ---------- */
  d.addEventListener('pointerdown', function (e) {
    var el = e.target.closest('.btn, .fab-subscribe, .sub a, .menu-btn');
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var r = el.getBoundingClientRect(), size = Math.max(r.width, r.height);
    var s = d.createElement('span');
    s.className = 'ripple';
    s.style.width = s.style.height = size + 'px';
    s.style.left = (e.clientX - r.left - size / 2) + 'px';
    s.style.top = (e.clientY - r.top - size / 2) + 'px';
    el.appendChild(s);
    setTimeout(function () { s.remove(); }, 650);
  });

  /* ---------- Subscribe dialog ---------- */
  var dlg = d.getElementById('subscribe-dialog');
  if (dlg) {
    var form = dlg.querySelector('form'), states = dlg.querySelectorAll('[data-state]'), sink = dlg.querySelector('iframe'), waiting = false;
    var show = function (name) { states.forEach(function (s) { s.hidden = s.getAttribute('data-state') !== name; }); };
    var open = function () {
      show('form');
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      var input = dlg.querySelector('input[type=email]'); if (input) setTimeout(function () { input.focus(); }, 60);
    };
    var close = function () { if (dlg.open && dlg.close) dlg.close(); else dlg.removeAttribute('open'); };
    d.querySelectorAll('[data-open-subscribe]').forEach(function (b) { b.addEventListener('click', open); });
    dlg.querySelectorAll('[data-close-subscribe]').forEach(function (b) { b.addEventListener('click', close); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    form.addEventListener('submit', function (e) {
      var email = form.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { e.preventDefault(); form.email.focus(); return; }
      if (!form.getAttribute('action')) {
        e.preventDefault();
        location.href = 'mailto:' + form.getAttribute('data-mailto') + '?subject=' + encodeURIComponent('Please subscribe me') + '&body=' + encodeURIComponent('Please add ' + email + ' to the Brahmavidya newsletter.');
        show('done'); return;
      }
      waiting = true;
      setTimeout(function () { if (waiting) { waiting = false; show('done'); } }, 2500);
    });
    if (sink) sink.addEventListener('load', function () { if (waiting) { waiting = false; show('done'); form.reset(); } });
    if (location.hash === '#subscribe') open();
  }

  /* ---------- Tabs (e.g. Musicology Day years) ---------- */
  d.querySelectorAll('[data-tabs]').forEach(function (wrap) {
    var tabs = wrap.querySelectorAll('[role=tab]');
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
        var p = d.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (n) { e.preventDefault(); select(tabs[(i + n + tabs.length) % tabs.length], true); }
      });
    });
    var start = wrap.querySelector('[role=tab][aria-selected=true]') || tabs[0];
    if (start) select(start);
  });

  /* ---------- Click-to-play YouTube (nothing loads until asked) ---------- */
  d.querySelectorAll('.video button[data-yt]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = d.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + b.getAttribute('data-yt') + '?autoplay=1&rel=0';
      f.title = b.getAttribute('aria-label') || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      b.parentElement.replaceChildren(f);
    });
  });

  /* ---------- Photo viewer for .gallery ---------- */
  var galleries = d.querySelectorAll('.gallery');
  if (galleries.length && typeof HTMLDialogElement === 'function') {
    var lb = d.createElement('dialog');
    lb.className = 'lightbox';
    lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<img alt=""><p></p>' +
      '<button class="icon-btn lb-nav lb-prev" type="button" aria-label="Previous photo"><svg class="i" viewBox="0 0 24 24"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg></button>' +
      '<button class="icon-btn lb-nav lb-next" type="button" aria-label="Next photo"><svg class="i" viewBox="0 0 24 24"><path d="M10 6 8.6 7.4 13.2 12l-4.6 4.6L10 18l6-6z"/></svg></button>' +
      '<button class="icon-btn lb-close" type="button" aria-label="Close"><svg class="i" viewBox="0 0 24 24"><path d="M18.3 5.71 12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.29-6.3z"/></svg></button>';
    d.body.appendChild(lb);
    var img = lb.querySelector('img'), cap = lb.querySelector('p'), list = [], idx = 0;
    var showAt = function (i) {
      idx = (i + list.length) % list.length;
      var a = list[idx], t = a.querySelector('img');
      img.src = a.getAttribute('href'); img.alt = t ? t.alt : ''; cap.textContent = a.getAttribute('data-caption') || (t ? t.alt : '');
    };
    galleries.forEach(function (g) {
      var links = Array.prototype.slice.call(g.querySelectorAll('a'));
      links.forEach(function (a, i) {
        a.addEventListener('click', function (e) { e.preventDefault(); list = links; showAt(i); lb.showModal(); });
      });
    });
    lb.querySelector('.lb-prev').addEventListener('click', function () { showAt(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { showAt(idx + 1); });
    lb.querySelector('.lb-close').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') showAt(idx - 1); if (e.key === 'ArrowRight') showAt(idx + 1); });
  }
})();
