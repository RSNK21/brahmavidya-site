/* BV Kannada engine: legacy Nudi / Baraha (ANSI) <-> Unicode Kannada.
   Rebuilt Nov 2026. Both directions work on whole syllables (aksharas):
   base consonant, ottaksharas, vowel sign, arkavattu, anusvara/visarga.
   Legacy byte order was checked glyph by glyph against the NUDI01 font
   (BVNudiAkshar01) so the ASCII we write renders correctly, and the reader
   accepts every ordering seen in real Nudi, Baraha and Sanka output.
   API (unchanged): toUnicode(text, opts) / toAscii(text, opts) -> { text, unknown, clean } */
(function () {
'use strict';

// ---------------------------------------------------------------- tables
const V = ['dead', 'a', 'aa', 'i', 'ii', 'u', 'uu', 'r', 'e', 'ee', 'ai', 'o', 'oo', 'au'];
const SIGN = { dead: '್', a: '', aa: 'ಾ', i: 'ಿ', ii: 'ೀ', u: 'ು', uu: 'ೂ', r: 'ೃ', rr: 'ೄ', e: 'ೆ', ee: 'ೇ', ai: 'ೈ', o: 'ೊ', oo: 'ೋ', au: 'ೌ' };
const SIGN_TO_V = Object.fromEntries(Object.entries(SIGN).filter(([k, s]) => s && k !== 'dead').map(([k, s]) => [s, k]));

// letter, then the 14 forms in V order (canonical spellings first)
const SERIES = [
  ['ಕ','Pï','PÀ','PÁ','Q','QÃ','PÀÄ','PÀÆ','PÀÈ','PÉ','PÉÃ','PÉÊ','PÉÆ','PÉÆÃ','PË'],
  ['ಖ','Sï','R','SÁ','T','TÃ','RÄ','RÆ','RÈ','SÉ','SÉÃ','SÉÊ','SÉÆ','SÉÆÃ','SË'],
  ['ಗ','Uï','UÀ','UÁ','V','VÃ','UÀÄ','UÀÆ','UÀÈ','UÉ','UÉÃ','UÉÊ','UÉÆ','UÉÆÃ','UË'],
  ['ಘ','Wï','WÀ','WÁ','X','XÃ','WÀÄ','WÀÆ','WÀÈ','WÉ','WÉÃ','WÉÊ','WÉÆ','WÉÆÃ','WË'],
  ['ಙ','Yï','Y','YÁ','YÂ','YÂÃ','YÄ','YÆ','YÈ','YÉ','YÉÃ','YÉÊ','YÉÆ','YÉÆÃ','YË'],
  ['ಚ','Zï','ZÀ','ZÁ','a','aÃ','ZÀÄ','ZÀÆ','ZÀÈ','ZÉ','ZÉÃ','ZÉÊ','ZÉÆ','ZÉÆÃ','ZË'],
  ['ಛ','bï','bÀ','bÁ','c','cÃ','bÀÄ','bÀÆ','bÀÈ','bÉ','bÉÃ','bÉÊ','bÉÆ','bÉÆÃ','bË'],
  ['ಜ','eï','d','eÁ','f','fÃ','dÄ','dÆ','dÈ','eÉ','eÉÃ','eÉÊ','eÉÆ','eÉÆÃ','eË'],
  ['ಝ','gÀhiï','gÀhÄ','gÀhiÁ','jhÄ','jhÄÃ','gÀhÄÄ','gÀhÄÆ','gÀhÄÈ','gÉhÄ','gÉhÄÃ','gÉhÄÊ','gÉhÆ','gÉhÆÃ','gÀhiË'],
  ['ಞ','kï','k','kÁ','kÂ','kÂÃ','kÄ','kÆ','kÈ','kÉ','kÉÃ','kÉÊ','kÉÆ','kÉÆÃ','kË'],
  ['ಟ','mï','l','mÁ','n','nÃ','lÄ','lÆ','lÈ','mÉ','mÉÃ','mÉÊ','mÉÆ','mÉÆÃ','mË'],
  ['ಠ','oï','oÀ','oÁ','p','pÃ','oÀÄ','oÀÆ','oÀÈ','oÉ','oÉÃ','oÉÊ','oÉÆ','oÉÆÃ','oË'],
  ['ಡ','qï','qÀ','qÁ','r','rÃ','qÀÄ','qÀÆ','qÀÈ','qÉ','qÉÃ','qÉÊ','qÉÆ','qÉÆÃ','qË'],
  ['ಢ','qsï','qsÀ','qsÁ','rü','rüÃ','qsÀÄ','qsÀÆ','qsÀÈ','qsÉ','qsÉÃ','qsÉÊ','qsÉÆ','qsÉÆÃ','qsË'],
  ['ಣ','uï','t','uÁ','tÂ','tÂÃ','tÄ','tÆ','tÈ','uÉ','uÉÃ','uÉÊ','uÉÆ','uÉÆÃ','uË'],
  ['ತ','vï','vÀ','vÁ','w','wÃ','vÀÄ','vÀÆ','vÀÈ','vÉ','vÉÃ','vÉÊ','vÉÆ','vÉÆÃ','vË'],
  ['ಥ','xï','xÀ','xÁ','y','yÃ','xÀÄ','xÀÆ','xÀÈ','xÉ','xÉÃ','xÉÊ','xÉÆ','xÉÆÃ','xË'],
  ['ದ','zï','zÀ','zÁ','¢','¢Ã','zÀÄ','zÀÆ','zÀÈ','zÉ','zÉÃ','zÉÊ','zÉÆ','zÉÆÃ','zË'],
  ['ಧ','zsï','zsÀ','zsÁ','¢ü','¢üÃ','zsÀÄ','zsÀÆ','zsÀÈ','zsÉ','zsÉÃ','zsÉÊ','zsÉÆ','zsÉÆÃ','zsË'],
  ['ನ','£ï','£À','£Á','¤','¤Ã','£ÀÄ','£ÀÆ','£ÀÈ','£É','£ÉÃ','£ÉÊ','£ÉÆ','£ÉÆÃ','£Ë'],
  ['ಪ','¥ï','¥À','¥Á','¦','¦Ã','¥ÀÅ','¥ÀÇ','¥ÀÈ','¥É','¥ÉÃ','¥ÉÊ','¥ÉÇ','¥ÉÇÃ','¥Ë'],
  ['ಫ','¥sï','¥sÀ','¥sÁ','¦ü','¦üÃ','¥sÀÅ','¥sÀÇ','¥sÀÈ','¥sÉ','¥sÉÃ','¥sÉÊ','¥sÉÇ','¥sÉÇÃ','¥sË'],
  ['ಬ','¨ï','§','¨Á','©','©Ã','§Ä','§Æ','§È','¨É','¨ÉÃ','¨ÉÊ','¨ÉÆ','¨ÉÆÃ','¨Ë'],
  ['ಭ','¨sï','¨sÀ','¨sÁ','©ü','©üÃ','¨sÀÄ','¨sÀÆ','¨sÀÈ','¨sÉ','¨sÉÃ','¨sÉÊ','¨sÉÆ','¨sÉÆÃ','¨sË'],
  ['ಮ','ªÀiï','ªÀÄ','ªÀiÁ','«Ä','«ÄÃ','ªÀÄÄ','ªÀÄÆ','ªÀÄÈ','ªÉÄ','ªÉÄÃ','ªÉÄÊ','ªÉÆ','ªÉÆÃ','ªÀiË'],
  ['ಯ','AiÀiï','AiÀÄ','AiÀiÁ','¬Ä','¬ÄÃ','AiÀÄÄ','AiÀÄÆ','AiÀÄÈ','AiÉÄ','AiÉÄÃ','AiÉÄÊ','AiÉÆ','AiÉÆÃ','AiÀiË'],
  ['ರ','gï','gÀ','gÁ','j','jÃ','gÀÄ','gÀÆ','gÀÈ','gÉ','gÉÃ','gÉÊ','gÉÆ','gÉÆÃ','gË'],
  ['ಲ','¯ï','®','¯Á','°','°Ã','®Ä','®Æ','®È','¯É','¯ÉÃ','¯ÉÊ','¯ÉÆ','¯ÉÆÃ','¯Ë'],
  ['ವ','ªï','ªÀ','ªÁ','«','«Ã','ªÀÅ','ªÀÇ','ªÀÈ','ªÉ','ªÉÃ','ªÉÊ','ªÉÇ','ªÉÇÃ','ªË'],
  ['ಶ','±ï','±À','±Á','²','²Ã','±ÀÄ','±ÀÆ','±ÀÈ','±É','±ÉÃ','±ÉÊ','±ÉÆ','±ÉÆÃ','±Ë'],
  ['ಷ','µï','µÀ','µÁ','¶','¶Ã','µÀÄ','µÀÆ','µÀÈ','µÉ','µÉÃ','µÉÊ','µÉÆ','µÉÆÃ','µË'],
  ['ಸ','¸ï','¸À','¸Á','¹','¹Ã','¸ÀÄ','¸ÀÆ','¸ÀÈ','¸É','¸ÉÃ','¸ÉÊ','¸ÉÆ','¸ÉÆÃ','¸Ë'],
  ['ಹ','ºï','ºÀ','ºÁ','»','»Ã','ºÀÄ','ºÀÆ','ºÀÈ','ºÉ','ºÉÃ','ºÉÊ','ºÉÆ','ºÉÆÃ','ºË'],
  ['ಳ','¼ï','¼À','¼Á','½','½Ã','¼ÀÄ','¼ÀÆ','¼ÀÈ','¼É','¼ÉÃ','¼ÉÊ','¼ÉÆ','¼ÉÆÃ','¼Ë'],
  ['ೞ','¿õï','¿õÀ','¿õÁ','¿Â','¿ÂÃ','¿Ä','¿Æ','¿È','¿õÉ','¿õÉÃ','¿õÉÊ','¿õÉÆ','¿õÉÆÃ','¿õË'],
  ['ಱ','¾õï','¾õÀ','¾õÁ','¾Â','¾ÂÃ','¾Ä','¾Æ','¾È','¾õÉ','¾õÉÃ','¾õÉÊ','¾õÉÆ','¾õÉÆÃ','¾õË'],
];
const FORMS = new Map(SERIES.map((r) => [r[0], r.slice(1)]));

// Alternative spellings found in real documents and other converters (read only).
const ALT_FORMS = [
  ['ಕ','r','PÀø'], ['ಖ','r','Rø'], ['ಗ','r','UÀø'], ['ಘ','r','WÀø'], ['ಚ','r','ZÀø'], ['ಛ','r','bÀø'],
  ['ಜ','r','dø'], ['ಝ','r','gÀhÄø'], ['ಟ','r','lø'], ['ಠ','r','oÀø'], ['ಡ','r','qÀø'], ['ಢ','r','qsÀø'],
  ['ಣ','r','tø'], ['ತ','r','vÀø'], ['ಥ','r','xÀø'], ['ದ','r','zÀø'], ['ಧ','r','zsÀø'], ['ನ','r','£Àø'],
  ['ಪ','r','¥Àø'], ['ಫ','r','¥sÀø'], ['ಬ','r','§ø'], ['ಭ','r','¨sÀø'], ['ಮ','r','ªÀÄø'], ['ಯ','r','AiÀÄø'],
  ['ರ','r','gÀø'], ['ಲ','r','®ø'], ['ವ','r','ªÀø'], ['ಶ','r','±Àø'], ['ಷ','r','µÀø'], ['ಸ','r','¸Àø'],
  ['ಹ','r','ºÀø'], ['ಳ','r','¼Àø'], ['ೞ','r','¿ø'], ['ಱ','r','¾ø'],
  ['ಜ','a','e'], ['ಬ','a','¨'], ['ಲ','dead','®ï'], ['ಝ','dead','gÀhÄï'], ['ಮ','dead','ªÀÄï'], ['ಯ','dead','AiÀÄï'],
  ['ಯ','e','AiÉÀÄ'], ['ಯ','ai','AiÉÀÄÊ'], ['ಝ','aa','gÀhÄÁ'],
  ['ಪ','u','¥ÀÄ'], ['ಪ','uu','¥ÀÆ'], ['ಫ','u','¥sÀÄ'], ['ಫ','uu','¥sÀÆ'], ['ಪ','o','¥ÉÆ'], ['ಪ','oo','¥ÉÆÃ'],
  ['ಫ','o','¥sÉÆ'], ['ಫ','oo','¥sÉÆÃ'],
  ['ಯ','a','0iÀÄ'], ['ಯ','u','0iÀÄÄ'], ['ಯ','uu','0iÀÄÆ'], ['ಯ','e','0iÉÄ'], ['ಯ','ee','0iÉÄÃ'], ['ಯ','ai','0iÉÄÊ'],
  ['ಯ','o','0iÉÆ'], ['ಯ','oo','0iÉÆÃ'], ['ಯ','aa','0iÀiÁ'], ['ಯ','au','0iÀiË'], ['ಯ','dead','0iÀiï'],
];

const SUB = { // ottakshara (subjoined) glyphs
  'ಕ':'Ì','ಖ':'Í','ಗ':'Î','ಘ':'Ï','ಙ':'Ð','ಚ':'Ñ','ಛ':'Ò','ಜ':'Ó','ಝ':'Ô','ಞ':'Õ','ಟ':'Ö','ಠ':'×',
  'ಡ':'Ø','ಢ':'Ù','ಣ':'Ú','ತ':'Û','ಥ':'Ü','ದ':'Ý','ಧ':'Þ','ನ':'ß','ಪ':'à','ಫ':'á','ಬ':'â','ಭ':'ã',
  'ಮ':'ä','ಯ':'å','ರ':'æ','ಲ':'è','ವ':'é','ಶ':'ê','ಷ':'ë','ಸ':'ì','ಹ':'í','ಳ':'î','ಱ':'ù','ೞ':'ú',
};
const SUB_READ = Object.fromEntries(Object.entries(SUB).map(([c, g]) => [g, c]));
SUB_READ['ç'] = 'ರ';           // ra ottu, form used after another ottu
const RA_SECOND = 'ç';
const OTTU_SPACER = 'ö';       // blank byte that moves a 2nd/3rd ottu clear of the 1st
const SPACED_OTTU = new Set(Object.values(SUB).filter((g) => g !== 'å' && g !== 'æ' && g !== 'ß' && g !== 'Ï'));

const VOWELS = [['C','ಅ'],['D','ಆ'],['E','ಇ'],['F','ಈ'],['G','ಉ'],['H','ಊ'],['IÄ','ಋ'],['IÆ','ೠ'],['IÆ2','ೠ'],
  ['J','ಎ'],['K','ಏ'],['L','ಐ'],['M','ಒ'],['N','ಓ'],['O','ಔ']];
const VOWEL_OUT = { 'ಅ':'C','ಆ':'D','ಇ':'E','ಈ':'F','ಉ':'G','ಊ':'H','ಋ':'IÄ','ೠ':'IÆ','ಎ':'J','ಏ':'K','ಐ':'L','ಒ':'M','ಓ':'N','ಔ':'O' };
const ASPIRATE = { 'ದ':'ಧ', 'ಡ':'ಢ', 'ಪ':'ಫ', 'ಬ':'ಭ' };

// how many trailing bytes of a form are a post-base vowel piece (ottus go before them)
const TAIL_LEN = { dead: 1, a: 0, aa: 1, i: 0, ii: 1, u: 1, uu: 1, r: 1, e: 0, ee: 1, ai: 1, o: 1, oo: 2, au: 1 };
const TAIL_CHARS = /^[ÁÃÄÅÆÇÈÊËøï]+$/;
function split(form, v) {
  const n = TAIL_LEN[v] || 0;
  const tail = n ? form.slice(-n) : '';
  return n && TAIL_CHARS.test(tail) ? [form.slice(0, -n), tail] : [form, ''];
}
// the state a head is in before its tail bytes arrive
const HEAD_STATE = { dead: 'a', aa: 'a', ii: 'i', u: 'a', uu: 'a', r: 'a', ee: 'e', ai: 'e', o: 'e', oo: 'o', au: 'a' };

// ---------------------------------------------------------------- legacy reader tokens
const TOK = new Map();
const put = (k, t) => { if (k && !TOK.has(k)) TOK.set(k, t); };
for (const [c, ...forms] of SERIES) forms.forEach((f, i) => put(f, { t: 'C', c, v: V[i] }));
for (const [c, v, f] of ALT_FORMS) put(f, { t: 'C', c, v });
for (const [c, ...forms] of SERIES) forms.forEach((f, i) => {
  const [head, tail] = split(f, V[i]);
  if (tail && head) put(head, { t: 'C', c, v: HEAD_STATE[V[i]] });
});
for (const [k, u] of VOWELS) put(k, { t: 'V', u });
for (const [g, c] of Object.entries(SUB_READ)) put(g, { t: 'O', c });
'ÁÃÄÅÆÇÈÊËÂÉøñïðÀüs'.split('').forEach((m) => put(m, { t: 'M', m }));
put('A', { t: 'A', u: 'ಂ' }); put('B', { t: 'A', u: 'ಃ' });
put('„', { t: 'X', u: 'ಽ' }); put(',,', { t: 'X', u: 'ಽ' }); put('ó', { t: 'M', m: 'ó' });
['ö', '÷', 'i', 'õ', '\u00AD', '\u200B', '\u200E', '\u200F', '\u2060', '\uFEFF'].forEach((z) => put(z, { t: 'Z' }));
const SINGLE_INDEX = new Map();
for (const k of [...TOK.keys()].sort((a, b) => b.length - a.length)) {
  if (!SINGLE_INDEX.has(k[0])) SINGLE_INDEX.set(k[0], []);
  SINGLE_INDEX.get(k[0]).push(k);
}

// ---------------------------------------------------------------- legacy -> Unicode
const CONSONANT = '[ಕ-ಹೞ]';
function syllableText(s) {
  if (s.kind === 'V') return s.u + s.mods;
  let out = (s.repha ? 'ರ್' : '') + s.c + (s.nukta ? '಼' : '');
  for (const o of s.ottus) out += '್' + o;
  out += s.v === 'dead' ? '್' : SIGN[s.v];
  return out + s.mods;
}
function mark(s, m) {               // returns false if the mark does not fit the syllable
  const v = s.v;
  switch (m) {
    case 'À': return true;
    case 's': case 'ü':
      if (ASPIRATE[s.c]) { s.c = ASPIRATE[s.c]; return true; }
      return s.c === 'ಧ' || s.c === 'ಢ' || s.c === 'ಫ' || s.c === 'ಭ';
    case 'Á': if (v === 'a') { s.v = 'aa'; return true; } return v === 'aa';
    case 'Â': if (v === 'a') { s.v = 'i'; return true; } return v === 'i';
    case 'É': if (v === 'a') { s.v = 'e'; return true; } return v === 'e';
    case 'Ã': if (v === 'i') s.v = 'ii'; else if (v === 'e') s.v = 'ee'; else if (v === 'o') s.v = 'oo'; else return false; return true;
    case 'Ä':
      if (s.c === 'ವ' && (v === 'a' || v === 'i' || v === 'e')) { s.c = 'ಮ'; return true; }
      if (v === 'a') { s.v = 'u'; return true; }
      if ((v === 'e' || v === 'i') && (s.c === 'ಯ' || s.c === 'ಝ' || s.c === 'ಮ')) return true;
      return false;
    case 'Å': if (v === 'a') { s.v = 'u'; return true; } return false;
    case 'Æ':
      if (v === 'a') { s.v = 'uu'; return true; }
      if (v === 'e') { if (s.c === 'ವ') s.c = 'ಮ'; s.v = 'o'; return true; }
      return false;
    case 'Ç': if (v === 'a') { s.v = 'uu'; return true; } if (v === 'e') { s.v = 'o'; return true; } return false;
    case 'È': case 'ø': if (v === 'a') { s.v = 'r'; return true; } return v === 'r';
    case 'ñ': if (v === 'a' || v === 'r') { s.v = 'rr'; return true; } return false;
    case 'Ê': if (v === 'e') { s.v = 'ai'; return true; } return false;
    case 'Ë': if (v === 'a') { s.v = 'au'; return true; } return false;
    case 'ï': s.v = 'dead'; return true;
    case 'ð': s.repha = true; return true;
    case 'ó': s.nukta = true; return true;
  }
  return false;
}

const ENG_START = '', ENG_END = '';
function legacyToUnicode(input, opts = {}) {
  const custom = (opts.custom || []).filter((e) => e && e.from && e.to);
  const customKeys = custom.map((e) => e.from).sort((a, b) => b.length - a.length);
  const customMap = new Map(custom.map((e) => [e.from, e.to]));
  // with opts.segments the input is read as is, so piece offsets stay true to the source
  let text = String(input).replace(/\u03BC/g, '\u00B5');   // Greek mu typed for the Nudi ಷ byte
  if (!opts.segments) text = text.normalize('NFC').replace(/[\u00AD\u200B\u200E\u200F\u202A-\u202E\u2060\uFEFF]/g, '');
  if (opts.keepEnglish !== false && !opts.segments) text = protectEnglish(text);
  const out = [];
  let at = 0;
  const emit = (str) => out.push([at, str]);
  const unknown = [];
  let syl = null, dollar = false, eng = false, pendingRepha = false, prevDead = false;
  const flush = () => { if (syl) { out.push([syl.start, syllableText(syl)]); prevDead = syl.kind === 'C' && syl.v === 'dead' && !syl.mods; syl = null; } };
  for (let i = 0; i < text.length;) {
    at = i;
    const ch = text[i];
    if (ch === ENG_START || ch === ENG_END) { flush(); eng = ch === ENG_START; i++; prevDead = false; continue; }
    if (ch === '$') { flush(); dollar = !dollar; i++; prevDead = false; continue; }
    if (dollar || eng) { emit(ch); i++; continue; }
    const ck = customKeys.find((k) => text.startsWith(k, i));
    if (ck) { flush(); emit(customMap.get(ck)); i += ck.length; prevDead = false; continue; }
    const key = (SINGLE_INDEX.get(ch) || []).find((k) => text.startsWith(k, i));
    const tok = key ? TOK.get(key) : null;
    if (!tok) {
      flush(); prevDead = false;
      if (/[0-9]/.test(ch) && opts.kannadaDigits) emit(String.fromCharCode(0x0CE6 + +ch));
      else { emit(ch); if (/[\u0080-ÿ]/.test(ch)) unknown.push({ char: ch, position: i }); }
      i++; continue;
    }
    i += key.length;
    if (tok.t === 'C') {
      // an explicit halant (ï) right before a new consonant stays visible: ಷಟ್‌ಶ್ರುತಿ
      const zwnj = syl && syl.kind === 'C' && syl.v === 'dead' && !syl.mods;
      flush();
      if (zwnj || prevDead) emit('‌');
      syl = { kind: 'C', c: tok.c, v: tok.v, ottus: [], mods: '', repha: pendingRepha, start: at };
      pendingRepha = false; prevDead = false;
    } else if (tok.t === 'V') {
      flush(); prevDead = false; syl = { kind: 'V', u: tok.u, mods: '', start: at };
    } else if (tok.t === 'O') {
      if (syl && syl.kind === 'C' && !syl.mods) syl.ottus.push(tok.c);
      else { flush(); emit('್' + tok.c); unknown.push({ char: key, position: i - key.length }); }
    } else if (tok.t === 'M') {
      if (syl && syl.kind === 'C' && !syl.mods && mark(syl, tok.m)) continue;
      if (syl && syl.kind === 'V' && tok.m === 'À') continue;
      if (tok.m === 'ü' && !syl) { pendingRepha = true; continue; }
      if (tok.m === 'ð' && syl && syl.kind === 'C') { syl.repha = true; continue; }
      if (tok.m === 's') { flush(); emit(tok.m); continue; }   // ordinary letters
      if (syl && syl.kind === 'C' && syl.mods && tok.m === 'Ã') continue;
      flush(); unknown.push({ char: key, position: i - key.length });
      emit(key);
    } else if (tok.t === 'A') {
      if (syl && (syl.kind === 'V' || syl.v !== 'dead')) syl.mods += tok.u;
      else { flush(); emit(tok.u); }
    } else if (tok.t === 'X') { flush(); emit(tok.u); }
    // 'Z' spacers and control bytes vanish
  }
  flush();
  const pieces = [];
  for (let k = 0; k < out.length; k++) {
    const [pos, str] = out[k];
    if (str === '\u200C' && !(out[k + 1] && /^[\u0C95-\u0CB9\u0CDE]/.test(out[k + 1][1]))) continue;
    pieces.push([pos, str.replace(/[\uE110\uE111]/g, '').normalize('NFC')]);
  }
  const result = pieces.map((x) => x[1]).join('');
  const r = { text: result, unknown, clean: unknown.length === 0 };
  if (opts.segments) r.pieces = pieces;
  return r;
}

// English words inside legacy text. A real Nudi/Baraha word almost always carries a byte above 127
// (talakattu, vowel signs, ottus), so a plain-ASCII word with vowels is English. Short or vowel-less
// ASCII words (ಕಿ = Q, ಇತಿ = Ew) count as English only next to clear English or in a line with no legacy bytes.
const COMMON = new Set('a an as at be by do go he if in is it me my no of on or so to up us we am vs dr mr mrs ms st no pm etc ie eg'.split(' '));
const WORD = /[A-Za-z][A-Za-z0-9]*(?:['’][A-Za-z]+)*/g;
function protectEnglish(text) {
  return text.split(/(\r?\n)/).map((line) => {
    if (/^\r?\n$/.test(line) || !/[A-Za-z]/.test(line)) return line;
    const lineIsEnglish = !/[\u0080-ÿ]/.test(line) && /[a-z]{3,}/.test(line);
    const toks = [];
    for (const m of line.matchAll(WORD)) {
      const w = m[0], start = m.index, end = start + w.length;
      const before = line[start - 1] || ' ', after = line[end] || ' ';
      if (/[\u0080-ÿ]/.test(before) || /[\u0080-ÿ]/.test(after)) continue; // glued to legacy bytes
      const sure = lineIsEnglish || COMMON.has(w.toLowerCase()) || (w.length >= 3 && /[aeiouy]/.test(w) && /[a-z]{2}/.test(w));
      toks.push({ start, end, sure });
    }
    const glue = /^[\s,.;:()'"&/-]*$/;
    const keep = toks.filter((t, i) => t.sure
      || (toks[i - 1] && toks[i - 1].sure && glue.test(line.slice(toks[i - 1].end, t.start)))
      || (toks[i + 1] && toks[i + 1].sure && glue.test(line.slice(t.end, toks[i + 1].start))));
    let r = '', cur = 0;
    for (const t of keep) { r += line.slice(cur, t.start) + ENG_START + line.slice(t.start, t.end) + ENG_END; cur = t.end; }
    return r + line.slice(cur);
  }).join('');
}

// ---------------------------------------------------------------- Unicode -> legacy
const IS_C = (ch) => ch >= 'ಕ' && ch <= 'ಹ' && FORMS.has(ch) || ch === 'ೞ';
function ottuBytes(list) {
  return list.map((c, i) => {
    if (i === 0) return SUB[c];
    if (c === 'ರ') return RA_SECOND;
    const g = SUB[c];
    return (SPACED_OTTU.has(g) ? OTTU_SPACER : '') + g;
  }).join('');
}
function clusterToLegacy(c, ottus, v, repha) {
  const forms = FORMS.get(c);
  if (!forms) return null;
  if (!ottus.some((o) => !SUB[o])) {
    if (v === 'rr') return clusterToLegacy(c, ottus, 'a', repha).replace(/ð$/, '') + 'ñ' + (repha ? 'ð' : '');
    const form = forms[V.indexOf(v)];
    const [head, tail] = split(form, v);
    // after an ottu the vowel sign ೃ takes its hanging form ø (È would sit under the ottu)
    const t = ottus.length && v === 'r' ? tail.replace('È', 'ø') : tail;
    return (ottus.length ? head + ottuBytes(ottus) + t : form) + (repha ? 'ð' : '');
  }
  return null;
}
function unicodeToLegacy(input, opts = {}) {
  const s = String(input).normalize('NFC')
    .replace(/[­​‎‏⁠﻿]/g, '')
    .replace(/ऽ/g, 'ಽ')
    .replace(/ಅ([ಾಿೀುೂೃೆೇೈೊೋೌ])/g, (m, x) => ({ 'ಾ':'ಆ','ಿ':'ಇ','ೀ':'ಈ','ು':'ಉ','ೂ':'ಊ','ೃ':'ಋ','ೆ':'ಎ','ೇ':'ಏ','ೈ':'ಐ','ೊ':'ಒ','ೋ':'ಓ','ೌ':'ಔ' })[x]);
  let out = '';
  const unknown = [];
  for (let i = 0; i < s.length;) {
    const ch = s[i];
    if (IS_C(ch)) {
      const start = i;
      const letters = [ch];
      let j = i + 1, nukta = false, zwjRa = false, dead = false;
      if (s[j] === '಼') { nukta = true; j++; }
      if (ch === 'ರ' && s[j] === '‍' && s[j + 1] === '್') { zwjRa = true; j++; }
      while (s[j] === '್') {
        let k = j + 1;
        if (s[k] === '‍') k++;
        if (IS_C(s[k] || '')) { letters.push(s[k]); j = k + 1; if (s[j] === '಼') j++; continue; }
        dead = true; j++; if (s[j] === '‌' || s[j] === '‍') j++;
        break;
      }
      let v = dead ? 'dead' : 'a';
      if (!dead && SIGN_TO_V[s[j]]) { v = SIGN_TO_V[s[j]]; j++; }
      let mods = '';
      while (s[j] === 'ಂ' || s[j] === 'ಃ') { mods += s[j] === 'ಂ' ? 'A' : 'B'; j++; }
      const repha = letters[0] === 'ರ' && letters.length > 1 && !zwjRa;
      const base = repha ? letters[1] : letters[0];
      const ottus = letters.slice(repha ? 2 : 1);
      const legacy = clusterToLegacy(base, ottus, v, repha);
      if (legacy == null) { out += s.slice(start, j); unknown.push({ char: s.slice(start, j), position: start }); }
      else out += legacy + (nukta ? 'ó' : '') + mods;
      i = j; continue;
    }
    if (VOWEL_OUT[ch]) {
      let j = i + 1, mods = '';
      while (s[j] === 'ಂ' || s[j] === 'ಃ') { mods += s[j] === 'ಂ' ? 'A' : 'B'; j++; }
      out += VOWEL_OUT[ch] + mods; i = j; continue;
    }
    if (ch === 'ಂ') { out += 'A'; i++; continue; }
    if (ch === 'ಃ') { out += 'B'; i++; continue; }
    if (ch === 'ಽ') { out += '„'; i++; continue; }
    if (ch >= '೦' && ch <= '೯') { out += String(ch.charCodeAt(0) - 0x0CE6); i++; continue; }
    if (ch === '‌' || ch === '‍') { i++; continue; }
    if (ch >= 'ಀ' && ch <= '೿') unknown.push({ char: ch, position: i });
    out += ch; i++;
  }
  return { text: out, unknown, clean: unknown.length === 0 };
}

// ---------------------------------------------------------------- options shared by the page
function postProcess(text, opts) {
  let t = text;
  if (opts.trimSpaces) t = t.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/gm, '').replace(/^[ \t]+/gm, '');
  return t;
}
function toUnicode(text, opts = {}) {
  const r = legacyToUnicode(text, opts);
  r.text = postProcess(r.text, opts);
  return r;
}
function toAscii(text, opts = {}) {
  let src = text;
  if (opts.asciiDigits === false) src = src; // digits are always written as 0-9; the font draws them
  const r = unicodeToLegacy(src, opts);
  r.text = postProcess(r.text, opts);
  return r;
}
// Leading bytes that belong to the previous syllable (used when a document splits one akshara across runs)
const CONTINUATION = /^[ÀÁÂÃÄÅÆÇÈÉÊËÌ-ãåæèéêëìíîçøñïðöùú÷üó]+/;
function continuationLength(s) { const m = CONTINUATION.exec(s); return m ? m[0].length : 0; }
function hasKannada(s) { return /[ಀ-೿]/.test(s); }

const api = { toUnicode, toAscii, convertKannada: (t, custom) => toUnicode(t, { custom }), convertUnicode: toAscii,
  continuationLength, hasKannada, version: '2026.11' };
if (typeof window !== 'undefined') { window.BV = window.BV || {}; window.BV.BVKannada = api; }
if (typeof module !== 'undefined') module.exports = api;
})();

/*!
 * praja2unicode.js - Praja (Prajavani legacy Kannada font) <-> Unicode converter
 * Version 1.0.1. Written for Brahmavidya / BV Mudrana. No dependencies.
 * GENERATED by tools/export.py from praja2unicode.py - edit the Python source.
 *
 * Browser:        <script src="praja2unicode.js"></script>
 *                 Praja2Unicode.prajaToUnicode(text)
 * Node/Electron:  const P = require('./praja2unicode.js');
 *                 P.prajaToUnicode(text); P.unicodeToPraja(text);
 *
 * Input is a JS string holding text that was set in a Praja font. Each character
 * is read as the legacy byte it stands for (Windows-1252, Latin-1, or the font's
 * own U+2219 slot). Convert only Praja-font runs: English text must be left
 * alone because Praja reuses every printable ASCII code.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else if (typeof define === "function" && define.amd) define([], factory);
  else root.Praja2Unicode = factory();
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var VERSION = "1.0.1";
  // ---- data tables ----
  var CP1252_HIGH = {"8364":128,"8218":130,"402":131,"8222":132,"8230":133,"8224":134,"8225":135,"710":136,"8240":137,"352":138,"8249":139,"338":140,"381":142,"8216":145,"8217":146,"8220":147,"8221":148,"8226":149,"8211":150,"8212":151,"732":152,"8482":153,"353":154,"8250":155,"339":156,"382":158,"376":159,"8729":183};
  var TOKENS = {"33":[["IV","ಅ"]],"113":[["IV","ಆ"]],"35":[["IV","ಇ"]],"36":[["IV","ಈ"]],"37":[["IV","ಉ"]],"38":[["IV","ಊ"]],"40":[["IV","ಎ"]],"41":[["IV","ಏ"]],"42":[["IV","ಐ"]],"43":[["IV","ಒ"]],"248":[["IV","ಓ"]],"242":[["IV","ಔ"]],"193":[["IV","ಓಂ"]],"77":[["RI"]],"224":[["ANU"]],"47":[["MOD","ಃ"]],"48":[["TXT","೦"]],"49":[["TXT","೧"]],"50":[["TXT","೨"]],"51":[["TXT","೩"]],"52":[["TXT","೪"]],"53":[["TXT","೫"]],"54":[["TXT","೬"]],"55":[["TXT","೭"]],"56":[["TXT","೮"]],"57":[["TXT","೯"]],"228":[["TXT",","]],"229":[["TXT","."]],"32":[["TXT"," "]],"9":[["TXT","\t"]],"10":[["TXT","\n"]],"13":[["TXT","\r"]],"249":[["C","ಕ"]],"211":[["C","ಕ"]],"82":[["CI","ಕ"]],"250":[["CE","ಕ"]],"71":[["C","ಖ"]],"238":[["C","ಖ"]],"83":[["CI","ಖ"]],"212":[["C","ಗ"]],"84":[["CI","ಗ"]],"213":[["C","ಘ"]],"246":[["CI","ಘ"]],"72":[["C","ಙ"]],"214":[["C","ಚ"]],"85":[["CI","ಚ"]],"252":[["C","ಛ"]],"73":[["C","ಜ"]],"216":[["C","ಜ"]],"87":[["CI","ಜ"]],"207":[["ZHA"]],"115":[["ZR"]],"74":[["C","ಞ"]],"75":[["C","ಟ"]],"217":[["C","ಟ"]],"88":[["CI","ಟ"]],"219":[["C","ಡ"]],"90":[["CI","ಡ"]],"76":[["C","ಣ"]],"220":[["C","ಣ"]],"64":[["CI","ಣ"]],"58":[["C","ತ"]],"92":[["CI","ತ"]],"59":[["C","ದ"]],"93":[["CI","ದ"]],"60":[["C","ನ"]],"94":[["CI","ನ"]],"39":[["C","ಪ"]],"61":[["C","ಪ"]],"95":[["CI","ಪ"]],"237":[["C","ಫ"]],"78":[["C","ಬ"]],"230":[["C","ಬ"]],"118":[["CI","ಬ"]],"65":[["VA"]],"97":[["VAI"]],"79":[["YA"]],"104":[["YAI"]],"210":[["YAE"]],"218":[["C","ರ"]],"89":[["CI","ರ"]],"63":[["C","ಲ"]],"80":[["C","ಲ"]],"98":[["CI","ಲ"]],"66":[["C","ಶ"]],"105":[["CI","ಶ"]],"67":[["C","ಷ"]],"99":[["CI","ಷ"]],"68":[["C","ಸ"]],"100":[["CI","ಸ"]],"69":[["C","ಹ"]],"101":[["CI","ಹ"]],"232":[["C","ಳ"]],"102":[["CI","ಳ"]],"179":[["C","ೞ"]],"150":[["C","ೞ"]],"86":[["C","ೞ"]],"180":[["C","ಱ"]],"151":[["C","ಱ"]],"70":[["C","ಜ"],["SUB","ಞ"]],"81":[["C","ಜ"],["SUB","ಞ"]],"103":[["CI","ಜ"],["SUB","ಞ"]],"225":[["CI","ಶ"],["SUB","ರ"]],"106":[["T"]],"111":[["V","aa"]],"112":[["V","i"]],"117":[["V","e"]],"206":[["V","e"]],"119":[["V","e"]],"96":[["V","e"],["V","len"]],"160":[["V","e"],["OO"]],"124":[["V","len"]],"122":[["V","au"]],"226":[["V","r"]],"121":[["V","rr"]],"227":[["V","ai"]],"125":[["V","vir"]],"251":[["V","u"]],"34":[["ARM"]],"62":[["ARM"]],"236":[["ARM"]],"123":[["ARMI"]],"116":[["ARMAA"]],"114":[["OO"]],"209":[["OOD"]],"107":[["TICK"]],"108":[["TICK"]],"135":[["STICK"]],"109":[["DOT"]],"110":[["DOT"]],"126":[["REPH",false]],"231":[["REPH",true]],"120":[["SUB","ಕ"]],"161":[["SUB","ಖ"]],"162":[["SUB","ಗ"]],"163":[["SUB","ಘ"]],"164":[["SUB","ಙ"]],"165":[["SUB","ಚ"]],"167":[["SUB","ಜ"]],"46":[["SUB","ಝ"]],"169":[["SUB","ಞ"]],"170":[["SUB","ಟ"]],"171":[["SUB","ಠ"]],"134":[["SUB","ಡ"]],"174":[["SUB","ಣ"]],"137":[["SUB","ತ"]],"176":[["SUB","ಥ"]],"138":[["SUB","ದ"]],"139":[["SUB","ನ"]],"140":[["SUB","ಪ"]],"44":[["SUB","ಫ"]],"145":[["SUB","ಫ"]],"146":[["SUB","ಬ"]],"182":[["SUB","ಮ"]],"199":[["SUB","ಯ"]],"200":[["SUB","ರ"]],"154":[["SUB","ಲ"]],"186":[["SUB","ವ"]],"187":[["SUB","ಶ"]],"155":[["SUB","ಷ"]],"235":[["SUB","ಷ"]],"156":[["SUB","ಸ"]],"192":[["SUB","ಹ"]],"191":[["SUB","ಳ"]],"177":[["SUB","ಱ"]],"147":[["SUB","ಱ"]],"178":[["SUB","ೞ"]],"148":[["SUB","ೞ"]],"233":[["SUB","ತ","ರ"]],"184":[["SUB","ತ","ರ"]],"234":[["SUB","ತ","ಯ"]],"183":[["SUB","ತ","ಯ"]],"196":[["SUB","ಟ","ರ"]],"201":[["SUB","ಪ","ರ"]],"203":[["SUB","ಸ","ರ"]],"204":[["SUB","ಕ","ಷ"]],"205":[["SUB","ಕ","ರ"]],"197":[["SUB","ತ"],["V","r"]],"198":[["SUB","ತ"],["V","ai"]],"194":[["SUB","ಕ"],["V","r"]],"195":[["SUB","ಬ"],["V","ai"]],"202":[["SUB","ರ"],["V","r"]],"45":[["SKIP"]],"91":[["SKIP"]],"239":[["SKIP"]],"240":[["SKIP"]],"241":[["SKIP"]],"243":[["SKIP"]],"244":[["SKIP"]],"245":[["SKIP"]],"247":[["SKIP"]],"253":[["SKIP"]],"254":[["SKIP"]],"215":[["SKIP"]],"221":[["SKIP"]],"222":[["SKIP"]],"223":[["SKIP"]],"208":[["SKIP"]],"166":[["SKIP"]],"168":[["SKIP"]],"172":[["SKIP"]],"173":[["SKIP"]],"175":[["SKIP"]],"181":[["SKIP"]],"185":[["SKIP"]],"188":[["SKIP"]],"189":[["SKIP"]],"190":[["SKIP"]],"128":[["SKIP"]],"129":[["SKIP"]],"130":[["SKIP"]],"131":[["SKIP"]],"132":[["SKIP"]],"133":[["SKIP"]],"136":[["SKIP"]],"141":[["SKIP"]],"142":[["SKIP"]],"143":[["SKIP"]],"144":[["SKIP"]],"149":[["SKIP"]],"152":[["SKIP"]],"153":[["SKIP"]],"157":[["SKIP"]],"158":[["SKIP"]],"159":[["SKIP"]],"255":[["IV","ಌ"]],"127":[["SKIP"]]};
  var ASPIRATE = {"ಪ":"ಫ","ದ":"ಧ","ಡ":"ಢ","ಬ":"ಭ","ಠ":"ಥ","ಚ":"ಛ","ಛ":"ಛ","ಫ":"ಫ","ಘ":"ಘ","ಝ":"ಝ","ಧ":"ಧ","ಢ":"ಢ","ಭ":"ಭ","ಥ":"ಥ"};
  var CONS_FORMS = {"ಕ":{"B":[211],"F":[211,106],"I":[82]},"ಖ":{"B":[238],"F":[71],"I":[83]},"ಗ":{"B":[212],"F":[212,106],"I":[84]},"ಘ":{"B":[213],"F":[213,106],"I":[246]},"ಙ":{"B":[72],"F":[72],"I":[72,112]},"ಚ":{"B":[214],"F":[214,106],"I":[85]},"ಛ":{"B":[252,107],"F":[252,107,106],"I":[85,108]},"ಜ":{"B":[216],"F":[73],"I":[87]},"ಞ":{"B":[74],"F":[74],"I":[74,112]},"ಟ":{"B":[217],"F":[75],"I":[88]},"ಠ":{"B":[218,109],"F":[218,109,106],"I":[89,109]},"ಡ":{"B":[219],"F":[219,106],"I":[90]},"ಢ":{"B":[219,107],"F":[219,107,106],"I":[90,108]},"ಣ":{"B":[220],"F":[76],"I":[64]},"ತ":{"B":[58],"F":[58,106],"I":[92]},"ಥ":{"B":[59,109,107],"F":[59,109,107,106],"I":[93,109,108]},"ದ":{"B":[59],"F":[59,106],"I":[93]},"ಧ":{"B":[59,107],"F":[59,107,106],"I":[93,108]},"ನ":{"B":[60],"F":[60,106],"I":[94]},"ಪ":{"B":[39],"F":[39,106],"I":[95]},"ಫ":{"B":[237],"F":[237,106],"I":[95,108]},"ಬ":{"B":[230],"F":[78],"I":[118]},"ಭ":{"B":[230,107],"F":[230,107,106],"I":[118,108]},"ರ":{"B":[218],"F":[218,106],"I":[89]},"ಲ":{"B":[63],"F":[80],"I":[98]},"ವ":{"B":[65],"F":[65,106],"I":[97]},"ಶ":{"B":[66],"F":[66,106],"I":[105]},"ಷ":{"B":[67],"F":[67,106],"I":[99]},"ಸ":{"B":[68],"F":[68,106],"I":[100]},"ಹ":{"B":[69],"F":[69,106],"I":[101]},"ಳ":{"B":[232],"F":[232,106],"I":[102]},"ಱ":{"B":[180],"F":[180],"I":[180,112]},"ೞ":{"B":[179],"F":[179],"I":[179,112]}};
  var DESC_TAIL = ["ಪ","ಫ","ವ"];
  var SPECIAL = {"ಮ":{"":[[65,106,34],[]],"aa":[[65,106,116],[]],"i":[[97,34],[]],"ii":[[97,34],[124]],"u":[[65,106,34],[34]],"uu":[[65,106,34],[114]],"r":[[65,106,34],[226]],"rr":[[65,106,34],[121]],"e":[[65,117,34],[]],"ee":[[65,117,34],[124]],"ai":[[65,117,34],[227]],"o":[[65,117],[114]],"oo":[[65,117],[114,124]],"au":[[65,106,123,122],[]],"vir":[[65,106,123,125],[]]},"ಯ":{"":[[79,34],[]],"aa":[[79,116],[]],"i":[[104,34],[]],"ii":[[104,34],[124]],"u":[[79,34],[34]],"uu":[[79,34],[114]],"r":[[79,34],[226]],"rr":[[79,34],[121]],"e":[[210,34],[]],"ee":[[210,34],[124]],"ai":[[210,34],[227]],"o":[[210],[114]],"oo":[[210],[114,124]],"au":[[79,123,122],[]],"vir":[[79,123,125],[]]},"ಝ":{"":[[207],[]],"aa":[[218,106,115,116],[]],"i":[[89,115,34],[]],"ii":[[89,115,34],[124]],"u":[[207],[34]],"uu":[[207],[114]],"r":[[207],[226]],"rr":[[207],[121]],"e":[[218,117,115,34],[]],"ee":[[218,117,115,34],[124]],"ai":[[218,117,115,34],[227]],"o":[[218,117,115],[114]],"oo":[[218,117,115],[114,124]],"au":[[218,106,115,123,122],[]],"vir":[[218,106,115,123,125],[]]}};
  var SUB_P = {"ಕ":[120],"ಖ":[161],"ಗ":[162],"ಘ":[163],"ಙ":[164],"ಚ":[165],"ಛ":[165,135],"ಜ":[167],"ಝ":[46],"ಞ":[169],"ಟ":[170],"ಠ":[171],"ಡ":[134],"ಢ":[134,135],"ಣ":[174],"ತ":[137],"ಥ":[176],"ದ":[138],"ಧ":[138,135],"ನ":[139],"ಪ":[140],"ಫ":[44],"ಬ":[146],"ಭ":[146,135],"ಮ":[182],"ಯ":[199],"ರ":[200],"ಲ":[154],"ವ":[186],"ಶ":[187],"ಷ":[155],"ಸ":[156],"ಹ":[192],"ಳ":[191],"ಱ":[177],"ೞ":[178]};
  var SUB2_P = {"ತ+ರ":[233],"ತ+ಯ":[234],"ಟ+ರ":[196],"ಪ+ರ":[201],"ಸ+ರ":[203],"ಕ+ರ":[205]};
  var SUB_SIGN_P = {"120,226":194,"137,226":197,"200,226":202,"137,227":198,"146,227":195};
  var IND_VOWEL_P = {"ಅ":[33],"ಆ":[113],"ಇ":[35],"ಈ":[36],"ಉ":[37],"ಊ":[38],"ಋ":[77,34],"ೠ":[77,114],"ಎ":[40],"ಏ":[41],"ಐ":[42],"ಒ":[43],"ಓ":[248],"ಔ":[242],"ಌ":[255]};
  var VOWEL_SIGNS = {"ಾ":"aa","ಿ":"i","ೀ":"ii","ು":"u","ೂ":"uu","ೃ":"r","ೄ":"rr","ೆ":"e","ೇ":"ee","ೈ":"ai","ೊ":"o","ೋ":"oo","ೌ":"au","್":"vir"};

  // ---- 1. character -> legacy byte ----
  function decodeByte(ch) {
    var o = ch.charCodeAt(0);
    if (CP1252_HIGH.hasOwnProperty(o)) return CP1252_HIGH[o];
    if (o <= 0xFF) return o;
    if (o >= 0xF000 && o <= 0xF0FF) return o - 0xF000;   // symbol-font PUA
    return null;
  }

  // ---- 2. syllable assembler (Praja -> Unicode) ----
  function Syl(kind, base) {
    this.kind = kind; this.base = base || null; this.armed = false;
    this.parts = []; this.subs = []; this.subtick = [];
    this.reph = false; this.tick = false; this.dot = false; this.mods = [];
  }
  Syl.prototype.needsArm = function () {
    return (this.kind === "VA" || this.kind === "YA" || this.kind === "ZR" ||
            this.kind === "RI") && !this.armed;
  };
  Syl.prototype.render = function () {
    var base;
    if (this.kind === "VA") base = this.armed ? "ಮ" : "ವ";
    else if (this.kind === "YA") base = "ಯ";
    else if (this.kind === "ZR") base = "ಝ";
    else if (this.kind === "RI") base = this.parts.indexOf("uu_arm") >= 0 ? "ೠ" : "ಋ";
    else base = this.base;
    if (this.kind === "C") {
      if (this.dot && base === "ರ") base = "ಠ";
      else if (this.dot && (base === "ದ" || base === "ಧ")) base = "ಥ";
      if (this.tick && ASPIRATE[base]) base = ASPIRATE[base];
    }
    var out = this.reph ? "ರ್" : "";
    out += base;
    for (var i = 0; i < this.subs.length; i++) {
      var s = this.subs[i];
      out += "್" + (this.subtick[i] && ASPIRATE[s] ? ASPIRATE[s] : s);
    }
    if (this.kind !== "RI") out += composeVowel(this.parts);
    return out + this.mods.join("");
  };

  var SINGLE = { aa: "ಾ", au: "ೌ", u: "ು", uu: "ೂ", r: "ೃ", rr: "ೄ", len: "ೕ",
                 ai: "ೖ", i: "ಿ", e: "ೆ", vir: "್" };

  function composeVowel(parts) {
    var p = parts.filter(function (x) { return x !== "uu_arm"; });
    if (!p.length) return "";
    var s = {}; p.forEach(function (x) { s[x] = true; });
    var sign = "", used = {};
    if (s.vir) { sign = "್"; used = { vir: 1 }; }
    else if (s.i) { if (s.len) { sign = "ೀ"; used = { i: 1, len: 1 }; } else { sign = "ಿ"; used = { i: 1 }; } }
    else if (s.e) {
      if (s.uu) { if (s.len) { sign = "ೋ"; used = { e: 1, uu: 1, len: 1 }; } else { sign = "ೊ"; used = { e: 1, uu: 1 }; } }
      else if (s.ai) { sign = "ೈ"; used = { e: 1, ai: 1 }; }
      else if (s.len) { sign = "ೇ"; used = { e: 1, len: 1 }; }
      else { sign = "ೆ"; used = { e: 1 }; }
    }
    var seen = {}, rest = "";
    p.forEach(function (x) {
      if (used[x] || seen[x]) return;
      seen[x] = 1; rest += SINGLE[x];
    });
    return sign + rest;
  }

  function stray(tok) {
    var k = tok[0];
    if (k === "V") return composeVowel([tok[1]]);
    if (k === "ARM" || k === "ARMI") return "ು";
    if (k === "ARMAA") return "ಾ";
    if (k === "OO" || k === "OOD") return "ೂ";
    if (k === "SUB") return tok.slice(1).map(function (s) { return "್" + s; }).join("");
    if (k === "REPH") return "ರ್";
    return "";
  }

  function tokenize(text) {
    var toks = [];
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i), b = decodeByte(ch);
      if (b === null || !TOKENS.hasOwnProperty(b)) { toks.push(["RAW", ch]); continue; }
      var list = TOKENS[b];
      for (var j = 0; j < list.length; j++) toks.push(list[j]);
    }
    return toks;
  }

  /** Convert text typed in a Praja font to Unicode Kannada. */
  function prajaToUnicode(text, opts) {
    opts = opts || {};
    var toks = tokenize(text), out = [], cur = null;
    function flush() { if (cur) { out.push(cur.render()); cur = null; } }
    function nw(kind, base) { flush(); cur = new Syl(kind, base); return cur; }
    for (var i = 0; i < toks.length; i++) {
      var tok = toks[i], k = tok[0], nxt = i + 1 < toks.length ? toks[i + 1][0] : null;
      switch (k) {
        case "C": nw("C", tok[1]); break;
        case "CI": nw("C", tok[1]).parts.push("i"); break;
        case "CE": nw("C", tok[1]).parts.push("e"); break;
        case "VA": nw("VA"); break;
        case "VAI": nw("VA").parts.push("i"); break;
        case "YA": nw("YA"); break;
        case "YAI": nw("YA").parts.push("i"); break;
        case "YAE": nw("YA").parts.push("e"); break;
        case "ZHA": nw("ZR").armed = true; break;
        case "ZR":
          if (cur && cur.kind === "C" && cur.base === "ರ" && !cur.subs.length) { cur.kind = "ZR"; cur.base = "ಝ"; }
          else nw("ZR");
          break;
        case "RI": nw("RI"); break;
        case "ANU":
          if (nxt === "ARMI" || nxt === "ARMAA") nw("YA");
          else if (cur) cur.mods.push("ಂ");
          else out.push("ಂ");
          break;
        case "MOD": if (cur) cur.mods.push(tok[1]); else out.push(tok[1]); break;
        case "IV": flush(); out.push(tok[1]); break;
        case "TXT": case "RAW": flush(); out.push(tok[1]); break;
        case "SKIP": case "T": break;
        default:
          if (!cur) { out.push(stray(tok)); break; }
          switch (k) {
            case "V": cur.parts.push(tok[1]); break;
            case "ARM": case "ARMI":
              if (cur.needsArm()) cur.armed = true; else cur.parts.push("u");
              break;
            case "ARMAA":
              if (cur.needsArm()) cur.armed = true;
              cur.parts.push("aa"); break;
            case "OO":
              if (cur.kind === "RI" && !cur.armed) { cur.armed = true; cur.parts.push("uu_arm"); }
              else if ((cur.kind === "VA" || cur.kind === "YA" || cur.kind === "ZR") && !cur.armed &&
                       cur.parts.indexOf("e") >= 0) { cur.armed = true; cur.parts.push("uu"); }
              else cur.parts.push("uu");
              break;
            case "OOD": cur.parts.push("uu"); break;
            case "TICK":
              if (cur.subs.length && cur.kind === "C" && !ASPIRATE[cur.base]) cur.subtick[cur.subtick.length - 1] = true;
              else cur.tick = true;
              break;
            case "STICK":
              if (cur.subs.length) cur.subtick[cur.subtick.length - 1] = true; else cur.tick = true;
              break;
            case "DOT": cur.dot = true; break;
            case "SUB":
              for (var s = 1; s < tok.length; s++) { cur.subs.push(tok[s]); cur.subtick.push(false); }
              break;
            case "REPH": cur.reph = true; if (tok[1]) cur.parts.push("len"); break;
          }
      }
    }
    flush();
    var res = out.join("");
    return opts.normalize === false || !res.normalize ? res : res.normalize("NFC");
  }

  // ---- 3. Unicode -> Praja ----
  var CONSONANTS = {};
  Object.keys(CONS_FORMS).forEach(function (c) { CONSONANTS[c] = 1; });
  Object.keys(SPECIAL).forEach(function (c) { CONSONANTS[c] = 1; });

  function consVowelParts(c, v) {
    if (SPECIAL[c]) { var sp = SPECIAL[c][v]; return [sp[0].slice(), sp[1].slice()]; }
    var f = CONS_FORMS[c], desc = DESC_TAIL.indexOf(c) >= 0;
    var U = desc ? 0xFB : 0x22, UU = desc ? 0xD1 : 0x72, B = f.B, F = f.F, I = f.I;
    var t = {
      "": [F, []], aa: [B.concat([0x6F]), []], i: [I, []], ii: [I, [0x7C]],
      u: [F, [U]], uu: [F, [UU]], r: [F, [0xE2]], rr: [F, [0x79]],
      e: [B.concat([0x75]), []], ee: [B.concat([0x75]), [0x7C]],
      ai: [B.concat([0x75]), [0xE3]], o: [B.concat([0x75]), [UU]],
      oo: [B.concat([0x75]), [UU, 0x7C]], au: [B.concat([0x7A]), []],
      vir: [B.concat([0x7D]), []]
    }[v];
    return [t[0].slice(), t[1].slice()];
  }

  function subsToPraja(subs) {
    var out = [], i = 0;
    while (i < subs.length) {
      var key = subs[i] + "+" + subs[i + 1];
      if (i + 1 < subs.length && SUB2_P[key]) { out = out.concat(SUB2_P[key]); i += 2; continue; }
      out = out.concat(SUB_P[subs[i]] || []); i++;
    }
    return out;
  }

  function syllableToPraja(base, subs, vowel, reph) {
    var seq, lr;
    if (base === "ಜ" && subs[0] === "ಞ") {
      var rest = subs.slice(1), left, right;
      if (vowel === "") { left = [0x51]; right = []; }
      else if (vowel === "i" || vowel === "ii") { left = [0x67]; right = vowel === "ii" ? [0x7C] : []; }
      else {
        lr = consVowelParts("ಜ", vowel); right = lr[1];
        left = (lr[0][0] === 0xD8 ? [0x46] : [0x51]).concat(lr[0].slice(1));
      }
      seq = left.concat(subsToPraja(rest), right);
    } else if (base === "ಶ" && subs.length === 1 && subs[0] === "ರ" && (vowel === "i" || vowel === "ii")) {
      seq = [0xE1].concat(vowel === "ii" ? [0x7C] : []);
    } else {
      lr = consVowelParts(base, vowel);
      // the short u-hook sits before the ottakshara; other right-hand signs follow it
      var pre = (lr[1][0] === 0x22 && subs.length) ? [0x22] : [];
      seq = lr[0].concat(pre, subsToPraja(subs), lr[1].slice(pre.length));
    }
    // ottakshara + vocalic-r / ai-length pieces that Praja draws as one glyph
    for (var k = 0; k + 1 < seq.length; k++) {
      var key2 = seq[k] + "," + seq[k + 1];
      if (SUB_SIGN_P[key2] !== undefined) { seq.splice(k, 2, SUB_SIGN_P[key2]); break; }
    }
    if (reph) {
      if (seq.length && seq[seq.length - 1] === 0x7C) seq[seq.length - 1] = 0xE7; else seq.push(0x7E);
    }
    return seq;
  }

  var CP1252_REV = {};
  Object.keys(CP1252_HIGH).forEach(function (k) { CP1252_REV[CP1252_HIGH[k]] = +k; });
  function byteToChar(b) {
    if (b >= 0x80 && b <= 0x9F && b !== 0xB7) return String.fromCharCode(CP1252_REV[b] || b);
    return String.fromCharCode(b);
  }

  /** Unicode Kannada -> array of Praja byte values (other characters kept as strings). */
  function unicodeToPrajaCodes(text) {
    if (text.normalize) text = text.normalize("NFC");
    var out = [], i = 0, n = text.length;
    while (i < n) {
      var ch = text.charAt(i), j = i, reph = false;
      if (ch === "ರ" && j + 2 < n && text.charAt(j + 1) === "್" && CONSONANTS[text.charAt(j + 2)]) {
        reph = true; j += 2;
      }
      if (CONSONANTS[text.charAt(j)]) {
        var base = text.charAt(j); j++;
        var subs = [];
        while (j + 1 < n && text.charAt(j) === "್" && CONSONANTS[text.charAt(j + 1)]) {
          subs.push(text.charAt(j + 1)); j += 2;
        }
        var vowel = "";
        if (j < n && VOWEL_SIGNS[text.charAt(j)] !== undefined) { vowel = VOWEL_SIGNS[text.charAt(j)]; j++; }
        out = out.concat(syllableToPraja(base, subs, vowel, reph));
        while (j < n && (text.charAt(j) === "ಂ" || text.charAt(j) === "ಃ")) {
          out.push(text.charAt(j) === "ಂ" ? 0xE0 : 0x2F); j++;
        }
        i = j; continue;
      }
      if (IND_VOWEL_P[ch]) out = out.concat(IND_VOWEL_P[ch]);
      else if (ch === "ಂ") out.push(0xE0);
      else if (ch === "ಃ") out.push(0x2F);
      else if (ch >= "೦" && ch <= "೯") out.push(0x30 + ch.charCodeAt(0) - 0x0CE6);
      else if (ch === ",") out.push(0xE4);
      else if (ch === ".") out.push(0xE5);
      else if (" \t\r\n".indexOf(ch) >= 0) out.push(ch.charCodeAt(0));
      else if (VOWEL_SIGNS[ch] !== undefined) {
        var lr2 = consVowelParts("ಕ", VOWEL_SIGNS[ch]);
        out = out.concat(lr2[0].slice(1), lr2[1]);
      } else if (ch !== "‌" && ch !== "‍") out.push(ch);
      i++;
    }
    return out;
  }

  /** Unicode Kannada -> legacy Praja string (Windows-1252 characters). */
  function unicodeToPraja(text) {
    return unicodeToPrajaCodes(text).map(function (x) {
      return typeof x === "string" ? x : byteToChar(x);
    }).join("");
  }

  // ---- 4. font-name helpers ----
  /** Legacy Praja font name -> 'Praja Unicode' family name, or null for other fonts. */
  function unicodeFontFor(fontName) {
    var n = String(fontName).trim().toLowerCase().replace(/-/g, "_");
    [" bold italic", " italic", " bold", " normal", " regular"].forEach(function (s) {
      if (n.slice(-s.length) === s) n = n.slice(0, -s.length);
    });
    n = n.replace(/ /g, "_");
    if (["praja_medium", "praja_med_itl", "praja_bold", "praja_bld_itl", "praja"].indexOf(n) >= 0) return "Praja Unicode";
    if (["praja_demi", "praja_dem_itl"].indexOf(n) >= 0) return "Praja Unicode Demi";
    if (["praja_light", "praja_lit_itl"].indexOf(n) >= 0) return "Praja Unicode Light";
    return null;
  }
  function isPrajaFont(fontName) { return unicodeFontFor(fontName) !== null; }

  // BV Mudrana: does this character only continue a syllable (vowel sign, ottu, tick, arkavattu...)?
  // Used to keep a syllable whole when the formatting changes in the middle of it.
  var CONT = { V: 1, ARM: 1, ARMI: 1, ARMAA: 1, OO: 1, OOD: 1, TICK: 1, STICK: 1, DOT: 1, SUB: 1, REPH: 1, T: 1, ANU: 1, MOD: 1 };
  function isContinuation(ch) {
    var b = decodeByte(ch);
    if (b === null || !TOKENS.hasOwnProperty(b)) return false;
    var k = TOKENS[b][0][0];
    if (k === "ANU") return true;
    return CONT[k] === 1;
  }

  return {
    VERSION: VERSION,
    isContinuation: isContinuation,
    unicodeFontFor: unicodeFontFor,
    isPrajaFont: isPrajaFont,
    prajaToUnicode: prajaToUnicode,
    unicodeToPraja: unicodeToPraja,
    unicodeToPrajaCodes: unicodeToPrajaCodes,
    decodeByte: decodeByte
  };
}));

