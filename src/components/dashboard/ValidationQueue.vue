<script setup>
  import { ref, onMounted } from 'vue';
  import { listarPendentes, detalhe, aprovar, devolver } from '../../services/documentos.js';
  import DocumentViewer from '../DocumentViewer.vue';
  import {
    ShieldCheck,
    Check,
    RotateCcw,
    Eye,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
    FileText,
    Calendar,
    User,
    Lock,
  } from 'lucide-vue-next';

  defineProps({
    currentUser: {
      type: Object,
      default: () => ({
        role: 'Administrador',
        matricula: 'AK-10001',
        pode_validar: true,
      }),
    },
  });

  const emit = defineEmits(['item-decidido']);

  // Estado da lista
  const items = ref([]);
  const loading = ref(false);
  const feedbackMessage = ref('');
  const feedbackType = ref('success'); // 'success' | 'error'

  // Modal de Detalhes
  const showDetailModal = ref(false);
  const loadingDetail = ref(false);
  const currentDetail = ref(null);
  const detailError = ref('');

  // Modal de Aprovação (AKA-53)
  const showAprovarModal = ref(false);
  const documentoParaAprovar = ref(null);
  const nivelSigiloEscolhido = ref('INTERNO');
  const confirmarConfidencialChecked = ref(false);
  const erroAprovacao = ref('');

  // Modal de Devolução
  const showDevolverModal = ref(false);
  const documentoParaDevolver = ref(null);
  const comentarioDevolucao = ref('');
  const erroDevolucao = ref('');

  // Estado de submissão
  const processandoAcao = ref(false);

  const opcoesSigilo = ['PÚBLICO', 'INTERNO', 'RESTRITO', 'CONFIDENCIAL'];

  const carregarDocumentos = async () => {
    loading.value = true;
    feedbackMessage.value = '';

    try {
      const data = await listarPendentes({ page: 1 });
      const docs = data?.results ?? (Array.isArray(data) ? data : []);
      items.value = docs;
      emit('item-decidido', data?.count ?? docs.length);
    } catch (err) {
      items.value = [];
      feedbackType.value = 'error';
      feedbackMessage.value =
        err?.detail ||
        err?.message ||
        'Não foi possível conectar ao servidor para consultar a fila de validação.';
    } finally {
      loading.value = false;
    }
  };

  const abrirDetalhe = async (doc) => {
    currentDetail.value = doc;
    showDetailModal.value = true;
    loadingDetail.value = true;
    detailError.value = '';

    try {
      const data = await detalhe(doc.id);
      if (data) {
        currentDetail.value = { ...doc, ...data };
      }
    } catch (err) {
      if (err?.status === 404) {
        detailError.value = 'Documento não encontrado ou indisponível. A lista será atualizada.';
        items.value = items.value.filter((i) => i.id !== doc.id);
        emit('item-decidido', items.value.length);
      } else {
        detailError.value =
          err?.detail ||
          err?.message ||
          'Não foi possível carregar os detalhes completos do documento.';
      }
    } finally {
      loadingDetail.value = false;
    }
  };

  const iniciarAprovar = (doc) => {
    documentoParaAprovar.value = doc;
    nivelSigiloEscolhido.value = doc.nivel_sigilo_sugerido || doc.nivel_sigilo || 'INTERNO';
    confirmarConfidencialChecked.value = false;
    erroAprovacao.value = '';
    showAprovarModal.value = true;
  };

  const handleConfirmarAprovar = async () => {
    if (!documentoParaAprovar.value) return;

    if (nivelSigiloEscolhido.value === 'CONFIDENCIAL' && !confirmarConfidencialChecked.value) {
      erroAprovacao.value =
        'É obrigatório marcar a caixa de confirmação para atribuir nível CONFIDENCIAL.';
      return;
    }

    processandoAcao.value = true;
    erroAprovacao.value = '';

    const docId = documentoParaAprovar.value.id;
    const docCodigo =
      documentoParaAprovar.value.identificador_codigo || documentoParaAprovar.value.titulo;

    try {
      const payload = {
        nivel_sigilo: nivelSigiloEscolhido.value,
        confirmar_confidencial: nivelSigiloEscolhido.value === 'CONFIDENCIAL',
      };

      await aprovar(docId, payload);

      // Sucesso: remove o item da lista e fecha os modais
      items.value = items.value.filter((i) => i.id !== docId);
      showAprovarModal.value = false;
      showDetailModal.value = false;
      feedbackType.value = 'success';
      feedbackMessage.value = `Documento ${docCodigo} aprovado com sucesso com sigilo ${nivelSigiloEscolhido.value}!`;
      emit('item-decidido', items.value.length);
    } catch (err) {
      if (err?.status === 409) {
        // Conflito: outro validador já decidiu o documento
        items.value = items.value.filter((i) => i.id !== docId);
        showAprovarModal.value = false;
        showDetailModal.value = false;
        feedbackType.value = 'error';
        feedbackMessage.value = 'Outro validador já decidiu este documento.';
        emit('item-decidido', items.value.length);
      } else if (err?.status === 403) {
        const detailStr = String(err?.detail || '').toLowerCase();
        if (detailStr.includes('enviado por você') || detailStr.includes('autor')) {
          erroAprovacao.value = 'Você não pode aprovar um documento enviado por você.';
        } else {
          erroAprovacao.value =
            'Você não tem permissão para aprovar documentos. É necessário privilégio de Administrador.';
        }
      } else {
        erroAprovacao.value =
          err?.detail || err?.message || 'Falha ao aprovar documento. Tente novamente.';
      }
    } finally {
      processandoAcao.value = false;
    }
  };

  const iniciarDevolver = (doc) => {
    documentoParaDevolver.value = doc;
    comentarioDevolucao.value = '';
    erroDevolucao.value = '';
    showDevolverModal.value = true;
  };

  const handleConfirmarDevolver = async () => {
    if (!documentoParaDevolver.value) return;

    if (comentarioDevolucao.value.trim().length < 10) {
      erroDevolucao.value = 'O comentário de devolução deve conter no mínimo 10 caracteres.';
      return;
    }

    processandoAcao.value = true;
    erroDevolucao.value = '';

    const docId = documentoParaDevolver.value.id;
    const docCodigo =
      documentoParaDevolver.value.identificador_codigo || documentoParaDevolver.value.titulo;

    try {
      await devolver(docId, {
        comentario: comentarioDevolucao.value.trim(),
      });

      // Sucesso: remove o item da lista e fecha os modais
      items.value = items.value.filter((i) => i.id !== docId);
      showDevolverModal.value = false;
      showDetailModal.value = false;
      feedbackType.value = 'success';
      feedbackMessage.value = `Documento ${docCodigo} devolvido para correção com sucesso!`;
      emit('item-decidido', items.value.length);
    } catch (err) {
      if (err?.status === 409) {
        // Conflito: outro validador já decidiu o documento
        items.value = items.value.filter((i) => i.id !== docId);
        showDevolverModal.value = false;
        showDetailModal.value = false;
        feedbackType.value = 'error';
        feedbackMessage.value = 'Outro validador já decidiu este documento.';
        emit('item-decidido', items.value.length);
      } else if (err?.status === 403) {
        const detailStr = String(err?.detail || '').toLowerCase();
        if (detailStr.includes('enviado por você') || detailStr.includes('autor')) {
          erroDevolucao.value = 'Você não pode devolver um documento enviado por você.';
        } else {
          erroDevolucao.value =
            'Você não tem permissão para devolver documentos. É necessário privilégio de Administrador.';
        }
      } else {
        erroDevolucao.value =
          err?.detail || err?.message || 'Falha ao devolver documento. Tente novamente.';
      }
    } finally {
      processandoAcao.value = false;
    }
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '—';
    try {
      return new Date(dataStr).toLocaleDateString('pt-BR');
    } catch {
      return dataStr;
    }
  };

  const getSigiloClass = (sigilo) => {
    switch (sigilo?.toUpperCase()) {
      case 'CONFIDENCIAL':
        return 'sigilo-confidencial';
      case 'RESTRITO':
        return 'sigilo-restrito';
      case 'PÚBLICO':
      case 'PUBLICO':
        return 'sigilo-publico';
      default:
        return 'sigilo-interno';
    }
  };

  onMounted(() => {
    carregarDocumentos();
  });
