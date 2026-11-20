/**
 * services/auditoria.js
 *
 * Consulta do log de auditoria (AKA-81, RF29). Só ADMINISTRADOR: para os
 * outros papéis o backend responde 403.
 *
 * - listarLogsAuditoria: página do log com os filtros (usuário, de/até, ação)
 * - exportarLogsAuditoriaCsv: o resultado filtrado inteiro em CSV
 * - listarUsuariosParaFiltro: opções do filtro de usuário
 */

import { apiFetch, apiFetchArquivo } from './api.js';

/** Query string só com os filtros preenchidos. */
export function consultaDosFiltros({ usuario, de, ate, acao } = {}, page) {
  const params = new URLSearchParams();
  Object.entries({ usuario, de, ate, acao, page }).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') params.append(chave, valor);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * @returns {Promise<{count, page, page_size, total_pages, results, acoes}>}
 */
export function listarLogsAuditoria(filtros, page = 1) {
  return apiFetch(`/api/auditoria/logs/${consultaDosFiltros(filtros, page)}`);
}

/** @returns {Promise<{ blob: Blob, nome: string|null }>} */
export function exportarLogsAuditoriaCsv(filtros) {
  return apiFetchArquivo(`/api/auditoria/logs/exportar/${consultaDosFiltros(filtros)}`);
}

/** Usuários cadastrados, por nome (endpoint de Gestão de Usuários, só admin). */
export async function listarUsuariosParaFiltro() {
  const data = await apiFetch('/api/auth/users/');
  return (data?.users ?? [])
    .map((u) => ({ id: u.id, nome: u.name }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
