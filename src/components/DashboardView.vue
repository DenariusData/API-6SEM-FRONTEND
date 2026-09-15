<script setup>
import { ref } from 'vue'
import logoUrl from '@/assets/logo.png'
import {
  Home,
  Search,
  FileText,
  Package,
  Mail,
  FolderGit2,
  Sparkles,
  Settings,
  Trash2,
  Send,
  Upload,
  Plus,
  ShieldCheck,
  ArrowRight,
  UserCheck
} from 'lucide-vue-next'

const activeMenu = ref('Inicio')
const activeTab = ref('AI Command Assistant')

const aiInputQuery = ref('')
const chatMessages = ref([
  {
    type: 'user',
    text: 'Quais os limites de stress para a asa do Gripen NG?'
  },
  {
    type: 'ai',
    text: 'Identifiquei 3 documentos altamente relevantes para a sua análise de trem de pouso e stress estrutural na asa do Gripen NG. Recomendo focar no primeiro certificado de conformidade.',
    documents: [
      { category: 'Aeroestrutura', title: 'Stress Test Asa Esquerda - Gripen NG', code: 'OI-2026-A8' },
      { category: 'Sistemas Críticos', title: 'Relatório de Empuxo Estrutural', code: 'DO-4820-F4' },
      { category: 'Sistemas Críticos', title: 'Certificado de Análise Estrutural', code: 'CA-4028-E' }
    ]
  }
])

const handleSendAiMessage = () => {
  if (!aiInputQuery.value.trim()) return

  chatMessages.value.push({
    type: 'user',
    text: aiInputQuery.value
  })

  const userQuery = aiInputQuery.value
  aiInputQuery.value = ''

  setTimeout(() => {
    chatMessages.value.push({
      type: 'ai',
      text: `Analisando a sua consulta: "${userQuery}". Os parâmetros de conformidade técnica indicam margem de segurança dentro dos limites operacionais previstos pela norma Akaer-ENG-2026.`,
      documents: [
        { category: 'Aeroestrutura', title: 'Manual de Tolerância e Resistência', code: 'OI-9621-X' }
      ]
    })
  }, 1000)
}

const clearChat = () => {
  chatMessages.value = []
}

// Lista de Documentos Técnicos Recentes
const recentDocuments = ref([
  {
    id: 1,
    category: 'Aeroestrutura',
    code: 'OI-2026-A8',
    title: 'Stress Test Asa Esquerda - Gripen NG',
    time: 'Modificado há 2h',
    status: 'Aprovado',
    statusClass: 'status-approved'
  },
  {
    id: 2,
    category: 'Sistemas Críticos',
    code: 'DO-4820-F4',
    title: 'Relatório de Empuxo Estrutural - Protótipo C',
    time: 'Modificado há 4h',
    status: 'Em Revisão',
    statusClass: 'status-revision'
  },
  {
    id: 3,
    category: 'Logística',
    code: 'DS-8920-L',
    title: 'Instruções de Despacho de Asa - SJC Hangar 2',
    time: 'Modificado ontem',
    status: 'Aprovado',
    statusClass: 'status-approved'
  },
  {
    id: 4,
    category: 'Sistemas Críticos',
    code: 'OI-9621-X',
    title: 'Manual de Operação de Aviônicos - Versão Final',
    time: 'Modificado ontem',
    status: 'Pendente',
    statusClass: 'status-pending'
  },
  {
    id: 5,
    category: 'Aeroestrutura',
    code: 'CA-4028-E',
    title: 'Certificado de Análise Estrutural do Trem de Pouso',
    time: 'Modificado há 3 dias',
    status: 'Aprovado',
    statusClass: 'status-approved'
  },
  {
    id: 6,
    category: 'Manutenção',
    code: 'PM-9011-M',
    title: 'Plano de Manutenção Preventiva Turbinas GE-880',
    time: 'Modificado há 5 dias',
    status: 'Em Revisão',
    statusClass: 'status-revision'
  }
])
</script>

