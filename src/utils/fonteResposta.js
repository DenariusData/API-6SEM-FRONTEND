/**
 * Etiqueta da origem de uma fonte na resposta da IA (fix AKA-107).
 *
 * Documento do acervo do sistema (tem documento_id) não leva etiqueta de
 * origem externa: a tela mostra a etiqueta padrão ("Documento Técnico").
 * Só a base pública do EverySpec, sem documento no sistema, é marcada assim.
 */
export function categoriaDaFonte(fonte) {
  return fonte?.documento_id ? null : 'EverySpec';
}
