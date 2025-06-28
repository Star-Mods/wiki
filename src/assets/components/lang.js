export let LANG = 'enUS';

export function setLang(langCode) {
  LANG = langCode;
}

export function i18n(text) {
  if (typeof text === 'string') return text;
  return text?.[LANG] || Object.values(text)[0] || '';
}
