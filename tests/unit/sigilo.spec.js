import { describe, expect, it } from 'vitest';

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