<template>
  <div class="dashboard-wrapper fade-in">
    <!-- Sidebar Navegação Esquerda -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <img :src="logoUrl" alt="AkaVision Logo" class="sidebar-logo" />
        <div class="sidebar-brand-text">
          <span class="sidebar-title">AkaVision</span>
          <span class="sidebar-subtitle">AKAER ENGENHARIA S.A.</span>
        </div>
      </div>

      <!-- Menu Principal -->
      <nav class="sidebar-menu">
        <a
          href="#"
          @click.prevent="activeMenu = 'Inicio'"
          :class="['menu-item', { active: activeMenu === 'Inicio' }]"
        >
          <Home :size="18" class="menu-icon" />
          <span>Início</span>
        </a>

        <a
          href="#"
          @click.prevent="activeMenu = 'Pesquisa'"
          :class="['menu-item', { active: activeMenu === 'Pesquisa' }]"
        >
          <Search :size="18" class="menu-icon" />
          <span>Pesquisa Avançada</span>
        </a>

        <a
          href="#"
          @click.prevent="activeMenu = 'Documentos'"
          :class="['menu-item', { active: activeMenu === 'Documentos' }]"
        >
          <FileText :size="18" class="menu-icon" />
          <span>Documentos</span>
        </a>

        <a
          href="#"
          @click.prevent="activeMenu = 'Despachos'"
          :class="['menu-item', { active: activeMenu === 'Despachos' }]"
        >
          <Package :size="18" class="menu-icon" />
          <span>Despachos</span>
        </a>

        <a
          href="#"
          @click.prevent="activeMenu = 'Malotes'"
          :class="['menu-item', { active: activeMenu === 'Malotes' }]"
        >
          <Mail :size="18" class="menu-icon" />
          <span>Malotes Digitais</span>
        </a>

        <a
          href="#"
          @click.prevent="activeMenu = 'Projetos'"
          :class="['menu-item', { active: activeMenu === 'Projetos' }]"
        >
          <FolderGit2 :size="18" class="menu-icon" />
          <span>Projetos</span>
        </a>
      </nav>

      <!-- Card Inferior de Credencial Operacional -->
      <div class="sidebar-credential-card">
        <span class="cred-tag">CREDENCIAL OPERACIONAL</span>
        <h4 class="cred-level">Nível 3 — Confidencial</h4>
        <p class="cred-info">Acesso monitorado pelo terminal SJC-22A.</p>
      </div>
    </aside>

    <!-- Área Principal de Trabalho -->
    <main class="main-content">
      <!-- Header Superior -->
      <header class="top-header">
        <div class="header-titles">
          <h1 class="page-title">Painel do Operador</h1>
          <p class="page-subtitle">
            Bem-vindo de volta, João Silva — Supervisor de Aeroestrutura
          </p>
        </div>

        <div class="user-profile-badge">
          <div class="user-info">
            <span class="user-name">João Silva</span>
            <span class="user-matricula">Matrícula AK-90822</span>
          </div>
          <div class="user-avatar">
            <UserCheck :size="20" class="avatar-icon" />
          </div>
        </div>
      </header>

      <!-- Seção AI Command Assistant -->
      <section class="ai-assistant-card">
        <!-- Abas da IA -->
        <div class="ai-tabs">
          <button
            type="button"
            @click="activeTab = 'AI Command Assistant'"
            :class="['tab-btn', { active: activeTab === 'AI Command Assistant' }]"
          >
            <Sparkles :size="16" />
            <span>AI Command Assistant</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'Smart Search'"
            :class="['tab-btn', { active: activeTab === 'Smart Search' }]"
          >
            <Search :size="16" />
            <span>Smart Search</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'Prompt Console'"
            :class="['tab-btn', { active: activeTab === 'Prompt Console' }]"
          >
            <Settings :size="16" />
            <span>Prompt Console</span>
          </button>
        </div>

        <!-- Chat Stream Area -->
        <div class="chat-container">
          <div
            v-for="(msg, index) in chatMessages"
            :key="index"
            :class="['chat-bubble-wrapper', msg.type]"
          >
            <!-- Pergunta do Usuário -->
            <div v-if="msg.type === 'user'" class="user-bubble">
              <span>{{ msg.text }}</span>
            </div>

            <!-- Resposta da IA -->
            <div v-else class="ai-response-box">
              <div class="ai-icon-circle">
                <Sparkles :size="16" />
              </div>
              <div class="ai-response-content">
                <p class="ai-text">{{ msg.text }}</p>

                <!-- Cards de Documentos Citados -->
                <div v-if="msg.documents && msg.documents.length" class="cited-docs-grid">
                  <div
                    v-for="(doc, dIdx) in msg.documents"
                    :key="dIdx"
                    class="cited-doc-card"
                  >
                    <span class="doc-cat-tag">{{ doc.category }}</span>
                    <h5 class="cited-doc-title">{{ doc.title }}</h5>
                    <span class="cited-doc-code">{{ doc.code }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Bar Inferior -->
        <div class="ai-input-bar">
          <button type="button" @click="clearChat" class="btn-clear" title="Limpar mensagens">
            <Trash2 :size="18" />
          </button>
          <input
            type="text"
            v-model="aiInputQuery"
            @keyup.enter="handleSendAiMessage"
            placeholder="Type AI message..."
            class="ai-input"
          />
          <button type="button" @click="handleSendAiMessage" class="btn-send-ai">
            <Send :size="16" />
          </button>
        </div>
      </section>

      <!-- Ações Rápidas de Operação -->
      <section class="quick-actions-section">
        <h3 class="section-label">AÇÕES RÁPIDAS DE OPERAÇÃO</h3>
        <div class="actions-grid">
          <button class="action-card primary-action">
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
            <ShieldCheck :size="18" />
            <span>Auditar Logs de Acesso</span>
          </button>
        </div>
      </section>

      <!-- Documentos Técnicos Recentes -->
      <section class="recent-docs-section">
        <div class="section-header-row">
          <h3 class="section-title">Documentos Técnicos Recentes</h3>
          <a href="#" @click.prevent class="link-see-all">
            <span>Ver todos os arquivos</span>
            <ArrowRight :size="16" />
          </a>
        </div>

        <div class="recent-grid">
          <div
            v-for="doc in recentDocuments"
            :key="doc.id"
            class="document-card"
          >
            <div class="doc-card-header">
              <span class="doc-category-badge">{{ doc.category }}</span>
              <span class="doc-code-tag">{{ doc.code }}</span>
            </div>

            <h4 class="doc-title">{{ doc.title }}</h4>

            <div class="doc-card-footer">
              <span class="doc-time">{{ doc.time }}</span>
              <span :class="['status-badge', doc.statusClass]">
                <span class="status-dot"></span>
                <span>{{ doc.status }}</span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background-color: #f1f5f9;
  overflow-x: hidden;
}

