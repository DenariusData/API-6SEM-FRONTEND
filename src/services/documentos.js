/**
 * services/documentos.js
 *
 * Catálogo de chamadas de API para o fluxo de documentos técnicos e validação.
 *
 * Funcionalidades:
 * - listarPendentes: Consulta a fila de documentos aguardando validação técnica (administradores).
 * - listarMeus: Consulta os documentos enviados pelo usuário logado (com suporte a filtros de status e paginação).
 * - detalhe: Consulta os metadados completos e histórico de auditoria de um documento.
 * - aprovar: Aprova um documento pendente com nível de sigilo final.
 * - devolver: Devolve um documento pendente com justificativa/comentário obrigatório.
 * - reenviar: Reenvia um documento que foi devolvido para nova validação.
 * - visualizar: Abre o documento no visualizador seguro (total de páginas + log de acesso).
 * - buscarPagina: Baixa uma página como imagem PNG com marca d'água (Blob).
 *
 * Segurança e Autenticação:
 * - Todas as funções utilizam apiFetch centralizado, garantindo o envio automático do cabeçalho
 *   Authorization: Bearer <token>.
 * - Respostas HTTP 401 são interceptadas centralmente, limpando a credencial e redirecionando
 *   para a tela de login.
 */

import { apiFetch, apiFetchBlob } from './api.js';

/**
 * Converte parâmetros de consulta (objeto, string ou número de página) em query string.
 *
 * @param {object|string|number} [params] - Parâmetros de consulta
 * @returns {string} Query string formatada com '?' ou vazia
 */
function toQueryString(params) {
  if (!params) return '';
  if (typeof params === 'string') {
    return params.startsWith('?') ? params : `?${params}`;
  }
  if (typeof params === 'number') {
    return `?page=${params}`;
  }
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Lista os documentos na fila de validação (status AGUARDANDO_VALIDACAO).
 * Exclusivo para usuários com permissão de validação (Administrador).
 *
 * @param {object|string|number} [params] - Parâmetros como { page: 1 }
 * @returns {Promise<object>} Lista paginada contendo { count, page, page_size, total_pages, results }
 */
export async function listarPendentes(params) {
  const qs = toQueryString(params);
  return apiFetch(`/api/documents/pendentes/${qs}`);
}

/**
 * Lista os documentos enviados pelo próprio usuário autenticado ("Meus Documentos").
 *
 * @param {object|string} [params] - Parâmetros como { status: 'DEVOLVIDO', page: 1 }
 * @returns {Promise<object>} Lista paginada de documentos do usuário ({ count, page, page_size, total_pages, results })
 */
export async function listarMeus(params) {
  const qs = toQueryString(params);
  return apiFetch(`/api/documents/meus/${qs}`);
}

/**
 * Obtém os detalhes completos de um documento técnico, incluindo metadados,
 * histórico de validação e parecer de devolução (se houver).
 *
 * @param {string|number} id - Identificador único (UUID) do documento
 * @returns {Promise<object>} Objeto com os detalhes do documento
 */
export async function detalhe(id) {
  if (!id) {
    throw new Error('O identificador do documento é obrigatório.');
  }
  return apiFetch(`/api/documents/${id}/`);
}

/**
 * Aprova um documento que está aguardando validação.
 *
 * @param {string|number} id - Identificador único do documento
 * @param {object} [dados={}] - Payload opcional (ex: { nivel_sigilo: 'INTERNO', confirmar_confidencial: true })
 * @returns {Promise<object>} Registro do documento aprovado
 */
export async function aprovar(id, dados = {}) {
  if (!id) {
    throw new Error('O identificador do documento é obrigatório.');
  }
  return apiFetch(`/api/documents/${id}/aprovar/`, {
    method: 'POST',
    body: dados,
  });
}

/**
 * Devolve um documento ao autor para correções com motivo/comentário obrigatório.
 *
 * @param {string|number} id - Identificador único do documento
 * @param {string|object} motivoOuDados - Texto do comentário ou objeto { comentario: '...' }
 * @returns {Promise<object>} Registro do documento devolvido
 */
export async function devolver(id, motivoOuDados) {
  if (!id) {
    throw new Error('O identificador do documento é obrigatório.');
  }

  let body = {};
  if (typeof motivoOuDados === 'string') {
    body = { comentario: motivoOuDados };
  } else if (motivoOuDados && typeof motivoOuDados === 'object') {
    body = { ...motivoOuDados };
  }

  return apiFetch(`/api/documents/${id}/devolver/`, {
    method: 'POST',
    body,
  });
}

/**
 * Reenvia um documento devolvido para nova rodada de validação técnica.
 *
 * @param {string|number} id - Identificador único do documento
 * @param {object|FormData} [dados={}] - Novos metadados ou arquivo corrigido
 * @returns {Promise<object>} Registro do documento reenviado
 */
export async function reenviar(id, dados = {}) {
  if (!id) {
    throw new Error('O identificador do documento é obrigatório.');
  }
  return apiFetch(`/api/documents/${id}/reenviar/`, {
    method: 'POST',
    body: dados,
  });
}

/**
 * Abre o documento no visualizador seguro (AKA-48 / AKA-61).
 * O backend registra a VISUALIZACAO no log de acesso.
 *
 * @param {string} id - Identificador único (UUID) do documento
 * @returns {Promise<object>} { total_paginas, titulo }
 */
export async function visualizar(id) {
  if (!id) {
    throw new Error('O identificador do documento é obrigatório.');
  }
  return apiFetch(`/api/documents/${id}/visualizar/`);
}

/**
 * Busca uma página do documento como imagem PNG com marca d'água.
 * O PDF original nunca chega ao navegador.
 *
 * @param {string} id - Identificador único (UUID) do documento
 * @param {number} numero - Número da página (começa em 1)
 * @param {object} [options] - Opções do fetch (ex.: { signal } para cancelar)
 * @returns {Promise<Blob>} Imagem da página
 */
export async function buscarPagina(id, numero, options = {}) {
  if (!id) {
    throw new Error('O identificador do documento é obrigatório.');
  }
  return apiFetchBlob(`/api/documents/${id}/paginas/${numero}/`, options);
}

export default {
  listarPendentes,
  listarMeus,
  detalhe,
  aprovar,
  devolver,
  reenviar,
  visualizar,
  buscarPagina,
};
