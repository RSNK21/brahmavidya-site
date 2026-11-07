/* Kannada ASCII (Nudi / Baraha) <-> Unicode converter.
   Conversion engine from the Brahmavidya Kannada converter
   (https://brahmavidya.co.in/kannada-ascii-to-unicode-converter/), used here unchanged
   except for indexing the lookup tables by first character for speed on whole books. */
(function () {
'use strict';
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
  const keyIndex = new Map();
  for (const k of keys) { const c = k[0]; if (!keyIndex.has(c)) keyIndex.set(c, []); keyIndex.get(c).push(k); }
  const aLongKeys = keys.filter((nextKey) => nextKey.length > 1 && nextKey.startsWith("A"));
  const preparedInput = protectEnglishWords(preprocessLegacy(protectDigitFractions(input)), keys);
  let output = "";
  const unknown = [];
  let preserved = false;

  for (let i = 0; i < preparedInput.length;) {
    if (preparedInput[i] === "$") { preserved = !preserved; i += 1; continue; }
    if (preparedInput[i] === englishStartSentinel) { preserved = true; i += 1; continue; }
    if (preparedInput[i] === englishEndSentinel) { preserved = false; i += 1; continue; }
    if (preserved) { output += preparedInput[i++]; continue; }

    const key = (keyIndex.get(preparedInput[i]) || []).find((candidate) => {
      if (!preparedInput.startsWith(candidate, i)) return false;
      // Anusvara A is also the first byte of legacy Ya syllables. Do not let a
      // shorter consonant+A match steal it when A begins any valid longer key
      // (AiÀÄ, AiÉÄÃ, AiÉÆ...); this is the ಗಣಪತಯೇ / paryaya class of bug.
      if (candidate.endsWith("A")) {
        const possibleNextKey = preparedInput.slice(i + candidate.length - 1);
        const aStartsLongerMapping = aLongKeys.some((nextKey) => possibleNextKey.startsWith(nextKey));
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
  const revIndex = new Map();
  for (const k of reverseKeys) { const c = k[0]; if (!revIndex.has(c)) revIndex.set(c, []); revIndex.get(c).push(k); }
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
  const canIndex = new Map();
  for (const k of canonicalClusterKeys) { const c = k[0]; if (!canIndex.has(c)) canIndex.set(c, []); canIndex.get(c).push(k); }

  for (let i = 0; i < prepared.length;) {
    const canonicalCluster = (canIndex.get(prepared[i]) || []).find((candidate) => prepared.startsWith(candidate, i));
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
          while (prepared[cursor] === "\u200C" || prepared[cursor] === "\u200D") cursor += 1;
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

    const special = (revIndex.get(prepared[i]) || []).find((candidate) =>
      candidate.length > 1 && prepared.startsWith(candidate, i),
    );
    if (special) {
      text += reverseMap.get(special);
      i += special.length;
      continue;
    }

    const key = (revIndex.get(prepared[i]) || []).find((candidate) => prepared.startsWith(candidate, i));
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
const asciiKeyCache = new WeakMap();
function canParseAsLegacyWord(word, legacyKeys) {
  if (!legacyKeys || !legacyKeys.length) return false;
  const asciiKeys = asciiKeyCache.get(legacyKeys) || (asciiKeyCache.set(legacyKeys, legacyKeys.filter((key) => /^[A-Za-z0-9]+$/.test(key))), asciiKeyCache.get(legacyKeys));
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


const keysCache = {};
function toUnicode(text, opts = {}) {
  const r = convertKannada(text, opts.custom || []);
  return r;
}
function toAscii(text) {
  const r = convertUnicode(text);
  return { text: restoreLiteralFractions(restoreEnglishMarkers(r.text)), unknown: r.unknown, clean: r.clean };
}
const api = { toUnicode, toAscii, convertKannada, convertUnicode };
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
