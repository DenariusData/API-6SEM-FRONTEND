<script setup>
  /*
   * Meus documentos — S2-38 (AKA-63)
   * Lista os envios do usuário logado (GET /api/documents/meus/?status=&page=)
   * com o estado de cada um. Documento devolvido mostra o comentário do
   * validador em destaque e o botão "Corrigir e reenviar", que abre o
   * formulário de upload em modo edição (AKA-60). O detalhe
   * (GET /api/documents/<id>/) mostra o histórico com data e quem fez.
   */
  import { computed, nextTick, onMounted, ref, watch } from 'vue';
  import {
    FileText,
    RefreshCw,
    Upload,
    Eye,
    RotateCcw,
    MessageSquare,
    X,
    Send,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
  } from 'lucide-vue-next';
  import { listarMeus, detalhe } from '../../services/documentos.js';
  import {
    FILTROS_STATUS as FILTROS,
    formatarData,
    statusValidacao,
  } from '../../utils/statusDocumento.js';

  const emit = defineEmits(['openUploadModal', 'editDocument']);

  /* ---------- Estados de validação (rótulos em utils/statusDocumento.js) ---------- */
  const CLASSE_POR_TOM = {
    aviso: 'etiqueta--amarela',
    perigo: 'etiqueta--vermelha',
    sucesso: 'etiqueta--verde',
    neutro: 'etiqueta--neutra',
  };
  const estado = (valor) => {
    const s = statusValidacao(valor);
    return { rotulo: s.rotulo, classe: CLASSE_POR_TOM[s.tom] };
  };

  const ACOES_HISTORICO = {
    ENVIADO: { rotulo: 'Enviado', icone: Upload, classe: 'marco--enviado' },
    DEVOLVIDO: { rotulo: 'Devolvido', icone: RotateCcw, classe: 'marco--devolvido' },
    REENVIADO: { rotulo: 'Reenviado', icone: Send, classe: 'marco--reenviado' },
    APROVADO: { rotulo: 'Aprovado', icone: CheckCircle2, classe: 'marco--aprovado' },
  };
  const acao = (valor) =>
    ACOES_HISTORICO[valor] ?? { rotulo: valor, icone: FileText, classe: 'marco--enviado' };

  /* ---------- Formatação ---------- */
  const formatarDataHora = (iso) =>
    iso
      ? new Date(iso).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  /* ---------- Lista ---------- */
  const filtro = ref('');
  const pagina = ref(1);
  const totalPaginas = ref(1);
  const total = ref(0);
  const documentos = ref([]);
  const carregando = ref(false);
  const erro = ref('');
  const contagens = ref({});

  // Cada carga ganha um número; resposta de uma carga antiga (filtro ou página
  // trocados no meio do caminho) é descartada.
  let ultimaCarga = 0;

  async function carregar() {
    const carga = ++ultimaCarga;
    carregando.value = true;
    erro.value = '';
    try {
      const resp = await listarMeus({ status: filtro.value, page: pagina.value });
      if (carga !== ultimaCarga) return;
      documentos.value = resp?.results ?? [];
      total.value = resp?.count ?? documentos.value.length;
      totalPaginas.value = Math.max(resp?.total_pages ?? 1, 1);
      // Contagens por estado vêm na mesma resposta (backend AKA-63): sem chamada extra.
      contagens.value = resp?.contagens ?? {};
      // A página ficou vazia (ex.: o único item dela foi reenviado): volta para a última válida.
      if (pagina.value > totalPaginas.value) pagina.value = totalPaginas.value;
    } catch (e) {
      if (carga !== ultimaCarga) return;
      documentos.value = [];
      erro.value = e?.detail || 'Não foi possível carregar os seus documentos.';
    } finally {
      if (carga === ultimaCarga) carregando.value = false;
    }
  }

  const recarregar = () => carregar();

  // Um watch só: trocar o filtro estando na página 2+ volta para a página 1 e
  // carrega UMA vez (a mudança de página dispara a carga).
  watch([filtro, pagina], ([novoFiltro], [filtroAnterior]) => {
    if (novoFiltro !== filtroAnterior && pagina.value !== 1) {
      pagina.value = 1;
      return;
    }
    carregar();
  });

  onMounted(recarregar);

  const TEXTOS_VAZIO = {
    '': 'Você ainda não enviou nenhum documento.',
    AGUARDANDO_VALIDACAO: 'Nenhum documento aguardando validação.',
    DEVOLVIDO: 'Nenhum documento devolvido.',
    DISPONIVEL: 'Nenhum documento disponível ainda.',
  };
  const vazioTexto = computed(() => TEXTOS_VAZIO[filtro.value] ?? TEXTOS_VAZIO['']);

  /* ---------- Detalhe ---------- */
  const detalheAberto = ref(false);
  const carregandoDetalhe = ref(false);
  const erroDetalhe = ref('');
  const docDetalhe = ref(null);
  const detalheRef = ref(null);
  let ultimoDetalhe = 0;
  let focoAnterior = null;

  async function abrirDetalhe(doc) {
    const pedido = ++ultimoDetalhe;
    focoAnterior = document.activeElement;
    detalheAberto.value = true;
    carregandoDetalhe.value = true;
    erroDetalhe.value = '';
    docDetalhe.value = null;
    nextTick(() => detalheRef.value?.focus());
    try {
      const d = await detalhe(doc.id);
      if (pedido === ultimoDetalhe) docDetalhe.value = d;
    } catch (e) {
      if (pedido === ultimoDetalhe) {
        erroDetalhe.value = e?.detail || 'Não foi possível carregar o detalhe do documento.';
      }
    } finally {
      if (pedido === ultimoDetalhe) carregandoDetalhe.value = false;
    }
  }

  function fecharDetalhe() {
    ultimoDetalhe++; // resposta que ainda estiver a caminho é ignorada
    detalheAberto.value = false;
    const foco = focoAnterior;
    focoAnterior = null;
    nextTick(() => foco?.focus?.());
  }

  // Esc fecha; Tab fica preso dentro do modal enquanto ele está aberto.
  function teclaNoDetalhe(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      fecharDetalhe();
      return;
    }
    if (e.key !== 'Tab' || !detalheRef.value) return;
    const focaveis = [
      ...detalheRef.value.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ),
    ];
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    const atual = document.activeElement;
    if (e.shiftKey && (atual === primeiro || atual === detalheRef.value)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && atual === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  }

  // Comentário em destaque no detalhe: o da devolução atual ou o último DEVOLVIDO do histórico.
  const comentarioDetalhe = computed(() => {
    const d = docDetalhe.value;
    if (!d || d.status_validacao !== 'DEVOLVIDO') return '';
    const devolucoes = (d.historico ?? []).filter((h) => h.acao === 'DEVOLVIDO');
    return d.comentario_devolucao || devolucoes[devolucoes.length - 1]?.comentario || '';
  });

  /* ---------- Corrigir e reenviar (abre o modo edição da AKA-60) ---------- */
  const corrigir = (doc) => {
    ultimoDetalhe++;
    focoAnterior = null; // o foco vai para o formulário de correção
    detalheAberto.value = false;
    emit('editDocument', doc.id);
  };

  defineExpose({ recarregar });