/* ==========================================
   SIDEBAR (NAVEGAÇÃO ESQUERDA)
   ========================================== */
.sidebar {
  width: 260px;
  background: radial-gradient(circle at top, #1e0836 0%, #16042a 60%, #0d021c 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 1.75rem 1.25rem;
  flex-shrink: 0;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding-left: 0.5rem;
}

.sidebar-logo {
  height: 34px;
  width: auto;
}

.sidebar-brand-text {
  display: flex;
  flex-direction: column;
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
}

.sidebar-subtitle {
  font-size: 0.62rem;
  font-weight: 700;
  color: #d8b4fe;
  letter-spacing: 0.12em;
  margin-top: 0.25rem;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1rem;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.2s;
  position: relative;
}

.menu-item:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.06);
}

.menu-item.active {
  color: #ffffff;
  background-color: #4c1d95;
  font-weight: 600;
}

.menu-item.active::after {
  content: '';
  position: absolute;
  right: 0.75rem;
  width: 4px;
  height: 18px;
  background-color: #c084fc;
  border-radius: 4px;
}

.sidebar-credential-card {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1.5rem;
}

.cred-tag {
  font-size: 0.65rem;
  font-weight: 800;
  color: #d8b4fe;
  letter-spacing: 0.08em;
  display: block;
  margin-bottom: 0.25rem;
}

