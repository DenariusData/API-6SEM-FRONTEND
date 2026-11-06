<script setup>
  /**
   * DocumentViewer (AKA-61)
   *
   * Visualizador seguro de documentos, usado na resposta da IA, na fila de validação
   * e em Meus Documentos.
   * - Cada página é buscada com fetch + token e exibida via URL.createObjectURL(blob).
   *   Não usa iframe, embed nem link direto para o arquivo.
   * - Mantém em memória só a página atual e a próxima; os blob URLs das demais são
   *   revogados ao trocar de página e todos são revogados ao fechar.
   * - Sem download nem impressão: imagem com draggable="false", sem menu de contexto
   *   e com Ctrl+S / Ctrl+P bloqueados enquanto o visualizador está aberto.
   */
  import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
  import { visualizar, buscarPagina } from '../services/documentos.js';
  import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Maximize,
    Loader2,
    AlertCircle,
    Lock,
    RefreshCw,
  } from 'lucide-vue-next';

  const props = defineProps({
    documentId: {
      type: String,
      required: true,
    },
    paginaInicial: {
      type: Number,
      default: 1,
    },
    titulo: {
      type: String,
      default: '',
    },
  });

  const ZOOM_MIN = 50;
  const ZOOM_MAX = 300;
  const ZOOM_PASSO = 25;

  // 'carregando' | 'pronto' | 'erro' | 'sem-permissao'
  const estado = ref('carregando');
  const mensagemErro = ref('');
  const tituloDocumento = ref('');
  const totalPaginas = ref(0);

  const paginaAtual = ref(1);
  const paginaDigitada = ref('1');
  // 'carregando' | 'pronta' | 'erro'
  const estadoPagina = ref('carregando');
  const erroPagina = ref('');
  const imagemUrl = ref(null);
  const zoom = ref(100);

  const temAnterior = computed(() => paginaAtual.value > 1);
  const temProxima = computed(() => paginaAtual.value < totalPaginas.value);

  // numero da página -> { url, controller, promise }
  const cache = new Map();
  // Incrementado a cada abertura/fechamento para descartar respostas antigas
  let geracao = 0;

  const liberar = (numero) => {
    const entrada = cache.get(numero);
    if (!entrada) return;
    entrada.controller?.abort();
    if (entrada.url) URL.revokeObjectURL(entrada.url);
    cache.delete(numero);
  };

  const liberarTudo = () => {
    [...cache.keys()].forEach(liberar);
  };

  const carregar = (numero) => {
    if (cache.has(numero)) return cache.get(numero).promise;

    const controller = new AbortController();
    const entrada = { url: null, controller, promise: null };
    entrada.promise = buscarPagina(props.documentId, numero, { signal: controller.signal })
      .then((blob) => {
        // Página descartada enquanto baixava: não cria blob URL
        if (cache.get(numero) !== entrada) return null;
        entrada.url = URL.createObjectURL(blob);
        entrada.controller = null;
        return entrada.url;
      })
      .catch((err) => {
        if (cache.get(numero) === entrada) cache.delete(numero);
        throw err;
      });

    cache.set(numero, entrada);
    return entrada.promise;
  };

  const mensagemSemPermissao =
    'Documento não encontrado ou você não tem permissão para visualizá-lo.';

  const tratarErroGeral = (err) => {
    if (err?.status === 403 || err?.status === 404) {
      estado.value = 'sem-permissao';
      mensagemErro.value = err?.status === 403 ? err.detail : mensagemSemPermissao;
      return;
    }
    estado.value = 'erro';
    mensagemErro.value =
      err?.detail || err?.message || 'Não foi possível abrir o documento. Tente novamente.';
  };

  const mostrarPagina = async (numero) => {
    paginaAtual.value = numero;
    paginaDigitada.value = String(numero);
    erroPagina.value = '';

    imagemUrl.value = cache.get(numero)?.url || null;
    estadoPagina.value = imagemUrl.value ? 'pronta' : 'carregando';

    // Só a página atual e a próxima ficam carregadas
    [...cache.keys()].forEach((k) => {
      if (k !== numero && k !== numero + 1) liberar(k);
    });

    const atual = carregar(numero);
    if (numero + 1 <= totalPaginas.value) {
      carregar(numero + 1).catch(() => {});
    }

    try {
      const url = await atual;
      if (paginaAtual.value !== numero || !url) return;
      imagemUrl.value = url;
      estadoPagina.value = 'pronta';
    } catch (err) {
      if (err?.name === 'AbortError' || paginaAtual.value !== numero) return;
      if (err?.status === 403) {
        tratarErroGeral(err);
        return;
      }
      estadoPagina.value = 'erro';
      erroPagina.value =
        err?.status === 404
          ? 'Página não encontrada.'
          : err?.detail || err?.message || 'Não foi possível carregar esta página.';
    }
  };

  const irPara = (numero) => {
    const n = Number.parseInt(numero, 10);
    if (!Number.isFinite(n) || n < 1 || n > totalPaginas.value) {
      paginaDigitada.value = String(paginaAtual.value);
      return;
    }
    if (n !== paginaAtual.value) mostrarPagina(n);
  };

  const paginaAnterior = () => temAnterior.value && irPara(paginaAtual.value - 1);
  const proximaPagina = () => temProxima.value && irPara(paginaAtual.value + 1);

  const aumentarZoom = () => {
    zoom.value = Math.min(ZOOM_MAX, zoom.value + ZOOM_PASSO);
  };
  const diminuirZoom = () => {
    zoom.value = Math.max(ZOOM_MIN, zoom.value - ZOOM_PASSO);
  };
  const resetarZoom = () => {
    zoom.value = 100;
  };

  const abrir = async () => {
    geracao += 1;
    const minhaGeracao = geracao;

    liberarTudo();
    imagemUrl.value = null;
    estado.value = 'carregando';
    mensagemErro.value = '';
    totalPaginas.value = 0;
    zoom.value = 100;

    try {
      const data = await visualizar(props.documentId);
      if (minhaGeracao !== geracao) return;

      totalPaginas.value = Number(data?.total_paginas) || 0;
      tituloDocumento.value = data?.titulo || props.titulo;
      if (totalPaginas.value < 1) {
        estado.value = 'erro';
        mensagemErro.value = 'O documento não possui páginas para exibir.';
        return;
      }

      estado.value = 'pronto';
      const inicial = Math.min(Math.max(1, props.paginaInicial || 1), totalPaginas.value);
      mostrarPagina(inicial);
    } catch (err) {
      if (minhaGeracao !== geracao) return;
      tratarErroGeral(err);
    }
  };

  const tentarNovamente = () => {
    if (estado.value === 'pronto') {
      mostrarPagina(paginaAtual.value);
    } else {
      abrir();
    }
  };

  const onTeclado = (event) => {
    if (event.target?.tagName === 'INPUT') return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      paginaAnterior();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      proximaPagina();
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      aumentarZoom();
    } else if (event.key === '-') {
      event.preventDefault();
      diminuirZoom();
    }
  };

  // Bloqueia "Salvar como" e "Imprimir" enquanto o visualizador estiver aberto
  const bloquearAtalhos = (event) => {
    const tecla = event.key?.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && (tecla === 's' || tecla === 'p')) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  watch(
    () => props.documentId,
    () => abrir()
  );

  onMounted(() => {
    window.addEventListener('keydown', bloquearAtalhos, true);
    abrir();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', bloquearAtalhos, true);
    geracao += 1;
    imagemUrl.value = null;
    liberarTudo();
  });