</script>

<template>
  <section class="meus-docs">
    <header class="cabecalho">
      <div>
        <h2>Meus documentos</h2>
        <p>Acompanhe o estado de cada documento que você enviou.</p>
      </div>
      <div class="cabecalho__acoes">
        <button
          type="button"
          class="btn btn--sec"
          :disabled="carregando"
          title="Atualizar"
          @click="recarregar"
        >
          <RefreshCw :size="16" :class="{ girando: carregando }" />
          <span>Atualizar</span>
        </button>
        <button type="button" class="btn btn--pri" @click="emit('openUploadModal')">
          <Upload :size="16" />
          <span>Enviar documento</span>
        </button>
      </div>
    </header>

    <!-- Filtro por estado -->
    <div class="filtros" role="group" aria-label="Filtrar por estado">
      <button
        v-for="f in FILTROS"
        :key="f.valor || 'todos'"
        type="button"
        :aria-pressed="filtro === f.valor"
        :class="['filtro', { 'filtro--ativo': filtro === f.valor }]"
        @click="filtro = f.valor"
      >
        {{ f.rotulo }}
        <span v-if="contagens[f.chaveContagem] != null" class="filtro__total">{{
          contagens[f.chaveContagem]
        }}</span>
      </button>
    </div>

    <!-- Estados da lista -->
    <div v-if="carregando && !documentos.length" class="estado-lista">Carregando documentos…</div>

    <div v-else-if="erro" class="estado-lista estado-lista--erro" role="alert">
      <AlertCircle :size="18" />
      <span>{{ erro }}</span>
      <button type="button" class="link" @click="recarregar">Tentar de novo</button>
    </div>

    <div v-else-if="!documentos.length" class="estado-lista">
      <FileText :size="22" />
      <span>{{ vazioTexto }}</span>
    </div>

    <!-- Tabela -->
    <div v-else class="tabela-wrap">
      <table class="tabela">
        <thead>
          <tr>
            <th>Título</th>
            <th>Identificador</th>
            <th>Revisão</th>
            <th>Enviado em</th>
            <th>Estado</th>
            <th class="col-acoes">Ações</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="doc in documentos" :key="doc.id">
            <tr :class="{ 'linha--devolvida': doc.status_validacao === 'DEVOLVIDO' }">
              <td class="col-titulo">{{ doc.titulo }}</td>
              <td class="mono">{{ doc.identificador_codigo }}</td>
              <td>{{ doc.numero_revisao }}</td>
              <td>{{ formatarData(doc.criado_em) }}</td>
              <td>
                <span :class="['etiqueta', estado(doc.status_validacao).classe]">
                  {{ estado(doc.status_validacao).rotulo }}
                </span>
              </td>
              <td class="col-acoes">
                <div class="acoes">
                  <button
                    type="button"
                    class="btn-icone"
                    title="Ver detalhes"
                    @click="abrirDetalhe(doc)"
                  >
                    <Eye :size="16" />
                    <span>Detalhes</span>
                  </button>
                  <button
                    v-if="doc.status_validacao === 'DEVOLVIDO'"
                    type="button"
                    class="btn-icone btn-icone--destaque"
                    @click="corrigir(doc)"
                  >
                    <RotateCcw :size="16" />
                    <span>Corrigir e reenviar</span>
                  </button>
                </div>
              </td>
            </tr>
            <!-- Comentário do validador em destaque, logo abaixo do documento devolvido -->
            <tr
              v-if="doc.status_validacao === 'DEVOLVIDO' && doc.ultimo_comentario_devolucao"
              class="linha-comentario"
            >
              <td colspan="6">
                <div class="comentario">
                  <MessageSquare :size="16" />
                  <div>
                    <strong>Comentário do validador</strong>
                    <p>{{ doc.ultimo_comentario_devolucao }}</p>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Paginação -->
    <footer v-if="totalPaginas > 1" class="paginacao">
      <span>{{ total }} documento(s) · página {{ pagina }} de {{ totalPaginas }}</span>
      <div>
        <button
          type="button"
          class="btn btn--sec"
          :disabled="pagina <= 1 || carregando"
          @click="pagina--"
        >
          <ChevronLeft :size="16" />
          <span>Anterior</span>
        </button>
        <button
          type="button"
          class="btn btn--sec"
          :disabled="pagina >= totalPaginas || carregando"
          @click="pagina++"
        >
          <span>Próxima</span>
          <ChevronRight :size="16" />
        </button>
      </div>
    </footer>

    <!-- Detalhe com histórico -->
    <div v-if="detalheAberto" class="overlay" @click.self="fecharDetalhe">
      <div
        ref="detalheRef"
        class="detalhe"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalhe-titulo"
        tabindex="-1"
        @keydown="teclaNoDetalhe"
      >
        <header class="detalhe__cabecalho">
          <div>
            <h3 id="detalhe-titulo">{{ docDetalhe?.titulo || 'Detalhe do documento' }}</h3>
            <p v-if="docDetalhe">
              {{ docDetalhe.identificador_codigo }} · Revisão {{ docDetalhe.numero_revisao }}
            </p>
          </div>
          <button type="button" class="btn-fechar" aria-label="Fechar" @click="fecharDetalhe">
            <X :size="20" />
          </button>
        </header>

        <div class="detalhe__corpo">
          <div v-if="carregandoDetalhe" class="estado-lista">Carregando…</div>

          <div v-else-if="erroDetalhe" class="estado-lista estado-lista--erro" role="alert">
            <AlertCircle :size="18" />
            <span>{{ erroDetalhe }}</span>
          </div>

          <template v-else-if="docDetalhe">
            <div class="detalhe__estado">
              <span :class="['etiqueta', estado(docDetalhe.status_validacao).classe]">
                {{ estado(docDetalhe.status_validacao).rotulo }}
              </span>
            </div>

            <div v-if="comentarioDetalhe" class="comentario comentario--bloco">
              <MessageSquare :size="16" />
              <div>
                <strong>Comentário do validador</strong>
                <p>{{ comentarioDetalhe }}</p>
              </div>
            </div>

            <dl class="metadados">
              <div>
                <dt>Tipo</dt>
                <dd>{{ docDetalhe.tipo_documento || '—' }}</dd>
              </div>
              <div>
                <dt>Subcategoria</dt>
                <dd>{{ docDetalhe.subcategoria || '—' }}</dd>
              </div>
              <div>
                <dt>Nível sugerido</dt>
                <dd>{{ docDetalhe.nivel_sigilo_sugerido || '—' }}</dd>
              </div>
              <div>
                <dt>Responsável</dt>
                <dd>{{ docDetalhe.responsavel || '—' }}</dd>
              </div>
              <div>
                <dt>Enviado em</dt>
                <dd>{{ formatarDataHora(docDetalhe.criado_em) }}</dd>
              </div>
              <div>
                <dt>Idioma</dt>
                <dd>{{ docDetalhe.idioma || '—' }}</dd>
              </div>
            </dl>

            <h4 class="historico__titulo">Histórico</h4>
            <ol v-if="docDetalhe.historico?.length" class="historico">
              <li
                v-for="(h, i) in docDetalhe.historico"
                :key="h.id ?? `${h.acao}-${h.criado_em}-${i}`"
                :class="['marco', acao(h.acao).classe]"
              >
                <span class="marco__icone"><component :is="acao(h.acao).icone" :size="14" /></span>
                <div class="marco__conteudo">
                  <div class="marco__linha">
                    <strong>{{ acao(h.acao).rotulo }}</strong>
                    <span class="marco__data">{{ formatarDataHora(h.criado_em) }}</span>
                  </div>
                  <span class="marco__quem">por {{ h.usuario || 'usuário não identificado' }}</span>
                  <p v-if="h.comentario" class="marco__comentario">{{ h.comentario }}</p>
                  <span v-if="h.nivel_sigilo" class="marco__quem"
                    >Nível final: {{ h.nivel_sigilo }}</span
                  >
                </div>
              </li>
            </ol>
            <p v-else class="estado-lista">Sem registros no histórico.</p>
          </template>
        </div>

        <footer class="detalhe__rodape">
          <button
            v-if="docDetalhe?.status_validacao === 'DEVOLVIDO'"
            type="button"
            class="btn btn--pri"
            @click="corrigir(docDetalhe)"
          >
            <RotateCcw :size="16" />
            <span>Corrigir e reenviar</span>
          </button>
          <button type="button" class="btn btn--sec" @click="fecharDetalhe">Fechar</button>
        </footer>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .meus-docs {
    /* variáveis globais de assets/styles.css, com o valor atual como reserva */
    --roxo: var(--purple-pill-text, #7e22ce);
    --roxo-escuro: #6b21a8;
    --roxo-claro: var(--purple-pill-bg, #f3e8ff);
    --borda: var(--border-light, #e2e8f0);
    --texto: #0f172a;
    --suave: var(--text-muted, #64748b);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    color: var(--texto);
  }

  .cabecalho {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
  }
  .cabecalho h2 {
    margin: 0 0 0.25rem;
    font-size: 1.35rem;
    font-weight: 700;
  }
  .cabecalho p {
    margin: 0;
    font-size: 0.88rem;
    color: var(--suave);
  }
  .cabecalho__acoes {
    display: flex;
    gap: 0.6rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    height: 38px;
    padding: 0 1rem;
    border-radius: 8px;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .btn--pri {
    background: var(--roxo);
    border: 1px solid var(--roxo);
    color: #fff;
  }
  .btn--pri:not(:disabled):hover {
    background: var(--roxo-escuro);
  }
  .btn--sec {
    background: #fff;
    border: 1px solid #cbd5e1;
    color: #475569;
  }
  .btn--sec:not(:disabled):hover {
    background: #f8fafc;
  }
  .girando {
    animation: girar 0.8s linear infinite;
  }
  @keyframes girar {
    to {
      transform: rotate(360deg);
    }
  }

  /* Filtro */
  .filtros {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .filtro {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.9rem;
    border: 1px solid var(--borda);
    border-radius: 999px;
    background: #fff;
    color: #475569;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .filtro:hover {
    border-color: var(--roxo);
  }
  .filtro--ativo {
    background: var(--roxo-claro);
    border-color: var(--roxo);
    color: var(--roxo);
  }
  .filtro__total {
    min-width: 1.4rem;
    padding: 0 0.35rem;
    border-radius: 999px;
    background: #f1f5f9;
    color: #475569;
    font-size: 0.72rem;
    text-align: center;
  }
  .filtro--ativo .filtro__total {
    background: var(--roxo);
    color: #fff;
  }

  /* Estados */
  .estado-lista {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2.5rem 1rem;
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
    background: #fff;
    color: var(--suave);
    font-size: 0.9rem;
    text-align: center;
  }
  .estado-lista--erro {
    border-color: #fecaca;
    background: #fef2f2;
    color: #991b1b;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--roxo);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
  }

  /* Tabela */
  .tabela-wrap {
    overflow-x: auto;
    border: 1px solid var(--borda);
    border-radius: 12px;
    background: #fff;
  }
  .tabela {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
  .tabela th {
    padding: 0.8rem 1rem;
    border-bottom: 1px solid var(--borda);
    background: #f8fafc;
    color: var(--suave);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-align: left;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .tabela td {
    padding: 0.85rem 0.9rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }
  .tabela tbody tr:last-child td {
    border-bottom: 0;
  }
  .col-titulo {
    font-weight: 600;
    min-width: 200px;
  }
  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.8rem;
    white-space: nowrap;
  }
  .col-acoes {
    width: 1%;
    text-align: right;
  }
  .acoes {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.4rem;
    min-width: 110px;
  }
  .linha--devolvida td {
    border-bottom: 0;
  }
  .linha-comentario td {
    padding-top: 0;
  }

  .btn-icone {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.7rem;
    white-space: nowrap;
    border: 1px solid var(--borda);
    border-radius: 7px;
    background: #fff;
    color: #475569;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-icone:hover {
    border-color: var(--roxo);
    color: var(--roxo);
  }
  .btn-icone--destaque {
    border-color: var(--roxo);
    background: var(--roxo);
    color: #fff;
  }
  .btn-icone--destaque:hover {
    background: var(--roxo-escuro);
    color: #fff;
  }

  /* Etiquetas de estado */
  .etiqueta {
    display: inline-block;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
  }
  .etiqueta--amarela {
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #b45309;
  }
  .etiqueta--vermelha {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
  }
  .etiqueta--verde {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #047857;
  }
  .etiqueta--neutra {
    background: #f1f5f9;
    color: #475569;
  }

  /* Comentário do validador */
  .comentario {
    display: flex;
    gap: 0.6rem;
    padding: 0.7rem 0.9rem;
    border: 1px solid #fecaca;
    border-left: 4px solid #dc2626;
    border-radius: 8px;
    background: #fef2f2;
    color: #7f1d1d;
  }
  .comentario svg {
    flex-shrink: 0;
    margin-top: 0.1rem;
  }
  .comentario strong {
    font-size: 0.78rem;
  }
  .comentario p {
    margin: 0.2rem 0 0;
    font-size: 0.85rem;
    line-height: 1.45;
    white-space: pre-line;
  }
  .comentario--bloco {
    margin-bottom: 1.1rem;
  }

  /* Paginação */
  .paginacao {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.82rem;
    color: var(--suave);
  }
  .paginacao div {
    display: flex;
    gap: 0.5rem;
  }

  /* Detalhe */
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
  }
  .detalhe {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 620px;
    max-height: 90vh;
    overflow: hidden;
    border: 1px solid var(--borda);
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }
  .detalhe__cabecalho {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: #0f172a;
    color: #fff;
  }
  .detalhe__cabecalho h3 {
    margin: 0 0 0.2rem;
    font-size: 1.05rem;
  }
  .detalhe__cabecalho p {
    margin: 0;
    color: #94a3b8;
    font-size: 0.78rem;
  }
  .btn-fechar {
    display: flex;
    padding: 0.35rem;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
  }
  .btn-fechar:hover {
    background: #1e293b;
    color: #fff;
  }
  .detalhe__corpo {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem 1.5rem;
  }
  .detalhe__estado {
    margin-bottom: 1rem;
  }
  .detalhe__rodape {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--borda);
  }

  .metadados {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem 1rem;
    margin: 0 0 1.25rem;
  }
  .metadados dt {
    color: var(--suave);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .metadados dd {
    margin: 0.15rem 0 0;
    font-size: 0.86rem;
  }

  /* Histórico */
  .historico__titulo {
    margin: 0 0 0.75rem;
    color: var(--suave);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .historico {
    position: relative;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .marco {
    position: relative;
    display: flex;
    gap: 0.75rem;
    padding-bottom: 1rem;
  }
  .marco:not(:last-child)::before {
    content: '';
    position: absolute;
    top: 28px;
    bottom: 0;
    left: 13px;
    width: 2px;
    background: var(--borda);
  }
  .marco__icone {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
  }
  .marco--enviado .marco__icone {
    background: var(--roxo-claro);
    color: var(--roxo);
  }
  .marco--devolvido .marco__icone {
    background: #fee2e2;
    color: #b91c1c;
  }
  .marco--reenviado .marco__icone {
    background: #fef3c7;
    color: #b45309;
  }
  .marco--aprovado .marco__icone {
    background: #d1fae5;
    color: #047857;
  }
  .marco__conteudo {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
    padding-top: 0.2rem;
  }
  .marco__linha {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: baseline;
    font-size: 0.86rem;
  }
  .marco__data,
  .marco__quem {
    color: var(--suave);
    font-size: 0.76rem;
  }
  .marco__comentario {
    margin: 0.3rem 0 0;
    padding: 0.5rem 0.7rem;
    border-radius: 7px;
    background: #f8fafc;
    font-size: 0.82rem;
    white-space: pre-line;
  }

  @media (max-width: 640px) {
    .metadados {
      grid-template-columns: 1fr;
    }
    .acoes {
      justify-content: flex-start;
    }
  }
</style>
