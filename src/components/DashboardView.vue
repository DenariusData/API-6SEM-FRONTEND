<script setup>
  import { ref, computed, nextTick, onMounted, watch } from 'vue';
  import { createUser, askQuestion } from '../services/api.js';
  import { listarMeus, listarPendentes } from '../services/documentos.js';
  import SidebarMenu from './dashboard/SidebarMenu.vue';
  import AnswerArea from './dashboard/AnswerArea.vue';
  import QuestionArea from './dashboard/QuestionArea.vue';
  import DocumentsManager from './dashboard/DocumentsManager.vue';
  import ValidationQueue from './dashboard/ValidationQueue.vue';
  import MeusDocumentos from './dashboard/MeusDocumentos.vue';
  import UploadDocumento from './UploadDocumento.vue';
  import {
    Search,
    FileText,
    Sparkles,
    Settings,
    Upload,
    Plus,
    ShieldCheck,
    ArrowRight,
    UserCheck,
    UserPlus,
    Tag,
    CheckCircle2,
    AlertCircle,
    X,
    FileUp,
    Send,
  } from 'lucide-vue-next';

  const props = defineProps({
    currentUser: {
      type: Object,
      default: () => ({
        id: 1,
        name: 'Carlos Eduardo',
        email: 'engenharia@akaer.com.br',
        role: 'Engenharia',
        matricula: 'AK-90822',
        cargo: 'Engenheiro Aeroespacial Senior',
        allowed_menus: [
          'Início',
          'Pesquisa Avançada',
          'Documentos',
          'Projetos',
          'AI Command Assistant',
          'Solicitar OI',
        ],
      }),
    },
  });

  const activeMenu = ref('Início');
  const activeTab = ref('AI Command Assistant');

  // Modal de Gestão de Usuários (Exclusivo Administrador)
  const showUserModal = ref(false);
  const newUserName = ref('');
  const newUserEmail = ref('');
  const newUserRole = ref('Engenharia');
  const newUserMatricula = ref('');
  const userModalSuccess = ref('');
  const userModalError = ref('');

  const demoUsersList = ref([
    {
      id: 1,
      name: 'Carlos Eduardo',
      email: 'engenharia@akaer.com.br',
      role: 'Engenharia',
      matricula: 'AK-90822',
    },
    {
      id: 2,
      name: 'Ana Souza',
      email: 'qualidade@akaer.com.br',
      role: 'Qualidade',
      matricula: 'AK-77401',
    },
    {
      id: 3,
      name: 'Ricardo Mendes',
      email: 'admin@akaer.com.br',
      role: 'Administrador',
      matricula: 'AK-10001',
    },
  ]);

  const handleCreateUser = async () => {
    userModalSuccess.value = '';
    userModalError.value = '';

    if (!newUserName.value.trim() || !newUserEmail.value.trim()) {
      userModalError.value = 'Preencha o nome e o e-mail do novo usuário.';
      return;
    }

    const payload = {
      name: newUserName.value,
      email: newUserEmail.value,
      role: newUserRole.value,
      matricula: newUserMatricula.value || `AK-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    try {
      const data = await createUser(payload);
      demoUsersList.value.push(data.user);
      userModalSuccess.value = `Usuário ${data.user.name} cadastrado com sucesso!`;
    } catch {
      demoUsersList.value.push({ ...payload, id: Date.now() });
      userModalSuccess.value = `Usuário ${payload.name} cadastrado no ambiente de demonstração!`;
    }

    newUserName.value = '';
    newUserEmail.value = '';
    newUserMatricula.value = '';
  };

  /* =========================================================
     UPLOAD DE DOCUMENTOS - S2-32 / S2-36
     O formulário, a validação e o envio ficam em UploadDocumento.vue.
     Aqui só abrimos/fechamos o modal (novo envio ou correção de um
     documento devolvido) e atualizamos as listas.
  ========================================================= */

  const showUploadModal = ref(false);
  const uploadLoading = ref(false);
  const documentoEmEdicao = ref(null); // id do documento devolvido (modo edição)
  const documentsManagerRef = ref(null);
  const meusDocumentosRef = ref(null);

  const openUploadModal = () => {
    documentoEmEdicao.value = null;
    showUploadModal.value = true;
  };

  const openEditModal = (documentoId) => {
    documentoEmEdicao.value = documentoId;
    showUploadModal.value = true;
  };

  const closeUploadModal = () => {
    if (uploadLoading.value) return;
    showUploadModal.value = false;
    documentoEmEdicao.value = null;
  };

  const onUploadEnviado = () => {
    carregarDocumentosRecentes();
    meusDocumentosRef.value?.recarregar();
  };

  const onDocumentoReenviado = () => {
    carregarDocumentosRecentes();
    documentsManagerRef.value?.aposReenvio();
    meusDocumentosRef.value?.recarregar();
  };

  // Interação Q&A (IA com fontes via pipeline RAG do backend)

  const IDIOMAS_ACEITOS = ['pt-BR', 'en'];

  const idiomaSalvo = localStorage.getItem('ai-language');
  const selectedLanguage = ref(IDIOMAS_ACEITOS.includes(idiomaSalvo) ? idiomaSalvo : 'pt-BR');

  const aiTexts = {
    'pt-BR': {
      english: 'Resposta em inglês',
      portuguese: 'Resposta em português',
      language: 'Idioma da resposta:',
      placeholder: 'Faça uma pergunta sobre os documentos técnicos...',
      processing: 'Processando...',
      processingMessage: 'Consultando documentos técnicos...',
      send: 'Enviar',
      clearChat: 'Limpar conversa',
      sources: 'Fontes consultadas',
      revision: 'Revisão',
      page: 'Página',
      defaultPage: '—',
      defaultCategory: 'Documento Técnico',
      similarity: 'Similaridade',
      serviceUnavailable:
        'O serviço de IA está indisponível no momento. Tente novamente mais tarde.',
      genericError: 'Não foi possível obter a resposta da IA.',
      connectionError:
        'Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
    },
    en: {
      english: 'English response',
      portuguese: 'Portuguese response',
      language: 'Response language:',
      placeholder: 'Ask a question about the technical documents...',
      processing: 'Processing...',
      processingMessage: 'Searching technical documents...',
      send: 'Send',
      clearChat: 'Clear conversation',
      sources: 'Sources consulted',
      revision: 'Revision',
      page: 'Page',
      defaultPage: '—',
      defaultCategory: 'Technical Document',
      similarity: 'Similarity',
      serviceUnavailable: 'The AI service is currently unavailable. Please try again later.',
      genericError: 'Could not get a response from the AI.',
      connectionError: 'Could not connect to the server. Check that the backend is running.',
    },
  };

  const currentAiTexts = computed(() => aiTexts[selectedLanguage.value]);

  const changeLanguage = (language) => {
    if (!IDIOMAS_ACEITOS.includes(language)) return;

    selectedLanguage.value = language;
    localStorage.setItem('ai-language', language);
  };

  const aiInputQuery = ref('');
  const isProcessing = ref(false);
  const answerAreaRef = ref(null);
  const chatMessages = ref([]);

  const scrollToBottom = () => {
    nextTick(() => {
      if (answerAreaRef.value) {
        answerAreaRef.value.scrollToBottom();
      }
    });
  };

  const handleSendAiMessage = async () => {
    const queryText = aiInputQuery.value.trim();

    if (!queryText || isProcessing.value) return;

    const timeString = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    chatMessages.value.push({
      type: 'user',
      text: queryText,
      timestamp: timeString,
    });

    aiInputQuery.value = '';
    isProcessing.value = true;
    scrollToBottom();

    const pushAiMessage = (text, sources = [], language = selectedLanguage.value) => {
      chatMessages.value.push({
        type: 'ai',
        text,
        sources,
        language,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

      isProcessing.value = false;
      scrollToBottom();
    };

    try {
      // Pipeline RAG do backend via serviço centralizado (AKA-96)
      const data = await askQuestion(queryText, selectedLanguage.value);

      const sources = (data?.fontes || []).map((fonte) => ({
        documentName: fonte.titulo,
        code: fonte.documento,
        revision: fonte.revisao || '—',
        page: fonte.pagina,
        similarity: `${Math.round(fonte.similaridade * 100)}%`,
        category: 'EverySpec',
        url: fonte.url_pdf,
      }));

      pushAiMessage(data?.resposta || '', data?.encontrou ? sources : [], data?.idioma);
    } catch (error) {
      if (error?.status === 503) {
        pushAiMessage(currentAiTexts.value.serviceUnavailable);
        return;
      }

      if (error?.status) {
        pushAiMessage(error.detail || currentAiTexts.value.genericError);
        return;
      }

      pushAiMessage(currentAiTexts.value.connectionError);
    }
  };

  const clearChat = () => {
    if (isProcessing.value) return;
    chatMessages.value = [];
  };

  // Lista de Documentos Técnicos Recentes (carregados via API sem mocks)
  const recentDocuments = ref([]);
  const recentDocsLoading = ref(false);
  const recentDocsError = ref('');

  const carregarDocumentosRecentes = async () => {
    recentDocsLoading.value = true;
    recentDocsError.value = '';
    try {
      const resp = await listarMeus({ page: 1 });
      const docs = resp?.results || resp?.items || (Array.isArray(resp) ? resp : []);
      if (Array.isArray(docs) && docs.length > 0) {
        recentDocuments.value = docs.slice(0, 6).map((doc) => {
          const isAprovado = doc.status_validacao === 'DISPONIVEL';
          const isDevolvido = doc.status_validacao === 'DEVOLVIDO';
          return {
            id: doc.id,
            category: doc.tipo_documento || doc.categoria || 'Aeroestrutura',
            code: doc.identificador_codigo || `DOC-${String(doc.id).slice(0, 6)}`,
            title: doc.titulo,
            time: doc.criado_em
              ? `Enviado em ${new Date(doc.criado_em).toLocaleDateString('pt-BR')}`
              : 'Recente',
            status: isAprovado ? 'Aprovado' : isDevolvido ? 'Devolvido' : 'Pendente',
            statusClass: isAprovado
              ? 'status-approved'
              : isDevolvido
                ? 'status-revision'
                : 'status-pending',
          };
        });
      } else {
        recentDocuments.value = [];
      }
    } catch (err) {
      recentDocuments.value = [];
      recentDocsError.value =
        err?.detail ||
        err?.message ||
        'Não foi possível carregar os documentos recentes do servidor.';
    } finally {
      recentDocsLoading.value = false;
    }
  };

  const pendingCount = ref(0);

  const podeValidar = computed(() => {
    return (
      props.currentUser?.pode_validar === true ||
      (!('pode_validar' in (props.currentUser || {})) &&
        props.currentUser?.role === 'Administrador')
    );
  });

  const carregarContadorPendentes = async () => {
    if (!podeValidar.value) {
      pendingCount.value = 0;
      return;
    }
    try {
      const data = await listarPendentes({ page: 1 });
      pendingCount.value = data?.count ?? (Array.isArray(data?.results) ? data.results.length : 0);
    } catch {
      pendingCount.value = 0;
    }
  };

  watch(
    () => props.currentUser,
    (user) => {
      carregarContadorPendentes();
      const hasPermission =
        user?.pode_validar === true ||
        (!('pode_validar' in (user || {})) && user?.role === 'Administrador');
      if (!hasPermission && activeMenu.value === 'Validação') {
        activeMenu.value = 'Início';
      }
    },
    { deep: true }
  );

  onMounted(() => {
    carregarDocumentosRecentes();
    carregarContadorPendentes();
  });

  // Menus padrão para fallback por perfil caso não venha no objeto
  const activeUserMenus = computed(() => {
    if (props.currentUser?.allowed_menus && props.currentUser.allowed_menus.length) {
      return props.currentUser.allowed_menus;
    }
    if (props.currentUser?.role === 'Administrador') {
      return [
        'Início',
        'Pesquisa Avançada',
        'Documentos',
        'Validação',
        'Projetos',
        'Despachos',
        'Malotes Digitais',
        'Gestão de Usuários',
        'Importar Arquivos',
        'Classificar Categorias',
        'AI Command Assistant',
      ];
    } else if (props.currentUser?.role === 'Qualidade') {
      return [
        'Início',
        'Pesquisa Avançada',
        'Documentos',
        'Relatórios de Qualidade',
        'Auditoria & Conformidade',
      ];
    } else {
      return [
        'Início',
        'Pesquisa Avançada',
        'Documentos',
        'Projetos',
        'AI Command Assistant',
        'Solicitar OI',
      ];
    }
  });
</script>

<template>
  <div class="dashboard-wrapper fade-in">
    <!-- Sidebar Navegação Esquerda (Componente SidebarMenu) -->
    <SidebarMenu
      :current-user="props.currentUser"
      :active-menu="activeMenu"
      :pending-count="pendingCount"
      @select-menu="(item) => (activeMenu = item)"
      @open-user-modal="showUserModal = true"
    />

    <!-- Área Principal de Trabalho -->
    <main class="main-content">
      <!-- Header Superior -->
      <header class="top-header">
        <div class="header-titles">
          <h1 class="page-title">Painel — Perfil {{ props.currentUser?.role || 'Engenharia' }}</h1>
          <p class="page-subtitle">
            Bem-vindo de volta, {{ props.currentUser?.name || 'Carlos Eduardo' }} —
            {{ props.currentUser?.cargo || 'Engenheiro' }}
          </p>
        </div>

        <div class="user-profile-badge">
          <div class="user-info">
            <span class="user-name">{{ props.currentUser?.name || 'Carlos Eduardo' }}</span>
            <span class="user-matricula"
              >Matrícula {{ props.currentUser?.matricula || 'AK-90822' }}</span
            >
          </div>
          <div class="user-avatar">
            <UserCheck :size="20" class="avatar-icon" />
          </div>
        </div>
      </header>

      <!-- Visão de Validação Técnica (AKA-49) -->
      <ValidationQueue
        v-if="activeMenu === 'Validação'"
        :current-user="props.currentUser"
        @item-decidido="carregarContadorPendentes"
      />

      <!-- Visão Central de Gestão e Validação de Documentos (AKA-94) -->
      <!-- Meus documentos: envios do usuário com o estado de cada um (AKA-63) -->
      <MeusDocumentos
        v-else-if="activeMenu === 'Meus documentos'"
        ref="meusDocumentosRef"
        @open-upload-modal="openUploadModal"
        @edit-document="openEditModal"
      />

      <DocumentsManager
        v-else-if="activeMenu === 'Documentos'"
        ref="documentsManagerRef"
        :current-user="props.currentUser"
        @open-upload-modal="openUploadModal"
        @edit-document="openEditModal"
      />

      <template v-else>
        <!-- Seção AI Command Assistant (Disponível para Engenharia e Administrador) -->
        <section v-if="activeUserMenus.includes('AI Command Assistant')" class="ai-assistant-card">
          <!-- Abas da IA -->
          <div class="ai-tabs">
            <button
              type="button"
              :class="['tab-btn', { active: activeTab === 'AI Command Assistant' }]"
              @click="activeTab = 'AI Command Assistant'"
            >
              <Sparkles :size="16" />
              <span>AI Command Assistant</span>
            </button>

            <button
              type="button"
              :class="['tab-btn', { active: activeTab === 'Smart Search' }]"
              @click="activeTab = 'Smart Search'"
            >
              <Search :size="16" />
              <span>Smart Search</span>
            </button>

            <button
              type="button"
              :class="['tab-btn', { active: activeTab === 'Prompt Console' }]"
              @click="activeTab = 'Prompt Console'"
            >
              <Settings :size="16" />
              <span>Prompt Console</span>
            </button>
          </div>

          <!-- Chat Stream Area (Componente AnswerArea) -->
          <AnswerArea
            ref="answerAreaRef"
            :messages="chatMessages"
            :is-processing="isProcessing"
            :current-ai-texts="currentAiTexts"
          />

          <!-- Input Bar Inferior (Componente QuestionArea com LanguageSelector integrado) -->
          <QuestionArea
            v-model="aiInputQuery"
            :is-processing="isProcessing"
            :selected-language="selectedLanguage"
            :current-ai-texts="currentAiTexts"
            @update:selected-language="changeLanguage"
            @send="handleSendAiMessage"
            @clear="clearChat"
          />
        </section>

        <!-- Ações Rápidas de Operação (Adaptadas por Perfil) -->
        <section class="quick-actions-section">
          <h3 class="section-label">
            AÇÕES RÁPIDAS DE OPERAÇÃO — {{ props.currentUser?.role?.toUpperCase() || 'ENGENHARIA' }}
          </h3>

          <!-- Grid Administrador -->
          <div v-if="props.currentUser?.role === 'Administrador'" class="actions-grid">
            <button class="action-card primary-action" @click="showUserModal = true">
              <UserPlus :size="18" />
              <span>Gestão de Usuários</span>
            </button>

            <button class="action-card" @click="openUploadModal">
              <Upload :size="18" />
              <span>Importar Arquivos</span>
            </button>

            <button class="action-card">
              <Tag :size="18" />
              <span>Classificar Categorias</span>
            </button>

            <button class="action-card">
              <ShieldCheck :size="18" />
              <span>Auditar Logs do Sistema</span>
            </button>
          </div>

          <!-- Grid Qualidade -->
          <div v-else-if="props.currentUser?.role === 'Qualidade'" class="actions-grid">
            <button class="action-card primary-action">
              <ShieldCheck :size="18" />
              <span>Auditoria & Conformidade</span>
            </button>

            <button class="action-card">
              <FileText :size="18" />
              <span>Emitir Relatório de Qualidade</span>
            </button>

            <button class="action-card">
              <Send :size="18" />
              <span>Solicitar Revisão Técnica</span>
            </button>

            <button class="action-card">
              <Search :size="18" />
              <span>Pesquisar Não-Conformidades</span>
            </button>
          </div>

          <!-- Grid Engenharia / Padrão -->
          <div v-else class="actions-grid">
            <button class="action-card primary-action" @click="openUploadModal">
              <Upload :size="18" />
              <span>Subir Novo Arquivo</span>
            </button>

            <button class="action-card">
              <Send :size="18" />
              <span>Novo Malote de Envio</span>
            </button>

            <button class="action-card">
              <Plus :size="18" />
              <span>Solicitar OI de Carga</span>
            </button>

            <button class="action-card">
              <Sparkles :size="18" />
              <span>Consultar AI Assistant</span>
            </button>
          </div>
        </section>

        <!-- Documentos Técnicos Recentes -->
        <section class="recent-docs-section">
          <div class="section-header-row">
            <h3 class="section-title">Documentos Técnicos Recentes</h3>
            <a href="#" class="link-see-all" @click.prevent="activeMenu = 'Meus documentos'">
              <span>Ver todos os arquivos</span>
              <ArrowRight :size="16" />
            </a>
          </div>

          <div v-if="recentDocsLoading" class="recent-docs-state">
            <span>Carregando documentos recentes...</span>
          </div>

          <div v-else-if="recentDocsError" class="recent-docs-state error">
            <span>{{ recentDocsError }}</span>
          </div>

          <div
            v-else-if="!recentDocuments || recentDocuments.length === 0"
            class="recent-docs-state"
          >
            <span>Nenhum documento recente encontrado.</span>
          </div>

          <div v-else class="documents-grid">
            <div
              v-for="doc in recentDocuments"
              :key="doc.id"
              class="document-card"
              @click="activeMenu = 'Meus documentos'"
            >
              <div class="doc-header">
                <span class="doc-category-badge">{{ doc.category }}</span>
                <span :class="['doc-status-badge', doc.statusClass]">{{ doc.status }}</span>
              </div>

              <h4 class="doc-title">{{ doc.title }}</h4>
              <div class="doc-footer">
                <span class="doc-code">{{ doc.code }}</span>
                <span class="doc-time">{{ doc.time }}</span>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- Modal de Upload - S2-32 (novo) / S2-36 (correção e reenvio) -->
      <div v-if="showUploadModal" class="modal-overlay" @click.self="closeUploadModal">
        <div class="upload-modal-card fade-in">
          <div class="upload-modal-header">
            <div class="upload-title-box">
              <div class="upload-icon-box">
                <FileUp :size="22" />
              </div>

              <div>
                <h3>
                  {{
                    documentoEmEdicao ? 'Corrigir e reenviar documento' : 'Enviar novo documento'
                  }}
                </h3>
                <p>
                  {{
                    documentoEmEdicao
                      ? 'Ajuste o que o validador apontou e reenvie'
                      : 'Campos com * são obrigatórios'
                  }}
                </p>
              </div>
            </div>

            <button
              type="button"
              class="close-upload-btn"
              :disabled="uploadLoading"
              aria-label="Fechar formulário"
              @click="closeUploadModal"
            >
              <X :size="20" />
            </button>
          </div>

          <div class="upload-modal-body">
            <UploadDocumento
              :key="documentoEmEdicao || 'novo'"
              :documento-id="documentoEmEdicao"
              @enviado="onUploadEnviado"
              @reenviado="onDocumentoReenviado"
              @enviando="(v) => (uploadLoading = v)"
              @cancelar="closeUploadModal"
            />
          </div>
        </div>
      </div>

      <!-- Modal de Gestão de Usuários (Administrador) -->
      <div v-if="showUserModal" class="modal-overlay" @click.self="showUserModal = false">
        <div class="user-modal-card fade-in">
          <div class="modal-header">
            <div class="modal-title-box">
              <UserCheck :size="22" class="modal-icon" />
              <h3>Gestão de Usuários do Sistema</h3>
            </div>
            <button class="close-btn" @click="showUserModal = false">&times;</button>
          </div>

          <div class="modal-body">
            <!-- Mensagens de Feedback no Modal -->
            <div v-if="userModalSuccess" class="modal-alert alert-success">
              <CheckCircle2 :size="16" />
              <span>{{ userModalSuccess }}</span>
            </div>
            <div v-if="userModalError" class="modal-alert alert-error">
              <AlertCircle :size="16" />
              <span>{{ userModalError }}</span>
            </div>

            <!-- Formulário Novo Usuário -->
            <form class="new-user-form" @submit.prevent="handleCreateUser">
              <h4>Cadastrar Novo Usuário</h4>
              <div class="form-row">
                <input
                  v-model="newUserName"
                  type="text"
                  placeholder="Nome Completo"
                  class="modal-input"
                  required
                />
                <input
                  v-model="newUserEmail"
                  type="email"
                  placeholder="E-mail (@akaer.com.br)"
                  class="modal-input"
                  required
                />
              </div>
              <div class="form-row">
                <select v-model="newUserRole" class="modal-select">
                  <option value="Engenharia">Engenharia</option>
                  <option value="Qualidade">Qualidade</option>
                  <option value="Administrador">Administrador</option>
                </select>
                <input
                  v-model="newUserMatricula"
                  type="text"
                  placeholder="Matrícula (ex: AK-99882)"
                  class="modal-input"
                />
              </div>
              <button type="submit" class="btn-create-user">
                <UserPlus :size="16" />
                <span>Cadastrar Usuário</span>
              </button>
            </form>

            <div class="modal-divider"></div>

            <!-- Lista de Usuários Existentes -->
            <h4>Usuários de Demonstração</h4>
            <div class="users-list">
              <div v-for="u in demoUsersList" :key="u.id" class="user-item">
                <div class="user-item-info">
                  <strong>{{ u.name }}</strong>
                  <span>{{ u.email }}</span>
                </div>
                <div class="user-item-badge">
                  <span class="user-role-tag">{{ u.role }}</span>
                  <span class="user-mat-tag">{{ u.matricula }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
  .dashboard-wrapper {
    display: flex;
    min-height: 100vh;
    width: 100vw;
    background-color: #f8fafc;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    padding: 2rem 2.5rem;
    overflow-y: auto;

    max-height: 100vh;
  }

  .top-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .page-title {
    font-size: 1.8rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.25rem;
  }

  .page-subtitle {
    font-size: 0.9rem;
    color: #64748b;

    margin: 0;
  }

  .user-profile-badge {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #ffffff;
    padding: 0.6rem 1rem;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .user-info {
    display: flex;
    flex-direction: column;
    text-align: right;
  }

  .user-name {
    font-size: 0.88rem;
    font-weight: 700;
    color: #0f172a;
  }

  .user-matricula {
    font-size: 0.75rem;
    color: #64748b;
  }

  .user-avatar {
    width: 38px;
    height: 38px;
    background-color: #f1f5f9;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #7e22ce;
  }

  /* AI Card */
  .ai-assistant-card {
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  }

  .ai-tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 1rem;
    margin-bottom: 1.25rem;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #64748b;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-btn.active {
    background-color: #f3e8ff;
    color: #7e22ce;
  }

  /* Quick Actions */
  .quick-actions-section {
    margin-bottom: 2rem;
  }

  .section-label {
    font-size: 0.75rem;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.08em;
    margin-bottom: 0.85rem;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .action-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .action-card:hover {
    border-color: #7e22ce;
    color: #7e22ce;
    transform: translateY(-1px);
  }

  .action-card.primary-action {
    background: linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%);
    color: #ffffff;
    border: none;
  }

  .action-card.primary-action:hover {
    opacity: 0.95;
    color: #ffffff;
  }

  /* Recent Documents */
  .recent-docs-section {
    margin-bottom: 2rem;
  }

  .section-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #0f172a;
  }

  .link-see-all {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: #7e22ce;
    font-weight: 600;
    text-decoration: none;
  }

  .recent-docs-state {
    padding: 2.5rem 1rem;
    text-align: center;
    background: #ffffff;
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
    color: #64748b;
    font-size: 0.9rem;
  }

  .recent-docs-state.error {
    border-color: #fecaca;
    background: #fef2f2;
    color: #991b1b;
  }

  .documents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .document-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  }

  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .doc-category-badge {
    font-size: 0.7rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
  }

  .doc-status-badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
  }

  .status-approved {
    background: #dcfce7;
    color: #166534;
  }

  .status-revision {
    background: #fef9c3;
    color: #854d0e;
  }

  .status-pending {
    background: #fee2e2;
    color: #991b1b;
  }

  .doc-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
    line-height: 1.4;
  }

  .doc-footer {
    display: flex;
    justify-content: space-between;
    font-size: 0.78rem;
    color: #94a3b8;
    margin-top: auto;
  }

  /* Modal de Gestão de Usuários */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  .user-modal-card {
    background: #ffffff;
    width: 100%;
    max-width: 540px;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }

  .modal-header {
    background: #0f172a;
    color: #ffffff;
    padding: 1.25rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-title-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .modal-title-box h3 {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
  }

  .modal-icon {
    color: #c084fc;
  }

  .close-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.5rem;
    cursor: pointer;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 0.85rem;
    border-radius: 8px;
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  .new-user-form h4,
  .modal-body h4 {
    font-size: 0.88rem;
    font-weight: 700;
    color: #334155;
    margin-bottom: 0.75rem;
  }

  .form-row {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .modal-input,
  .modal-select {
    flex: 1;
    padding: 0.65rem 0.85rem;
    font-size: 0.85rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    outline: none;
  }

  .btn-create-user {
    width: 100%;
    padding: 0.75rem;
    background: #7e22ce;
    color: #ffffff;
    font-weight: 700;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.88rem;
  }

  .modal-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 1.25rem 0;
  }

  .users-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    max-height: 180px;
    overflow-y: auto;
  }

  .user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0.85rem;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .user-item-info {
    display: flex;
    flex-direction: column;
    font-size: 0.82rem;
  }

  .user-item-info strong {
    color: #0f172a;
  }

  .user-item-info span {
    color: #64748b;
    font-size: 0.75rem;
  }

  .user-item-badge {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;
  }

  .user-role-tag {
    font-size: 0.7rem;
    font-weight: 700;
    color: #7e22ce;
    background: #f3e8ff;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
  }

  .user-mat-tag {
    font-size: 0.7rem;
    color: #64748b;
  }

  @media (max-width: 900px) {
    .dashboard-wrapper {
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
      transition: all 0.2s;
    }
    .sidebar {
      width: 100%;
    }
  }

  /* =========================================================
   MODAL UPLOAD - S2-32 (o formulário tem estilo próprio)
========================================================= */

  .upload-modal-card {
    background: #ffffff;
    width: 100%;
    max-width: 780px;
    max-height: 90vh;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
  }

  .upload-modal-header {
    background: #0f172a;
    color: #ffffff;
    padding: 1.25rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  .upload-title-box {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .upload-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 9px;
    background: #7e22ce;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
  }

  .upload-title-box h3 {
    margin: 0 0 0.2rem;
    font-size: 1.05rem;
    font-weight: 700;
  }

  .upload-title-box p {
    margin: 0;
    color: #94a3b8;
    font-size: 0.75rem;
  }

  .close-upload-btn {
    width: 34px;
    height: 34px;
    border: none;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-upload-btn:hover:not(:disabled) {
    background: #1e293b;
    color: #ffffff;
  }

  .close-upload-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .upload-modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }
</style>