</script>

<template>
  <div
    class="document-viewer"
    tabindex="0"
    aria-label="Visualizador de documento"
    @keydown="onTeclado"
    @contextmenu.prevent
  >
    <!-- Barra de ferramentas: navegação e zoom (sem download/impressão) -->
    <div class="viewer-toolbar">
      <span class="viewer-title" :title="tituloDocumento || titulo">
        {{ tituloDocumento || titulo || 'Documento' }}
      </span>

      <div v-if="estado === 'pronto'" class="viewer-controls">
        <div class="control-group">
          <button
            type="button"
            class="viewer-btn"
            title="Página anterior"
            :disabled="!temAnterior"
            @click="paginaAnterior"
          >
            <ChevronLeft :size="16" />
          </button>
          <label class="page-indicator">
            <span class="sr-only">Número da página</span>
            <input
              v-model="paginaDigitada"
              type="number"
              class="page-input"
              min="1"
              :max="totalPaginas"
              @keydown.enter.prevent="irPara(paginaDigitada)"
              @blur="irPara(paginaDigitada)"
            />
            <span class="page-total">de {{ totalPaginas }}</span>
          </label>
          <button
            type="button"
            class="viewer-btn"
            title="Próxima página"
            :disabled="!temProxima"
            @click="proximaPagina"
          >
            <ChevronRight :size="16" />
          </button>
        </div>

        <div class="control-group">
          <button
            type="button"
            class="viewer-btn"
            title="Diminuir zoom"
            :disabled="zoom <= ZOOM_MIN"
            @click="diminuirZoom"
          >
            <ZoomOut :size="16" />
          </button>
          <span class="zoom-value">{{ zoom }}%</span>
          <button
            type="button"
            class="viewer-btn"
            title="Aumentar zoom"
            :disabled="zoom >= ZOOM_MAX"
            @click="aumentarZoom"
          >
            <ZoomIn :size="16" />
          </button>
          <button
            type="button"
            class="viewer-btn"
            title="Ajustar à largura"
            :disabled="zoom === 100"
            @click="resetarZoom"
          >
            <Maximize :size="15" />
          </button>
        </div>
      </div>
    </div>

    <div class="viewer-stage">
      <div v-if="estado === 'carregando'" class="viewer-state">
        <Loader2 :size="28" class="spin-icon" />
        <span>Abrindo documento...</span>
      </div>

      <div v-else-if="estado === 'sem-permissao'" class="viewer-state state-denied">
        <Lock :size="30" />
        <strong>Acesso não permitido</strong>
        <span>{{ mensagemErro }}</span>
      </div>

      <div v-else-if="estado === 'erro'" class="viewer-state state-error">
        <AlertCircle :size="30" />
        <span>{{ mensagemErro }}</span>
        <button type="button" class="retry-btn" @click="tentarNovamente">
          <RefreshCw :size="14" />
          <span>Tentar novamente</span>
        </button>
      </div>

      <template v-else>
        <div v-if="estadoPagina === 'carregando'" class="viewer-state">
          <Loader2 :size="28" class="spin-icon" />
          <span>Carregando página {{ paginaAtual }}...</span>
        </div>

        <div v-else-if="estadoPagina === 'erro'" class="viewer-state state-error">
          <AlertCircle :size="30" />
          <span>{{ erroPagina }}</span>
          <button type="button" class="retry-btn" @click="tentarNovamente">
            <RefreshCw :size="14" />
            <span>Tentar novamente</span>
          </button>
        </div>

        <div v-else class="page-wrapper" :style="{ width: `${zoom}%` }">
          <img
            :src="imagemUrl"
            :alt="`Página ${paginaAtual} de ${totalPaginas}`"
            class="page-image"
            draggable="false"
            @dragstart.prevent
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
  .document-viewer {
    display: flex;
    flex-direction: column;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    overflow: hidden;
    outline: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .document-viewer:focus-visible {
    border-color: #a855f7;
  }

  .viewer-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding: 0.55rem 0.85rem;
    background: #1e293b;
    border-bottom: 1px solid #334155;
  }

  .viewer-title {
    flex: 1;
    min-width: 0;
    font-size: 0.82rem;
    font-weight: 600;
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .viewer-controls {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex-wrap: wrap;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .viewer-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background: #334155;
    border: none;
    border-radius: 6px;
    color: #f1f5f9;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .viewer-btn:hover:not(:disabled) {
    background: #475569;
  }

  .viewer-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .page-indicator {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.78rem;
    color: #94a3b8;
  }

  .page-input {
    width: 3.2rem;
    padding: 0.3rem 0.35rem;
    background: #0f172a;
    border: 1px solid #475569;
    border-radius: 6px;
    color: #ffffff;
    font-size: 0.8rem;
    text-align: center;
    outline: none;
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .page-input::-webkit-outer-spin-button,
  .page-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .page-input:focus {
    border-color: #a855f7;
  }

  .page-total {
    white-space: nowrap;
  }

  .zoom-value {
    min-width: 3rem;
    text-align: center;
    font-size: 0.78rem;
    font-weight: 600;
    color: #cbd5e1;
  }

  .viewer-stage {
    height: 60vh;
    min-height: 320px;
    overflow: auto;
    padding: 1rem;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .page-wrapper {
    flex-shrink: 0;
    max-width: none;
  }

  .page-image {
    display: block;
    width: 100%;
    height: auto;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    pointer-events: none;
    -webkit-user-drag: none;
    user-select: none;
  }

  .viewer-state {
    align-self: center;
    margin: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    max-width: 420px;
    text-align: center;
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .state-denied {
    color: #fbbf24;
  }

  .state-denied strong {
    color: #ffffff;
    font-size: 0.95rem;
  }

  .state-error {
    color: #f87171;
  }

  .retry-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.25rem;
    padding: 0.4rem 0.85rem;
    background: #334155;
    border: none;
    border-radius: 6px;
    color: #f1f5f9;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
  }

  .retry-btn:hover {
    background: #475569;
  }

  .spin-icon {
    animation: viewer-spin 1s linear infinite;
    color: #a855f7;
  }

  @keyframes viewer-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  /* Impressão: o conteúdo do documento nunca vai para o papel */
  @media print {
    .document-viewer {
      display: none !important;
    }
  }
</style>