/* BV Mudrana: legacy Devanagari and IAST fonts to Unicode, and back.
   Chanakya, Chanakyamath and Walkman-Chanakya-901 (Devanagari) become Unicode Devanagari set in BV Chitkala,
   BV Chitkala Math and BV Chitkala Hindi. Nalanda fonts (IAST transliteration) become Unicode Latin set in
   BV Nanda. The tables come from the fonts themselves: each legacy glyph was matched outline for outline
   with its glyph in the BV fonts, which were made from them. */
(function () {
  const BV = (window.BV = window.BV || {});
  // code -> [kind, text]. Kinds: C consonant or conjunct, H half form (ends in virama), V vowel sign,
  // M other mark (nukta, anusvara, rakar, yaphala...), P i-sign written before its consonant (text = what
  // follows the i-sign, like an anusvara), PR i-sign with a reph, R reph (text = what follows it), X anything else.
  const T = {"chanakya":{"16":["X","\u090d"],"18":["X","\u0911"],"22":["V","\u093e"],"24":["X","\u0914"],"25":["V","\u0949"],"33":["X","!"],"34":["X","\u5350"],"35":["C","\u092a\u094d\u0924"],"36":["X","."],"37":["C","\u0924\u094d\u0928"],"38":["X","\u00d7"],"39":["X","%"],"40":["X","("],"41":["X",")"],"42":["X","*"],"43":["X","+"],"44":["X",","],"45":["X","-"],"46":["X","."],"47":["X","/"],"48":["X","\u0966"],"49":["X","\u0967"],"50":["X","\u0968"],"51":["X","\u0969"],"52":["X","\u096a"],"53":["X","\u096b"],"54":["X","\u096c"],"55":["X","\u096d"],"56":["X","\u096e"],"57":["X","\u096f"],"58":["X",":"],"59":["X",";"],"60":["X","<"],"61":["X","="],"62":["X",">"],"63":["X","?"],"64":["C","\u091e\u094d\u091a"],"65":["M","\u094d\u0930"],"66":["C","\u0915\u094d\u091a"],"67":["C","\u0937\u094d\u091f"],"68":["C","\u0937\u094d\u0920"],"69":["C","\u0936\u094d\u0935"],"70":["C","\u0938\u094d\u0928"],"71":["C","\u0924\u094d\u0930"],"72":["X","\u0965"],"73":["C","\u0922\u094d\u0922"],"74":["C","\u091b\u094d\u0935"],"75":["M","\u094d\u092f"],"76":["C","\u0930\u0941"],"77":["C","\u0930\u0942"],"78":["C","\u0939\u0943"],"79":["C","\u0939\u094d\u0930"],"80":["C","\u0915\u094d\u0915"],"81":["C","\u0915\u094d\u0924"],"82":["C","\u0915\u094d\u0930"],"83":["H","\u0938\u094d"],"84":["C","\u091e\u094d\u091c"],"85":["X","\u2009"],"86":["C","\u0919\u094d\u0915"],"87":["C","\u0919\u094d\u0916"],"88":["C","\u0919\u094d\u0917"],"89":["C","\u0919\u094d\u0918"],"90":["R","\u0902"],"91":["X","["],"92":["C","\u091d\u094d\u0930"],"93":["X","]"],"94":["C","\u091f\u094d\u091f"],"95":["C","\u091f\u094d\u0920"],"96":["C","\u0915\u094d\u0935"],"97":["C","\u0921\u094d\u0921"],"98":["C","\u0921\u094d\u0922"],"99":["H","\u0937\u094d"],"100":["C","\u0938\u094d\u0930"],"101":["C","\u0926\u094d\u0917"],"102":["C","\u0926\u094d\u0918"],"103":["C","\u0926\u094d\u0926"],"104":["C","\u0926\u094d\u0927"],"105":["C","\u0926\u094d\u092c"],"106":["C","\u0926\u094d\u092d"],"107":["C","\u0926\u094d\u092e"],"108":["C","\u0926\u094d\u092f"],"109":["C","\u0926\u094d\u0935"],"110":["C","\u0920\u094d\u0920"],"111":["C","\u0936"],"112":["C","\u0936\u094d\u091a"],"113":["C","\u0939\u094d\u0928"],"114":["H","\u0939\u094d\u092e\u094d"],"115":["C","\u0939\u094d\u092f"],"116":["C","\u0939\u094d\u0932"],"117":["C","\u0939\u094d\u0935"],"118":["X","1"],"119":["X","2"],"120":["X","3"],"121":["X","4"],"122":["X","5"],"123":["X","6"],"124":["X","7"],"125":["X","8"],"126":["X","9"],"127":["M","\u0953"],"128":["H","\u0915\u094d"],"129":["H","\u0916\u094d"],"130":["H","\u0917\u094d"],"131":["H","\u0918\u094d"],"132":["C","\u0932\u094d\u0932"],"133":["H","\u091c\u094d"],"134":["H","\u091e\u094d"],"135":["H","\u0923\u094d"],"136":["H","\u0924\u094d"],"137":["H","\u0925\u094d"],"138":["H","\u0927\u094d"],"139":["H","\u0928\u094d"],"140":["H","\u092a\u094d"],"141":["H","\u092b\u094d"],"142":["H","\u092c\u094d"],"143":["H","\u092d\u094d"],"144":["H","\u092e\u094d"],"145":["H","\u091a\u094d"],"146":["H","\u091c\u094d"],"147":["H","\u091a\u094d\u091a\u094d"],"148":["H","\u091c\u094d\u091c\u094d"],"149":["H","\u091c\u093c\u094d"],"150":["C","\u0919\u094d\u0915\u094d\u0937"],"151":["X","\u2014"],"152":["H","\u0924\u094d\u0930\u094d"],"153":["H","\u091c\u094d\u091e\u094d"],"154":["M","\u0901"],"155":["V","\u0944"],"156":["X","\u0950"],"157":["C","\u0938\u094d\u0924\u094d\u0930"],"158":["H","\u0924\u094d\u0924\u094d"],"159":["H","\u0936\u094d\u0930\u094d"],"160":["M","\u0952"],"161":["M","\u0901"],"162":["M","\u0902"],"163":["V","\u0962"],"164":["X","\u2009"],"165":["X","\u0905"],"166":["C","\u0937\u094d\u091f\u094d\u0935"],"167":["X","\u0907"],"168":["P","\u0902"],"169":["X","\u0909"],"170":["X","\u090a"],"171":["X","\u090b"],"172":["X","\u0960"],"173":["X","\u090c"],"174":["X","0"],"175":["C","\u0916\u094d\u0928"],"176":["X","\u090f"],"177":["H","\u0939\u094d"],"178":["C","\u091f"],"179":["H","\u0936\u094d"],"180":["M","\u0902"],"181":["C","\u0926\u094d\u092c\u094d\u0930"],"182":["C","\u0932"],"183":["C","\u0915"],"184":["M","\u093c"],"185":["C","\u0916"],"186":["C","\u0916\u094d\u0930"],"187":["C","\u0917"],"188":["C","\u0926"],"189":["C","\u0921\u094d\u0921"],"190":["C","\u0919"],"191":["C","\u091a"],"192":["C","\u091b"],"193":["C","\u091c"],"194":["C","\u092a"],"195":["H","\u0935\u094d"],"196":["H","\u092f\u094d"],"197":["C","\u091f"],"198":["C","\u0920"],"199":["C","\u0921"],"200":["C","\u092b"],"201":["C","\u0922"],"202":["H","\u091c\u093c\u094d"],"203":["H","\u0932\u094d"],"204":["C","\u0924"],"205":["C","\u0925"],"206":["C","\u0926"],"207":["C","\u0927"],"208":["X","\u0964"],"209":["M","\u0903"],"210":["X","\u2018"],"211":["X","\u2019"],"212":["V","\u0947"],"213":["C","\u092c"],"214":["C","\u092d"],"215":["C","\u092e"],"216":["C","\u092f"],"217":["C","\u0928"],"218":["C","\u0930"],"219":["H","\u091d\u094d"],"220":["C","\u0932"],"221":["C","\u0933"],"222":["M","\u0951"],"223":["C","\u0935"],"224":["H","\u0936\u094d"],"225":["C","\u0937"],"226":["C","\u0938"],"227":["C","\u0939"],"228":["V","\u0941"],"229":["V","\u0942"],"230":["V","\u093e"],"231":["P",""],"232":["V","\u0940"],"233":["V","\u0941"],"234":["V","\u0942"],"235":["V","\u0943"],"236":["P","\u0902"],"237":["PR",""],"238":["M","\u0954"],"239":["X","\u200b"],"240":["V","\u0947"],"241":["V","\u0948"],"242":["V","\u0945"],"243":["H","\u0928\u094d\u0928\u094d"],"244":["V","\u094b"],"245":["V","\u094c"],"246":["C","\u0939\u0941"],"247":["M","\u094d"],"248":["X","\u0970"],"249":["X","\u093d"],"250":["X","\u0950"],"251":["C","\u0933"],"252":["R",""],"253":["M","\u094d\u0930"],"254":["M","\u094d\u0930"],"255":["H","\u0915\u094d\u0937\u094d"]},"chanakyamath":{"16":["X","\u090d"],"18":["X","\u0911"],"22":["V","\u093e"],"24":["X","\u0914"],"25":["V","\u0949"],"33":["X","!"],"34":["X","\u5350"],"35":["C","\u092a\u094d\u0924"],"36":["X","."],"37":["C","\u0924\u094d\u0928"],"38":["X","\u00d7"],"39":["X","%"],"40":["X","("],"41":["X",")"],"42":["X","*"],"43":["X","+"],"44":["X",","],"45":["X","-"],"46":["X","."],"47":["X","/"],"48":["X","\u0966"],"49":["X","\u0967"],"50":["X","\u0968"],"51":["X","\u0969"],"52":["X","\u096a"],"53":["X","\u096b"],"54":["X","\u096c"],"55":["X","\u096d"],"56":["X","\u096e"],"57":["X","\u096f"],"58":["X",":"],"59":["X",";"],"60":["X","<"],"61":["X","="],"62":["X",">"],"63":["X","?"],"64":["C","\u091e\u094d\u091a"],"65":["M","\u094d\u0930"],"66":["C","\u0915\u094d\u091a"],"67":["C","\u0937\u094d\u091f"],"68":["C","\u0937\u094d\u0920"],"69":["C","\u0936\u094d\u0935"],"70":["C","\u0938\u094d\u0928"],"71":["C","\u0924\u094d\u0930"],"72":["X","\u0965"],"73":["C","\u0922\u094d\u0922"],"74":["C","\u091b\u094d\u0935"],"75":["M","\u094d\u092f"],"76":["C","\u0930\u0941"],"77":["C","\u0930\u0942"],"78":["C","\u0939\u0943"],"79":["C","\u0939\u094d\u0930"],"80":["C","\u0915\u094d\u0915"],"81":["C","\u0915\u094d\u0924"],"82":["C","\u0915\u094d\u0930"],"83":["H","\u0938\u094d"],"84":["C","\u091e\u094d\u091c"],"85":["X","\u2009"],"86":["C","\u0919\u094d\u0915"],"87":["C","\u0919\u094d\u0916"],"88":["C","\u0919\u094d\u0917"],"89":["C","\u0919\u094d\u0918"],"90":["R","\u0902"],"91":["X","["],"92":["C","\u091d\u094d\u0930"],"93":["X","]"],"94":["C","\u091f\u094d\u091f"],"95":["C","\u091f\u094d\u0920"],"96":["C","\u0915\u094d\u0935"],"97":["C","\u0921\u094d\u0921"],"98":["C","\u0921\u094d\u0922"],"99":["H","\u0937\u094d"],"100":["C","\u0938\u094d\u0930"],"101":["C","\u0926\u094d\u0917"],"102":["C","\u0926\u094d\u0918"],"103":["C","\u0926\u094d\u0926"],"104":["C","\u0926\u094d\u0927"],"105":["C","\u0926\u094d\u092c"],"106":["C","\u0926\u094d\u092d"],"107":["C","\u0926\u094d\u092e"],"108":["C","\u0926\u094d\u092f"],"109":["C","\u0926\u094d\u0935"],"110":["C","\u0920\u094d\u0920"],"111":["C","\u0936"],"112":["C","\u0936\u094d\u091a"],"113":["C","\u0939\u094d\u0928"],"114":["H","\u0939\u094d\u092e\u094d"],"115":["C","\u0939\u094d\u092f"],"116":["C","\u0939\u094d\u0932"],"117":["C","\u0939\u094d\u0935"],"118":["X","1"],"119":["X","2"],"120":["X","3"],"121":["X","4"],"122":["X","5"],"123":["X","6"],"124":["X","7"],"125":["X","8"],"126":["X","9"],"127":["M","\u0953"],"128":["H","\u0915\u094d"],"129":["H","\u0916\u094d"],"130":["H","\u0917\u094d"],"131":["H","\u0918\u094d"],"132":["C","\u0932\u094d\u0932"],"133":["H","\u091c\u094d"],"134":["H","\u091e\u094d"],"135":["H","\u0923\u094d"],"136":["H","\u0924\u094d"],"137":["H","\u0925\u094d"],"138":["H","\u0927\u094d"],"139":["H","\u0928\u094d"],"140":["H","\u092a\u094d"],"141":["H","\u092b\u094d"],"142":["H","\u092c\u094d"],"143":["H","\u092d\u094d"],"144":["H","\u092e\u094d"],"145":["H","\u091a\u094d"],"146":["H","\u091c\u094d"],"147":["H","\u091a\u094d\u091a\u094d"],"148":["H","\u091c\u094d\u091c\u094d"],"149":["H","\u091c\u093c\u094d"],"150":["C","\u0919\u094d\u0915\u094d\u0937"],"151":["X","\u2014"],"152":["H","\u0924\u094d\u0930\u094d"],"153":["H","\u091c\u094d\u091e\u094d"],"154":["X","\u2234"],"155":["V","\u0944"],"156":["X","\u2235"],"157":["C","\u0938\u094d\u0924\u094d\u0930"],"158":["H","\u0924\u094d\u0924\u094d"],"159":["H","\u0936\u094d\u0930\u094d"],"160":["M","\u0952"],"161":["M","\u0901"],"162":["M","\u0902"],"163":["V","\u0962"],"164":["X","\u2009"],"165":["X","\u0905"],"166":["C","\u0937\u094d\u091f\u094d\u0935"],"167":["X","\u0907"],"168":["P","\u0902"],"169":["X","\u0909"],"170":["X","\u090a"],"171":["X","\u090b"],"172":["X","\u0960"],"173":["X","\u090c"],"174":["X","0"],"175":["C","\u0916\u094d\u0928"],"176":["X","\u090f"],"177":["H","\u0939\u094d"],"178":["C","\u091f"],"179":["H","\u0936\u094d"],"180":["M","\u0902"],"181":["C","\u0926\u094d\u092c\u094d\u0930"],"182":["C","\u0932"],"183":["C","\u0915"],"184":["M","\u093c"],"185":["C","\u0916"],"186":["C","\u0916\u094d\u0930"],"187":["C","\u0917"],"188":["C","\u0926"],"189":["C","\u0921\u094d\u0921"],"190":["C","\u0919"],"191":["C","\u091a"],"192":["C","\u091b"],"193":["C","\u091c"],"194":["C","\u092a"],"195":["H","\u0935\u094d"],"196":["H","\u092f\u094d"],"197":["C","\u091f"],"198":["C","\u0920"],"199":["C","\u0921"],"200":["C","\u092b"],"201":["C","\u0922"],"203":["H","\u0932\u094d"],"204":["C","\u0924"],"205":["C","\u0925"],"206":["C","\u0926"],"207":["C","\u0927"],"208":["X","\u0964"],"209":["M","\u0903"],"210":["X","\u2018"],"211":["X","\u2019"],"212":["V","\u0947"],"213":["C","\u092c"],"214":["C","\u092d"],"215":["C","\u092e"],"216":["C","\u092f"],"217":["C","\u0928"],"218":["C","\u0930"],"219":["H","\u091d\u094d"],"220":["C","\u0932"],"221":["C","\u0933"],"222":["H","\u0915\u094d\u0937\u094d"],"223":["C","\u0935"],"224":["H","\u0936\u094d"],"225":["C","\u0937"],"226":["C","\u0938"],"227":["C","\u0939"],"228":["V","\u0941"],"229":["V","\u0942"],"230":["V","\u093e"],"231":["P",""],"232":["V","\u0940"],"233":["V","\u0941"],"234":["V","\u0942"],"235":["V","\u0943"],"236":["P","\u0902"],"237":["PR",""],"238":["C","\u0939\u0941"],"239":["C","\u0939\u0942"],"240":["V","\u0947"],"241":["V","\u0948"],"242":["V","\u0945"],"243":["H","\u0928\u094d\u0928\u094d"],"244":["V","\u094b"],"245":["V","\u094c"],"246":["C","\u092a\u094d\u0930"],"247":["M","\u094d"],"248":["X","\u0970"],"249":["X","\u093d"],"250":["X","\u0950"],"251":["C","\u0933"],"252":["R",""],"253":["M","\u094d\u0930"],"254":["M","\u094d\u0930"],"255":["X","\u200b"]},"walkman":{"33":["X","!"],"34":["H","\u0937\u094d"],"35":["C","\u0930\u0941"],"36":["X","+"],"37":["M","\u0903"],"38":["X","-"],"39":["C","\u0937\u094d\u0920"],"40":["X","("],"41":["X",")"],"42":["X","\u2019"],"43":["M","\u093c"],"44":["X","\u090f"],"45":["X","."],"46":["H","\u0923\u094d"],"47":["C","\u0927"],"48":["X","0"],"49":["X","1"],"50":["X","2"],"51":["X","3"],"52":["X","4"],"53":["X","5"],"54":["X","6"],"55":["X","7"],"56":["X","8"],"57":["X","9"],"58":["C","\u0930\u0942"],"59":["C","\u092f"],"60":["C","\u0922"],"61":["H","\u0924\u094d\u0930\u094d"],"62":["C","\u091d"],"63":["H","\u0918\u094d"],"64":["X","/"],"65":["X","\u0964"],"66":["C","\u0920"],"67":["H","\u092c\u094d"],"68":["H","\u0915\u094d"],"69":["H","\u092e\u094d"],"70":["H","\u0925\u094d"],"71":["C","\u0933"],"72":["H","\u092d\u094d"],"73":["H","\u092a\u094d"],"74":["C","\u0936\u094d\u0930"],"75":["C","\u091c\u094d\u091e"],"76":["H","\u0938\u094d"],"77":["C","\u0921"],"78":["C","\u091b"],"79":["H","\u0935\u094d"],"80":["H","\u091a\u094d"],"81":["H","\u092b\u094d"],"82":["H","\u0924\u094d"],"83":["V","\u0948"],"84":["H","\u091c\u094d"],"85":["H","\u0928\u094d"],"86":["C","\u091f"],"87":["V","\u0945"],"88":["H","\u0917\u094d"],"89":["H","\u0932\u094d"],"90":["R",""],"91":["H","\u0916\u094d"],"92":["X","?"],"93":["X",","],"94":["X","\u2018"],"95":["X",";"],"96":["C","\u0937\u094d\u091f"],"97":["M","\u0902"],"98":["X","\u0907"],"99":["C","\u092c"],"100":["C","\u0915"],"101":["C","\u092e"],"102":["P",""],"103":["C","\u0939"],"104":["V","\u0940"],"105":["C","\u092a"],"106":["C","\u0930"],"107":["V","\u093e"],"108":["C","\u0938"],"109":["X","\u0909"],"110":["C","\u0926"],"111":["C","\u0935"],"112":["C","\u091a"],"113":["V","\u0941"],"114":["C","\u0924"],"115":["V","\u0947"],"116":["C","\u091c"],"117":["C","\u0928"],"118":["X","\u0905"],"119":["V","\u0942"],"120":["C","\u0917"],"121":["C","\u0932"],"122":["M","\u094d\u0930"],"123":["H","\u0915\u094d\u0937\u094d"],"124":["C","\u0926\u094d\u092f"],"125":["C","\u0926\u094d\u0935"],"126":["M","\u094d"],"161":["M","\u0901"],"162":["M","\u0903"],"163":["PR",""],"165":["X","\u0950"],"166":["C","\u0919\u094d\u0915\u094d\u0937"],"167":["M","\u0901"],"168":["X","\u0950"],"169":["H","\u0936\u094d"],"170":["M","\u094d\u0930"],"171":["X","\u5350"],"172":["C","\u0937\u094d\u091f\u094d\u0935"],"173":["C","\u0933"],"177":["C","\u0916\u094d\u0930"],"178":["C","\u0919\u094d\u0918"],"179":["C","\u0915\u094d\u0935"],"180":["X","*"],"182":["X","\u201c"],"183":["C","\u0916"],"184":["C","\u0915\u094d\u091a"],"185":["C","\u091b\u094d\u0935"],"186":["H","\u091c\u093c\u094d"],"187":["X","%"],"188":["C","\u0919\u094d\u0916"],"189":["C","\u0926\u094d\u092d"],"191":["X","\u093d"],"193":["V","\u0943"],"194":["M","\u0953"],"195":["C","\u0926\u094d\u092c"],"196":["V","\u0941"],"197":["P","\u0902"],"200":["X",""],"203":["X","\u201d"],"208":["C","\u0916\u094d\u0928"],"225":["X","\u090c"],"227":["M","\u094d\u0930"],"233":["C","\u0915\u094d\u0930"],"234":["C","\u0919\u094d\u0915\u094d\u0937"],"235":["X","]"],"241":["C","\u0926\u094d\u0930"],"249":["X","\u096e"],"250":["C","\u0926\u094d\u092c\u094d\u0930"],"251":["C","\u0939\u094d\u0930"]}};
  const NALANDA = {"32":" ","33":"!","34":"\"","35":"#","36":"$","37":"%","38":"&","39":"'","40":"(","41":")","42":"*","43":"+","44":",","45":"-","46":".","47":"/","48":"0","49":"1","50":"2","51":"3","52":"4","53":"5","54":"6","55":"7","56":"8","57":"9","58":":","59":";","60":"<","61":"=","62":">","63":"?","64":"@","65":"A","66":"B","67":"C","68":"D","69":"E","70":"F","71":"G","72":"H","73":"I","74":"J","75":"K","76":"L","77":"M","78":"N","79":"O","80":"P","81":"Q","82":"R","83":"S","84":"T","85":"U","86":"V","87":"W","88":"X","89":"Y","90":"Z","91":"[","92":"\\","93":"]","94":"^","95":"_","96":"`","97":"a","98":"b","99":"c","100":"d","101":"e","102":"f","103":"g","104":"h","105":"i","106":"j","107":"k","108":"l","109":"m","110":"n","111":"o","112":"p","113":"q","114":"r","115":"s","116":"t","117":"u","118":"v","119":"w","120":"x","121":"y","122":"z","123":"{","124":"|","125":"}","126":"~","127":"\u016b\u0300","128":"\u00c4","129":"\u0100","130":"\u00c7","131":"\u00c9","132":"\u00d1","133":"\u00d6","134":"\u00dc","135":"\u00e1","136":"\u00e0","137":"\u00e2","138":"\u00e4","139":"\u00e3","140":"\u0101","141":"\u00e7","142":"\u00e9","143":"\u00e8","144":"\u00ea","145":"\u2018","146":"\u2019","147":"\u201c","148":"\u201d","149":"\u00b4","150":"\u2013","151":"\u2014","152":"\u00f2","153":"\u00f4","154":"\u00f6","155":"\u0129","156":"\u00fa","157":"\u00f9","158":"\u00fb","159":"\u00fc","160":"\u2020","161":"\u00b0","162":"\u1e6d","163":"\u00a3","164":"\u0323","165":"\u0324","166":"\u1e63","167":"s\u0324","168":"\u1e62","169":"S\u0324","170":"\u1e93","171":"z\u0324","172":"\u1e25","173":"r\u0304\u0301","174":"\u1e95","175":"\u00d8","176":"\u0101\u0303","177":"\u0303","178":"\u012b\u0303","179":"m\u0310","180":"\u0303\u0304","181":"\u00b5","182":"\u012b","183":"\u0103","184":"\u012d","185":"\u0112","186":"\u012a","187":"\u00aa","188":"\u00ba","189":"\u2126","190":"\u1e5b","191":"\u1e5f","192":"\u1e5d","193":"\u1e5b\u0301","194":"\u1e5b\u0300","195":"\u1e43","196":"\u1e47","197":"\u1e41","198":"\u1e45","199":"\u1e49","200":"\u012b\u0301","201":"\u012b\u0300","203":"\u1e40","204":"\u1e44","205":"\u1e48","206":"\u1e0d","207":"\u1e0c","208":"\u2020","209":"\u0306","210":"\u25cf","211":"\u00a7","212":"g\u0331h\u0331","213":"\u00b0","214":"\u00f7","215":"r\u0304","216":"\u00ff","217":"\u0178","218":"\u00ef","219":"\u00f1","220":"\u015b","221":"\u015a","222":"\u0332","223":"\u0332","224":"\u00eb","225":"\u00ed","226":"g\u0331","227":"G\u0331","228":"\u00a4","229":"\u00c2","230":"\u00ca","231":"\u00c1","232":"\u00cb","233":"\u00c8","234":"\u00cd","235":"\u00ce","236":"\u00cf","237":"\u00cc","238":"\u00d3","239":"\u00d4","240":"\u0303","241":"\u00d2","242":"\u00da","243":"\u00db","244":"\u00d9","245":"\u00c0","246":"\u0128","247":"\u016b\u0301","248":"\u00ec","249":"\u00ee","250":"\u00f3","251":"\u0306","252":"\u1e36","253":"\u1e3a","254":"\u0101\u0301","255":"\u0101\u0300"};
  // Nalanda's accents are zero-width glyphs typed BEFORE the letter they sit on (a dead-key layout);
  // each has a lower-case and a capital-height version
  const NAL_PREFIX = { 94: '́', 96: '̆', 124: '̌', 126: '̆', 160: '̃', 161: '̣', 163: '̤', 164: '̣', 165: '̤', 175: '̱', 177: '̃', 180: '̃̄', 181: '̄', 187: '̄', 188: '̌', 189: '́', 209: '̆', 214: '̃', 240: '̃', 251: '̆' };
  const NAL_CAP = { '́': 94, '̆': 209, '̃': 160, '̄': 187, '̌': 188 };
  const NAL_LC = { '́': 189, '̆': 126, '̃': 214, '̄': 181, '̌': 124, '̣': 164, '̤': 165, '̱': 175 };
  Object.assign(NALANDA, NAL_PREFIX);
  NALANDA[202] = ''; // an empty spacer
  const VIRAMA = '्';
  // text from PageMaker arrives decoded as Windows-1252, and from Word symbol fonts as U+F0xx: back to byte codes
  const B2C = [];
  const C2B = new Map();
  try {
    const all = new Uint8Array(256);
    for (let i = 0; i < 256; i++) all[i] = i;
    const dec = new TextDecoder('windows-1252').decode(all);
    for (let i = 0; i < 256; i++) { B2C[i] = dec[i]; C2B.set(dec.charCodeAt(i), i); }
  } catch (e) { for (let i = 0; i < 256; i++) { B2C[i] = String.fromCharCode(i); C2B.set(i, i); } }
  const byteOf = (c) => (c >= 0xf000 && c <= 0xf0ff ? c - 0xf000 : C2B.has(c) ? C2B.get(c) : c < 256 ? c : -1);
  const charOf = (b) => B2C[b] || String.fromCharCode(b);
  const DEV = { chanakya: 1, chanakyamath: 1, walkman: 1 };

  // ------------------------------------------------------------------ fonts
  function encodingForFont(name) {
    const n = String(name || '').replace(/[\s_-]+/g, '').toLowerCase();
    if (!n || /^bv/.test(n)) return null;
    if (/^walkmanchanakya/.test(n)) return 'walkman';
    if (/^chanakyamath/.test(n)) return 'chanakyamath';
    if (/^chanakya/.test(n)) return 'chanakya';
    if (/^nalanda/.test(n)) return 'nalanda';
    return null;
  }
  const style = (n) => ({ bold: /bold|bld|bd|heavy|black/i.test(n), italic: /ital|itl|obl/i.test(n) });
  // the Unicode font that carries the same design
  function unicodeFont(name) {
    const enc = encodingForFont(name);
    if (!enc) return null;
    const n = String(name);
    const st = style(n.replace(/^walkman-chanakya-?|-?901/gi, ''));
    if (enc === 'walkman') return Object.assign({ font: 'BVChitkala Hindi' }, st);
    if (enc === 'chanakyamath') return Object.assign({ font: 'BVChitkala Math' }, st);
    if (enc === 'chanakya') return Object.assign({ font: 'BVChitkala' }, st);
    // Nalanda: Garamond is BV Nanda; the others are Times, Palatino, Helvetica, Baskerville and Bookman cuts
    const k = n.replace(/[\s_-]+/g, '').toLowerCase();
    const font = /tim/.test(k) ? 'Times New Roman' : /pala/.test(k) ? 'Palatino Linotype' : /hel/.test(k) ? 'Arial' : /bas/.test(k) ? 'Baskerville Old Face' : /boo/.test(k) ? 'Bookman Old Style' : 'BVNanda';
    return Object.assign({ font }, style(n.replace(/^nalanda(gara?|tim|pala|hel|bas|book)?/i, '')));
  }
  const label = (enc) => ({ chanakya: 'Chanakya → Unicode Devanagari', chanakyamath: 'Chanakyamath → Unicode Devanagari', walkman: 'Walkman-Chanakya → Unicode Devanagari', nalanda: 'Nalanda → Unicode IAST' }[enc] || '');

  // ------------------------------------------------------------------ legacy -> Unicode
  const PRE_MARKS = /^[़]/; // nukta joins the consonant
  const JOINS = { '़': 1, '्र': 1, '्य': 1 };
  function tokens(s, tab) {
    const out = [];
    for (const ch of s) {
      const c = byteOf(ch.codePointAt(0));
      const e = c >= 0 ? tab[c] : null;
      if (!e) { out.push({ k: 'X', s: ch }); continue; }
      if (e[0] === 'PR') { out.push({ k: 'P', s: '', reph: true }); continue; }
      out.push({ k: e[0], s: e[1] });
    }
    return out;
  }
  // consonant clusters: half forms, then a full consonant (a half form followed by the aa-sign is the full letter),
  // with its nukta, rakar and yaphala
  function clusters(tk) {
    const out = [];
    for (let i = 0; i < tk.length; ) {
      const t = tk[i];
      if (t.k !== 'H' && t.k !== 'C') { out.push(t); i++; continue; }
      let s = '';
      let full = false;
      while (i < tk.length && (tk[i].k === 'H' || tk[i].k === 'C')) {
        const u = tk[i];
        if (u.k === 'C') {
          // a conjunct with an explicit virama that joins the next consonant
          const v = tk[i + 1], n = tk[i + 2];
          if (v && v.k === 'M' && v.s === VIRAMA && n && (n.k === 'C' || n.k === 'H')) { s += u.s + VIRAMA; i += 2; continue; }
          s += u.s; i++; full = true; break;
        }
        if (tk[i + 1] && tk[i + 1].k === 'V' && tk[i + 1].s === 'ा') { s += u.s.slice(0, -1); i += 2; full = true; break; }
        s += u.s; i++;
      }
      if (full) while (i < tk.length && tk[i].k === 'M' && JOINS[tk[i].s]) { s += tk[i].s; i++; }
      out.push({ k: 'S', s, half: !full });
    }
    return out;
  }
  const VOWELS = /^[ऄ-औॠॡॲ-ॷ]/;
  function syllables(tk) {
    const out = [];
    for (let i = 0; i < tk.length; i++) {
      const t = tk[i];
      if (t.k === 'P') {
        // the i-sign is written before the consonant cluster it follows in Unicode
        const n = tk[i + 1];
        if (n && n.k === 'S') {
          out.push({ k: 'S', s: n.s + 'ि' + t.s, reph: !!t.reph });
          i++;
          continue;
        }
        out.push({ k: 'S', s: 'ि' + t.s, reph: !!t.reph });
        continue;
      }
      if (t.k === 'X' && VOWELS.test(t.s)) { out.push({ k: 'S', s: t.s, vowel: true }); continue; }
      if (t.k === 'S') { out.push({ k: 'S', s: t.s, half: t.half }); continue; }
      const last = out[out.length - 1];
      if (last && last.k === 'S' && !last.half && (t.k === 'V' || t.k === 'M')) { last.s += t.s; continue; }
      if (last && last.k === 'S' && t.k === 'R') { last.reph = true; last.s += t.s; continue; }
      out.push(t.k === 'R' ? { k: 'X', s: 'र्' + t.s } : t);
    }
    return out;
  }
  function tidy(syl) {
    let s = syl.s;
    if (syl.reph) {
      if (syl.vowel && s[0] === 'इ') s = 'ई' + s.slice(1); // i + reph is the long ii (Kruti style)
      else s = 'र्' + s;
    }
    // vowel letters built from parts
    s = s.replace(/अा/g, 'आ').replace(/आे/g, 'ओ').replace(/आै/g, 'औ')
      .replace(/अो/g, 'ओ').replace(/अौ/g, 'औ').replace(/एे/g, 'ऐ').replace(/अॉ/g, 'ऑ').replace(/अॅ/g, 'ऑ');
    // o and au signs built from aa + e / ai
    s = s.replace(/ाे/g, 'ो').replace(/ेा/g, 'ो').replace(/ाै/g, 'ौ').replace(/ैा/g, 'ौ').replace(/ाॅ/g, 'ॉ');
    // nukta before vowel signs, anusvara and candrabindu after them
    s = s.replace(/([ा-ौॢॣ]+)़/g, '़$1');
    for (let k = 0; k < 3; k++) s = s.replace(/([ँंः])([ा-ौॢॣ])/g, '$2$1');
    return s;
  }
  function toUnicode(s, enc) {
    if (enc === 'nalanda') {
      let o = '';
      let pending = '';
      for (const ch of s) {
        const c = byteOf(ch.codePointAt(0));
        if (NAL_PREFIX[c]) { pending += NAL_PREFIX[c]; continue; }
        o += (c >= 0 && NALANDA[c] != null ? NALANDA[c] : ch) + pending;
        pending = '';
      }
      return (o + pending).normalize('NFC');
    }
    const tab = T[enc];
    if (!tab) return s;
    return syllables(clusters(tokens(s, tab))).map((t) => (t.k === 'S' ? tidy(t) : t.s)).join('');
  }
  // a run that starts with these belongs to the syllable at the end of the run before
  function continues(enc, ch) {
    const tab = T[enc];
    if (!tab) return false;
    const e = tab[byteOf(ch.charCodeAt(0))];
    return !!e && (e[0] === 'V' || e[0] === 'R' || (e[0] === 'M' && e[1] !== 'ः'));
  }

  // ------------------------------------------------------------------ Unicode -> legacy (for saving back)
  const REV = {};
  function rev(enc) {
    if (REV[enc]) return REV[enc];
    const r = { C: new Map(), H: new Map(), V: new Map(), M: new Map(), X: new Map(), P: null, PA: null, R: null, RA: null, PR: null, maxC: 1 };
    const tab = T[enc];
    for (const k of Object.keys(tab).map(Number).sort((a, b) => (a < 32) - (b < 32) || a - b)) {
      const [kind, s] = tab[k];
      const ch = charOf(k);
      if (kind === 'P') { if (s === '' && !r.P) r.P = ch; else if (s && !r.PA) r.PA = ch; continue; }
      if (kind === 'PR') { if (!r.PR) r.PR = ch; continue; }
      if (kind === 'R') { if (s === '' && !r.R) r.R = ch; else if (s && !r.RA) r.RA = ch; continue; }
      const m = r[kind];
      if (m && s && !m.has(s)) { m.set(s, ch); if (kind === 'C' || kind === 'H') r.maxC = Math.max(r.maxC, [...s].length); }
    }
    // a full consonant with no glyph of its own is its half form plus the aa-sign
    return (REV[enc] = r);
  }
  const CONS = '[क-हक़-य़ळ]़?';
  const SYL = new RegExp(`((?:${CONS}्\u200d?)*${CONS})(्(?![क-ह]))?([ा-ौॢॣ]*)([ँ-ः]*)`, 'g');
  function clusterToLegacy(r, s) {
    // greedy: longest conjunct the font has, else half forms
    let out = '';
    const cs = [...s];
    let i = 0;
    while (i < cs.length) {
      let hit = null;
      for (let n = Math.min(r.maxC, cs.length - i); n >= 1 && !hit; n--) {
        const part = cs.slice(i, i + n).join('');
        const rest = i + n === cs.length;
        if (rest && r.C.has(part)) hit = [r.C.get(part), n];
        else if (!rest && cs[i + n] === VIRAMA && r.H.has(part + VIRAMA)) hit = [r.H.get(part + VIRAMA), n + 1];
        else if (rest && r.H.has(part + VIRAMA) && r.V.has('ा')) hit = [r.H.get(part + VIRAMA) + r.V.get('ा'), n];
        else if (!rest && cs[i + n] === VIRAMA && r.C.has(part) && r.M.has(VIRAMA)) hit = [r.C.get(part) + r.M.get(VIRAMA), n + 1];
      }
      if (!hit) { const c = cs[i]; hit = [r.X.get(c) || r.M.get(c) || c, 1]; }
      // rakar and yaphala after a full consonant
      out += hit[0];
      i += hit[1];
      if (i < cs.length - 1 && cs[i] === VIRAMA && (cs[i + 1] === 'र' || cs[i + 1] === 'य') && i + 2 === cs.length && r.M.has(VIRAMA + cs[i + 1])) {
        out += r.M.get(VIRAMA + cs[i + 1]);
        i += 2;
      }
    }
    return out;
  }
  function fromUnicode(s, enc) {
    if (enc === 'nalanda') {
      const back = {};
      for (const [k, v] of Object.entries(NALANDA)) if (back[v] == null && !NAL_PREFIX[k] && v) back[v] = charOf(+k);
      let o = '';
      const t = s.normalize('NFC');
      for (let i = 0; i < t.length; ) {
        let hit = null;
        for (let n = 3; n >= 1 && !hit; n--) { const p = t.slice(i, i + n); if (back[p] != null) hit = [back[p], n]; }
        if (!hit) {
          // a letter with accents the font has no single glyph for: the accents first, then the letter
          const d = t[i].normalize('NFD');
          const base = d[0], marks = [...d.slice(1)];
          const cap = base !== base.toLowerCase() || /[bdfhklt]/.test(base);
          const pre = marks.map((m) => { const k = (cap && NAL_CAP[m]) || NAL_LC[m]; return k ? charOf(k) : m; }).join('');
          hit = [marks.length ? pre + (back[base] != null ? back[base] : base) : back[base] != null ? back[base] : t[i], 1];
        }
        o += hit[0];
        i += hit[1];
      }
      return o;
    }
    if (!T[enc]) return s;
    const r = rev(enc);
    const t = s.replace(/ई/g, '\ue000'); // long ii: i + reph
    return t.replace(SYL, (all, cl, vir, signs, marks, off) => {
      let reph = false;
      let c = cl;
      if (c.startsWith('र्') && c.length > 2) { reph = true; c = c.slice(2); }
      let pre = '';
      let post = '';
      let sg = signs;
      if (sg.includes('ि')) { sg = sg.replace('ि', ''); pre = reph && r.PR ? r.PR : r.P || ''; if (reph && r.PR) reph = false; }
      let mk = marks;
      if (pre === r.P && mk === 'ं' && r.PA && !sg) { pre = r.PA; mk = ''; }
      for (const ch of sg) post += r.V.get(ch) || (ch === 'ो' ? (r.V.get('ा') || '') + (r.V.get('े') || '') : ch === 'ौ' ? (r.V.get('ा') || '') + (r.V.get('ै') || '') : ch);
      if (vir) post += r.M.get(VIRAMA) || '';
      let tail = '';
      if (reph) tail = mk === 'ं' && r.RA ? ((mk = ''), r.RA) : r.R || '';
      for (const ch of mk) post += r.M.get(ch) || ch;
      return pre + clusterToLegacy(r, c) + post + tail;
    }).replace(/[ऀ-ॿ]/g, (ch) => {
      if (ch === 'र') return r.C.get(ch) || ch;
      const x = r.X.get(ch) || r.M.get(ch) || r.V.get(ch);
      if (x) return x;
      // vowel letters built from parts
      const parts = { 'आ': 'अा', 'ओ': 'अो', 'औ': 'अौ', 'ऐ': 'एे' }[ch];
      return parts ? [...parts].map((p) => r.X.get(p) || r.V.get(p) || (p === 'ो' ? (r.V.get('ा') || '') + (r.V.get('े') || '') : p === 'ौ' ? (r.V.get('ा') || '') + (r.V.get('ै') || '') : p)).join('') : ch;
    }).replace(/\ue000/g, () => (r.X.get('इ') || '') + (r.R || ''));
  }

  BV.DevLegacy = { encodingForFont, unicodeFont, toUnicode, fromUnicode, continues, label, isDev: (enc) => !!DEV[enc] || enc === 'nalanda', tables: T };
})();