.cred-level {
  font-size: 0.9rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.cred-info {
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.3;
}

/* ==========================================
   MAIN CONTENT
   ========================================== */
.main-content {
  flex: 1;
  padding: 2rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-y: auto;
}

/* Top Header */
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-family: var(--font-serif);
  font-size: 2.5rem;
  font-weight: 500;
  color: #1e1b4b;
  line-height: 1.1;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.user-profile-badge {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background-color: #ffffff;
  padding: 0.5rem 1rem 0.5rem 1.25rem;
  border-radius: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.user-info {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
}

.user-matricula {
  font-size: 0.75rem;
  color: #64748b;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ==========================================
   AI COMMAND ASSISTANT CARD
   ========================================== */
.ai-assistant-card {
  background-color: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.25rem 0 1.25rem;
  border-bottom: 1px solid #f1f5f9;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  background: none;
  border: none;
  border-bottom: 2.5px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #7e22ce;
}

.tab-btn.active {
  color: #7e22ce;
  border-bottom-color: #7e22ce;
}

.chat-container {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 180px;
}

.chat-bubble-wrapper.user {
  display: flex;
  justify-content: flex-end;
}

.user-bubble {
  background-color: #1e0836;
  color: #ffffff;
  padding: 0.85rem 1.25rem;
  border-radius: 14px 14px 2px 14px;
  font-size: 0.9rem;
  max-width: 80%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.ai-response-box {
  display: flex;
  gap: 1rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.25rem;
  max-width: 90%;
}

.ai-icon-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #7e22ce;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-response-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ai-text {
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.5;
}

.cited-docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.cited-doc-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.doc-cat-tag {
  font-size: 0.68rem;
  font-weight: 700;
  color: #7e22ce;
  background-color: #f3e8ff;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  width: fit-content;
}

.cited-doc-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.25;
}

.cited-doc-code {
  font-size: 0.72rem;
  color: #94a3b8;
}

/* Input Bar Inferior */
.ai-input-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  background-color: #ffffff;
  border-top: 1px solid #f1f5f9;
}

.btn-clear {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 6px;
  transition: color 0.2s;
}

.btn-clear:hover {
  color: #ef4444;
}

.ai-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.9rem;
  color: #1e293b;
}

.ai-input::placeholder {
  color: #94a3b8;
}

.btn-send-ai {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #7e22ce;
  color: #ffffff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-send-ai:hover {
  background-color: #6b21a8;
}

/* ==========================================
   AÇÕES RÁPIDAS DE OPERAÇÃO
   ========================================== */
.quick-actions-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.08em;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.action-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border-color: #cbd5e1;
}

.action-card.primary-action {
  background-color: #4c1d95;
  color: #ffffff;
  border: none;
}

.action-card.primary-action:hover {
  background-color: #3b166e;
}

/* ==========================================
   DOCUMENTOS TÉCNICOS RECENTES
   ========================================== */
.recent-docs-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
}

.link-see-all {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #7e22ce;
  text-decoration: none;
}

.link-see-all:hover {
  text-decoration: underline;
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.document-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  transition: all 0.2s;
}

.document-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.doc-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.doc-category-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #7e22ce;
  background-color: #f3e8ff;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
}

.doc-code-tag {
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
}

.doc-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
}

.doc-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f8fafc;
}

.doc-time {
  font-size: 0.78rem;
  color: #94a3b8;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-approved {
  background-color: #ecfdf5;
  color: #059669;
}
.status-approved .status-dot { background-color: #10b981; }

.status-revision {
  background-color: #fff7ed;
  color: #d97706;
}
.status-revision .status-dot { background-color: #f59e0b; }

.status-pending {
  background-color: #f3e8ff;
  color: #7e22ce;
}
.status-pending .status-dot { background-color: #a855f7; }

/* Responsive Grid */
@media (max-width: 1200px) {
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .recent-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 850px) {
  .dashboard-wrapper {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }

  .recent-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
