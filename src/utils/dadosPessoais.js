/**
 * utils/dadosPessoais.js
 *
 * Regras da tela Meus dados (AKA-56), as mesmas do backend
 * (core_api/services/auth/dados_pessoais.py): nome de 3 a 150 caracteres e
 * e-mail válido com até 180. A validação aqui só evita uma ida ao servidor;
 * quem decide continua sendo o backend.
 */

export const NOME_MINIMO = 3;
export const NOME_MAXIMO = 150;
export const EMAIL_MAXIMO = 180;

// Formato simples (algo@dominio.tld, sem espaços). O backend valida de novo.
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizarNome = (valor) => String(valor ?? '').trim();
export const normalizarEmail = (valor) =>
  String(valor ?? '')
    .trim()
    .toLowerCase();

/** Mensagem de erro do nome, ou '' se estiver válido. */
export function erroNome(valor) {
  const nome = normalizarNome(valor);
  if (nome.length < NOME_MINIMO || nome.length > NOME_MAXIMO) {
    return `O nome deve ter entre ${NOME_MINIMO} e ${NOME_MAXIMO} caracteres.`;
  }
  return '';
}

/** Mensagem de erro do e-mail, ou '' se estiver válido. */
export function erroEmail(valor) {
  const email = normalizarEmail(valor);
  if (!email || email.length > EMAIL_MAXIMO || !FORMATO_EMAIL.test(email)) {
    return 'Informe um e-mail válido.';
  }
  return '';
}

/**
 * Campos que mudaram em relação ao usuário atual, já normalizados, no formato
 * do PATCH /api/auth/me/ ({ nome?, email? }). O e-mail não diferencia
 * maiúsculas, como no backend.
 */
export function camposAlterados(form, usuario) {
  const campos = {};
  if (normalizarNome(form.nome) !== normalizarNome(usuario?.name)) {
    campos.nome = normalizarNome(form.nome);
  }
  if (normalizarEmail(form.email) !== normalizarEmail(usuario?.email)) {
    campos.email = normalizarEmail(form.email);
  }
  return campos;
}
