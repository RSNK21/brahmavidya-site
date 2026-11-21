/* BV Kannada document converter: Word, Excel, PowerPoint and OpenDocument files,
   legacy Nudi / Baraha <-> Unicode, entirely in the browser.
   Needs: window.BV.BVKannada (bv-legacy-converters.js) and JSZip (vendor/jszip.min.js).
   Only text set in a Nudi or Baraha font is converted (unless "all text" is chosen), so English
   and Unicode text in the same file are left alone. Formatting, images, tables and layout are untouched:
   only the text inside runs and the font names change. */
(function (root) {
'use strict';

const NS = {
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
  s: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  office: 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
  style: 'urn:oasis:names:tc:opendocument:xmlns:style:1.0',
  text: 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
  table: 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
  draw: 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0',
  presentation: 'urn:oasis:names:tc:opendocument:xmlns:presentation:1.0',
  fo: 'urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0',
  svg: 'urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0',
  xml: 'http://www.w3.org/XML/1998/namespace',
};

// Nudi 01e, NUDI 05 k, Nudi Akshar-01, BRH Kannada, Baraha Kannada ... but not their Unicode fonts
const LEGACY_FONT = /(^|[^a-z])(nudi|brh\s*kan|baraha\s*kan|brh\s*kannada|baraha)/i;
const isLegacyFont = (n) => !!n && LEGACY_FONT.test(n) && !/uni/i.test(n);
const KANNADA = /[ಀ-೿]/;
const KN_RUN = /[ಀ-೿‌‍]+(?:[  .,;:!?'"()\-–]+[ಀ-೿‌‍]+)*/g;

// ---------------------------------------------------------------- small DOM helpers (work in browsers and xmldom)
const kids = (el, ns, name) => { const out = []; if (!el) return out; for (let n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 1 && n.namespaceURI === ns && (n.localName || n.nodeName.split(':').pop()) === name) out.push(n); return out; };
const kid = (el, ns, name) => kids(el, ns, name)[0] || null;
const all = (el, ns, name) => Array.from(el.getElementsByTagNameNS(ns, name));
const attr = (el, ns, name) => (el && el.hasAttributeNS(ns, name) ? el.getAttributeNS(ns, name) : null);
const local = (n) => n.localName || n.nodeName.split(':').pop();
function ancestor(el, ns, name) { for (let p = el.parentNode; p && p.nodeType === 1; p = p.parentNode) if (p.namespaceURI === ns && local(p) === name) return p; return null; }
function ensure(parent, ns, qname, first) {
  const name = qname.split(':').pop();
  let el = kid(parent, ns, name);
  if (!el) { el = parent.ownerDocument.createElementNS(ns, qname); if (first && parent.firstChild) parent.insertBefore(el, parent.firstChild); else parent.appendChild(el); }
  return el;
}
function textNodes(el) { const out = []; (function walk(n) { for (let c = n.firstChild; c; c = c.nextSibling) { if (c.nodeType === 3) out.push(c); else if (c.nodeType === 1) walk(c); } })(el); return out; }

// ---------------------------------------------------------------- conversion core
function makeConverter(K, opts, report) {
  const engineOpts = { kannadaDigits: !!opts.kannadaDigits, keepEnglish: false };
  const note = (r) => { for (const u of r.unknown) report.unknown.add(u.char); };
  return {
    a2u(s, keepEnglish) { if (!s) return s; const r = K.toUnicode(s, Object.assign({}, engineOpts, { keepEnglish: !!keepEnglish })); note(r); report.chars += s.length; return r.text; },
    u2a(s) { if (!s) return s; const r = K.toAscii(s, engineOpts); note(r); report.chars += s.length; return r.text; },
  };
}
// Convert a paragraph's legacy pieces together, so a syllable that Word split across two runs
// (bold change, spell-check marks, editing history) is read whole. Each Unicode syllable goes back
// into the run where that syllable began.
function convertGroups(K, C, items, opts, report) {
  let group = [];
  const run = () => {
    if (!group.length) return;
    let joined = '';
    const starts = group.map((it) => { const st = joined.length; joined += it.get(); return st; });
    const r = K.toUnicode(joined, { segments: true, keepEnglish: false, kannadaDigits: !!opts.kannadaDigits });
    for (const u of r.unknown) report.unknown.add(u.char);
    report.chars += joined.length;
    const outs = group.map(() => '');
    let g = 0;
    for (const [pos, str] of r.pieces) { while (g + 1 < group.length && pos >= starts[g + 1]) g++; outs[g] += str; }
    group.forEach((it, i) => it.set(outs[i]));
    group = [];
  };
  for (const it of items) {
    if (it.legacy && it.strict !== false && it.join !== false) group.push(it);
    else { run(); if (it.legacy && it.get()) it.set(C.a2u(it.get(), true)); }
    if (it.breakAfter) run();
  }
  run();
}

// ================================================================ Word (.docx)
function docxStyles(doc, theme) {
  const styles = new Map();
  let defaults = null, defaultPara = null;
  if (doc) {
    const dd = all(doc, NS.w, 'rPrDefault')[0];
    defaults = dd ? kid(dd, NS.w, 'rPr') : null;
    for (const st of all(doc, NS.w, 'style')) {
      const id = attr(st, NS.w, 'styleId');
      const based = kid(st, NS.w, 'basedOn');
      styles.set(id, { rPr: kid(st, NS.w, 'rPr'), basedOn: based ? attr(based, NS.w, 'val') : null, type: attr(st, NS.w, 'type') });
      if (attr(st, NS.w, 'type') === 'paragraph' && attr(st, NS.w, 'default') === '1') defaultPara = id;
    }
  }
  const fontOf = (rPr) => {
    const f = rPr && kid(rPr, NS.w, 'rFonts');
    if (!f) return null;
    const direct = attr(f, NS.w, 'hAnsi') || attr(f, NS.w, 'ascii');
    if (direct) return direct;
    const th = attr(f, NS.w, 'hAnsiTheme') || attr(f, NS.w, 'asciiTheme');
    if (th) return /major/i.test(th) ? theme.major : theme.minor;
    return null;
  };
  const styleFont = (id, seen = new Set()) => {
    if (!id || seen.has(id)) return null; seen.add(id);
    const st = styles.get(id); if (!st) return null;
    return fontOf(st.rPr) || styleFont(st.basedOn, seen);
  };
  return { fontOf, styleFont, defaultFont: () => fontOf(defaults) || styleFont(defaultPara) || theme.minor, defaultPara };
}
function themeFonts(doc) {
  const t = { major: null, minor: null };
  if (!doc) return t;
  const face = (tag) => { const f = all(doc, NS.a, tag)[0]; const l = f && kid(f, NS.a, 'latin'); return l ? l.getAttribute('typeface') : null; };
  t.major = face('majorFont'); t.minor = face('minorFont');
  return t;
}
function setWordFonts(rPr, font, mirrorCs) {
  const f = ensure(rPr, NS.w, 'w:rFonts', true);
  for (const a of ['asciiTheme', 'hAnsiTheme', 'cstheme', 'eastAsiaTheme']) if (f.hasAttributeNS(NS.w, a)) f.removeAttributeNS(NS.w, a);
  f.setAttributeNS(NS.w, 'w:ascii', font); f.setAttributeNS(NS.w, 'w:hAnsi', font); f.setAttributeNS(NS.w, 'w:cs', font);
  if (mirrorCs) {
    // Kannada is a complex script in Word: bold, italic and size must also be set on the cs side
    for (const [a, b] of [['b', 'bCs'], ['i', 'iCs'], ['sz', 'szCs']]) {
      const src = kid(rPr, NS.w, a);
      if (src && !kid(rPr, NS.w, b)) { const c = rPr.ownerDocument.createElementNS(NS.w, 'w:' + b); const v = attr(src, NS.w, 'val'); if (v != null) c.setAttributeNS(NS.w, 'w:val', v); src.parentNode.insertBefore(c, src.nextSibling); }
    }
  }
}
function runFontDocx(r, p, S) {
  const rPr = kid(r, NS.w, 'rPr');
  const direct = S.fontOf(rPr);
  if (direct) return direct;
  const rs = rPr && kid(rPr, NS.w, 'rStyle');
  const fromChar = rs && S.styleFont(attr(rs, NS.w, 'val'));
  if (fromChar) return fromChar;
  const pPr = p && kid(p, NS.w, 'pPr');
  const ps = pPr && kid(pPr, NS.w, 'pStyle');
  return S.styleFont(ps ? attr(ps, NS.w, 'val') : S.defaultPara) || S.defaultFont();
}
async function convertDocx(zip, K, C, opts, report) {
  const read = async (n) => (zip.file(n) ? parse(await zip.file(n).async('string')) : null);
  const theme = themeFonts(await read('word/theme/theme1.xml'));
  const stylesDoc = await read('word/styles.xml');
  const S = docxStyles(stylesDoc, theme);
  const parts = Object.keys(zip.files).filter((n) => /^word\/(document|header\d*|footer\d*|footnotes|endnotes|comments)\.xml$/.test(n));
  for (const name of parts) {
    const doc = await read(name);
    for (const p of all(doc, NS.w, 'p')) {
      const runs = all(p, NS.w, 'r').filter((r) => ancestor(r, NS.w, 'p') === p);
      if (opts.direction === 'a2u') {
        const items = [];
        for (const r of runs) {
          const font = runFontDocx(r, p, S);
          const legacy = isLegacyFont(font) || opts.scope === 'all';
          for (const t of kids(r, NS.w, 't')) items.push({ r, t, legacy, strict: isLegacyFont(font), get: () => t.textContent, set: (v) => { t.textContent = v; } });
        }
        convertGroups(K, C, items, opts, report);
        const done = new Set();
        for (const it of items) {
          if (!it.legacy) continue;
          if (/^\s|\s$/.test(it.t.textContent)) it.t.setAttributeNS(NS.xml, 'xml:space', 'preserve');
          if (!done.has(it.r)) { done.add(it.r); setWordFonts(ensure(it.r, NS.w, 'w:rPr', true), opts.unicodeFont, true); report.runs++; }
        }
      } else {
        for (const r of runs) {
          const ts = kids(r, NS.w, 't');
          if (!ts.some((t) => KANNADA.test(t.textContent))) continue;
          const onlyText = Array.from(r.childNodes).filter((n) => n.nodeType === 1 && local(n) !== 'rPr');
          if (onlyText.length === 1 && ts.length === 1) splitRun(r, ts[0].textContent, (seg, isKn) => {
            const nr = r.cloneNode(true); const nt = kid(nr, NS.w, 't');
            nt.textContent = isKn ? C.u2a(seg) : seg; nt.setAttributeNS(NS.xml, 'xml:space', 'preserve');
            if (isKn) { setWordFonts(ensure(nr, NS.w, 'w:rPr', true), opts.legacyFont, false); report.runs++; }
            return nr;
          });
          else {
            for (const t of ts) { t.textContent = C.u2a(t.textContent); t.setAttributeNS(NS.xml, 'xml:space', 'preserve'); }
            setWordFonts(ensure(r, NS.w, 'w:rPr', true), opts.legacyFont, false); report.runs++;
          }
        }
      }
    }
    zip.file(name, serialize(doc));
  }
  if (stylesDoc && opts.direction === 'a2u') {
    let touched = false;
    for (const f of all(stylesDoc, NS.w, 'rFonts')) {
      const n = attr(f, NS.w, 'hAnsi') || attr(f, NS.w, 'ascii');
      if (isLegacyFont(n)) { setWordFonts(f.parentNode, opts.unicodeFont, true); report.fonts.add(n); touched = true; }
    }
    if (touched) zip.file('word/styles.xml', serialize(stylesDoc));
  }
}
// Replace one run by several: Kannada parts and the rest, each from make(segment, isKannada)
function splitRun(r, text, make) {
  const segs = []; let cur = 0;
  for (const m of text.matchAll(KN_RUN)) { if (m.index > cur) segs.push([text.slice(cur, m.index), false]); segs.push([m[0], true]); cur = m.index + m[0].length; }
  if (cur < text.length) segs.push([text.slice(cur), false]);
  const parent = r.parentNode;
  for (const [seg, isKn] of segs) parent.insertBefore(make(seg, isKn), r);
  parent.removeChild(r);
}

// ================================================================ Excel (.xlsx)
async function convertXlsx(zip, K, C, opts, report) {
  const stylesDoc = parse(await zip.file('xl/styles.xml').async('string'));
  const fontsEl = all(stylesDoc, NS.s, 'fonts')[0];
  const fonts = kids(fontsEl, NS.s, 'font');
  const fontName = (f) => { const n = kid(f, NS.s, 'name'); return n ? n.getAttribute('val') : null; };
  const xfsEl = all(stylesDoc, NS.s, 'cellXfs')[0];
  const xfs = kids(xfsEl, NS.s, 'xf');
  const xfLegacy = xfs.map((xf) => { const f = fonts[+xf.getAttribute('fontId') || 0]; return isLegacyFont(fontName(f)); });
  const sstName = 'xl/sharedStrings.xml';
  const sst = zip.file(sstName) ? parse(await zip.file(sstName).async('string')) : null;
  const sis = sst ? kids(all(sst, NS.s, 'sst')[0], NS.s, 'si') : [];
  const siLegacy = new Array(sis.length).fill(false), siKnXf = new Map();
  const sheetNames = Object.keys(zip.files).filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
  const sheets = [];
  for (const n of sheetNames) sheets.push([n, parse(await zip.file(n).async('string'))]);
  let newXf = new Map();
  const legacyXfFor = (idx) => {           // copy of a cell style that uses the legacy font
    if (newXf.has(idx)) return newXf.get(idx);
    const xf = xfs[idx] || xfs[0];
    const f = fonts[+xf.getAttribute('fontId') || 0].cloneNode(true);
    const nm = ensure(f, NS.s, 'name'); nm.setAttribute('val', opts.legacyFont);
    fontsEl.appendChild(f); const fid = kids(fontsEl, NS.s, 'font').length - 1; fontsEl.setAttribute('count', String(fid + 1));
    const nx = xf.cloneNode(true); nx.setAttribute('fontId', String(fid)); nx.setAttribute('applyFont', '1');
    xfsEl.appendChild(nx); const xid = kids(xfsEl, NS.s, 'xf').length - 1; xfsEl.setAttribute('count', String(xid + 1));
    newXf.set(idx, xid); return xid;
  };
  for (const [, doc] of sheets) for (const c of all(doc, NS.s, 'c')) {
    const s = +(c.getAttribute('s') || 0), t = c.getAttribute('t');
    const legacy = xfLegacy[s] || opts.scope === 'all';
    if (t === 's') {
      const v = kid(c, NS.s, 'v'); const i = v ? +v.textContent : -1;
      if (opts.direction === 'a2u') { if (legacy && i >= 0) siLegacy[i] = true; }
      else if (i >= 0 && sis[i] && KANNADA.test(sis[i].textContent)) { c.setAttribute('s', String(legacyXfFor(s))); siKnXf.set(i, true); report.runs++; }
    } else if (t === 'inlineStr') {
      for (const tt of all(c, NS.s, 't')) {
        if (opts.direction === 'a2u' && legacy) { tt.textContent = C.a2u(tt.textContent, opts.scope === 'all' && !xfLegacy[s]); report.runs++; }
        else if (opts.direction === 'u2a' && KANNADA.test(tt.textContent)) { tt.textContent = C.u2a(tt.textContent); c.setAttribute('s', String(legacyXfFor(s))); report.runs++; }
      }
    }
  }
  sis.forEach((si, i) => {
    const runs = kids(si, NS.s, 'r');
    if (opts.direction === 'a2u') {
      if (runs.length) {
        for (const r of runs) {
          const rPr = kid(r, NS.s, 'rPr'); const rf = rPr && kid(rPr, NS.s, 'rFont');
          const legacy = rf ? isLegacyFont(rf.getAttribute('val')) : siLegacy[i];
          if (!legacy && opts.scope !== 'all') continue;
          for (const t of kids(r, NS.s, 't')) t.textContent = C.a2u(t.textContent, !legacy);
          if (rf && isLegacyFont(rf.getAttribute('val'))) { report.fonts.add(rf.getAttribute('val')); rf.setAttribute('val', opts.unicodeFont); }
          report.runs++;
        }
      } else if (siLegacy[i]) { for (const t of kids(si, NS.s, 't')) t.textContent = C.a2u(t.textContent, false); report.runs++; }
    } else if (siKnXf.has(i)) {
      for (const t of all(si, NS.s, 't')) if (KANNADA.test(t.textContent)) t.textContent = C.u2a(t.textContent);
      for (const rf of all(si, NS.s, 'rFont')) rf.setAttribute('val', opts.legacyFont);
    }
  });
  if (opts.direction === 'a2u') for (const f of fonts) { const n = kid(f, NS.s, 'name'); if (n && isLegacyFont(n.getAttribute('val'))) { report.fonts.add(n.getAttribute('val')); n.setAttribute('val', opts.unicodeFont); } }
  zip.file('xl/styles.xml', serialize(stylesDoc));
  if (sst) zip.file(sstName, serialize(sst));
  for (const [n, doc] of sheets) zip.file(n, serialize(doc));
}

// ================================================================ PowerPoint (.pptx)
async function convertPptx(zip, K, C, opts, report) {
  const themeDocs = [];
  for (const n of Object.keys(zip.files).filter((x) => /^ppt\/theme\/theme\d+\.xml$/.test(x))) themeDocs.push([n, parse(await zip.file(n).async('string'))]);
  const th = themeDocs.length ? themeFonts(themeDocs[0][1]) : { major: null, minor: null };
  const resolve = (tf) => (tf === '+mn-lt' ? th.minor : tf === '+mj-lt' ? th.major : tf);
  const names = Object.keys(zip.files).filter((n) => /^ppt\/(slides|slideLayouts|slideMasters|notesSlides|notesMasters)\/[^/]+\.xml$/.test(n));
  // masters and layouts tell us the default font when a run names none
  let defaultLegacy = isLegacyFont(th.minor) || isLegacyFont(th.major);
  const docs = [];
  for (const n of names) { const d = parse(await zip.file(n).async('string')); docs.push([n, d]); if (/slideMasters/.test(n) && all(d, NS.a, 'latin').some((l) => isLegacyFont(resolve(l.getAttribute('typeface'))))) defaultLegacy = true; }
  const runFont = (r) => {
    const rPr = kid(r, NS.a, 'rPr'); const l = rPr && kid(rPr, NS.a, 'latin');
    if (l) return resolve(l.getAttribute('typeface'));
    const p = ancestor(r, NS.a, 'p'); const pPr = p && kid(p, NS.a, 'pPr'); const d = pPr && kid(pPr, NS.a, 'defRPr'); const dl = d && kid(d, NS.a, 'latin');
    if (dl) return resolve(dl.getAttribute('typeface'));
    // list styles in the same shape
    const body = ancestor(r, NS.a, 'txBody') || (r.parentNode && r.parentNode.parentNode);
    const ls = body && kid(body, NS.a, 'lstStyle');
    const any = ls && all(ls, NS.a, 'latin')[0];
    if (any) return resolve(any.getAttribute('typeface'));
    return null;
  };
  const setFont = (r, font) => {
    let rPr = kid(r, NS.a, 'rPr');
    if (!rPr) { rPr = r.ownerDocument.createElementNS(NS.a, 'a:rPr'); r.insertBefore(rPr, r.firstChild); }
    for (const tag of ['latin', 'ea', 'cs']) {
      let el = kid(rPr, NS.a, tag);
      if (!el) { el = r.ownerDocument.createElementNS(NS.a, 'a:' + tag); const before = ['sym', 'hlinkClick', 'hlinkMouseOver', 'rtl', 'extLst'].map((x) => kid(rPr, NS.a, x)).find(Boolean); rPr.insertBefore(el, before || null); }
      if (tag === 'ea' && opts.direction === 'u2a') continue;
      el.setAttribute('typeface', font);
    }
  };
  for (const [n, doc] of docs) {
    for (const p of all(doc, NS.a, 'p')) {
      const runs = kids(p, NS.a, 'r');
      if (opts.direction === 'a2u') {
        const items = runs.map((r) => {
          const f = runFont(r); const legacy = f ? isLegacyFont(f) : defaultLegacy;
          const t = kid(r, NS.a, 't');
          return { r, t, legacy: (legacy || opts.scope === 'all') && !!t, strict: legacy, get: () => (t ? t.textContent : ''), set: (v) => { if (t) t.textContent = v; } };
        });
        convertGroups(K, C, items, opts, report);
        for (const it of items) if (it.legacy) { setFont(it.r, opts.unicodeFont); report.runs++; }
      } else {
        for (const r of runs) {
          const t = kid(r, NS.a, 't');
          if (!t || !KANNADA.test(t.textContent)) continue;
          splitRun(r, t.textContent, (seg, isKn) => { const nr = r.cloneNode(true); kid(nr, NS.a, 't').textContent = isKn ? C.u2a(seg) : seg; if (isKn) { setFont(nr, opts.legacyFont); report.runs++; } return nr; });
        }
      }
    }
    if (opts.direction === 'a2u') for (const l of ['latin', 'cs'].flatMap((x) => all(doc, NS.a, x))) { const f = l.getAttribute('typeface'); if (isLegacyFont(f)) { report.fonts.add(f); l.setAttribute('typeface', opts.unicodeFont); } }
    zip.file(n, serialize(doc));
  }
  if (opts.direction === 'a2u') for (const [n, d] of themeDocs) {
    let t = false;
    for (const l of all(d, NS.a, 'latin').concat(all(d, NS.a, 'cs'))) if (isLegacyFont(l.getAttribute('typeface'))) { report.fonts.add(l.getAttribute('typeface')); l.setAttribute('typeface', opts.unicodeFont); t = true; }
    if (t) zip.file(n, serialize(d));
  }
}

// ================================================================ OpenDocument (.odt .ods .odp)
async function convertOdf(zip, K, C, opts, report) {
  const contentDoc = parse(await zip.file('content.xml').async('string'));
  const stylesDoc = zip.file('styles.xml') ? parse(await zip.file('styles.xml').async('string')) : null;
  const docs = [contentDoc, stylesDoc].filter(Boolean);
  const faces = new Map(); // face name -> family
  for (const d of docs) for (const f of all(d, NS.style, 'font-face')) faces.set(attr(f, NS.style, 'name'), (attr(f, NS.svg, 'font-family') || '').replace(/^['"]|['"]$/g, ''));
  const styleMap = new Map(), defaults = new Map();
  for (const d of docs) {
    for (const st of all(d, NS.style, 'style')) {
      const key = attr(st, NS.style, 'family') + ':' + attr(st, NS.style, 'name');
      if (!styleMap.has(key) || ancestor(st, NS.office, 'automatic-styles')) styleMap.set(key, st);
    }
    for (const st of all(d, NS.style, 'default-style')) defaults.set(attr(st, NS.style, 'family'), st);
  }
  const propFont = (st) => {
    const tp = st && kid(st, NS.style, 'text-properties');
    if (!tp) return null;
    const fn = attr(tp, NS.style, 'font-name');
    if (fn) return faces.get(fn) || fn;
    return attr(tp, NS.fo, 'font-family');
  };
  const styleFont = (family, name, seen = new Set()) => {
    const key = family + ':' + name;
    if (!name || seen.has(key)) return null; seen.add(key);
    const st = styleMap.get(key);
    if (!st) return null;
    return propFont(st) || styleFont(family, attr(st, NS.style, 'parent-style-name'), seen);
  };
  const nodeFont = (tn) => {
    for (let p = tn.parentNode; p && p.nodeType === 1; p = p.parentNode) {
      let f = null;
      if (p.namespaceURI === NS.text && attr(p, NS.text, 'style-name')) f = styleFont(local(p) === 'span' ? 'text' : 'paragraph', attr(p, NS.text, 'style-name'));
      else if (p.namespaceURI === NS.table && local(p) === 'table-cell' && cellStyle.get(p)) f = styleFont('table-cell', cellStyle.get(p));
      else if (attr(p, NS.draw, 'text-style-name')) f = styleFont('paragraph', attr(p, NS.draw, 'text-style-name'));
      else if (attr(p, NS.presentation, 'style-name')) f = styleFont('presentation', attr(p, NS.presentation, 'style-name'));
      else if (attr(p, NS.draw, 'style-name')) f = styleFont('graphic', attr(p, NS.draw, 'style-name'));
      if (f) return f;
    }
    for (const fam of ['paragraph', 'table-cell', 'graphic']) { const f = propFont(defaults.get(fam)); if (f) return f; }
    return null;
  };
  // spreadsheet cells often take their style from the column or row (default-cell-style-name)
  const cellStyle = new Map();
  for (const tbl of all(contentDoc, NS.table, 'table')) {
    const cols = [];
    for (const c of all(tbl, NS.table, 'table-column')) { const n = Math.min(+(attr(c, NS.table, 'number-columns-repeated') || 1), 4096); for (let k = 0; k < n && cols.length < 4096; k++) cols.push(attr(c, NS.table, 'default-cell-style-name')); }
    for (const row of all(tbl, NS.table, 'table-row')) {
      const rowDef = attr(row, NS.table, 'default-cell-style-name');
      let ci = 0;
      for (let c = row.firstChild; c; c = c.nextSibling) {
        if (c.nodeType !== 1 || (local(c) !== 'table-cell' && local(c) !== 'covered-table-cell')) continue;
        const own = attr(c, NS.table, 'style-name');
        const st = own || rowDef || cols[ci];
        if (st && st !== 'Default') cellStyle.set(c, st); else if (st) cellStyle.set(c, st);
        ci += +(attr(c, NS.table, 'number-columns-repeated') || 1);
      }
    }
  }
  const bodyOf = (d) => all(d, NS.office, 'body')[0] || all(d, NS.office, 'master-styles')[0];
  const paraOf = (tn) => { for (let p = tn.parentNode; p && p.nodeType === 1; p = p.parentNode) if (p.namespaceURI === NS.text && (local(p) === 'p' || local(p) === 'h')) return p; return null; };
  for (const d of docs) {
    const body = bodyOf(d); if (!body) continue;
    const nodes = textNodes(body).filter((n) => paraOf(n));
    if (opts.direction === 'a2u') {
      const items = nodes.map((n) => { const f = nodeFont(n); const legacy = isLegacyFont(f); return { n, legacy: legacy || opts.scope === 'all', strict: legacy, para: paraOf(n), get: () => n.data, set: (v) => { n.data = v; } }; });
      items.forEach((it, i) => { it.breakAfter = !items[i + 1] || items[i + 1].para !== it.para; if (it.legacy) report.runs++; });
      convertGroups(K, C, items, opts, report);
    } else {
      const spanStyle = ensureOdfLegacyStyle(contentDoc, opts.legacyFont);
      for (const n of nodes) {
        if (!KANNADA.test(n.data)) continue;
        const text = n.data, parent = n.parentNode, docOf = n.ownerDocument;
        let cur = 0; const frag = [];
        for (const m of text.matchAll(KN_RUN)) {
          if (m.index > cur) frag.push(docOf.createTextNode(text.slice(cur, m.index)));
          const sp = docOf.createElementNS(NS.text, 'text:span'); sp.setAttributeNS(NS.text, 'text:style-name', spanStyle);
          sp.appendChild(docOf.createTextNode(C.u2a(m[0]))); frag.push(sp); report.runs++;
          cur = m.index + m[0].length;
        }
        if (cur < text.length) frag.push(docOf.createTextNode(text.slice(cur)));
        for (const f of frag) parent.insertBefore(f, n);
        parent.removeChild(n);
      }
    }
  }
  if (opts.direction === 'a2u') {
    // point the legacy font faces at the Unicode font, and give Kannada (complex script) the same font and weight
    const legacyFaces = new Set();
    for (const d of docs) for (const f of all(d, NS.style, 'font-face')) {
      const fam = (attr(f, NS.svg, 'font-family') || '').replace(/^['"]|['"]$/g, '');
      if (isLegacyFont(fam) || isLegacyFont(attr(f, NS.style, 'name'))) {
        report.fonts.add(isLegacyFont(fam) ? fam : attr(f, NS.style, 'name'));
        legacyFaces.add(attr(f, NS.style, 'name'));
        f.setAttributeNS(NS.svg, 'svg:font-family', "'" + opts.unicodeFont + "'");
        if (f.hasAttributeNS(NS.style, 'font-charset')) f.removeAttributeNS(NS.style, 'font-charset');
      }
    }
    for (const d of docs) for (const tp of all(d, NS.style, 'text-properties')) {
      const fn = attr(tp, NS.style, 'font-name'), ff = attr(tp, NS.fo, 'font-family');
      const legacy = (fn && legacyFaces.has(fn)) || isLegacyFont(ff);
      if (!legacy) continue;
      if (isLegacyFont(ff)) tp.setAttributeNS(NS.fo, 'fo:font-family', "'" + opts.unicodeFont + "'");
      if (fn) tp.setAttributeNS(NS.style, 'style:font-name-complex', fn);
      else tp.setAttributeNS(NS.style, 'style:font-family-complex', "'" + opts.unicodeFont + "'");
      for (const [a, b] of [['font-weight', 'font-weight-complex'], ['font-style', 'font-style-complex'], ['font-size', 'font-size-complex']]) {
        const v = attr(tp, NS.fo, a); if (v && !attr(tp, NS.style, b)) tp.setAttributeNS(NS.style, 'style:' + b, v);
      }
      if (tp.hasAttributeNS(NS.style, 'font-charset')) tp.removeAttributeNS(NS.style, 'font-charset');
    }
  }
  zip.file('content.xml', serialize(contentDoc));
  if (stylesDoc) zip.file('styles.xml', serialize(stylesDoc));
}
function ensureOdfLegacyStyle(doc, font) {
  const name = 'BVLegacyKannada';
  const decls = all(doc, NS.office, 'font-face-decls')[0] || (() => { const r = doc.documentElement; const e = doc.createElementNS(NS.office, 'office:font-face-decls'); r.insertBefore(e, all(doc, NS.office, 'automatic-styles')[0] || all(doc, NS.office, 'body')[0]); return e; })();
  if (!all(decls, NS.style, 'font-face').some((f) => attr(f, NS.style, 'name') === name)) {
    const f = doc.createElementNS(NS.style, 'style:font-face'); f.setAttributeNS(NS.style, 'style:name', name); f.setAttributeNS(NS.svg, 'svg:font-family', "'" + font + "'"); decls.appendChild(f);
  }
  let auto = all(doc, NS.office, 'automatic-styles')[0];
  if (!auto) { auto = doc.createElementNS(NS.office, 'office:automatic-styles'); doc.documentElement.insertBefore(auto, all(doc, NS.office, 'body')[0]); }
  if (!all(auto, NS.style, 'style').some((s) => attr(s, NS.style, 'name') === name)) {
    const st = doc.createElementNS(NS.style, 'style:style'); st.setAttributeNS(NS.style, 'style:name', name); st.setAttributeNS(NS.style, 'style:family', 'text');
    const tp = doc.createElementNS(NS.style, 'style:text-properties'); tp.setAttributeNS(NS.style, 'style:font-name', name); st.appendChild(tp); auto.appendChild(st);
  }
  return name;
}

// ================================================================ plain text and CSV
function decodeText(bytes) {
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) bytes = bytes.subarray(3);
  try { return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), enc: 'utf-8' }; }
  catch (e) { return { text: new TextDecoder('windows-1252').decode(bytes), enc: 'windows-1252' }; }
}
const CP1252 = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F };
function encode1252(s) {
  const out = new Uint8Array(s.length); let bad = 0;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); out[i] = c < 256 ? c : (CP1252[c] || (bad++, 0x3F)); }
  return { bytes: out, bad };
}

// ================================================================ entry point
let parse, serialize;
async function convertFile(input, fileName, options) {
  const K = (root.BV && root.BV.BVKannada) || options.engine;
  const JSZip = options.JSZip || root.JSZip;
  const DP = options.DOMParser || root.DOMParser, XS = options.XMLSerializer || root.XMLSerializer;
  parse = (s) => new DP().parseFromString(s, 'application/xml');
  serialize = (d) => { const x = new XS().serializeToString(d); return x.startsWith('<?xml') ? x : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' + x; };
  const opts = Object.assign({ direction: 'a2u', scope: 'legacy', unicodeFont: 'Noto Sans Kannada', legacyFont: 'Nudi 01 e' }, options);
  const report = { runs: 0, chars: 0, unknown: new Set(), fonts: new Set(), warnings: [] };
  const C = makeConverter(K, opts, report);
  const ext = (fileName.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase();
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input instanceof ArrayBuffer ? input : await input.arrayBuffer());
  const tag = opts.direction === 'a2u' ? '_unicode' : '_nudi';
  const outName = fileName.replace(/(\.[^.]+)?$/, (m) => tag + m);
  const MIME = { docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', odt: 'application/vnd.oasis.opendocument.text', ods: 'application/vnd.oasis.opendocument.spreadsheet', odp: 'application/vnd.oasis.opendocument.presentation' };
  if (ext === 'txt' || ext === 'csv') {
    const { text, enc } = decodeText(bytes);
    if (opts.direction === 'a2u') {
      const out = C.a2u(text, true);
      return finish(new TextEncoder().encode((ext === 'csv' ? '﻿' : '') + out), 'text/plain;charset=utf-8', outName, report, { from: enc });
    }
    const out = C.u2a(text); const { bytes: b, bad } = encode1252(out);
    if (bad) report.warnings.push(bad + ' characters have no place in a legacy (ANSI) file and became "?".');
    return finish(b, 'text/plain;charset=windows-1252', outName, report, {});
  }
  if (/^(doc|xls|ppt)$/.test(ext)) throw new Error('Old .' + ext + ' files cannot be opened in the browser. Open the file in Microsoft Office or LibreOffice, save it as .' + ext + 'x, then convert that copy.');
  if (!MIME[ext]) throw new Error('This file type is not supported. Use .docx, .xlsx, .pptx, .odt, .ods, .odp, .txt or .csv.');
  if (!JSZip) throw new Error('The ZIP reader did not load. Check your connection and reload the page.');
  let zip;
  try { zip = await JSZip.loadAsync(bytes); } catch (e) { throw new Error('This file could not be opened. It may be damaged or password-protected.'); }
  if (zip.file('EncryptedPackage') || zip.file('encryption')) throw new Error('This file is password-protected. Remove the password in Office, save, and try again.');
  if (ext === 'docx') await convertDocx(zip, K, C, opts, report);
  else if (ext === 'xlsx') await convertXlsx(zip, K, C, opts, report);
  else if (ext === 'pptx') await convertPptx(zip, K, C, opts, report);
  else await convertOdf(zip, K, C, opts, report);
  if (opts.direction === 'a2u' && report.runs === 0 && opts.scope !== 'all') report.warnings.push('No text in a Nudi or Baraha font was found. If the Kannada was typed in another legacy font name, choose "Convert all text" and try again.');
  if (opts.direction === 'u2a' && report.runs === 0) report.warnings.push('No Unicode Kannada text was found in this file.');
  if (zip.file('mimetype')) zip.file('mimetype', MIME[ext], { compression: 'STORE' });
  const out = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 }, mimeType: MIME[ext] });
  return finish(out, MIME[ext], outName, report, {});
}
function finish(bytes, mime, name, report, extra) {
  return { bytes, mime, name, report: { runs: report.runs, chars: report.chars, unknown: [...report.unknown], fonts: [...report.fonts], warnings: report.warnings, from: extra.from } };
}

const api = { convertFile, isLegacyFont };
root.BV = root.BV || {}; root.BV.KannadaDocs = api;
if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
