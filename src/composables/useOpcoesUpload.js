/**
 * composables/useOpcoesUpload.js
 *
 * Opções dos selects do formulário de upload (S2-32), com cache em nível de
 * módulo: o modal é destruído ao fechar (v-if), mas as listas continuam aqui,
 * então reabrir o formulário não refaz as requisições. Para recarregar, use o
 * "Tentar de novo" (forcar = true).
 *
 * Contrato do backend (core_api/views/opcoes_upload_views.py):
 *   { "results": [{ "id" | "codigo", "nome" }] }
 *   áreas: cada item traz "categorias", e cada categoria traz "subcategorias".
 * Qualquer resposta fora desse formato marca a lista como falha (visível na
 * tela), em vez de deixar o select vazio sem aviso.
 */

import { reactive } from 'vue';
import {
  listarAreas,
  listarIdiomas,
  listarNiveisSigilo,
  listarResponsaveis,
  listarTiposDocumento,
} from '../services/api.js';

export class FormatoInvalido extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'FormatoInvalido';
  }
}

function exigirLista(valor, onde) {
  if (!Array.isArray(valor)) {
    throw new FormatoInvalido(`Esperava uma lista em "${onde}".`);
  }
  return valor;
}

/** Lê `resp.results`; qualquer outro formato é erro. */
export function lerResults(resp) {
  return exigirLista(resp?.results, 'results');
}

/** { id | codigo, nome } -> { value, label } */
export function paraOpcao(item) {
  const id = item?.id ?? item?.codigo;
  if (id === undefined || id === null || typeof item?.nome !== 'string') {
    throw new FormatoInvalido('Item sem "id"/"codigo" ou sem "nome".');
  }
  return { value: String(id), label: item.nome };
}

export function paraArea(area) {
  return {
    ...paraOpcao(area),
    categorias: exigirLista(area.categorias, 'categorias').map((categoria) => ({
      ...paraOpcao(categoria),
      subcategorias: exigirLista(categoria.subcategorias, 'subcategorias').map(paraOpcao),
    })),
  };
}

const FONTES = {
  tipos: { buscar: listarTiposDocumento, mapear: paraOpcao },
  areas: { buscar: listarAreas, mapear: paraArea },
  niveis: { buscar: listarNiveisSigilo, mapear: paraOpcao },
  idiomas: { buscar: listarIdiomas, mapear: paraOpcao },
};

const CHAVES = [...Object.keys(FONTES), 'responsaveis'];
const porChave = (valor) => Object.fromEntries(CHAVES.map((c) => [c, valor()]));

// Estado compartilhado entre todas as instâncias do formulário.
const opcoes = reactive(porChave(() => []));
const carregando = reactive(porChave(() => false));
const falhou = reactive(porChave(() => false));

const carregadas = new Set();
const responsaveisPorArea = new Map();
let pedidoResponsaveis = 0;

function registrarFalha(chave, erro) {
  // Só em desenvolvimento, e sem o corpo da resposta (pode ter dados pessoais).
  if (import.meta.env.DEV) {
    console.error(
      `[opções do upload] falha ao carregar "${chave}":`,
      erro?.status ? `HTTP ${erro.status}` : erro?.message
    );
  }
}

async function carregar(chave, forcar = false) {
  if (!forcar && carregadas.has(chave)) return;
  carregando[chave] = true;
  falhou[chave] = false;
  try {
    const { buscar, mapear } = FONTES[chave];
    opcoes[chave] = lerResults(await buscar()).map(mapear);
    carregadas.add(chave);
  } catch (erro) {
    opcoes[chave] = [];
    falhou[chave] = true;
    carregadas.delete(chave);
    registrarFalha(chave, erro);
  } finally {
    carregando[chave] = false;
  }
}

function carregarTodas() {
  return Promise.all(Object.keys(FONTES).map((chave) => carregar(chave)));
}

/** Responsáveis da área principal (GET /api/responsaveis/?area=<id>). */
async function carregarResponsaveis(area, forcar = false) {
  const pedido = ++pedidoResponsaveis;
  falhou.responsaveis = false;

  if (!area) {
    opcoes.responsaveis = [];
    carregando.responsaveis = false;
    return;
  }
  if (!forcar && responsaveisPorArea.has(area)) {
    opcoes.responsaveis = responsaveisPorArea.get(area);
    carregando.responsaveis = false;
    return;
  }

  opcoes.responsaveis = [];
  carregando.responsaveis = true;
  try {
    const lista = lerResults(await listarResponsaveis(area)).map(paraOpcao);
    responsaveisPorArea.set(area, lista);
    // Ignora a resposta se o usuário já trocou de área enquanto carregava.
    if (pedido === pedidoResponsaveis) opcoes.responsaveis = lista;
  } catch (erro) {
    if (pedido === pedidoResponsaveis) falhou.responsaveis = true;
    registrarFalha('responsaveis', erro);
  } finally {
    if (pedido === pedidoResponsaveis) carregando.responsaveis = false;
  }
}

export function useOpcoesUpload() {
  return { opcoes, carregando, falhou, carregar, carregarTodas, carregarResponsaveis };
}
