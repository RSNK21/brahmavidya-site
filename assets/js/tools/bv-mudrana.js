/* BV Mudrana launch page behaviour.
   The converters come from bv-legacy-converters.js (loaded just before this file),
   which defines window.BV.Legacy, window.BV.DevLegacy and window.BV.BVKannada.
   On WordPress these were packed inside a PNG; here they are a normal script. */
window.__bvmMain = function () {
var L = window.BV && window.BV.Legacy;
var DL = window.BV && window.BV.DevLegacy;
var $ = function (id) { return document.getElementById(id); };
var ENCS = [
{ id: 'nudi', name: 'Nudi / Baraha', sub: 'Kannada', font: "'Praja Unicode', 'BVMatanga', serif", fontName: 'Praja Unicode', lang: 'kn', sample: 'ಕನ್ನಡ ಸಾಹಿತ್ಯ ಪರಿಷತ್ತಿನ ಮುದ್ರಣಾಲಯದಲ್ಲಿ ಮೊದಲ ಪುಸ್ತಕ ಅಚ್ಚಾಯಿತು.',
note: 'Nudi and Baraha store a Kannada syllable as pieces of shapes. The Brahmavidya Kannada converter puts each syllable back in Unicode order, keeping visible halants.' },
{ id: 'praja', name: 'Praja', sub: 'Kannada (Prajavani)', font: "'Praja Unicode', serif", fontName: 'Praja Unicode', lang: 'kn', sample: 'ಪ್ರಜಾವಾಣಿ ಪತ್ರಿಕೆಯ ಅಕ್ಷರಗಳು ಈಗ ಯೂನಿಕೋಡಿನಲ್ಲಿ.',
note: 'Praja has its own layout, not Nudi’s. Converted text set in Praja Unicode has the same letters and the same widths, so nothing on the page moves.' },
{ id: 'chanakya', name: 'Chanakya', sub: 'Devanagari', font: "'BVChitkala', serif", fontName: 'BV Chitkala', lang: 'sa', sample: 'धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।',
note: 'Chanakya writes the i-sign before its consonant and the reph after it, as they are seen. The converter reorders them, rebuilds conjuncts from half forms, and sets the result in BV Chitkala, made from Chanakya itself.' },
{ id: 'walkman', name: 'Walkman-Chanakya', sub: 'Hindi (Kruti layout)', font: "'BVChitkala', serif", fontName: 'BV Chitkala Hindi', lang: 'hi', sample: 'नमस्ते भारत । हिन्दी की क्रिया ।',
note: 'Walkman-Chanakya-901 uses the Kruti Dev keyboard layout, common in Hindi newspapers. Its text goes to BV Chitkala Hindi.' },
{ id: 'nalanda', name: 'Nalanda', sub: 'IAST transliteration', font: "'BVNanda', serif", fontName: 'BV Nanda', lang: 'sa-Latn', sample: 'Śrīmad Bhagavadgītā: dharmakṣetre kurukṣetre samavetā yuyutsavaḥ',
note: 'In Nalanda fonts an accent is a separate key typed before its letter. The converter joins each accent to its letter, so ṛ, ū and ṃ become single Unicode characters, set in BV Nanda.' },
];
var enc = ENCS[0], toUni = true;
function legacyOf(e, t) { return L.fromUnicode(t, e.id); }
function uniOf(e, t) { return L.toUnicode(t, e.id); }
function render() {
var v = $('bvm-in').value;
var out = toUni ? uniOf(enc, v) : legacyOf(enc, v);
var o = $('bvm-out');
o.textContent = out;
o.style.fontFamily = toUni ? enc.font : "ui-monospace, 'Cascadia Mono', Consolas, monospace";
o.style.fontSize = toUni ? '' : '19px';
o.lang = toUni ? enc.lang : 'en';
$('bvm-count').textContent = [...v].length + ' characters in';
}
function labels() {
$('bvm-in-lbl').textContent = toUni ? 'Typed in ' + enc.name + ' (ASCII)' : 'Unicode text';
$('bvm-out-lbl').textContent = toUni ? 'Unicode, in ' + enc.fontName : 'For the old ' + enc.name + ' font';
var i = $('bvm-in');
i.style.fontFamily = toUni ? "ui-monospace, 'Cascadia Mono', Consolas, monospace" : enc.font;
i.style.fontSize = toUni ? '' : '22px';
$('bvm-enc-note').textContent = enc.note;
}
function load() { $('bvm-in').value = toUni ? legacyOf(enc, enc.sample) : enc.sample; render(); }
var tabs = $('bvm-enc');
ENCS.forEach(function (e, k) {
var b = document.createElement('button');
b.className = 'bvm-tab'; b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'bvm-tab-' + e.id;
b.setAttribute('aria-selected', k === 0 ? 'true' : 'false'); b.tabIndex = k === 0 ? 0 : -1;
b.innerHTML = e.name + '<small>' + e.sub + '</small>';
b.addEventListener('click', function () { select(k, true); });
tabs.appendChild(b);
});
function select(k, focus) {
enc = ENCS[k];
[].forEach.call(tabs.children, function (b, j) { b.setAttribute('aria-selected', j === k ? 'true' : 'false'); b.tabIndex = j === k ? 0 : -1; if (j === k && focus) b.focus(); });
labels(); load();
}
tabs.addEventListener('keydown', function (ev) {
var k = ENCS.indexOf(enc);
if (ev.key === 'ArrowRight') { ev.preventDefault(); select((k + 1) % ENCS.length, true); }
if (ev.key === 'ArrowLeft') { ev.preventDefault(); select((k - 1 + ENCS.length) % ENCS.length, true); }
});
$('bvm-in').addEventListener('input', render);
$('bvm-sample').addEventListener('click', load);
$('bvm-swap').addEventListener('click', function () {
var cur = toUni ? uniOf(enc, $('bvm-in').value) : $('bvm-in').value;
toUni = !toUni;
$('bvm-in').value = toUni ? legacyOf(enc, cur) : cur;
labels(); render();
});
$('bvm-copy').addEventListener('click', function () {
var t = $('bvm-out').textContent;
var done = function (ok) { $('bvm-copied').textContent = ok ? 'Copied.' : 'Select the text and press Ctrl+C.'; setTimeout(function () { $('bvm-copied').textContent = ''; }, 2500); };
try { navigator.clipboard.writeText(t).then(function () { done(true); }, function () { selectOut(); done(false); }); } catch (e) { selectOut(); done(false); }
});
function selectOut() { var r = document.createRange(); r.selectNodeContents($('bvm-out')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
labels(); load();
var STICK = [
{ e: ENCS[0], t: 'ಕನ್ನಡ ಮುದ್ರಣ', f: "'BVMatanga', serif" },
{ e: ENCS[1], t: 'ಪ್ರಜಾವಾಣಿ', f: "'Praja Unicode', serif" },
{ e: ENCS[2], t: 'श्रीमद्भगवद्गीता', f: "'BVChitkala', serif" },
{ e: ENCS[4], t: 'Śrīmad Bhagavadgītā', f: "'BVNanda', serif" },
];
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var si = 0, timer = 0, paused = false;
var pips = $('bvm-pips');
STICK.forEach(function (s, k) {
var b = document.createElement('button');
b.type = 'button'; b.textContent = String(k + 1); b.setAttribute('aria-pressed', k === 0 ? 'true' : 'false');
b.setAttribute('aria-label', s.e.name + ' example');
b.addEventListener('click', function () { paused = true; show(k); });
pips.appendChild(b);
});
function show(k) {
clearTimeout(timer);
si = k;
var s = STICK[k];
[].forEach.call(pips.children, function (b, j) { b.setAttribute('aria-pressed', j === k ? 'true' : 'false'); });
$('bvm-stick-font').textContent = s.e.name;
var ascii = legacyOf(s.e, s.t);
var a = $('bvm-ascii'), u = $('bvm-uni');
a.textContent = ascii;
u.style.fontFamily = s.f;
u.lang = s.e.lang;
var g = window.Intl && Intl.Segmenter ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s.t)].map(function (x) { return x.segment; }) : [...s.t];
var seg = [];
g.forEach(function (c) { var last = seg[seg.length - 1]; if (last && /[್्]$/.test(last)) seg[seg.length - 1] = last + c; else seg.push(c); });
u.innerHTML = '';
var spans = seg.map(function (g) { var sp = document.createElement('span'); sp.className = 'ch' + (reduce ? '' : ' off'); sp.textContent = g; u.appendChild(sp); return sp; });
if (!reduce) spans.forEach(function (sp, j) { setTimeout(function () { sp.classList.remove('off'); }, 260 + j * 110); });
if (!paused) timer = setTimeout(function () { show((si + 1) % STICK.length); }, 4200 + seg.length * 110);
}
show(0);
var wsList = $('bvm-ws-list');
var SHOTS = { 'pagemaker-dark': '../assets/uploads/2026/10/bv-mudrana-pagemaker-dark.jpg', 'word-light': '../assets/uploads/2026/10/bv-mudrana-word-light.jpg', 'basic-material': '../assets/uploads/2026/10/bv-mudrana-basic-material.jpg', 'advanced-expressive': '../assets/uploads/2026/10/bv-mudrana-advanced-expressive.jpg', 'classic': '../assets/uploads/2026/10/bv-mudrana-classic.jpg' };
wsList.addEventListener('click', function (ev) {
var b = ev.target.closest('button');
if (!b) return;
[].forEach.call(wsList.children, function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
var img = $('bvm-ws-img');
img.style.opacity = '.25';
setTimeout(function () { img.src = SHOTS[b.dataset.shot]; img.alt = b.dataset.alt; img.style.opacity = '1'; }, reduce ? 0 : 140);
});
var sz = $('bvm-size');
sz.addEventListener('input', function () { document.querySelector('.bvm-specimens').style.setProperty('--bvm-spec-size', sz.value + 'px'); $('bvm-size-out').textContent = sz.value + ' px'; });
document.querySelector('.bvm-specimens').style.setProperty('--bvm-spec-size', sz.value + 'px');
};

(function () {
  function start() {
    if (!window.BV || !window.BV.Legacy) {
      window.BV = window.BV || {};
      window.BV.Legacy = { toUnicode: function (s) { return s; }, fromUnicode: function (s) { return s; } };
      var n = document.getElementById('bvm-enc-note');
      if (n) n.textContent = 'The converter could not load in this browser. Please refresh the page.';
    }
    try { window.__bvmMain(); } catch (e) { if (window.console) console.error(e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
