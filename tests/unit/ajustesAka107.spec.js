import { describe, expect, it } from 'vitest';

import { categoriaDaFonte } from '../../src/utils/fonteResposta.js';
import { NIVEIS_SIGILO, rotuloSigilo } from '../../src/utils/sigilo.js';

describe('níveis de sigilo da aprovação', () => {
  it('enviam o nome do banco, sem acento', () => {
    expect(NIVEIS_SIGILO).toEqual(['PUBLICO', 'INTERNO', 'RESTRITO', 'CONFIDENCIAL']);
  });

  it('mostram o rótulo com acento na tela', () => {
    expect(rotuloSigilo('PUBLICO')).toBe('PÚBLICO');
    expect(rotuloSigilo('RESTRITO')).toBe('RESTRITO');
  });
});

describe('etiqueta da fonte na resposta da IA', () => {
  it('documento do sistema não leva a etiqueta EverySpec', () => {
    expect(categoriaDaFonte({ documento_id: 'abc' })).toBeNull();
  });

  it('base pública sem documento no sistema leva EverySpec', () => {
    expect(categoriaDaFonte({ documento_id: null, url_pdf: 'https://x' })).toBe('EverySpec');
  });
});
