/* Brahmavidya Kannada Tools: converter and page behaviour.
   Ported from the WordPress page (where it had to be base64-wrapped). Runs in the browser.
   Only the "Aksharamukha" transliteration panel sends text to an outside service. */
(function(){if(new URLSearchParams(window.location.search).get("word-addin")==="1")document.documentElement.classList.add("bv-word-addin");})();


(function(){
// ═══════════════════════════════════════════════════════════
// CONVERSION ENGINE
// Longest-match ASCII↔Unicode converter for Nudi/Baraha Kannada
// ═══════════════════════════════════════════════════════════
const KANNADA = "\u0C80-\u0CFF";

/** Longest-match table for the Nudi/Baraha ANSI family. */
const mapping = new Map();
const add = (legacy, unicode) => legacy && mapping.set(legacy, unicode);

[
  ["C", "ಅ"], [",,", "ಽ"], ["D", "ಆ"], ["E", "ಇ"], ["F", "ಈ"], ["G", "ಉ"],
  ["H", "ಊ"], ["IÄ", "ಋ"], ["IÆ2", "ೠ"], ["IÆA", "ೠಂ"], ["®ñA", "ಲೄಂ"], ["J", "ಎ"], ["K", "ಏ"],
  ["L", "ಐ"], ["M", "ಒ"], ["N", "ಓ"], ["O", "ಔ"], ["A", "ಂ"], ["B", "ಃ"],
].forEach(([a, u]) => add(a, u));

// These are context fragments in Nudi/Baraha output. A terminal z is the
// inherent-vowel form of ದ when the font omits its usual À suffix; a lone i is
// a positioning/control component and must never leak into Unicode output.
add("z", "ದ");
add("i", "");
// Alternate Nudi/Baraha-family single-byte forms seen in PDF extraction.
add("e", "ಜ");
add("¨", "ಬ");

// dead, base, aa, i, ii, u, uu, vocalic-r, e, ee, ai, o, oo, au
const series = [
  ["ಕ","Pï","PÀ","PÁ","Q","QÃ","PÀÄ","PÀÆ","PÀÈ","PÉ","PÉÃ","PÉÊ","PÉÆ","PÉÆÃ","PË"],
  ["ಖ","Sï","R","SÁ","T","TÃ","RÄ","RÆ","RÈ","SÉ","SÉÃ","SÉÊ","SÉÆ","SÉÆÃ","SË"],
  ["ಗ","Uï","UÀ","UÁ","V","VÃ","UÀÄ","UÀÆ","UÀÈ","UÉ","UÉÃ","UÉÊ","UÉÆ","UÉÆÃ","UË"],
  ["ಘ","Wï","WÀ","WÁ","X","XÃ","WÀÄ","WÀÆ","WÀÈ","WÉ","WÉÃ","WÉÊ","WÉÆ","WÉÆÃ","WË"],
  ["ಙ","Yï","Y","YÁ","YÂ","YÂÃ","YÄ","YÆ","YÈ","YÉ","YÉÃ","YÉÊ","YÉÆ","YÉÆÃ","YË"],
  ["ಚ","Zï","ZÀ","ZÁ","a","aÃ","ZÀÄ","ZÀÆ","ZÀÈ","ZÉ","ZÉÃ","ZÉÊ","ZÉÆ","ZÉÆÃ","ZË"],
  ["ಛ","bï","bÀ","bÁ","c","cÃ","bÀÄ","bÀÆ","bÀÈ","bÉ","bÉÃ","bÉÊ","bÉÆ","bÉÆÃ","bË"],
  ["ಜ","dï","d","eÁ","f","fÃ","dÄ","dÆ","dÈ","eÉ","eÉÃ","eÉÊ","eÉÆ","eÉÆÃ","eË"],
  ["ಝ","gÀhÄï","gÀhÄ","gÀhiÁ","jhÄ","jhÄÃ","gÀhÄÄ","gÀhÄÆ","gÀhÄÈ","gÉhÄ","gÉhÄÃ","gÉhÄÊ","gÉhÆ","gÉhÆÃ","gÀhiË"],
  ["ಞ","kï","k","kÁ","kÂ","kÂÃ","kÄ","kÆ","kÈ","kÉ","kÉÃ","kÉÊ","kÉÆ","kÉÆÃ","kË"],
  ["ಟ","mï","l","mÁ","n","nÃ","lÄ","lÆ","lÈ","mÉ","mÉÃ","mÉÊ","mÉÆ","mÉÆÃ","mË"],
  ["ಠ","oï","oÀ","oÁ","p","pÃ","oÀÄ","oÀÆ","oÀÈ","oÉ","oÉÃ","oÉÊ","oÉÆ","oÉÆÃ","oË"],
  ["ಡ","qï","qÀ","qÁ","r","rÃ","qÀÄ","qÀÆ","qÀÈ","qÉ","qÉÃ","qÉÊ","qÉÆ","qÉÆÃ","qË"],
  ["ಢ","qsï","qsÀ","qsÁ","rü","rüÃ","qsÀÄ","qsÀÆ","qsÀÈ","qsÉ","qsÉÃ","qsÉÊ","qsÉÆ","qsÉÆÃ","qsË"],
  ["ಣ","uï","t","uÁ","tÂ","tÂÃ","tÄ","tÆ","tÈ","uÉ","uÉÃ","uÉÊ","uÉÆ","uÉÆÃ","uË"],
  ["ತ","vï","vÀ","vÁ","w","wÃ","vÀÄ","vÀÆ","vÀÈ","vÉ","vÉÃ","vÉÊ","vÉÆ","vÉÆÃ","vË"],
  ["ಥ","xï","xÀ","xÁ","y","yÃ","xÀÄ","xÀÆ","xÀÈ","xÉ","xÉÃ","xÉÊ","xÉÆ","xÉÆÃ","xË"],
  ["ದ","zï","zÀ","zÁ","¢","¢Ã","zÀÄ","zÀÆ","zÀÈ","zÉ","zÉÃ","zÉÊ","zÉÆ","zÉÆÃ","zË"],
  ["ಧ","zsï","zsÀ","zsÁ","¢ü","¢üÃ","zsÀÄ","zsÀÆ","zsÀÈ","zsÉ","zsÉÃ","zsÉÊ","zsÉÆ","zsÉÆÃ","zsË"],
  ["ನ","£ï","£À","£Á","¤","¤Ã","£ÀÄ","£ÀÆ","£ÀÈ","£É","£ÉÃ","£ÉÊ","£ÉÆ","£ÉÆÃ","£Ë"],
  ["ಪ","¥ï","¥À","¥Á","¦","¦Ã","¥ÀÄ","¥ÀÆ","¥ÀÈ","¥É","¥ÉÃ","¥ÉÊ","¥ÉÆ","¥ÉÆÃ","¥Ë"],
  ["ಫ","¥sï","¥sÀ","¥sÁ","¦ü","¦üÃ","¥sÀÄ","¥sÀÆ","¥sÀÈ","¥sÉ","¥sÉÃ","¥sÉÊ","¥sÉÆ","¥sÉÆÃ","¥sË"],
  ["ಬ","§ï","§","¨Á","©","©Ã","§Ä","§Æ","§È","¨É","¨ÉÃ","¨ÉÊ","¨ÉÆ","¨ÉÆÃ","¨Ë"],
  ["ಭ","¨sï","¨sÀ","¨sÁ","©ü","©üÃ","¨sÀÄ","¨sÀÆ","¨sÀÈ","¨sÉ","¨sÉÃ","¨sÉÊ","¨sÉÆ","¨sÉÆÃ","¨sË"],
  ["ಮ","ªÀÄï","ªÀÄ","ªÀiÁ","«Ä","«ÄÃ","ªÀÄÄ","ªÀÄÆ","ªÀÄÈ","ªÉÄ","ªÉÄÃ","ªÉÄÊ","ªÉÆ","ªÉÆÃ","ªÀiË"],
  ["ಯ","AiÀÄï","AiÀÄ","AiÀiÁ","¬Ä","¬ÄÃ","AiÀÄÄ","AiÀÄÆ","AiÀÄÈ","AiÉÀÄ","AiÉÄÃ","AiÉÀÄÊ","AiÉÆ","AiÉÆÃ","AiÀiË"],
  ["ರ","gï","gÀ","gÁ","j","jÃ","gÀÄ","gÀÆ","gÀÈ","gÉ","gÉÃ","gÉÊ","gÉÆ","gÉÆÃ","gË"],
  ["ಲ","®ï","®","¯Á","°","°Ã","®Ä","®Æ","®È","¯É","¯ÉÃ","¯ÉÊ","¯ÉÆ","¯ÉÆÃ","¯Ë"],
  ["ವ","ªï","ªÀ","ªÁ","«","«Ã","ªÀÅ","ªÀÇ","ªÀÈ","ªÉ","ªÉÃ","ªÉÊ","ªÉÇ","ªÉÇÃ","ªË"],
  ["ಶ","±ï","±À","±Á","²","²Ã","±ÀÄ","±ÀÆ","±ÀÈ","±É","±ÉÃ","±ÉÊ","±ÉÆ","±ÉÆÃ","±Ë"],
  ["ಷ","µï","µÀ","µÁ","¶","¶Ã","µÀÄ","µÀÆ","µÀÈ","µÉ","µÉÃ","µÉÊ","µÉÆ","µÉÆÃ","µË"],
  ["ಸ","¸ï","¸À","¸Á","¹","¹Ã","¸ÀÄ","¸ÀÆ","¸ÀÈ","¸É","¸ÉÃ","¸ÉÊ","¸ÉÆ","¸ÉÆÃ","¸Ë"],
  ["ಹ","ºï","ºÀ","ºÁ","»","»Ã","ºÀÄ","ºÀÆ","ºÀÈ","ºÉ","ºÉÃ","ºÉÊ","ºÉÆ","ºÉÆÃ","ºË"],
  ["ಳ","¼ï","¼À","¼Á","½","½Ã","¼ÀÄ","¼ÀÆ","¼ÀÈ","¼É","¼ÉÃ","¼ÉÊ","¼ÉÆ","¼ÉÆÃ","¼Ë"],
];

const vowelSigns = ["್", "", "ಾ", "ಿ", "ೀ", "ು", "ೂ", "ೃ", "ೆ", "ೇ", "ೈ", "ೊ", "ೋ", "ೌ"];
for (const row of series) {
  const [letter, ...forms] = row;
  forms.forEach((form, index) => add(form, letter + vowelSigns[index]));
  add(forms[1] + "A", letter + "ಂ");
  add(forms[1] + "B", letter + "ಃ");
}

const subjoined = {
  "Ì":"ಕ","Í":"ಖ","Î":"ಗ","Ï":"ಘ","Ð":"ಙ","Ñ":"ಚ","Ò":"ಛ","Ó":"ಜ","Ô":"ಝ","Õ":"ಞ",
  "Ö":"ಟ","×":"ಠ","Ø":"ಡ","Ù":"ಢ","Ú":"ಣ","Û":"ತ","Ü":"ಥ","Ý":"ದ","Þ":"ಧ","ß":"ನ",
  "à":"ಪ","á":"ಫ","â":"ಬ","ã":"ಭ","ä":"ಮ","å":"ಯ","æ":"ರ","è":"ಲ","é":"ವ","ê":"ಶ",
  "ë":"ಷ","ì":"ಸ","í":"ಹ","î":"ಳ","¿":"ೞ",
};
Object.entries(subjoined).forEach(([a, u]) => add(a, "್" + u));

// NUDI01 uses a dedicated final-ra form for the three-consonant ಸ್ತ್ರ family.
// The final ç positions the ottakshara correctly; no visible prefix is required.
const canonicalLegacyClusters = new Map();
// NUDI01 requires this exact keypress order for ತ್ಯೇ. The leading marker is
// part of its visual cluster form, not a separate Kannada ರ.
canonicalLegacyClusters.set("ತ್ಯೇ", "ævÉåÃ");
add("ævÉåÃ", "ತ್ಯೇ");
// Avoid ambiguous NUDI byte sequences in repha + ವ vowel forms.
[
  ["", "gÀé"], ["ಾ", "gÀéÁ"], ["ಿ", "gÀéÂ"], ["ೀ", "gÀéÂÃ"],
  ["ು", "gÀéÄ"], ["ೂ", "gÀéÆ"], ["ೃ", "gÀéø"], ["ೆ", "gÀéÉ"],
  ["ೇ", "gÀéÉÃ"], ["ೈ", "gÀéÉÊ"], ["ೊ", "gÀéÉÆ"], ["ೋ", "gÀéÉÆÃ"], ["ೌ", "gÀéË"],
].forEach(([sign, legacy]) => {
  canonicalLegacyClusters.set("ರ್ವ" + sign, legacy);
  add(legacy, "ರ್ವ" + sign);
});
const saFormsForStra = series.find((row) => row[0] === "ಸ").slice(1);
vowelSigns.forEach((sign, index) => {
  const unicode = "ಸ್ತ್ರ" + sign;
  const legacy = saFormsForStra[index] + "Ûç";
  canonicalLegacyClusters.set(unicode, legacy);
  add(legacy, unicode);
  add("s" + legacy, unicode); // Accept the short-lived prefixed form without emitting it.
});

[
  ["PÀë", "ಕ್ಷ"], ["kÕ", "ಞ್ಞ"], ["gÀÜå", "ರ್ಥ್ಯ"], ["xÀåð", "ರ್ಥ್ಯ"],
  ["gÀå", "ರ್ಯ"], ["gÁå", "ರ್ಯಾ"], ["AiÀÄð", "ರ್ಯ"], ["ªÀÄåð", "ರ್ಮ್ಯ"],
  ["gÉæ", "ರ್ರೆ"], ["gÀä", "ರ್ಮ"], ["jä", "ರ್ಮಿ"], ["jäÃ", "ರ್ಮೀ"],
  ["gÀé", "ರ್ವ"], ["jÛ", "ರ್ತಿ"], ["VæÃ", "ಗ್ರೀ"], ["¶ÖæÃ", "ಷ್ಟ್ರೀ"],
  ["wÛ", "ತ್ತಿ"], ["¥Áæ", "ಪ್ರಾ"], ["¸ÀÌø", "ಸ್ಕೃ"], ["gÁ¶ÖçÃAiÀÄ", "ರಾಷ್ಟ್ರೀಯ"],
  ["EAVèµï", "ಇಂಗ್ಲಿಷ್"], ["«µÀAiÀÄ", "ವಿಷಯ"], ["¸ËPÀAiÀÄð", "ಸೌಕರ್ಯ"],
  ["0iÀÄÄ", "ಯು"], ["AiÉÄ", "ಯೆ"], ["0iÉÆ", "ಯೊ"], ["¥ÀÇ", "ಪೂ"],
  ["¥sÀÅ", "ಫು"], ["¥sÀÇ", "ಫೂ"], ["gÉå", "ರ್ಯೆ"], ["gÉåÃ", "ರ್ಯೇ"],
  ["gÉÆå", "ರ್ಯೊ"], ["gÉÆåÃ", "ರ್ಯೋ"], ["gÀÄå", "ರ್ಯು"], ["gÀÆå", "ರ್ಯೂ"],
  ["jå", "ರ್ಯಿ"], ["jåÃ", "ರ್ಯೀ"], ["gÀåA", "ರ್ಯಂ"], ["gÀåB", "ರ್ಯಃ"],
  ["gÉÆÜåÃ", "ರ್ಥ್ಯೋ"], ["ªÀiÁåð", "ರ್ಮ್ಯಾ"], ["gÁìöå", "ರ್ಸ್ಯಾ"],
  ["¢æ", "ದ್ರಿ"], ["ªÀÄ¢æ", "ಮುದ್ರಿ"], ["UÉÀ", "ಗೆ"], ["¥ÀÅ", "ಪು"],
  ["AiÀÄUÀ", "ಯಗ"], ["¥ÀÖ", "ಪ್ಟ"],
].forEach(([a, u]) => add(a, u));

const suspicious = /[A-Za-zÀ-ÿ¢£¤¥¦§¨©¬®¯°±²µ¶¸¹º»¼½¾¿]/;
// Preserve ZWNJ/ZWJ: they are meaningful Kannada shaping controls.
const invisibleFormatting = /[\u00AD\u034F\u061C\u180E\u200B\u200E\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;
const dependentVowelAtEnd = /[ಾಿೀುೂೃೆೇೈೊೋೌ]$/u;
const kannadaClusterAtEnd = /[\u0C80-\u0CFF\u200C\u200D]$/u;

function endsInKannadaCluster(output) {
  return kannadaClusterAtEnd.test(output);
}

function preprocessLegacy(input) {
  return input
    .normalize("NFC")
    .replace(invisibleFormatting, "")
    // Some legacy documents substitute Greek mu (U+03BC) for the NUDI
    // micro sign (U+00B5) used by every ಷ syllable.
    .replace(/μ/g, "µ")
    // Some NUDI variants encode final ಲ್ with a standalone macron. Preserve
    // the established ಲಾ/ಲೆ/ಲೈ/ಲೊ/ಲೋ/ಲೌ sequences that also begin with ¯.
    .replace(/¯ï/g, "®ï")
    .replace(/¯(?![ÁÉË])/g, "®ï")
    .replace(/À{2,}/g, "À")
    .replace(/É{2,}/g, "É");
}

function applySubjoined(output, consonant) {
  const vowel = output.match(dependentVowelAtEnd)?.[0] || "";
  if (vowel) {
    return output.slice(0, -vowel.length) + "್" + consonant + vowel;
  }
  return output + "್" + consonant;
}

function applyBrokenMark(output, mark) {
  const transforms = {
    "Ã": [[/ಿ$/u, "ೀ"], [/ೆ$/u, "ೇ"], [/ೊ$/u, "ೋ"]],
    "Ê": [[/ೆ$/u, "ೈ"]],
    "Æ": [[/ೆ$/u, "ೊ"]],
  };
  for (const [pattern, replacement] of transforms[mark] || []) {
    if (pattern.test(output)) return output.replace(pattern, replacement);
  }
  return output + ({ "Ã":"ೀ", "Ä":"ು", "Æ":"ೂ", "È":"ೃ", "Ê":"ೈ" }[mark] || mark);
}

function applyLooseModifier(output, mark) {
  if (mark === "À") return output;
  if (mark === "ç" || mark === "æ") return applySubjoined(output, "ರ");
  if (mark === "ü") return output + "ರ್";
  if (mark === "ï") return output.replace(dependentVowelAtEnd, "") + "್";
  const signs = { "Á":"ಾ", "Â":"ಿ", "É":"ೆ", "Ë":"ೌ", "ø":"ೃ" };
  const sign = signs[mark];
  if (!sign) return null;
  return output.replace(dependentVowelAtEnd, "") + sign;
}

/**
 * Converts Nudi/Baraha legacy text using longest-match-first and Kannada cluster rules.
 * Text between $...$ is preserved as English.
 */
function convertKannada(input, customEntries = []) {
  const localMap = new Map(mapping);
  for (const entry of customEntries) {
    if (entry?.from && entry?.to) localMap.set(entry.from, entry.to);
  }
  const keys = [...localMap.keys()].sort((a, b) => b.length - a.length);
  const preparedInput = protectEnglishWords(preprocessLegacy(protectDigitFractions(input)), keys);
  let output = "";
  const unknown = [];
  let preserved = false;

  for (let i = 0; i < preparedInput.length;) {
    if (preparedInput[i] === "$") { preserved = !preserved; i += 1; continue; }
    if (preparedInput[i] === englishStartSentinel) { preserved = true; i += 1; continue; }
    if (preparedInput[i] === englishEndSentinel) { preserved = false; i += 1; continue; }
    if (preserved) { output += preparedInput[i++]; continue; }

    const key = keys.find((candidate) => {
      if (!preparedInput.startsWith(candidate, i)) return false;
      // Anusvara A is also the first byte of legacy Ya syllables. Do not let a
      // shorter consonant+A match steal it when A begins any valid longer key
      // (AiÀÄ, AiÉÄÃ, AiÉÆ...); this is the ಗಣಪತಯೇ / paryaya class of bug.
      if (candidate.endsWith("A")) {
        const possibleNextKey = preparedInput.slice(i + candidate.length - 1);
        const aStartsLongerMapping = keys.some(
          (nextKey) => nextKey.length > 1 && nextKey.startsWith("A") && possibleNextKey.startsWith(nextKey),
        );
        if (aStartsLongerMapping) return false;
      }
      return true;
    });
    if (key) {
      if (key.length === 1 && subjoined[key]) output = applySubjoined(output, subjoined[key]);
      else output += localMap.get(key);
      i += key.length;
      continue;
    }

    const char = preparedInput[i++];
    if (["Ã", "Ä", "Æ", "È", "Ê"].includes(char) && endsInKannadaCluster(output)) {
      output = applyBrokenMark(output, char);
    } else if (char === "ð") {
      output = output.replace(/([ಕ-ಹಳ](?:್[\u200C\u200D]?[ಕ-ಹಳ])*(?:[ಾಿೀುೂೃೆೇೈೊೋೌ])?)$/u, "ರ್$1");
    } else if (char === "ö" || char === "÷") {
      continue;
    } else if (char === "ü") {
      // Prefix repha used by some NUDI documents.
      output += "ರ್";
      continue;
    } else if (char === "ï") {
      // Ignore a truly orphaned legacy virama; otherwise attach it to its base.
      if (endsInKannadaCluster(output)) output = applyLooseModifier(output, char);
      continue;
    } else {
      const repaired = endsInKannadaCluster(output) ? applyLooseModifier(output, char) : null;
      if (repaired !== null) output = repaired;
      else {
        output += char;
        if (suspicious.test(char)) unknown.push({ char, position: i - 1 });
      }
    }
  }

  return {
    text: output
      .replace(/(^|[^\u0C95-\u0CB9\u0CBC])\u0CCD[\u200C\u200D]?/gu, "$1")
      .replace(/\u200D(?=\u0CCD)/gu, "")
      .replace(/\u0CCD{2,}/gu, "\u0CCD")
      .replace(/\u25CC/gu, "")
      .normalize("NFC")
      .replace(/\u093D/gu, "\u0CBD")
      .replace(/[\uE103-\uE105]/gu, (s) => sentinelToDigitFraction.get(s)),
    unknown,
    clean: unknown.length === 0,
  };
}

/**
 * Converts Unicode Kannada to the canonical legacy form already present in
 * this converter's mapping table. Longer mapped sequences take priority.
 */
function convertUnicode(input) {
  const reverseMap = new Map();
  for (const [legacy, unicode] of mapping) {
    if (unicode) reverseMap.set(unicode, legacy);
  }
  reverseMap.set("ಽ", "ಽ");
  "೦೧೨೩೪೫೬೭೮೯".split("").forEach((digit, index) => reverseMap.set(digit, String(index)));
  // Accept alternate legacy Ya spellings, but always emit the canonical
  // Ai... series in Unicode-to-ASCII output.
  const yaSeries = series.find((row) => row[0] === "ಯ");
  if (yaSeries) {
    yaSeries.slice(1).forEach((form, index) => reverseMap.set("ಯ" + vowelSigns[index], form));
  }
  const reverseKeys = [...reverseMap.keys()].sort((a, b) => b.length - a.length);
  const formIndex = new Map(series.map((row) => [row[0], row.slice(1)]));
  const subjoinedReverse = new Map(
    Object.entries(subjoined).map(([legacy, letter]) => [letter, legacy]),
  );
  const vowelIndex = new Map([
    ["", 1], ["ಾ", 2], ["ಿ", 3], ["ೀ", 4], ["ು", 5], ["ೂ", 6],
    ["ೃ", 7], ["ೆ", 8], ["ೇ", 9], ["ೈ", 10], ["ೊ", 11], ["ೋ", 12], ["ೌ", 13],
  ]);
  const consonant = /^[ಕ-ಹಳ]$/u;
  const prepared = protectEnglishWords(protectLiteralFractions(input.replace(/\u0CCD\u0CBC/gu, "\u0CCD").normalize("NFC").replace(invisibleFormatting, "").replace(/([ಕ-ಹಳ])[\u200C\u200D]+(?=[ಾಿೀುೂೃೆೇೈೊೋೌ])/gu, "$1").replace(/ಅಾ/gu, "ಆ").replace(/ಅಿ/gu, "ಇ").replace(/ಅೀ/gu, "ಈ").replace(/ಅು/gu, "ಉ").replace(/ಅೂ/gu, "ಊ").replace(/ಅೃ/gu, "ಋ").replace(/ಅೆ/gu, "ಎ").replace(/ಅೇ/gu, "ಏ").replace(/ಅೈ/gu, "ಐ").replace(/ಅೊ/gu, "ಒ").replace(/ಅೋ/gu, "ಓ").replace(/ಅೌ/gu, "ಔ").normalize("NFC").replace(/\u093D/gu, "\u0CBD")));
  let text = "";
  const unknown = [];

  const canonicalClusterKeys = [...canonicalLegacyClusters.keys()].sort((a, b) => b.length - a.length);

  for (let i = 0; i < prepared.length;) {
    const canonicalCluster = canonicalClusterKeys.find((candidate) => prepared.startsWith(candidate, i));
    if (canonicalCluster) {
      text += canonicalLegacyClusters.get(canonicalCluster);
      i += canonicalCluster.length;
      continue;
    }
    const first = prepared[i];
    if (consonant.test(first) ? (prepared[i + 1] === "್" ?
        consonant.test(prepared[i + 2] || "") : false) : false) {
      const letters = [first];
      let cursor = i + 1;
      let finalVirama = false;
      while (prepared[cursor] === "್") {
        if (consonant.test(prepared[cursor + 1] || "")) {
          letters.push(prepared[cursor + 1]);
          cursor += 2;
          while (prepared[cursor] === "‌" || prepared[cursor] === "‍") cursor += 1;
        } else {
          finalVirama = true;
          cursor += 1;
          break;
        }
      }
      const sign = vowelIndex.has(prepared[cursor]) ? prepared[cursor++] : "";
      const isRepha = letters[0] === "ರ" ? (letters.length > 1 ? !finalVirama : false) : false;
      const baseLetter = isRepha ? letters[1] : letters[0];
      const tailLetters = isRepha ? letters.slice(2) : letters.slice(1);
      const forms = formIndex.get(baseLetter);
      const tails = tailLetters.map((letter) => subjoinedReverse.get(letter));
      if (forms ? tails.every(Boolean) : false) {
        const baseIndex = finalVirama
          ? (letters.length > 1 ? 1 : 0)
          : vowelIndex.get(sign);
        // NUDI01 subjoined glyphs have zero advance. The blank ö byte advances
        // successive ottaksharas so double and triple clusters do not overprint.
        const spacedTails = tails.join("ö");
        // Post-base vowel bytes must follow the complete ottakshara stack. Placing
        // them inside the base form causes forms such as ಶ್ರೀ and ತ್ಯೇ to jumble.
        const clusterForms = {
          "": forms[1] + spacedTails,
          "ಾ": forms[1] + spacedTails + "Á",
          "ಿ": forms[3] + spacedTails,
          "ೀ": forms[3] + spacedTails + "Ã",
          "ು": forms[1] + spacedTails + "Ä",
          "ೂ": forms[1] + spacedTails + "Æ",
          "ೃ": forms[1] + spacedTails + "ø",
          "ೆ": forms[8] + spacedTails,
          "ೇ": forms[8] + spacedTails + "Ã",
          "ೈ": forms[8] + spacedTails + "Ê",
          "ೊ": forms[8] + spacedTails + "Æ",
          "ೋ": forms[8] + spacedTails + "ÆÃ",
          "ೌ": forms[1] + spacedTails + "Ë",
        };
        const clusterForm = finalVirama
          ? forms[1] + spacedTails + "ï"
          : clusterForms[sign];
        // Repha follows the complete cluster, including its vowel bytes.
        text += clusterForm + (isRepha ? "ð" : "");
        if (prepared[cursor] === "ಂ") { text += "A"; cursor += 1; }
        else if (prepared[cursor] === "ಃ") { text += "B"; cursor += 1; }
        i = cursor;
        continue;
      }
    }

    const special = reverseKeys.find((candidate) =>
      candidate.length > 1 && prepared.startsWith(candidate, i),
    );
    if (special) {
      text += reverseMap.get(special);
      i += special.length;
      continue;
    }

    const key = reverseKeys.find((candidate) => prepared.startsWith(candidate, i));
    if (key) {
      text += reverseMap.get(key);
      i += key.length;
      continue;
    }

    text += first;
    if (/[ಀ-೿]/u.test(first)) unknown.push({ char: first, position: i });
    i += 1;
  }

  return { text, unknown, clean: unknown.length === 0 };
}

// ═══════════════════════════════════════════════════
// FRACTION & ENGLISH WORD PROTECTION
// Prevents conversion engine from consuming literal fractions
// and English words in mixed Kannada/English documents
// ═══════════════════════════════════════════════════

const literalFractionToSentinel = new Map([["¼", "\uE100"], ["½", "\uE101"], ["¾", "\uE102"]]);
const sentinelToLiteralFraction = new Map([...literalFractionToSentinel].map(([fraction, sentinel]) => [sentinel, fraction]));
function protectLiteralFractions(text) { return text.replace(/[¼½¾]/gu, (fraction) => literalFractionToSentinel.get(fraction)); }
function restoreLiteralFractions(text) { return text.replace(/[\uE100-\uE102]/gu, (sentinel) => sentinelToLiteralFraction.get(sentinel)); }
// CONV-001 fix: protect digit+fraction patterns (e.g. 3½) during ASCII→Unicode
// conversion so the legacy mapping does not consume the fraction character.
const digitFractionToSentinel = new Map([["¼", "\uE103"], ["½", "\uE104"], ["¾", "\uE105"]]);
const sentinelToDigitFraction = new Map([...digitFractionToSentinel].map(([fraction, sentinel]) => [sentinel, fraction]));
function protectDigitFractions(text) { return text.replace(/([0-9\u0CE6-\u0CE9])([¼½¾])/gu, (_, digit, frac) => digit + digitFractionToSentinel.get(frac)); }
function restoreDigitFractions(text) { return text.replace(/[\uE103-\uE105]/gu, (sentinel) => sentinelToDigitFraction.get(sentinel)); }
const englishStartSentinel = "\uE110";
const englishEndSentinel = "\uE111";
const clearEnglishWord = /(^|[\s([{<"'“‘,:;!?])([A-Z][A-Z0-9]{1,}|[A-Za-z][A-Za-z0-9]{2,}|a|I|an|as|at|be|by|if|in|is|it|of|on|or|to)(?=$|[\s)\]}>"'”’,:;!?])/gm;
function canParseAsLegacyWord(word, legacyKeys) {
  if (!legacyKeys || !legacyKeys.length) return false;
  const asciiKeys = legacyKeys.filter((key) => /^[A-Za-z0-9]+$/.test(key));
  const reachable = new Uint8Array(word.length + 1);
  reachable[0] = 1;
  for (let index = 0; index < word.length; index += 1) {
    if (!reachable[index]) continue;
    for (const key of asciiKeys) {
      if (word.startsWith(key, index)) reachable[index + key.length] = 1;
    }
  }
  return reachable[word.length] === 1;
}
/* ═══════════════════════════════════════════════════════════════
   SECTION 2: ENGLISH WORD PROTECTION
   Sentinel-based protection for Latin words in mixed Kannada text.
   ═══════════════════════════════════════════════════════════════ */
function protectEnglishWords(text, legacyKeys = null) {
  const tokens = [...text.matchAll(clearEnglishWord)].map((match) => {
    const prefix = match[1] || "";
    const word = match[2];
    const start = match.index + prefix.length;
    return { word, start, end: start + word.length, ambiguous: canParseAsLegacyWord(word, legacyKeys) };
  });
  const englishGlue = /^[\s()\[\]{}<>"'“”‘’,:;!?-]*$/u;
  const selected = tokens.filter((token, index) => {
    if (!token.ambiguous) return true;
    const previous = tokens[index - 1];
    const next = tokens[index + 1];
    const followsEnglish = previous && !previous.ambiguous && englishGlue.test(text.slice(previous.end, token.start));
    const precedesEnglish = next && !next.ambiguous && englishGlue.test(text.slice(token.end, next.start));
    return Boolean(followsEnglish || precedesEnglish);
  });
  let result = "";
  let cursor = 0;
  for (const token of selected) {
    result += text.slice(cursor, token.start) + englishStartSentinel + token.word + englishEndSentinel;
    cursor = token.end;
  }
  return result + text.slice(cursor);
}
function restoreEnglishMarkers(text) { return text.replace(/[\uE110\uE111]/gu, ""); }

const sampleText = "PÀ£ÀßqÀ ¨sÁµÉAiÀÄ°è ¸ÀA¸ÀÌøwAiÀÄ ¸ËAzÀAiÀÄð«zÉ.";

/* ═══════════════════════════════════════════════════════════════
   SECTION 3: UI CONTROLLER
   DOM bindings, event handlers, mode switching.
   ═══════════════════════════════════════════════════════════════ */
  // ═══════════════════════════════════════════════════
// UI CONTROLLER
// Wires conversion engine to DOM: textareas, buttons,
// mode toggle, Aksharamukha integration, copy/download
// ═══════════════════════════════════════════════════

var root=document.getElementById("bv-kannada-converter");
  if(!root)return;
  var input=root.querySelector("#bv-kc-input");
  var output=root.querySelector("#bv-kc-output");
  var outputPreview=root.querySelector("#bv-kc-output-preview");
  var status=root.querySelector("#bv-kc-status");
  var mode="unicode";
  var toUnicode=root.querySelector("#bv-kc-to-unicode");
  var toAscii=root.querySelector("#bv-kc-to-ascii");
  var sourceTitle=root.querySelector(".bv-kc__bar strong");
  var sourceSubtitle=root.querySelector(".bv-kc__bar small");
  var inputLabel=root.querySelector('label[for="bv-kc-input"]');
  var outputLabel=root.querySelector('label[for="bv-kc-output"]');
  var copyButton=root.querySelector("#bv-kc-copy");
  var akPanel=root.querySelector("#bv-kc-aksharamukha");
  var akTarget=root.querySelector("#bv-kc-ak-target");
  var akRun=root.querySelector("#bv-kc-ak-run");
  var akOutput=root.querySelector("#bv-kc-ak-output");
  var akStatus=root.querySelector("#bv-kc-ak-status");
  var akCopy=root.querySelector("#bv-kc-ak-copy");
  function renderLegacyPreview(text){
    outputPreview.textContent="";
    var displayToken=/\uE110([^\uE111]*)\uE111|([0-9೦-೯]+)?([\uE100-\uE102])/gu;
    var cursor=0;
    var match;
    while((match=displayToken.exec(text))!==null){
      if(match.index>cursor)outputPreview.appendChild(document.createTextNode(text.slice(cursor,match.index)));
      var span=document.createElement("span");
      if(match[1]!==undefined){span.className="bv-kc__literal-english";span.textContent=match[1];}
      else{span.className="bv-kc__literal-fraction";span.textContent=(match[2]||"")+sentinelToLiteralFraction.get(match[3]);}
      outputPreview.appendChild(span);
      cursor=displayToken.lastIndex;
    }
    if(cursor<text.length)outputPreview.appendChild(document.createTextNode(text.slice(cursor)));
  }
  function update(){
    var result=mode==="unicode"?convertKannada(input.value):convertUnicode(input.value);
    output.value=result.text;
    renderLegacyPreview(result.text);
    if(input.value&&window.bvSaveHistory){window.bvSaveHistory(input.value,result.text,mode==="unicode"?"a2u":"u2a");}
    akOutput.value="";
    akStatus.textContent="Runs only when you select Transliterate Unicode.";
    akStatus.removeAttribute("data-state");
    if(!input.value){status.textContent="Ready for conversion.";status.removeAttribute("data-state");return;}
    if(result.clean){status.textContent="Conversion complete. No unmapped characters detected.";status.setAttribute("data-state","ok");}
    else{var chars=Array.from(new Set(result.unknown.map(function(x){return x.char;}))).join(" ");status.textContent="Review "+result.unknown.length+" unmapped character"+(result.unknown.length===1?"":"s")+": "+chars;status.setAttribute("data-state","warn");}
  }
  function setMode(nextMode){
    mode=nextMode;
    root.setAttribute("data-mode",mode==="unicode"?"unicode":"ascii");
    var unicodeMode=mode==="unicode";
    output.hidden=!unicodeMode;
    outputPreview.hidden=unicodeMode;
    toUnicode.classList.toggle("is-active",unicodeMode);
    toAscii.classList.toggle("is-active",!unicodeMode);
    toUnicode.setAttribute("aria-pressed",String(unicodeMode));
    toAscii.setAttribute("aria-pressed",String(!unicodeMode));
    sourceTitle.textContent=unicodeMode?"Legacy Kannada":"Unicode Kannada";
    sourceSubtitle.textContent=unicodeMode?"Nudi / Baraha ASCII text":"Standard Kannada Unicode text";
    inputLabel.textContent=unicodeMode?"Paste legacy text":"Paste Unicode text";
    outputLabel.textContent=unicodeMode?"Unicode Kannada":"Legacy Kannada ASCII";
    input.placeholder=unicodeMode?"Paste text copied from a legacy Kannada document…":"Paste Kannada Unicode text…";
    output.placeholder=unicodeMode?"Unicode output appears here…":"Legacy ASCII output appears here…";
    copyButton.textContent=unicodeMode?"Copy Unicode":"Copy ASCII";
    akPanel.hidden=!unicodeMode;
    update();
    input.focus();
  }
  input.addEventListener("input",update);
  toUnicode.addEventListener("click",function(){setMode("unicode");});
  toAscii.addEventListener("click",function(){setMode("ascii");});
  root.querySelector("#bv-kc-sample").addEventListener("click",function(){input.value=mode==="unicode"?"UÀt¥ÀvÀAiÉÄÃ\n"+sampleText:"ಗಣಪತಯೇ\nಕನ್ನಡ ಭಾಷೆಯಲ್ಲಿ ಸಂಸ್ಕೃತಿಯ ಸೌಂದರ್ಯವಿದೆ.\nಽ";update();input.focus();});
  root.querySelector("#bv-kc-clear").addEventListener("click",function(){input.value="";update();input.focus();});
  root.querySelector("#bv-kc-copy").addEventListener("click",async function(){if(!output.value)return;try{await navigator.clipboard.writeText(restoreEnglishMarkers(restoreLiteralFractions(output.value)));status.textContent=(mode==="unicode"?"Unicode":"ASCII")+" text copied to the clipboard.";status.setAttribute("data-state","ok");}catch(e){output.focus();output.select();status.textContent="Select and copy the converted text manually.";status.setAttribute("data-state","warn");}});
  root.querySelector("#bv-kc-download").addEventListener("click",function(){if(!output.value)return;var blob=new Blob([restoreEnglishMarkers(restoreLiteralFractions(output.value))],{type:"text/plain;charset=utf-8"});var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=mode==="unicode"?"kannada-unicode.txt":"kannada-legacy-ascii.txt";a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);});
  akTarget.addEventListener("change",function(){akPanel.setAttribute("data-target",akTarget.value);akOutput.value="";akStatus.textContent="Select Transliterate Unicode to generate the chosen script.";akStatus.removeAttribute("data-state");});
  akRun.addEventListener("click",async function(){
    if(mode!=="unicode"){akStatus.textContent="Aksharamukha is available only for Kannada Unicode output.";akStatus.setAttribute("data-state","warn");return;}
    if(!output.value){akStatus.textContent="Convert some legacy Kannada text to Unicode first.";akStatus.setAttribute("data-state","warn");return;}
    akRun.disabled=true;akStatus.textContent="Transliterating with Aksharamukha…";akStatus.removeAttribute("data-state");
    try{
      akPanel.setAttribute("data-target",akTarget.value);
      var normalizedUnicode=output.value.replace(/\u093D/gu,"\u0CBD");
      var params=new URLSearchParams({source:"Kannada",target:akTarget.value,text:normalizedUnicode,nativize:"false"});
      var endpoint="https://aksharamukha-plugin.appspot.com/api/public";
      var requests=[
        {url:endpoint+"?"+params.toString(),options:{method:"GET",headers:{Accept:"text/plain"}}},
        {url:endpoint,options:{method:"POST",headers:{Accept:"text/plain","Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},body:params.toString()}},
        {url:endpoint+"?"+params.toString(),options:{method:"GET",headers:{Accept:"text/plain"}}}
      ];
      var response=null;var lastError=null;
      for(var requestIndex=0;requestIndex<requests.length;requestIndex++){
        var controller=new AbortController();var timeoutId=setTimeout(function(){controller.abort();},12000);
        try{
          var requestOptions=Object.assign({},requests[requestIndex].options,{signal:controller.signal,cache:"no-store"});
          response=await fetch(requests[requestIndex].url,requestOptions);
          if(response.ok)break;
          lastError=new Error("HTTP "+response.status);
        }catch(requestError){lastError=requestError;}finally{clearTimeout(timeoutId);}
        if(requestIndex<requests.length-1)await new Promise(function(resolve){setTimeout(resolve,600*(requestIndex+1));});
      }
      if(!response||!response.ok)throw lastError||new Error("No response from Aksharamukha");
      var resultText=await response.text();
      try{var parsed=JSON.parse(resultText);resultText=typeof parsed==="string"?parsed:(parsed.output||parsed.text||resultText);}catch(ignore){}
      if(akTarget.value==="Grantha")resultText=resultText.replace(/\u093D/gu,"\u{1133D}");
      akOutput.value=resultText;akStatus.textContent="Aksharamukha transliteration complete.";akStatus.setAttribute("data-state","ok");
    }catch(error){akOutput.value="";akStatus.textContent="Aksharamukha did not respond after automatic retries. Select Transliterate Unicode to try again. Your core Unicode output is unchanged.";akStatus.setAttribute("data-state","warn");}
    finally{akRun.disabled=false;}
  });
  akCopy.addEventListener("click",async function(){if(!akOutput.value)return;try{await navigator.clipboard.writeText(akOutput.value);akStatus.textContent="Transliteration copied to the clipboard.";akStatus.setAttribute("data-state","ok");}catch(error){akOutput.focus();akOutput.select();akStatus.textContent="Select and copy the transliteration manually.";akStatus.setAttribute("data-state","warn");}});

/* ═══════════════════════════════════════════════════════════════
   SECTION 4: WORD ADD-IN (lazy-loaded via Office.js)
   Only activates when ?word-addin=1 is in the URL.
   ═══════════════════════════════════════════════════════════════ */
  // ═══════════════════════════════════════════════════
// WORD ADD-IN
// Integrates with Microsoft Word via Office.js when
// opened with ?word-addin=1 query parameter
// ═══════════════════════════════════════════════════

function initialiseWordAddin() {
    if (new URLSearchParams(window.location.search).get("word-addin") !== "1") return;
    const toUnicodeButton = document.getElementById("bv-word-to-unicode");
    const toAsciiButton = document.getElementById("bv-word-to-ascii");
    const wordStatus = document.getElementById("bv-word-addin-status");
    if (!toUnicodeButton || !toAsciiButton || !wordStatus) return;
    const setReady = (ready) => {
      toUnicodeButton.disabled = !ready;
      toAsciiButton.disabled = !ready;
    };
    const cleanResult = (result) => restoreEnglishMarkers(restoreLiteralFractions(result.text));
    const convertSelection = async (direction) => {
      setReady(false);
      wordStatus.textContent = "Converting selected text…";
      try {
        await Word.run(async (context) => {
          const selection = context.document.getSelection();
          selection.load("text");
          await context.sync();
          if (!selection.text) {
            wordStatus.textContent = "Select text in the Word document first.";
            return;
          }
          const result = direction === "unicode" ? convertKannada(selection.text) : convertUnicode(selection.text);
          selection.insertText(cleanResult(result), Word.InsertLocation.replace);
          await context.sync();
          wordStatus.textContent = result.clean ? "Selected text converted successfully." : "Text converted. Review " + result.unknown.length + " unmapped character" + (result.unknown.length === 1 ? "." : "s.");
        });
      } catch (error) {
        wordStatus.textContent = "Word could not replace the selection. Select editable text and try again.";
      } finally {
        setReady(true);
      }
    };
    toUnicodeButton.addEventListener("click", () => convertSelection("unicode"));
    toAsciiButton.addEventListener("click", () => convertSelection("ascii"));
    const officeScript = document.createElement("script");
    officeScript.src = "https://appsforoffice.microsoft.com/lib/1/hosted/office.js";
    officeScript.onload = () => Office.onReady((info) => {
      if (info.host === Office.HostType.Word) {
        setReady(true);
        wordStatus.textContent = "Ready. Select text in Word.";
      } else wordStatus.textContent = "Open this add-in inside Microsoft Word.";
    });
    officeScript.onerror = () => {
      wordStatus.textContent = "Microsoft Word integration could not load. Check internet access and reopen the add-in.";
    };
    document.head.appendChild(officeScript);
  }
  initialiseWordAddin();

// ═══════════════════════════════════════════════════════════
// WORD ADD-IN DOWNLOAD DIALOG
// Handles the Installation Instructions modal and button
// repositioning below the hero media row
// ═══════════════════════════════════════════════════════════
(function(){
  var open=document.getElementById('bv-wordaddin-open'),
      dialog=document.getElementById('bv-wordaddin-dialog');
  var actions=document.querySelector('.bv-wordaddin-actions'),
      row=document.querySelector('.bv-kc__media-row');
  if(row&&actions)row.insertAdjacentElement('afterend',actions);
  if(dialog&&dialog.parentNode!==document.body)document.body.appendChild(dialog);
  if(!open||!dialog)return;
  function close(){dialog.hidden=true;document.body.style.overflow='';open.focus()}
  open.addEventListener('click',function(){dialog.hidden=false;document.body.style.overflow='hidden';dialog.querySelector('.bv-wordaddin-x').focus()});
  dialog.querySelectorAll('[data-bv-wordaddin-close]').forEach(function(item){item.addEventListener('click',close)});
  document.addEventListener('keydown',function(event){if(event.key==='Escape'&&!dialog.hidden)close()});
})();
})();



(function(){
  var popup=document.getElementById('bv-font-popup');
  if(!popup)return;
  var moreButton=popup.querySelector('.bv-font-popup__more');
  var title=popup.querySelector('#bv-font-popup-title');
  var langButtons=popup.querySelectorAll('[data-bv-popup-lang]');
  var copies=popup.querySelectorAll('[data-bv-popup-copy]');
  function closePopup(){popup.hidden=true;document.body.classList.remove('bv-popup-open');if(previousFocus)previousFocus.focus();}
  function setLanguage(language){
    langButtons.forEach(function(button){var active=button.getAttribute('data-bv-popup-lang')===language;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    copies.forEach(function(copy){copy.hidden=copy.getAttribute('data-bv-popup-copy')!==language;});
    title.textContent=language==='kn'?'ಡಿಜಿಟಲ್ ಫಾಂಟ್ ಪರಿವರ್ತನಾ ತಂತ್ರಾಂಶ':'Digital Font Conversion Tool';
    popup.classList.remove('is-expanded');moreButton.setAttribute('aria-expanded','false');moreButton.textContent='ಇನ್ನಷ್ಟು / More';
  }
  popup.querySelectorAll('[data-bv-popup-close]').forEach(function(button){button.addEventListener('click',closePopup);});
  langButtons.forEach(function(button){button.addEventListener('click',function(){setLanguage(button.getAttribute('data-bv-popup-lang'));});});
  moreButton.addEventListener('click',function(){var expanded=popup.classList.toggle('is-expanded');moreButton.setAttribute('aria-expanded',String(expanded));moreButton.textContent=expanded?'ಕಡಿಮೆ / Less':'ಇನ್ನಷ್ಟು / More';});
var previousFocus=null;  var focusableSelector='button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';  document.addEventListener('keydown',function(event){    if(event.key==='Escape'&&!popup.hidden){closePopup();return;}    if(event.key==='Tab'&&!popup.hidden){      var focusables=Array.from(popup.querySelectorAll(focusableSelector));      if(!focusables.length)return;      var first=focusables[0],last=focusables[focusables.length-1];      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}    }  });
  previousFocus=document.activeElement;document.body.classList.add('bv-popup-open');popup.querySelector('.bv-font-popup__x').focus();
  setLanguage('kn');
})();

/* === CONVERSION HISTORY === */
(function(){
var S="bv-kc-history",M=10;
var L=document.getElementById("bv-kc-history-list"),C=document.getElementById("bv-kc-history-clear");
if(!L||!C)return;
function gH(){try{return JSON.parse(localStorage.getItem(S))||[]}catch(e){return[]}}
function sH(a){try{localStorage.setItem(S,JSON.stringify(a))}catch(e){}}
function fT(ts){var d=new Date(ts),n=new Date(),df=n-d;
if(df<6e4)return "Just now";
if(df<36e5)return Math.floor(df/6e4)+"m ago";
if(df<864e5)return Math.floor(df/36e5)+"h ago";
return d.toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
function eH(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function rH(){var E=gH(),h="";
if(!E.length){L.innerHTML="<p class=bv-kc__history-empty>No conversions yet. Your conversion history will appear here.</p>";return}
for(var i=0;i<E.length;i++){var e=E[i];
h+="<div class=bv-kc__history-entry tabindex=0 data-idx="+i+" role=button>";
h+="<div class=bv-kc__history-entry-header>";
h+="<span class=bv-kc__history-entry-dir>"+(e.dir==="a2u"?"ASCII → Unicode":"Unicode → ASCII")+"</span>";
h+="<span style=display:flex;align-items:center;gap:6px>";
h+="<span class=bv-kc__history-entry-time>"+fT(e.time)+"</span>";
h+="<button class=bv-kc__history-entry-delete data-del="+i+">×</button>";
h+="</span></div>";
h+="<div class=bv-kc__history-entry-preview>";
h+="<div class=bv-kc__history-entry-input>"+eH(e.input)+"</div>";
h+="<div class=bv-kc__history-entry-arrow>→</div>";
h+="<div class=bv-kc__history-entry-output>"+eH(e.output)+"</div>";
h+="</div></div>"}
L.innerHTML=h}
window.bvSaveHistory=function(input,output,dir){
if(!input||!output)return;
var E=gH();E.unshift({input:input,output:output,dir:dir,time:Date.now()});
if(E.length>M)E=E.slice(0,M);sH(E);rH()};
L.addEventListener("click",function(ev){
var db=ev.target.closest(".bv-kc__history-entry-delete");
if(db){var di=parseInt(db.getAttribute("data-del"),10);var E=gH();E.splice(di,1);sH(E);rH();return}
var en=ev.target.closest(".bv-kc__history-entry");if(!en)return;
var ix=parseInt(en.getAttribute("data-idx"),10);var d=gH()[ix];if(!d)return;
var ie=document.getElementById("bv-kc-input"),oe=document.getElementById("bv-kc-output");
if(!ie||!oe)return;
ie.value=d.input;oe.value=d.output;
if(d.dir==="a2u"){document.getElementById("bv-kc-to-unicode").click()}
else{document.getElementById("bv-kc-to-ascii").click()}
ie.scrollIntoView({behavior:"smooth",block:"center"});ie.focus()});
L.addEventListener("keydown",function(ev){
if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();var el=ev.target.closest(".bv-kc__history-entry");if(el)el.click()}});
C.addEventListener("click",function(){sH([]);rH()});
rH()})();


;

(function(){
  var open=document.getElementById('bv-docclean-open'),
      dialog=document.getElementById('bv-docclean-dialog'),
      row=document.getElementById('bv-docclean-actions'),
      addin=document.querySelector('#bv-kannada-converter .bv-wordaddin-actions');
  if(!open||!dialog)return;
  function placeRow(){
    var host=document.querySelector('#bv-kannada-converter .bv-wordaddin-actions');
    if(host&&row&&row.nextElementSibling!==host)host.parentNode.insertBefore(row,host);
  }
  placeRow();
  document.addEventListener('DOMContentLoaded',function(){placeRow();setTimeout(placeRow,50);setTimeout(placeRow,400);});
  if(dialog.parentNode!==document.body)document.body.appendChild(dialog);
  function close(){dialog.hidden=true;document.body.style.overflow='';open.focus()}
  open.addEventListener('click',function(){dialog.hidden=false;document.body.style.overflow='hidden';dialog.querySelector('.bv-wordaddin-x').focus()});
  dialog.querySelectorAll('[data-bv-docclean-close]').forEach(function(item){item.addEventListener('click',close)});
  document.addEventListener('keydown',function(event){if(event.key==='Escape'&&!dialog.hidden)close()});
})();

;

(function(){
  var open=document.getElementById('bv-gamaka-open'),
      dialog=document.getElementById('bv-gamaka-dialog'),
      row=document.getElementById('bv-gamaka-actions');
  if(!open||!dialog)return;
  function placeRow(){
    var host=document.getElementById('bv-docclean-actions');
    if(host&&row&&row.nextElementSibling!==host)host.parentNode.insertBefore(row,host);
  }
  placeRow();
  document.addEventListener('DOMContentLoaded',function(){placeRow();setTimeout(placeRow,50);setTimeout(placeRow,400);});
  if(dialog.parentNode!==document.body)document.body.appendChild(dialog);
  function close(){dialog.hidden=true;document.body.style.overflow='';open.focus()}
  open.addEventListener('click',function(){dialog.hidden=false;document.body.style.overflow='hidden';dialog.querySelector('.bv-wordaddin-x').focus()});
  dialog.querySelectorAll('[data-bv-gamaka-close]').forEach(function(item){item.addEventListener('click',close)});
  document.addEventListener('keydown',function(event){if(event.key==='Escape'&&!dialog.hidden)close()});
})();

;

(function(){
  function markReal(){
    var d=document.getElementById('bv-wordaddin-dialog');
    if(d&&!d.classList.contains('bv-addin-real'))d.classList.add('bv-addin-real');
  }
  markReal();
  document.addEventListener('DOMContentLoaded',function(){markReal();setTimeout(markReal,50);setTimeout(markReal,400);setTimeout(markReal,1500);});
})();

;
(function(){function init(){var root=document.getElementById("bv-kannada-converter");if(!root)return;var panel=root.querySelector("#bv-kc-aksharamukha"),run=root.querySelector("#bv-kc-ak-run"),input=root.querySelector("#bv-kc-input"),target=root.querySelector("#bv-kc-ak-target"),out=root.querySelector("#bv-kc-ak-output"),st=root.querySelector("#bv-kc-ak-status");if(!panel||!run||!input||!target||!out||!st||panel.getAttribute("data-bv-fix"))return;panel.setAttribute("data-bv-fix","1");function show(){if(panel.hidden)panel.hidden=false;}show();new MutationObserver(show).observe(panel,{attributes:true,attributeFilter:["hidden"]});function say(msg,state){st.textContent=msg;if(state)st.setAttribute("data-state",state);else st.removeAttribute("data-state");}run.addEventListener("click",async function(e){if(root.getAttribute("data-mode")!=="ascii")return;e.preventDefault();e.stopImmediatePropagation();var text=input.value;if(!text.trim()){say("Paste some Kannada Unicode text first.","warn");return;}run.disabled=true;say("Transliterating with Aksharamukha…");try{panel.setAttribute("data-target",target.value);var params=new URLSearchParams({source:"Kannada",target:target.value,text:text.replace(/\u093D/gu,"\u0CBD"),nativize:"false"});var endpoint="https://aksharamukha-plugin.appspot.com/api/public";var reqs=[{url:endpoint+"?"+params.toString(),options:{method:"GET",headers:{Accept:"text/plain"}}},{url:endpoint,options:{method:"POST",headers:{Accept:"text/plain","Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},body:params.toString()}},{url:endpoint+"?"+params.toString(),options:{method:"GET",headers:{Accept:"text/plain"}}}];var res=null,lastErr=null;for(var i=0;i<reqs.length;i++){var ctl=new AbortController();var tid=setTimeout(function(){ctl.abort();},12000);try{res=await fetch(reqs[i].url,Object.assign({},reqs[i].options,{signal:ctl.signal,cache:"no-store"}));if(res.ok)break;lastErr=new Error("HTTP "+res.status);}catch(err){lastErr=err;}finally{clearTimeout(tid);}if(i<reqs.length-1)await new Promise(function(r){setTimeout(r,600*(i+1));});}if(!res||!res.ok)throw lastErr||new Error("No response");var result=await res.text();try{var p=JSON.parse(result);result=typeof p==="string"?p:(p.output||p.text||result);}catch(ignore){}if(target.value==="Grantha")result=result.replace(/\u093D/gu,"\u{1133D}");out.value=result;say("Aksharamukha transliteration complete.","ok");}catch(err){out.value="";say("Aksharamukha did not respond after automatic retries. Select Transliterate Unicode to try again.","warn");}finally{run.disabled=false;}},true);}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();})();