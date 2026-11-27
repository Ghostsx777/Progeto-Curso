import assert from 'node:assert/strict';
import test from 'node:test';
import {spokenText} from '../scripts/spoken-text.mjs';

test('narra unidades de tempo por extenso e preserva palavras acentuadas', () => {
  assert.equal(spokenText('10min, 1 min. 2h 1s'), '10 minutos, 1 minuto. 2 horas 1 segundo');
  assert.equal(spokenText('“ação” → revisão'.normalize('NFD')), 'ação , depois, revisão');
  assert.equal(spokenText('Leia ´ a próxima seção'), 'Leia a próxima seção');
});