/* BV Mudrana: legacy (ASCII-font) Kannada to Unicode.
   Nudi stores a syllable as visual pieces: base shape, talakattu, vowel-sign parts,
   subscript ottus (after the vowel!), and the repha (arkavattu) last.
   This converter rebuilds each syllable in Unicode order.  Written for BV Mudrana;
   glyph codes cross-checked against the public Nudi layout. */
(function () {
  const BV = (typeof window !== 'undefined' ? (window.BV = window.BV || {}) : (globalThis.BV = globalThis.BV || {}));
  const H = '್'; // halant (virama)

  // base shapes that need a talakattu (À) or a vowel sign to complete them
  const BASE = {
    P: 'ಕ', S: 'ಖ', U: 'ಗ', W: 'ಘ', Z: 'ಚ', b: 'ಛ', e: 'ಜ', m: 'ಟ', o: 'ಠ', q: 'ಡ', qs: 'ಢ', u: 'ಣ', v: 'ತ', x: 'ಥ',
    z: 'ದ', zs: 'ಧ', '£': 'ನ', '¥': 'ಪ', '¥s': 'ಫ', '¨': 'ಬ', '¨s': 'ಭ', 'ª': 'ವ', g: 'ರ', '¯': 'ಲ', '±': 'ಶ',
    'µ': 'ಷ', '¸': 'ಸ', 'º': 'ಹ', '¼': 'ಳ', Ai: 'ಯ', '0i': 'ಯ',
  };
  // complete consonant shapes (inherent "a")
  const FULL = { R: 'ಖ', d: 'ಜ', l: 'ಟ', t: 'ಣ', '§': 'ಬ', '®': 'ಲ', k: 'ಞ', Y: 'ಙ' };
  // consonant + i
  const WITH_I = {
    Q: 'ಕ', T: 'ಖ', V: 'ಗ', X: 'ಘ', a: 'ಚ', c: 'ಛ', f: 'ಜ', n: 'ಟ', p: 'ಠ', r: 'ಡ', 'rü': 'ಢ', 'tÂ': 'ಣ', w: 'ತ', y: 'ಥ',
    '¢': 'ದ', '¢ü': 'ಧ', '¤': 'ನ', '¦': 'ಪ', '¦ü': 'ಫ', '©': 'ಬ', '©ü': 'ಭ', '«': 'ವ', '¬': 'ಯ', j: 'ರ', '°': 'ಲ',
    '²': 'ಶ', '¶': 'ಷ', '¹': 'ಸ', '»': 'ಹ', '½': 'ಳ', 'jh': 'ಝ',
  };
  const VOWELS = { C: 'ಅ', D: 'ಆ', E: 'ಇ', F: 'ಈ', G: 'ಉ', H: 'ಊ', 'IÄ': 'ಋ', J: 'ಎ', K: 'ಏ', L: 'ಐ', M: 'ಒ', N: 'ಓ', O: 'ಔ' };
  const VATTU = {
    'Ì': 'ಕ', 'Í': 'ಖ', 'Î': 'ಗ', 'Ï': 'ಘ', 'Õ': 'ಞ', 'Ñ': 'ಚ', 'Ò': 'ಛ', 'Ó': 'ಜ', 'Ô': 'ಝ', 'Ö': 'ಟ', '×': 'ಠ', 'Ø': 'ಡ',
    'Ù': 'ಢ', 'Ú': 'ಣ', 'Û': 'ತ', 'Ü': 'ಥ', 'Ý': 'ದ', 'Þ': 'ಧ', 'ß': 'ನ', 'à': 'ಪ', 'á': 'ಫ', 'â': 'ಬ', 'ã': 'ಭ', 'ä': 'ಮ',
    'å': 'ಯ', 'æ': 'ರ', 'ç': 'ರ', 'è': 'ಲ', 'é': 'ವ', 'ê': 'ಶ', 'ë': 'ಷ', 'ì': 'ಸ', 'í': 'ಹ', 'î': 'ಳ',
  };
  const IGNORE = new Set(['ö', '÷', 'ø', 'ù']);
  // longest keys first for greedy matching
  const KEYS = [...new Set([...Object.keys(BASE), ...Object.keys(FULL), ...Object.keys(WITH_I), ...Object.keys(VOWELS), 'gÀh', 'gÉh'])].sort((a, b) => b.length - a.length);

  function nudiToUnicode(input) {
    const out = [];
    let syl = null; // {repha, cons:[], vowel, tail:boolean (ma/ya tail pending), mods}
    const flush = () => {
      if (!syl) return;
      let s = '';
      if (syl.vowelOnly) s = syl.vowelOnly;
      else {
        if (syl.repha) s += 'ರ' + H;
        s += syl.cons.join(H);
        if (syl.halant) s += H;
        else if (syl.vowel) s += syl.vowel;
      }
      s += syl.mods;
      out.push(s);
      syl = null;
    };
    const start = (cons, vowel, opts = {}) => {
      // a lone halant consonant followed by another consonant keeps its visible halant
      if (syl && syl.halant && !syl.vowelOnly) { flush(); out.push('\u200C'); }
      flush();
      syl = { repha: false, cons: [cons], vowel, halant: false, mods: '', tail: !!opts.tail, base: opts.base };
    };
    let i = 0;
    const str = input;
    while (i < str.length) {
      const ch = str[i];
      if (IGNORE.has(ch)) { i++; continue; }
      // ya: "Ai"   (plain "A" is anusvara)
      let key = null;
      for (const k of KEYS) if (str.startsWith(k, i)) { key = k; break; }
      if (key === 'gÀh' || key === 'gÉh') {
        // jha: ರ-base + À/É + h + tail
        start('ಝ', key === 'gÀh' ? '' : 'ೆ', { tail: true, base: 'jha' });
        i += key.length;
        continue;
      }
      if (key && BASE[key] !== undefined) {
        start(BASE[key], null, { tail: key === 'ª' || key === 'Ai' || key === '0i', base: key });
        i += key.length;
        continue;
      }
      if (key && FULL[key] !== undefined) { start(FULL[key], ''); i += key.length; continue; }
      if (key && WITH_I[key] !== undefined) {
        start(WITH_I[key], 'ಿ', { tail: key === '«' || key === '¬' || key === 'jh', base: key });
        i += key.length;
        continue;
      }
      if (key && VOWELS[key] !== undefined) { flush(); syl = { vowelOnly: VOWELS[key], mods: '' }; i += key.length; continue; }

      // marks that modify the current syllable
      if (syl && !syl.vowelOnly) {
        let used = true;
        switch (ch) {
          case 'À': if (syl.vowel === null) syl.vowel = ''; break; // talakattu
          case 'Á': syl.vowel = 'ಾ'; break;
          case 'É': syl.vowel = 'ೆ'; break;
          case 'Ë': syl.vowel = 'ೌ'; break;
          case 'ï': syl.halant = true; break;
          case 'Â': break; // part of ಣಿ, already handled
          case 'h': break; // jha piece
          case 'i':
          case 'Ä':
            if (syl.tail) {
              // ma / ya tail, not a vowel
              syl.tail = false;
              if (syl.base === 'ª' || syl.base === '«') syl.cons[0] = 'ಮ';
              if (syl.vowel === null) syl.vowel = '';
            } else if (ch === 'Ä') syl.vowel = syl.vowel === 'ೆ' ? 'ೆ' : 'ು';
            else used = false;
            break;
          case 'Å': syl.vowel = 'ು'; break;
          case 'Æ':
            if (syl.base === 'ª' && syl.tail && syl.vowel === 'ೆ') { syl.cons[0] = 'ಮ'; syl.tail = false; }
            syl.vowel = syl.vowel === 'ೆ' ? 'ೊ' : 'ೂ';
            break;
          case 'Ç': syl.vowel = syl.vowel === 'ೆ' ? 'ೊ' : 'ೂ'; break;
          case 'È': syl.vowel = 'ೃ'; break;
          case 'Ã': syl.vowel = syl.vowel === 'ಿ' ? 'ೀ' : syl.vowel === 'ೆ' ? 'ೇ' : syl.vowel === 'ೊ' ? 'ೋ' : syl.vowel === 'ೃ' ? 'ೄ' : syl.vowel; break;
          case 'Ê': syl.vowel = 'ೈ'; break;
          case 'ð': syl.repha = true; break;
          case 'õ': // ಙ joiner piece (as in ಶಾರ್ಙ್ಗ): swallow a following ಾ shape
            if (str[i + 1] === 'Á') i++;
            if (syl.vowel === null) syl.vowel = '';
            break;
          case 'ü': // mahaprana mark on i-forms (ಧಿ ಫಿ ಭಿ ಢಿ handled in table); also ಘ variants
            break;
          case 's': {
            const asp = { 'ದ': 'ಧ', 'ಪ': 'ಫ', 'ಬ': 'ಭ', 'ಡ': 'ಢ' };
            if (asp[syl.cons[0]] && syl.cons.length === 1) syl.cons[0] = asp[syl.cons[0]];
            else used = false;
            break;
          }
          default:
            if (VATTU[ch]) { syl.cons.push(VATTU[ch]); if (syl.vowel === null) syl.vowel = ''; }
            else used = false;
        }
        if (used) { i++; continue; }
      }
      if (ch === 'A') { if (syl) syl.mods += 'ಂ'; else out.push('ಂ'); i++; continue; }
      if (ch === 'B') { if (syl) syl.mods += 'ಃ'; else out.push('ಃ'); i++; continue; }
      if (ch === 'ð' && !syl) { i++; continue; }
      if (VATTU[ch] && !syl) { out.push(H + VATTU[ch]); i++; continue; }
      // anything else: punctuation, digits, spaces
      flush();
      if (str.startsWith('||', i)) { out.push('॥'); i += 2; continue; }
      if (ch === '|') { out.push('।'); i++; continue; }
      out.push(ch);
      i++;
    }
    flush();
    return out.join('').normalize('NFC');
  }

  // Which legacy encoding does a font name use?
  function encodingForFont(name) {
    const n = (name || '').toLowerCase();
    if (isPrajaNudi(name)) return 'nudi'; // Praja01-Praja08: the Praja design in the Nudi layout
    if (isPrajaFont(name)) return 'praja'; // Prajavani's Praja fonts have their own layout
    if (/^nudi\b/.test(n) || /^nudi/.test(n)) return 'nudi';
    if (/^brh\s*(kannada|kan)/.test(n) || /^baraha\s*kan/.test(n)) return 'nudi'; // Baraha Kannada shares the Nudi layout
    if (/^brh\s*devanagari|^baraha\s*dev/.test(n)) return 'brh-deva';
    // Chanakya, Chanakyamath, Walkman-Chanakya (Devanagari) and Nalanda (IAST)
    if (BV.DevLegacy) return BV.DevLegacy.encodingForFont(name);
    return null;
  }

  // All conversions use the Brahmavidya converter engine (bvkannada.js) when it is loaded;
  // the older built-in routine stays only as a fallback.
  const CUSTOM = [{ from: 'YõÁÎð', to: 'ರ್ಙ್ಗ' }];
  const toUnicode0 = (s) => {
    const K = BV.BVKannada || (typeof require !== 'undefined' ? require('./bvkannada.js') : null);
    return K ? K.toUnicode(s, { custom: CUSTOM }).text : nudiToUnicode(s);
  };
  // In Nudi, “ï” is a visible halant (ಟ್ in ಷಟ್\u200Cಶ್ರುತಿ). The converter joins the next consonant into a conjunct
  // (ಟ್ಶ), so the text is converted in pieces at each visible halant and a ZWNJ keeps the halant visible.
  const toUnicode = (s) => {
    if (s.indexOf('\u00EF') < 0) return toUnicode0(s);
    const parts = s.split(/(?<=\u00EF)(?=[^\s\u00EF])/);
    let out = '';
    for (const part of parts) {
      const u = toUnicode0(part);
      if (/\u0CCD$/.test(out) && /^[\u0C95-\u0CB9\u0CDE]/.test(u)) out += '\u200C';
      out += u;
    }
    return out;
  };
  const toAscii = (s) => {
    const K = BV.BVKannada || (typeof require !== 'undefined' ? require('./bvkannada.js') : null);
    return K.toAscii(s).text;
  };
  // ---- Praja (Prajavani) fonts: the Brahmavidya Praja Unicode converter (praja.js)
  const PJ = () => BV.Praja2Unicode || (typeof window !== 'undefined' && window.Praja2Unicode) || (typeof require !== 'undefined' ? require('./praja.js') : null);
  // Praja01-Praja08 (Brahmavidya Praja Unicode kit): Praja letters on the Nudi ASCII layout
  const PRAJA_NUDI = { 1: ['Praja Unicode Light', false, false], 2: ['Praja Unicode Light', false, true], 3: ['Praja Unicode', false, false], 4: ['Praja Unicode', false, true],
    5: ['Praja Unicode Demi', false, false], 6: ['Praja Unicode Demi', false, true], 7: ['Praja Unicode', true, false], 8: ['Praja Unicode', true, true] };
  const prajaNudiNum = (name) => { const m = /^praja\s*0?([1-8])$/i.exec(String(name || '').trim()); return m ? +m[1] : 0; };
  function isPrajaNudi(name) { return prajaNudiNum(name) > 0; }
  // the Praja Unicode face that matches a Praja01-08 font, or null
  function prajaNudiUnicodeFont(name) { const v = PRAJA_NUDI[prajaNudiNum(name)]; return v ? { font: v[0], bold: v[1], italic: v[2] } : null; }
  function isPrajaFont(name) {
    const n = String(name || '').trim();
    if (!n || /unicode/i.test(n) || isPrajaNudi(n)) return false;
    const P = PJ();
    return (P && P.isPrajaFont(n)) || /^praja([\s_-]|$)/i.test(n);
  }
  // 'Praja_Demi Italic' -> { font: 'Praja Unicode Demi', bold: false, italic: true }
  function prajaUnicodeFont(name) {
    const n = String(name || '');
    const P = PJ();
    const font = (P && P.unicodeFontFor(n)) || (/demi/i.test(n) ? 'Praja Unicode Demi' : /light|lit/i.test(n) ? 'Praja Unicode Light' : 'Praja Unicode');
    return { font, bold: /bold|bld/i.test(n), italic: /ital|itl/i.test(n) };
  }
  const isDev = (enc) => !!(BV.DevLegacy && BV.DevLegacy.isDev(enc));
  const prajaToUnicode = (s) => { const P = PJ(); return P ? P.prajaToUnicode(s) : s; };
  const unicodeToPraja = (s) => { const P = PJ(); return P ? P.unicodeToPraja(s) : s; };
  const prajaContinues = (ch) => { const P = PJ(); return !!(P && P.isContinuation(ch)); };
  BV.Legacy = { nudiToUnicode: toUnicode, oldNudiToUnicode: nudiToUnicode, unicodeToNudi: toAscii, encodingForFont,
    isPrajaFont, prajaUnicodeFont, prajaToUnicode, unicodeToPraja, prajaContinues, isPrajaNudi, prajaNudiUnicodeFont,
    // any legacy Kannada encoding to Unicode
    toUnicode: (s, enc) => (enc === 'praja' ? prajaToUnicode(s) : isDev(enc) ? BV.DevLegacy.toUnicode(s, enc) : toUnicode(s)),
    // Unicode back to a legacy encoding (for saving to PageMaker)
    fromUnicode: (s, enc) => (enc === 'praja' ? unicodeToPraja(s) : isDev(enc) ? BV.DevLegacy.fromUnicode(s, enc) : toAscii(s)),
    // the Unicode font with the same design as a legacy font, if there is one
    unicodeFontFor: (name) => { const enc = encodingForFont(name); return enc === 'praja' ? prajaUnicodeFont(name) : enc === 'nudi' ? prajaNudiUnicodeFont(name) : isDev(enc) ? BV.DevLegacy.unicodeFont(name) : null; },
    isDev,
    convertible: (enc) => enc === 'nudi' || enc === 'praja' || isDev(enc),
    label: (enc) => (enc === 'praja' ? 'Praja → Unicode' : enc === 'nudi' ? 'Nudi → Unicode' : isDev(enc) ? BV.DevLegacy.label(enc) : ''),
    // legacy tags kept on converted runs: nudi:, praja:, chanakya:, nalanda: ... and their -ascii: forms
    LEGACY_TAG: /^(nudi|praja|chanakya|chanakyamath|walkman|nalanda)(-ascii)?:/ };
  if (typeof module !== 'undefined') module.exports = BV.Legacy;
})();
