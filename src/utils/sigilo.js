/**
 * Níveis de sigilo (fix AKA-107).
 *
 * O valor enviado ao back é o nome cadastrado no banco (sem acento); o rótulo
 * é só o que a tela mostra. Antes a tela enviava "PÚBLICO" e o back
 * respondia "Nível de sigilo inexistente".
 */
export const NIVEIS_SIGILO = ['PUBLICO', 'INTERNO', 'RESTRITO', 'CONFIDENCIAL'];

const ROTULOS = { PUBLICO: 'PÚBLICO' };

export function rotuloSigilo(nivel) {
  return ROTULOS[nivel] || nivel;
}
