export let LANG = localStorage.getItem('app-lang') || 'enUS';

const listeners = new Set();

export function setLang(lang) {
  let shortcuts = {
    ru: "ruRU",
    en: "enUS",
    kr: "koKR",
    cn: "zhCN",
  }
  if(shortcuts[lang.toLowerCase()]){
    lang = shortcuts[lang.toLowerCase()]
  }
  if (lang !== LANG) {
    LANG = lang;
    localStorage.setItem('app-lang', lang);
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
    listeners.forEach(cb => cb(lang));
  }
}

const staticStrings = {
  'select-mod': { enUS: 'Mod', ruRU: 'Модификация' },
  'army-title': { enUS: 'Units', ruRU: 'Юниты' },
  'structures-title': { enUS: 'structures', ruRU: 'Здания' },
  'upgrades-title': { enUS: 'upgrades', ruRU: 'Улучшения' },
  'factions-title': { enUS: 'Faction', ruRU: 'Фракция' },
  'language-label': { enUS: 'Language', ruRU: 'Язык' }
};

export function i18n(text) {
  if (!text) return '';

  // If the text is a translation object, return matching lang
  if (typeof text === 'object') {
    return text[LANG] || text.enUS || Object.values(text)[0] || '';
  }

  // If it's a key in staticStrings
  if (staticStrings[text]) {
    return staticStrings[text][LANG] || Object.values(staticStrings[text])[0] || '';
  }

  return text; // fallback: assume plain string
}

export function getLang() {
  return LANG;
}

export function onLangChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
