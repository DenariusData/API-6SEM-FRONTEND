import { describe, expect, it } from 'vitest';

import { categoriaDaFonte } from '../../src/utils/fonteResposta.js';

describe('etiqueta da fonte na resposta da IA', () => {
  it('documento do sistema não leva a etiqueta EverySpec', () => {
    expect(categoriaDaFonte({ documento_id: 'abc' })).toBeNull();
  });

  it('base pública sem documento no sistema leva EverySpec', () => {
    expect(categoriaDaFonte({ documento_id: null, url_pdf: 'https://x' })).toBe('EverySpec');
  });
});
