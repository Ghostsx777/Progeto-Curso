export function spokenText(value) {
  return value.normalize('NFC')
    .replace(/(\d+(?:[,.]\d+)?)\s*(min|h|s)\b\.?/giu, (match, number, unit) => {
      const singular = Number(number.replace(',', '.')) === 1;
      const words = {min: 'minuto', h: 'hora', s: 'segundo'};
      const dot = match.endsWith('.') ? '.' : '';
      return number + ' ' + words[unit.toLowerCase()] + (singular ? '' : 's') + dot;
    })
    .replace(/[·•]|\s+[–—]\s+/gu, ', ')
    .replace(/[\u201c\u201d\u201e\u00ab\u00bb\u2018\u2019]/gu, '')
    .replace(/\u2192/gu, ', depois, ')
    .replace(/(?:^|\s)[´`¨^~]+(?=\s|$)/gu, ' ')
    .replace(/\s+/gu, ' ').trim();
}
