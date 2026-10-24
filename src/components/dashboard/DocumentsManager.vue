<script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import {
    listarPendentes,
    listarMeus,
    detalhe,
    aprovar,
    devolver,
  } from '../../services/documentos.js';
  import DocumentViewer from '../DocumentViewer.vue';
  import {
    FileText,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Check,
    Eye,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
    Upload,
  } from 'lucide-vue-next';

  const props = defineProps({
    currentUser: {
      type: Object,
      default: () => ({
        role: 'Engenharia',
        matricula: 'AK-90822',
      }),
    },
  });

  const emit = defineEmits(['openUploadModal', 'editDocument']);

  // AKA-50 / AKA-94: Apenas quem tem pode_validar (exclusivo Administrador no backend)
  // pode acessar a fila de validação e aprovar/devolver documentos.
  const podeValidar = computed(
    () =>
      props.currentUser?.pode_validar === true ||
      (!('pode_validar' in (props.currentUser || {})) &&
        props.currentUser?.role === 'Administrador')
  );

  // Abas: 'meus' (Meus Documentos) | 'pendentes' (Fila de Validação)
  const activeTab = ref(podeValidar.value ? 'pendentes' : 'meus');
  const statusFilter = ref('');
  const loading = ref(false);
  const feedbackMessage = ref('');
  const feedbackType = ref('success'); // 'success' | 'error'

  const items = ref([]);

  // Modal de Detalhes
  const showDetailModal = ref(false);
  const loadingDetail = ref(false);
  const currentDetail = ref(null);
  const detailError = ref('');

  // Modal de Devolução
  const showDevolverModal = ref(false);
  const motivoDevolucao = ref('');
  const erroDevolucao = ref('');
  const processandoAcao = ref(false);
  const documentoParaAcao = ref(null);

  const carregarDocumentos = async () => {
    loading.value = true;
    feedbackMessage.value = '';

    try {
      if (activeTab.value === 'pendentes') {
        const data = await listarPendentes({ page: 1 });
        const docs = data?.results ?? (Array.isArray(data) ? data : []);
        items.value = docs;
      } else {
        const params = { page: 1 };
        if (statusFilter.value) {
          params.status = statusFilter.value;
        }
        const data = await listarMeus(params);
        const docs = data?.results ?? (Array.isArray(data) ? data : []);
        items.value = docs;
      }
    } catch (err) {
      items.value = [];
      feedbackType.value = 'error';
      feedbackMessage.value =
        err?.detail ||
        err?.message ||
        'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
    } finally {
      loading.value = false;
    }
  };

  const abrirDetalhe = async (doc) => {
    documentoParaAcao.value = doc;
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
      detailError.value =
        err?.detail || err?.message || 'Não foi possível carregar os detalhes do servidor.';
    } finally {
      loadingDetail.value = false;
    }
  };

  const handleAprovar = async (doc) => {
    processandoAcao.value = true;
    feedbackMessage.value = '';

    try {
      const isConfidencial = (doc.nivel_sigilo || doc.nivel_sigilo_sugerido) === 'CONFIDENCIAL';
      const payload = {
        nivel_sigilo: doc.nivel_sigilo || doc.nivel_sigilo_sugerido,
        confirmar_confidencial: isConfidencial,
      };

      await aprovar(doc.id, payload);
      feedbackType.value = 'success';
      feedbackMessage.value = `Documento ${doc.identificador_codigo || doc.titulo} aprovado com sucesso!`;
      showDetailModal.value = false;
      await carregarDocumentos();
    } catch (err) {
      feedbackType.value = 'error';
      feedbackMessage.value = err?.detail || err?.message || 'Falha ao aprovar o documento.';
    } finally {
      processandoAcao.value = false;
    }
  };

  const abrirModalDevolver = (doc) => {
    documentoParaAcao.value = doc;
    motivoDevolucao.value = '';
    erroDevolucao.value = '';
    showDevolverModal.value = true;
  };

  const handleDevolver = async () => {
    if (!motivoDevolucao.value.trim() || motivoDevolucao.value.trim().length < 10) {
      erroDevolucao.value = 'O motivo da devolução deve ter no mínimo 10 caracteres.';
      return;
    }

    processandoAcao.value = true;
    erroDevolucao.value = '';

    try {
      await devolver(documentoParaAcao.value.id, {
        comentario: motivoDevolucao.value.trim(),
      });
      showDevolverModal.value = false;
      showDetailModal.value = false;
      feedbackType.value = 'success';
      feedbackMessage.value = `Documento devolvido para correção com sucesso.`;
      await carregarDocumentos();
    } catch (err) {
      erroDevolucao.value = err?.detail || err?.message || 'Não foi possível devolver o documento.';
    } finally {
      processandoAcao.value = false;
    }
  };

  // S2-36: corrigir abre o formulário de upload em modo edição (no DashboardView).
  const abrirCorrecao = (doc) => {
    showDetailModal.value = false;
    emit('editDocument', doc.id);
  };

  const formatarStatus = (status) => {
    switch (status) {
      case 'AGUARDANDO_VALIDACAO':
        return 'Aguardando Validação';
      case 'DISPONIVEL':
        return 'Disponível / Aprovado';
      case 'DEVOLVIDO':
        return 'Devolvido';
      default:
        return status || 'Pendente';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'AGUARDANDO_VALIDACAO':
        return 'badge-warning';
      case 'DISPONIVEL':
        return 'badge-success';
      case 'DEVOLVIDO':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  };

  watch(podeValidar, (canValidate) => {
    if (!canValidate && activeTab.value === 'pendentes') {
      activeTab.value = 'meus';
    }
  });

  watch([activeTab, statusFilter], () => {
    carregarDocumentos();
  });

  onMounted(() => {
    carregarDocumentos();
  });

  // Chamado pelo DashboardView depois que o formulário em modo edição reenvia.
  const aposReenvio = async () => {
    feedbackType.value = 'success';
    feedbackMessage.value = 'Documento reenviado para validação.';
    await carregarDocumentos();
  };

  defineExpose({ carregarDocumentos, aposReenvio });
</script>

<template>
  <div class="documents-manager-container fade-in">
    <!-- Header e Controles Principais -->
    <div class="manager-header">
      <div>
        <h2 class="manager-title">Central de Documentos Técnicos</h2>
        <p class="manager-subtitle">
          Consulte o catálogo corporativo, gerencie envios e acompanhe a fila de validação
        </p>
      </div>

      <div class="manager-actions">
        <button
          type="button"
          class="btn-refresh"
          :disabled="loading"
          title="Recarregar lista"
          @click="carregarDocumentos"
        >
          <RefreshCw :size="16" :class="{ 'spin-icon': loading }" />
          <span>Atualizar</span>
        </button>

        <button type="button" class="btn-primary-action" @click="emit('openUploadModal')">
          <Upload :size="16" />
          <span>Novo Documento</span>
        </button>
      </div>
    </div>

    <!-- Feedback Banner -->
    <div
      v-if="feedbackMessage"
      :class="[
        'feedback-banner',
        feedbackType === 'success' ? 'feedback-success' : 'feedback-error',
      ]"
    >
      <component :is="feedbackType === 'success' ? CheckCircle2 : AlertCircle" :size="18" />
      <span>{{ feedbackMessage }}</span>
      <button class="feedback-close-btn" @click="feedbackMessage = ''">&times;</button>
    </div>

    <!-- Navegação de Abas -->
    <div class="manager-tabs-bar">
      <div class="tabs-group">
        <button
          v-if="podeValidar"
          type="button"
          :class="['manager-tab-btn', { active: activeTab === 'pendentes' }]"
          @click="activeTab = 'pendentes'"
        >
          <ShieldCheck :size="16" />
          <span>Fila de Validação (Pendentes)</span>
        </button>

        <button
          type="button"
          :class="['manager-tab-btn', { active: activeTab === 'meus' }]"
          @click="activeTab = 'meus'"
        >
          <FileText :size="16" />
          <span>Meus Documentos</span>
        </button>
      </div>

      <!-- Filtro de Status para Meus Documentos -->
      <div v-if="activeTab === 'meus'" class="filter-group">
        <select v-model="statusFilter" class="filter-select">
          <option value="">Todos os status</option>
          <option value="AGUARDANDO_VALIDACAO">Aguardando Validação</option>
          <option value="DISPONIVEL">Disponíveis / Aprovados</option>
          <option value="DEVOLVIDO">Devolvidos</option>
        </select>
      </div>
    </div>

    <!-- Lista de Documentos -->
    <div class="documents-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Carregando documentos via API...</span>
      </div>

      <div v-else-if="!items || items.length === 0" class="empty-state">
        <FileText :size="40" class="empty-icon" />
        <h4>Nenhum documento encontrado</h4>
        <p>
          {{
            activeTab === 'pendentes'
              ? 'Não há documentos pendentes de validação no momento.'
              : 'Você ainda não possui documentos enviados com estes filtros.'
          }}
        </p>
      </div>

      <div v-else class="documents-table-wrapper">
        <table class="documents-table">
          <thead>
            <tr>
              <th>Código / Título</th>
              <th>Categoria / Área</th>
              <th>Sigilo</th>
              <th>Status</th>
              <th>Data</th>
              <th class="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in items" :key="doc.id">
              <td>
                <div class="doc-primary-info">
                  <span class="doc-code-tag">{{ doc.identificador_codigo || 'DOC-TEMP' }}</span>
                  <strong class="doc-table-title">{{ doc.titulo }}</strong>
                </div>
              </td>
              <td>
                <div class="doc-category-info">
                  <span class="category-name">{{
                    doc.tipo_documento || doc.categoria || 'Geral'
                  }}</span>
                  <span class="area-name">{{ doc.autor || doc.area || '—' }}</span>
                </div>
              </td>
              <td>
                <span class="sigilo-badge" :data-sigilo="doc.nivel_sigilo">
                  {{ doc.nivel_sigilo || 'INTERNO' }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', getStatusClass(doc.status_validacao)]">
                  {{ formatarStatus(doc.status_validacao) }}
                </span>
              </td>
              <td>
                <span class="date-text">
                  {{ doc.criado_em ? new Date(doc.criado_em).toLocaleDateString('pt-BR') : '—' }}
                </span>
              </td>
              <td class="text-right">
                <div class="row-actions">
                  <button
                    type="button"
                    class="action-icon-btn btn-view"
                    title="Ver detalhes"
                    @click="abrirDetalhe(doc)"
                  >
                    <Eye :size="16" />
                    <span>Detalhes</span>
                  </button>

                  <!-- Ações rápidas de validação exclusivas para quem pode validar (Administrador) -->
                  <template v-if="podeValidar && doc.status_validacao === 'AGUARDANDO_VALIDACAO'">
                    <button
                      type="button"
                      class="action-icon-btn btn-approve"
                      title="Aprovar documento"
                      :disabled="processandoAcao"
                      @click="handleAprovar(doc)"
                    >
                      <Check :size="16" />
                      <span>Aprovar</span>
                    </button>

                    <button
                      type="button"
                      class="action-icon-btn btn-return"
                      title="Devolver com motivo"
                      :disabled="processandoAcao"
                      @click="abrirModalDevolver(doc)"
                    >
                      <RotateCcw :size="16" />
                      <span>Devolver</span>
                    </button>
                  </template>

                  <button
                    v-if="doc.status_validacao === 'DEVOLVIDO'"
                    type="button"
                    class="action-icon-btn btn-resend"
                    title="Corrigir e reenviar para validação"
                    :disabled="processandoAcao"
                    @click="abrirCorrecao(doc)"
                  >
                    <RotateCcw :size="16" />
                    <span>Corrigir</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Detalhes do Documento -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="detail-modal-card fade-in">
        <div class="modal-header">
          <div class="modal-title-box">
            <FileText :size="20" class="header-icon" />
            <div>
              <h3>Detalhes do Documento</h3>
              <span class="detail-doc-code">{{ currentDetail?.identificador_codigo }}</span>
            </div>
          </div>
          <button class="close-btn" @click="showDetailModal = false">&times;</button>
        </div>

        <div class="modal-body">
          <div v-if="loadingDetail" class="loading-state">
            <div class="spinner"></div>
            <span>Carregando dados completos da API...</span>
          </div>

          <div v-else-if="currentDetail" class="detail-content">
            <div v-if="detailError" class="modal-alert alert-warning">
              <AlertTriangle :size="16" />
              <span>{{ detailError }}</span>
            </div>

            <div class="detail-grid">
              <div class="detail-field">
                <label>Título:</label>
                <strong>{{ currentDetail.titulo }}</strong>
              </div>

              <div class="detail-field">
                <label>Status Atual:</label>
                <span :class="['status-badge', getStatusClass(currentDetail.status_validacao)]">
                  {{ formatarStatus(currentDetail.status_validacao) }}
                </span>
              </div>

              <div class="detail-field">
                <label>Nível de Sigilo Final:</label>
                <span class="sigilo-badge">{{ currentDetail.nivel_sigilo || 'INTERNO' }}</span>
              </div>

              <div class="detail-field">
                <label>Sigilo Sugerido:</label>
                <span class="sigilo-badge">{{ currentDetail.nivel_sigilo_sugerido || '—' }}</span>
              </div>

              <div class="detail-field">
                <label>Tipo / Categoria:</label>
                <span>{{
                  currentDetail.tipo_documento ||
                  currentDetail.categoria ||
                  currentDetail.subcategoria ||
                  'Geral'
                }}</span>
              </div>

              <div class="detail-field">
                <label>Autor / Responsável:</label>
                <span>{{
                  currentDetail.autor || currentDetail.responsavel || currentDetail.area || '—'
                }}</span>
              </div>
            </div>

            <!-- Visualizador seguro do documento (AKA-61) -->
            <DocumentViewer
              v-if="currentDetail.id"
              :document-id="String(currentDetail.id)"
              :titulo="currentDetail.titulo"
            />

            <!-- Parecer de devolução se aplicável -->
            <div
              v-if="
                currentDetail.status_validacao === 'DEVOLVIDO' || currentDetail.comentario_devolucao
              "
              class="devolucao-box"
            >
              <div class="devolucao-header">
                <AlertCircle :size="18" class="text-danger" />
                <strong>Motivo da Devolução:</strong>
              </div>
              <p class="devolucao-text">
                {{ currentDetail.comentario_devolucao || 'Nenhum comentário registrado.' }}
              </p>
            </div>

            <!-- Histórico de Validação (se retornado pela API) -->
            <div
              v-if="currentDetail.historico && currentDetail.historico.length > 0"
              class="history-section"
            >
              <h4>Histórico de Tramitação</h4>
              <ul class="history-timeline">
                <li v-for="(h, idx) in currentDetail.historico" :key="idx" class="history-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <span class="timeline-acao">{{ h.acao }}</span>
                    <span class="timeline-data">
                      {{
                        h.criado_em
                          ? new Date(h.criado_em).toLocaleString('pt-BR')
                          : 'Data não informada'
                      }}
                    </span>
                    <p v-if="h.comentario" class="timeline-comment">{{ h.comentario }}</p>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Ações no rodapé do modal -->
            <div class="modal-footer-actions">
              <template
                v-if="podeValidar && currentDetail.status_validacao === 'AGUARDANDO_VALIDACAO'"
              >
                <button
                  type="button"
                  class="btn-modal-action btn-approve"
                  :disabled="processandoAcao"
                  @click="handleAprovar(currentDetail)"
                >
                  <Check :size="16" />
                  <span>Aprovar Documento</span>
                </button>

                <button
                  type="button"
                  class="btn-modal-action btn-return"
                  :disabled="processandoAcao"
                  @click="abrirModalDevolver(currentDetail)"
                >
                  <RotateCcw :size="16" />
                  <span>Devolver Documento</span>
                </button>
              </template>

              <button
                v-if="currentDetail.status_validacao === 'DEVOLVIDO'"
                type="button"
                class="btn-modal-action btn-resend"
                :disabled="processandoAcao"
                @click="abrirCorrecao(currentDetail)"
              >
                <RotateCcw :size="16" />
                <span>Corrigir e Reenviar</span>
              </button>

              <button type="button" class="btn-modal-cancel" @click="showDetailModal = false">
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Devolução (Motivo Obrigatório) -->
    <div v-if="showDevolverModal" class="modal-overlay" @click.self="showDevolverModal = false">
      <div class="devolver-modal-card fade-in">
        <div class="modal-header">
          <div class="modal-title-box">
            <RotateCcw :size="20" class="header-icon text-danger" />
            <div>
              <h3>Devolver Documento</h3>
              <span class="detail-doc-code">{{ documentoParaAcao?.identificador_codigo }}</span>
            </div>
          </div>
          <button class="close-btn" @click="showDevolverModal = false">&times;</button>
        </div>

        <div class="modal-body">
          <p class="modal-instruction">
            Informe o motivo da devolução e as correções necessárias que o responsável deve realizar
            (mínimo de 10 caracteres).
          </p>

          <div v-if="erroDevolucao" class="modal-alert alert-error">
            <AlertCircle :size="16" />
            <span>{{ erroDevolucao }}</span>
          </div>

          <form @submit.prevent="handleDevolver">
            <div class="form-group">
              <label for="motivo-devolucao" class="form-label">
                Motivo / Justificativa da Devolução
                <span class="required">*</span>
              </label>
              <textarea
                id="motivo-devolucao"
                v-model="motivoDevolucao"
                class="form-textarea"
                rows="4"
                placeholder="Ex: Faltou incluir anexo de cálculo estrutural na seção 3..."
                required
              ></textarea>
              <span class="char-count">{{ motivoDevolucao.length }} caracteres (mínimo: 10)</span>
            </div>

            <div class="modal-actions-row">
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
                class="btn-modal-action btn-return-confirm"
                :disabled="processandoAcao || motivoDevolucao.trim().length < 10"
              >
                <RotateCcw :size="16" />
                <span>{{ processandoAcao ? 'Enviando...' : 'Confirmar Devolução' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .documents-manager-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
  }

  .manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .manager-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 0.25rem 0;
  }

  .manager-subtitle {
    font-size: 0.88rem;
    color: #64748b;
    margin: 0;
  }

  .manager-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .btn-refresh {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #475569;
    padding: 0.55rem 0.95rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-refresh:hover:not(:disabled) {
    background: #f1f5f9;
    color: #0f172a;
  }

  .btn-primary-action {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #7e22ce;
    border: none;
    color: #ffffff;
    padding: 0.55rem 1.15rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-primary-action:hover {
    background: #6b21a8;
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
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 500;
  }

  .feedback-success {
    background: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .feedback-error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .feedback-close-btn {
    margin-left: auto;
    background: transparent;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: inherit;
  }

  /* Tabs */
  .manager-tabs-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #e2e8f0;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .tabs-group {
    display: flex;
    gap: 0.5rem;
  }

  .manager-tab-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
  }

  .manager-tab-btn:hover {
    color: #0f172a;
  }

  .manager-tab-btn.active {
    color: #7e22ce;
    border-bottom-color: #7e22ce;
  }

  .filter-select {
    padding: 0.45rem 0.85rem;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    font-size: 0.85rem;
    color: #334155;
    background-color: #ffffff;
  }

  /* Table Card */
  .documents-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3.5rem 1.5rem;
    gap: 0.75rem;
    color: #64748b;
  }

  .empty-icon {
    color: #94a3b8;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid #e2e8f0;
    border-top-color: #7e22ce;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .documents-table-wrapper {
    overflow-x: auto;
  }

  .documents-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.88rem;
  }

  .documents-table th {
    background: #f8fafc;
    padding: 0.85rem 1rem;
    color: #475569;
    font-weight: 600;
    border-bottom: 1px solid #e2e8f0;
  }

  .documents-table td {
    padding: 0.95rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: middle;
  }

  .documents-table tr:hover td {
    background: #f8fafc;
  }

  .doc-primary-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .doc-code-tag {
    font-size: 0.72rem;
    font-weight: 700;
    color: #7e22ce;
    letter-spacing: 0.03em;
  }

  .doc-table-title {
    font-size: 0.92rem;
    color: #0f172a;
  }

  .doc-category-info {
    display: flex;
    flex-direction: column;
  }

  .category-name {
    font-weight: 500;
  }

  .area-name {
    font-size: 0.75rem;
    color: #64748b;
  }

  /* Badges */
  .sigilo-badge {
    display: inline-block;
    padding: 0.25rem 0.55rem;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    background: #f1f5f9;
    color: #475569;
  }

  .sigilo-badge[data-sigilo='CONFIDENCIAL'] {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .status-badge {
    display: inline-block;
    padding: 0.3rem 0.65rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .badge-warning {
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
  }

  .badge-success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }

  .badge-danger {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .badge-neutral {
    background: #f1f5f9;
    color: #475569;
  }

  .date-text {
    font-size: 0.8rem;
    color: #64748b;
  }

  .text-right {
    text-align: right;
  }

  .row-actions {
    display: flex;
    gap: 0.45rem;
    justify-content: flex-end;
  }

  .action-icon-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
  }

  .btn-view {
    background: #f1f5f9;
    color: #334155;
    border-color: #cbd5e1;
  }

  .btn-view:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  .btn-approve {
    background: #ecfdf5;
    color: #047857;
    border-color: #a7f3d0;
  }

  .btn-approve:hover:not(:disabled) {
    background: #d1fae5;
  }

  .btn-return {
    background: #fef2f2;
    color: #b91c1c;
    border-color: #fecaca;
  }

  .btn-return:hover:not(:disabled) {
    background: #fee2e2;
  }

  .btn-resend {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #bfdbfe;
  }

  .btn-resend:hover:not(:disabled) {
    background: #dbeafe;
  }

  /* Modais */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    padding: 1.5rem;
  }

  .detail-modal-card,
  .devolver-modal-card {
    background: #ffffff;
    border-radius: 12px;
    width: 100%;
    max-width: 620px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    border: 1px solid #e2e8f0;
  }

  .detail-modal-card {
    max-width: 960px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-title-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .modal-title-box h3 {
    margin: 0;
    font-size: 1.15rem;
    color: #0f172a;
  }

  .detail-doc-code {
    font-size: 0.75rem;
    color: #7e22ce;
    font-weight: 700;
  }

  .header-icon {
    color: #7e22ce;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    color: #64748b;
    cursor: pointer;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .detail-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-field label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
  }

  .devolucao-box {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .devolucao-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #991b1b;
    margin-bottom: 0.35rem;
  }

  .devolucao-text {
    margin: 0;
    font-size: 0.88rem;
    color: #7f1d1d;
  }

  .history-section {
    border-top: 1px solid #e2e8f0;
    padding-top: 1rem;
    margin-bottom: 1.5rem;
  }

  .history-section h4 {
    margin: 0 0 0.85rem 0;
    font-size: 0.95rem;
    color: #0f172a;
  }

  .history-timeline {
    list-style: none;
    padding: 0;
    margin: 0;
    position: relative;
    border-left: 2px solid #e2e8f0;
    margin-left: 0.75rem;
  }

  .history-item {
    position: relative;
    padding-left: 1.25rem;
    padding-bottom: 1rem;
  }

  .timeline-dot {
    position: absolute;
    left: -6px;
    top: 4px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #7e22ce;
  }

  .timeline-acao {
    font-weight: 600;
    font-size: 0.85rem;
    color: #0f172a;
    display: block;
  }

  .timeline-data {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .timeline-comment {
    margin: 0.25rem 0 0 0;
    font-size: 0.82rem;
    color: #475569;
  }

  .modal-footer-actions,
  .modal-actions-row {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .btn-modal-action {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.6rem 1.15rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-return-confirm {
    background: #dc2626;
    color: #ffffff;
  }

  .btn-return-confirm:hover:not(:disabled) {
    background: #b91c1c;
  }

  .btn-modal-cancel {
    padding: 0.6rem 1.15rem;
    border-radius: 8px;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #475569;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .btn-modal-cancel:hover {
    background: #e2e8f0;
  }

  .modal-instruction {
    font-size: 0.85rem;
    color: #475569;
    margin-bottom: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1rem;
  }

  .form-label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #334155;
  }

  .form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.88rem;
    font-family: inherit;
    resize: vertical;
  }

  .form-textarea:focus {
    outline: none;
    border-color: #7e22ce;
    box-shadow: 0 0 0 3px rgba(126, 34, 206, 0.15);
  }

  .char-count {
    font-size: 0.72rem;
    color: #94a3b8;
    align-self: flex-end;
  }

  .modal-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 6px;
    font-size: 0.82rem;
    margin-bottom: 1rem;
  }

  .alert-warning {
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
  }

  .alert-error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .required {
    color: #dc2626;
  }

  .fade-in {
    animation: fadeIn 0.25s ease-in-out;
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
</style>
