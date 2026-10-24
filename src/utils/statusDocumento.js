/**
 * utils/statusDocumento.js
 *
 * Rótulos e tons dos estados de validação do documento, num lugar só, para
 * as telas (Meus documentos, Documentos) não divergirem. Cada tela traduz o
 * `tom` para as próprias classes de CSS.
 */

export const STATUS_VALIDACAO = {
  AGUARDANDO_VALIDACAO: { rotulo: 'Aguardando validação', tom: 'aviso' },
  DEVOLVIDO: { rotulo: 'Devolvido', tom: 'perigo' },
  DISPONIVEL: { rotulo: 'Disponível', tom: 'sucesso' },
};

export const statusValidacao = (valor) =>
  STATUS_VALIDACAO[valor] ?? { rotulo: valor || 'Pendente', tom: 'neutro' };

/** Filtros da tela Meus documentos; `chaveContagem` lê o `contagens` do backend. */
export const FILTROS_STATUS = [
  { valor: '', rotulo: 'Todos', chaveContagem: 'TODOS' },
  {
    valor: 'AGUARDANDO_VALIDACAO',
    rotulo: 'Aguardando validação',
    chaveContagem: 'AGUARDANDO_VALIDACAO',
  },
  { valor: 'DEVOLVIDO', rotulo: 'Devolvidos', chaveContagem: 'DEVOLVIDO' },
  { valor: 'DISPONIVEL', rotulo: 'Disponíveis', chaveContagem: 'DISPONIVEL' },
];

/**
 * Data para exibição em pt-BR. Uma data pura ("AAAA-MM-DD") é lida no fuso
 * local; `new Date("2026-10-23")` seria meia-noite UTC e mostraria o dia
 * anterior em Brasília.
 */
export function formatarData(valor) {
  if (!valor) return '—';
  const soData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor));
  const data = soData ? new Date(+soData[1], +soData[2] - 1, +soData[3]) : new Date(valor);
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleDateString('pt-BR');
}