</script>

<template>
  <section class="validation-queue-container fade-in">
    <!-- Header e Controles -->
    <header class="queue-header">
      <div class="header-text-group">
        <div class="title-with-badge">
          <h2 class="queue-title">Fila de Validação Técnica</h2>
          <span class="count-pill" title="Total de documentos pendentes">
            {{ items.length }} pendente{{ items.length === 1 ? '' : 's' }}
          </span>
        </div>
        <p class="queue-subtitle">
          Analise documentos submetidos pela equipe técnica, confirme o nível de sigilo ou devolva
          com parecer de correções.
        </p>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="btn-refresh"
          :disabled="loading"
          title="Recarregar fila de validação"
          @click="carregarDocumentos"
        >
          <RefreshCw :size="16" :class="{ 'spin-icon': loading }" />
          <span>Atualizar</span>
        </button>
      </div>
    </header>

    <!-- Feedback Banner -->
    <div
      v-if="feedbackMessage"
      :class="[
        'feedback-banner',
        feedbackType === 'success' ? 'feedback-success' : 'feedback-error',
      ]"
    >
      <component :is="feedbackType === 'success' ? CheckCircle2 : AlertCircle" :size="18" />
      <span class="feedback-text">{{ feedbackMessage }}</span>
      <button class="feedback-close-btn" @click="feedbackMessage = ''">&times;</button>
    </div>

    <!-- Tabela de Documentos Pendentes -->
    <div class="queue-card">
      <div v-if="loading" class="state-container">
        <div class="spinner"></div>
        <span>Carregando fila de documentos pendentes...</span>
      </div>

      <div v-else-if="!items || items.length === 0" class="state-container empty-state">
        <ShieldCheck :size="48" class="empty-icon" />
        <h4 class="empty-title">Nenhum documento pendente</h4>
        <p class="empty-desc">
          Todos os documentos enviados já foram validados ou não há novas submissões no momento.
        </p>
      </div>

      <div v-else class="table-responsive">
        <table class="validation-table">
          <thead>
            <tr>
              <th>Identificador</th>
              <th>Título</th>
              <th>Revisão</th>
              <th>Autor</th>
              <th>Nível Sugerido</th>
              <th>Data de Envio</th>
              <th class="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="doc in items"
              :key="doc.id"
              class="table-row-clickable"
              @click="abrirDetalhe(doc)"
            >
              <td>
                <span class="code-badge">{{ doc.identificador_codigo || 'DOC-S/C' }}</span>
              </td>
              <td>
                <div class="title-cell">
                  <strong class="doc-title-text">{{ doc.titulo }}</strong>
                  <span class="doc-meta-sub">{{ doc.tipo_documento || 'Documento Técnico' }}</span>
                </div>
              </td>
              <td>
                <span class="rev-tag">Rev. {{ doc.numero_revisao ?? '0' }}</span>
              </td>
              <td>
                <div class="author-cell">
                  <User :size="14" class="cell-sub-icon" />
                  <span>{{ doc.autor || '—' }}</span>
                </div>
              </td>
              <td>
                <span :class="['sigilo-pill', getSigiloClass(doc.nivel_sigilo_sugerido)]">
                  <Lock v-if="doc.nivel_sigilo_sugerido === 'CONFIDENCIAL'" :size="12" />
                  {{ doc.nivel_sigilo_sugerido || 'INTERNO' }}
                </span>
              </td>
              <td>
                <div class="date-cell">
                  <Calendar :size="14" class="cell-sub-icon" />
                  <span>{{ formatarData(doc.criado_em) }}</span>
                </div>
              </td>
              <td class="text-right" @click.stop>
                <div class="row-actions-group">
                  <button
                    type="button"
                    class="btn-row-action btn-view"
                    title="Ver detalhes e metadados"
                    @click="abrirDetalhe(doc)"
                  >
                    <Eye :size="15" />
                    <span>Detalhes</span>
                  </button>

                  <button
                    type="button"
                    class="btn-row-action btn-approve"
                    title="Aprovar documento"
                    :disabled="processandoAcao"
                    @click="iniciarAprovar(doc)"
                  >
                    <Check :size="15" />
                    <span>Aprovar</span>
                  </button>

                  <button
                    type="button"
                    class="btn-row-action btn-return"
                    title="Devolver documento com parecer"
                    :disabled="processandoAcao"
                    @click="iniciarDevolver(doc)"
                  >
                    <RotateCcw :size="15" />
                    <span>Devolver</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- =========================================================
         MODAL DE DETALHES DO DOCUMENTO + VISUALIZADOR AKA-61
    ========================================================= -->
    <div v-if="showDetailModal" class="modal-backdrop" @click.self="showDetailModal = false">
      <div class="modal-card modal-detail-card fade-in">
        <header class="modal-header">
          <div class="modal-header-info">
            <FileText :size="20" class="header-icon" />
            <div>
              <h3 class="modal-heading">Detalhes do Documento</h3>
              <span class="modal-sub-code">{{ currentDetail?.identificador_codigo }}</span>
            </div>
          </div>
          <button class="btn-close" @click="showDetailModal = false">&times;</button>
        </header>

        <div class="modal-body">
          <div v-if="loadingDetail" class="state-container">
            <div class="spinner"></div>
            <span>Carregando metadados completos...</span>
          </div>

          <div v-else-if="currentDetail" class="detail-container">
            <div v-if="detailError" class="modal-alert alert-warning">
              <AlertTriangle :size="16" />
              <span>{{ detailError }}</span>
            </div>

            <!-- Grid de Metadados -->
            <div class="metadata-grid">
              <div class="meta-field span-2">
                <span class="meta-label">Título do Documento:</span>
                <span class="meta-value bold-title">{{ currentDetail.titulo }}</span>
              </div>

              <div class="meta-field">
                <span class="meta-label">Identificador / Código:</span>
                <span class="meta-value">{{ currentDetail.identificador_codigo }}</span>
              </div>

              <div class="meta-field">
                <span class="meta-label">Número de Revisão:</span>
                <span class="meta-value">Rev. {{ currentDetail.numero_revisao ?? '0' }}</span>
              </div>

              <div class="meta-field">
                <span class="meta-label">Autor do Upload:</span>
                <span class="meta-value">{{ currentDetail.autor || '—' }}</span>
              </div>

              <div class="meta-field">
                <span class="meta-label">Nível de Sigilo Sugerido:</span>
                <span :class="['sigilo-pill', getSigiloClass(currentDetail.nivel_sigilo_sugerido)]">
                  <Lock v-if="currentDetail.nivel_sigilo_sugerido === 'CONFIDENCIAL'" :size="12" />
                  {{ currentDetail.nivel_sigilo_sugerido || 'INTERNO' }}
                </span>
              </div>

              <div class="meta-field">
                <span class="meta-label">Tipo de Documento:</span>
                <span class="meta-value">{{ currentDetail.tipo_documento || 'Geral' }}</span>
              </div>

              <div class="meta-field">
                <span class="meta-label">Subcategoria:</span>
                <span class="meta-value">{{ currentDetail.subcategoria || '—' }}</span>
              </div>

              <div class="meta-field">
                <span class="meta-label">Idioma:</span>
                <span class="meta-value">{{ currentDetail.idioma || 'Português' }}</span>
              </div>

              <div class="meta-field">
                <span class="meta-label">Data de Envio:</span>
                <span class="meta-value">{{ formatarData(currentDetail.criado_em) }}</span>
              </div>

              <div
                v-if="currentDetail.areas && currentDetail.areas.length"
                class="meta-field span-2"
              >
                <span class="meta-label">Áreas de Aplicação:</span>
                <div class="tags-row">
                  <span v-for="area in currentDetail.areas" :key="area" class="area-tag">
                    {{ area }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Visualizador seguro do documento (AKA-61) -->
            <DocumentViewer
              v-if="currentDetail.id"
              :document-id="String(currentDetail.id)"
              :titulo="currentDetail.titulo"
            />

            <!-- Histórico de tramitação se existente -->
            <div
              v-if="currentDetail.historico && currentDetail.historico.length > 0"
              class="history-block"
            >
              <h5 class="history-title">Histórico de Tramitação</h5>
              <div class="timeline-list">
                <div v-for="(h, idx) in currentDetail.historico" :key="idx" class="timeline-row">
                  <div class="timeline-dot"></div>
                  <div class="timeline-data">
                    <span class="timeline-action">{{ h.acao }}</span>
                    <span class="timeline-user"
                      >por {{ h.usuario || 'Sistema' }} em {{ formatarData(h.criado_em) }}</span
                    >
                    <p v-if="h.comentario" class="timeline-comment">{{ h.comentario }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <div class="modal-footer-actions">
            <button
              type="button"
              class="btn-modal-action btn-approve"
              :disabled="processandoAcao"
              @click="iniciarAprovar(currentDetail)"
            >
              <Check :size="16" />
              <span>Aprovar</span>
            </button>

            <button
              type="button"
              class="btn-modal-action btn-return"
              :disabled="processandoAcao"
              @click="iniciarDevolver(currentDetail)"
            >
              <RotateCcw :size="16" />
              <span>Devolver</span>
            </button>

            <button type="button" class="btn-modal-cancel" @click="showDetailModal = false">
              Fechar
            </button>
          </div>
        </footer>
      </div>
    </div>

    <!-- =========================================================
         MODAL DE APROVAÇÃO (REGRA AKA-53 - SIGILO CONFIDENCIAL)
    ========================================================= -->
    <div v-if="showAprovarModal" class="modal-backdrop" @click.self="showAprovarModal = false">
      <div class="modal-card modal-action-card fade-in">
        <header class="modal-header">
          <div class="modal-header-info">
            <Check :size="20" class="header-icon text-success" />
            <div>
              <h3 class="modal-heading">Aprovar Documento Técnico</h3>
              <span class="modal-sub-code">{{ documentoParaAprovar?.identificador_codigo }}</span>
            </div>
          </div>
          <button class="btn-close" @click="showAprovarModal = false">&times;</button>
        </header>

        <div class="modal-body">
          <p class="modal-instruction">
            Confirme a aprovação do documento <strong>"{{ documentoParaAprovar?.titulo }}"</strong>.
            Você pode manter o nível de sigilo sugerido ou selecionar outro nível de classificação.
          </p>

          <div v-if="erroAprovacao" class="modal-alert alert-error">
            <AlertCircle :size="16" />
            <span>{{ erroAprovacao }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Nível de Sigilo Final:</label>
            <div class="sigilo-options-grid">
              <label
                v-for="sig in opcoesSigilo"
                :key="sig"
                :class="['sigilo-option-card', { selected: nivelSigiloEscolhido === sig }]"
              >
                <input
                  v-model="nivelSigiloEscolhido"
                  type="radio"
                  name="nivel_sigilo"
                  :value="sig"
                  class="sr-only"
                />
                <div class="sigilo-option-header">
                  <span :class="['sigilo-dot', getSigiloClass(sig)]"></span>
                  <strong>{{ sig }}</strong>
                </div>
                <span
                  v-if="sig === documentoParaAprovar?.nivel_sigilo_sugerido"
                  class="suggested-tag"
                >
                  (Sugerido no upload)
                </span>
              </label>
            </div>
          </div>

          <!-- AVISO EXTRA E CHECKBOX OBRIGATÓRIO SE CONFIDENCIAL (AKA-53) -->
          <div
            v-if="nivelSigiloEscolhido === 'CONFIDENCIAL'"
            class="confidencial-warning-box fade-in"
          >
            <div class="warning-header">
              <AlertTriangle :size="20" class="warning-icon" />
              <div>
                <strong>Atenção: Nível Confidencial</strong>
                <p class="warning-text">
                  A classificação <strong>CONFIDENCIAL</strong> restringe o acesso aos usuários com
                  autorização formal e gera logs de auditoria detalhados conforme a norma AKA-53.
                </p>
              </div>
            </div>

            <label class="confidencial-checkbox-label">
              <input
                id="check-confirmar-confidencial"
                v-model="confirmarConfidencialChecked"
                type="checkbox"
                class="custom-checkbox"
              />
              <span>Confirmo a atribuição de nível CONFIDENCIAL a este documento técnico.</span>
            </label>
          </div>
        </div>

        <footer class="modal-footer">
          <div class="modal-footer-actions">
            <button
              type="button"
              class="btn-modal-cancel"
              :disabled="processandoAcao"
              @click="showAprovarModal = false"
            >
              Cancelar
            </button>

            <button
              type="button"
              class="btn-modal-action btn-approve"
              :disabled="
                processandoAcao ||
                (nivelSigiloEscolhido === 'CONFIDENCIAL' && !confirmarConfidencialChecked)
              "
              @click="handleConfirmarAprovar"
            >
              <Check :size="16" />
              <span>{{ processandoAcao ? 'Aprovando...' : 'Confirmar Aprovação' }}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>

    <!-- =========================================================
         MODAL DE DEVOLUÇÃO (COMENTÁRIO >= 10 CARACTERES)
    ========================================================= -->
    <div v-if="showDevolverModal" class="modal-backdrop" @click.self="showDevolverModal = false">
      <div class="modal-card modal-action-card fade-in">
        <header class="modal-header">
          <div class="modal-header-info">
            <RotateCcw :size="20" class="header-icon text-danger" />
            <div>
              <h3 class="modal-heading">Devolver Documento Técnico</h3>
              <span class="modal-sub-code">{{ documentoParaDevolver?.identificador_codigo }}</span>
            </div>
          </div>
          <button class="btn-close" @click="showDevolverModal = false">&times;</button>
        </header>

        <div class="modal-body">
          <p class="modal-instruction">
            Informe as correções técnicas necessárias para o autor
            <strong>{{ documentoParaDevolver?.autor || 'do documento' }}</strong
            >. O comentário é obrigatório e deve ter no mínimo 10 caracteres.
          </p>

          <div v-if="erroDevolucao" class="modal-alert alert-error">
            <AlertCircle :size="16" />
            <span>{{ erroDevolucao }}</span>
          </div>

          <form @submit.prevent="handleConfirmarDevolver">
            <div class="form-group">
              <label for="comentario-devolucao" class="form-label">
                Parecer / Motivo da Devolução
                <span class="required">*</span>
              </label>
              <textarea
                id="comentario-devolucao"
                v-model="comentarioDevolucao"
                rows="4"
                class="form-textarea"
                placeholder="Descreva detalhadamente o que precisa ser ajustado (ex: Adequar a seção de cálculo estrutural conforme norma AKA-04)..."
                required
              ></textarea>
              <div class="char-counter-row">
                <span
                  :class="[
                    'char-counter',
                    comentarioDevolucao.trim().length >= 10 ? 'counter-valid' : 'counter-invalid',
                  ]"
                >
                  {{ comentarioDevolucao.trim().length }} / 10 caracteres mínimos
                </span>
                <span v-if="comentarioDevolucao.trim().length < 10" class="counter-hint">
                  (digite mais {{ 10 - comentarioDevolucao.trim().length }} para habilitar)
                </span>
              </div>
            </div>

            <div class="modal-footer-actions">
              <button
                type="button"
                class="btn-modal-cancel"
                :disabled="processandoAcao"
                @click="showDevolverModal = false"
              >
                Cancelar
              </button>

              <button
                type="submit"
                class="btn-modal-action btn-return"
                :disabled="processandoAcao || comentarioDevolucao.trim().length < 10"
              >
                <RotateCcw :size="16" />
                <span>{{ processandoAcao ? 'Devolvendo...' : 'Confirmar Devolução' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .validation-queue-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem 2rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  .queue-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .title-with-badge {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .queue-title {
    font-size: 1.6rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.02em;
    margin: 0;
  }

  .count-pill {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.35);
    padding: 0.2rem 0.65rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .queue-subtitle {
    font-size: 0.88rem;
    color: #94a3b8;
    margin: 0.35rem 0 0 0;
    max-width: 750px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .btn-refresh {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: #1e293b;
    border: 1px solid #334155;
    color: #cbd5e1;
    padding: 0.5rem 0.9rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-refresh:hover:not(:disabled) {
    background: #334155;
    color: #ffffff;
  }

  .btn-refresh:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spin-icon {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Feedback Banner */
  .feedback-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1.2rem;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 500;
  }

  .feedback-success {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .feedback-error {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .feedback-text {
    flex: 1;
  }

  .feedback-close-btn {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.25rem;
    cursor: pointer;
    line-height: 1;
    padding: 0 0.25rem;
  }

  /* Tabela e Card */
  .queue-card {
    background: #1e293b;
    border-radius: 12px;
    border: 1px solid #334155;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  .state-container {
    padding: 3rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.85rem;
    color: #94a3b8;
    text-align: center;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(148, 163, 184, 0.2);
    border-top-color: #a855f7;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .empty-icon {
    color: #64748b;
  }

  .empty-title {
    color: #f1f5f9;
    font-size: 1.15rem;
    margin: 0;
    font-weight: 600;
  }

  .empty-desc {
    color: #94a3b8;
    font-size: 0.85rem;
    max-width: 450px;
    margin: 0;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .validation-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.85rem;
  }

  .validation-table th {
    background: #0f172a;
    color: #94a3b8;
    padding: 0.85rem 1rem;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #334155;
  }

  .validation-table td {
    padding: 0.95rem 1rem;
    border-bottom: 1px solid #2d3748;
    color: #cbd5e1;
    vertical-align: middle;
  }

  .table-row-clickable {
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .table-row-clickable:hover {
    background-color: #243248;
  }

  .text-right {
    text-align: right;
  }

  .code-badge {
    display: inline-block;
    font-family: monospace;
    font-size: 0.75rem;
    font-weight: 700;
    background: #0f172a;
    color: #38bdf8;
    border: 1px solid #0284c7;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }

  .title-cell {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .doc-title-text {
    color: #ffffff;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .doc-meta-sub {
    font-size: 0.72rem;
    color: #94a3b8;
  }

  .rev-tag {
    font-size: 0.75rem;
    font-weight: 700;
    background: #334155;
    color: #e2e8f0;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
  }

  .author-cell,
  .date-cell {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #cbd5e1;
    font-size: 0.82rem;
  }

  .cell-sub-icon {
    color: #64748b;
    flex-shrink: 0;
  }

  /* Sigilo Pills */
  .sigilo-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .sigilo-publico {
    background: rgba(14, 165, 233, 0.15);
    color: #38bdf8;
    border: 1px solid rgba(14, 165, 233, 0.35);
  }

  .sigilo-interno {
    background: rgba(168, 85, 247, 0.15);
    color: #c084fc;
    border: 1px solid rgba(168, 85, 247, 0.35);
  }

  .sigilo-restrito {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.35);
  }

  .sigilo-confidencial {
    background: rgba(239, 68, 68, 0.18);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.45);
  }

  /* Ações na linha */
  .row-actions-group {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .btn-row-action {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.35rem 0.65rem;
    border-radius: 6px;
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.15s ease;
  }

  .btn-row-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-row-action.btn-view {
    background: #334155;
    color: #f1f5f9;
  }

  .btn-row-action.btn-view:hover:not(:disabled) {
    background: #475569;
    color: #ffffff;
  }

  .btn-row-action.btn-approve {
    background: #059669;
    color: #ffffff;
  }

  .btn-row-action.btn-approve:hover:not(:disabled) {
    background: #10b981;
  }

  .btn-row-action.btn-return {
    background: #dc2626;
    color: #ffffff;
  }

  .btn-row-action.btn-return:hover:not(:disabled) {
    background: #ef4444;
  }

  /* Modais */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
    padding: 1.5rem;
  }

  .modal-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  .modal-detail-card {
    max-width: 960px;
  }

  .modal-action-card {
    max-width: 580px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.2rem 1.5rem;
    border-bottom: 1px solid #334155;
    background: #0f172a;
  }

  .modal-header-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-icon {
    color: #a855f7;
  }

  .text-success {
    color: #10b981 !important;
  }

  .text-danger {
    color: #ef4444 !important;
  }

  .modal-heading {
    font-size: 1.15rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
  }

  .modal-sub-code {
    font-size: 0.75rem;
    font-family: monospace;
    color: #94a3b8;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #94a3b8;
    cursor: pointer;
    line-height: 1;
    padding: 0 0.25rem;
  }

  .btn-close:hover {
    color: #ffffff;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .modal-instruction {
    font-size: 0.88rem;
    color: #cbd5e1;
    margin: 0;
    line-height: 1.5;
  }

  .modal-alert {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-size: 0.84rem;
  }

  .alert-warning {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .alert-error {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .metadata-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.85rem 1.25rem;
    background: #0f172a;
    padding: 1.2rem;
    border-radius: 8px;
    border: 1px solid #334155;
  }

  .meta-field {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .meta-field.span-2 {
    grid-column: span 2;
  }

  .meta-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 0.04em;
  }

  .meta-value {
    font-size: 0.88rem;
    color: #f1f5f9;
  }

  .bold-title {
    font-weight: 700;
    font-size: 1rem;
    color: #ffffff;
  }

  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .area-tag {
    background: #334155;
    color: #cbd5e1;
    font-size: 0.72rem;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }

  /* Histórico */
  .history-block {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .history-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: #cbd5e1;
    margin: 0;
  }

  .timeline-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-left: 0.5rem;
  }

  .timeline-row {
    display: flex;
    gap: 0.75rem;
    position: relative;
  }

  .timeline-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #a855f7;
    margin-top: 0.35rem;
    flex-shrink: 0;
  }

  .timeline-data {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-size: 0.78rem;
  }

  .timeline-action {
    font-weight: 700;
    color: #ffffff;
  }

  .timeline-user {
    color: #94a3b8;
  }

  .timeline-comment {
    background: #0f172a;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    color: #e2e8f0;
    margin: 0.25rem 0 0 0;
  }

  /* Form Elements */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .form-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #cbd5e1;
  }

  .required {
    color: #ef4444;
  }

  .sigilo-options-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.65rem;
  }

  .sigilo-option-card {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 0.75rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    transition: all 0.2s;
  }

  .sigilo-option-card:hover {
    border-color: #64748b;
  }

  .sigilo-option-card.selected {
    border-color: #a855f7;
    background: rgba(168, 85, 247, 0.1);
  }

  .sigilo-option-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #ffffff;
  }

  .sigilo-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .suggested-tag {
    font-size: 0.68rem;
    color: #a855f7;
    font-weight: 600;
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

  /* Confidencial Box (AKA-53) */
  .confidencial-warning-box {
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid #d97706;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .warning-header {
    display: flex;
    gap: 0.65rem;
    color: #fbbf24;
  }

  .warning-icon {
    flex-shrink: 0;
    margin-top: 0.15rem;
  }

  .warning-text {
    font-size: 0.78rem;
    color: #e2e8f0;
    margin: 0.25rem 0 0 0;
    line-height: 1.4;
  }

  .confidencial-checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    user-select: none;
  }

  .custom-checkbox {
    width: 17px;
    height: 17px;
    margin-top: 0.1rem;
    accent-color: #d97706;
    cursor: pointer;
  }

  /* Devolução Textarea e Contador */
  .form-textarea {
    width: 100%;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 0.75rem;
    color: #ffffff;
    font-size: 0.88rem;
    font-family: inherit;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
  }

  .form-textarea:focus {
    border-color: #a855f7;
  }

  .char-counter-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
  }

  .char-counter {
    font-weight: 700;
  }

  .counter-valid {
    color: #10b981;
  }

  .counter-invalid {
    color: #f87171;
  }

  .counter-hint {
    color: #94a3b8;
  }

  /* Footer Modais */
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #334155;
    background: #0f172a;
  }

  .modal-footer-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.75rem;
  }

  .btn-modal-action {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.1rem;
    border-radius: 8px;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-modal-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-modal-action.btn-approve {
    background: #059669;
    color: #ffffff;
  }

  .btn-modal-action.btn-approve:hover:not(:disabled) {
    background: #10b981;
  }

  .btn-modal-action.btn-return {
    background: #dc2626;
    color: #ffffff;
  }

  .btn-modal-action.btn-return:hover:not(:disabled) {
    background: #ef4444;
  }

  .btn-modal-cancel {
    background: transparent;
    border: 1px solid #475569;
    color: #cbd5e1;
    padding: 0.55rem 1rem;
    border-radius: 8px;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-modal-cancel:hover:not(:disabled) {
    background: #334155;
    color: #ffffff;
  }

  .fade-in {
    animation: fadeIn 0.2s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .validation-queue-container {
      padding: 1rem;
    }

    .metadata-grid {
      grid-template-columns: 1fr;
    }

    .meta-field.span-2 {
      grid-column: span 1;
    }

    .sigilo-options-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
