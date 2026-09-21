<script setup>
import { ref, computed } from 'vue'
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
  UserCheck,
  UserPlus,
  Tag,
  CheckCircle2,
  AlertCircle
} from 'lucide-vue-next'

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
      allowed_menus: ['Início', 'Pesquisa Avançada', 'Documentos', 'Projetos', 'AI Command Assistant', 'Solicitar OI']
    })
  }
})

const activeMenu = ref('Início')
const activeTab = ref('AI Command Assistant')

// Modal de Gestão de Usuários (Exclusivo Administrador)
const showUserModal = ref(false)
const newUserName = ref('')
const newUserEmail = ref('')
const newUserRole = ref('Engenharia')
const newUserMatricula = ref('')
const userModalSuccess = ref('')
const userModalError = ref('')

const demoUsersList = ref([
  { id: 1, name: 'Carlos Eduardo', email: 'engenharia@akaer.com.br', role: 'Engenharia', matricula: 'AK-90822' },
  { id: 2, name: 'Ana Souza', email: 'qualidade@akaer.com.br', role: 'Qualidade', matricula: 'AK-77401' },
  { id: 3, name: 'Ricardo Mendes', email: 'admin@akaer.com.br', role: 'Administrador', matricula: 'AK-10001' }
])

const handleCreateUser = async () => {
  userModalSuccess.value = ''
  userModalError.value = ''

  if (!newUserName.value.trim() || !newUserEmail.value.trim()) {
    userModalError.value = 'Preencha o nome e o e-mail do novo usuário.'
    return
  }

  const payload = {
    name: newUserName.value,
    email: newUserEmail.value,
    role: newUserRole.value,
    matricula: newUserMatricula.value || `AK-${Math.floor(10000 + Math.random() * 90000)}`
  }

  try {
    const res = await fetch('http://localhost:8000/api/auth/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      const data = await res.json()
      demoUsersList.value.push(data.user)
      userModalSuccess.value = `Usuário ${data.user.name} cadastrado com sucesso!`
    } else {
      demoUsersList.value.push({ ...payload, id: Date.now() })
      userModalSuccess.value = `Usuário ${payload.name} cadastrado no ambiente de demonstração!`
    }
  } catch (e) {
    demoUsersList.value.push({ ...payload, id: Date.now() })
    userModalSuccess.value = `Usuário ${payload.name} cadastrado!`
  }

  newUserName.value = ''
  newUserEmail.value = ''
  newUserMatricula.value = ''
}

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
      text: 'Identifiquei 3 documentos altamente relevantes para a sua análise de trem de pouso e stress estrutural na asa do Gripen NG. Recomendo focar no primeiro certificado de conformidade.',
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

// Menus padrão para fallback por perfil caso não venha no objeto
const activeUserMenus = computed(() => {
  if (props.currentUser?.allowed_menus && props.currentUser.allowed_menus.length) {
    return props.currentUser.allowed_menus
  }
  if (props.currentUser?.role === 'Administrador') {
    return ['Início', 'Pesquisa Avançada', 'Documentos', 'Projetos', 'Despachos', 'Malotes Digitais', 'Gestão de Usuários', 'Importar Arquivos', 'Classificar Categorias', 'AI Command Assistant']
  } else if (props.currentUser?.role === 'Qualidade') {
    return ['Início', 'Pesquisa Avançada', 'Documentos', 'Relatórios de Qualidade', 'Auditoria & Conformidade']
  } else {
    return ['Início', 'Pesquisa Avançada', 'Documentos', 'Projetos', 'AI Command Assistant', 'Solicitar OI']
  }
})

const getMenuIcon = (menuTitle) => {
  switch (menuTitle) {
    case 'Início': return Home
    case 'Pesquisa Avançada': return Search
    case 'Documentos': return FileText
    case 'Gestão de Usuários': return UserCheck
    case 'Importar Arquivos': return Upload
    case 'Classificar Categorias': return Tag
    case 'Projetos': return FolderGit2
    case 'Despachos': return Package
    case 'Malotes Digitais': return Mail
    case 'AI Command Assistant': return Sparkles
    case 'Relatórios de Qualidade': return FileText
    case 'Auditoria & Conformidade': return ShieldCheck
    case 'Solicitar OI': return Plus
    default: return FileText
  }
}
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

      <!-- Menu Principal Dinâmico por Perfil -->
      <nav class="sidebar-menu">
        <a
          v-for="item in activeUserMenus"
          :key="item"
          href="#"
          @click.prevent="item === 'Gestão de Usuários' ? (showUserModal = true) : (activeMenu = item)"
          :class="['menu-item', { active: activeMenu === item }]"
        >
          <component :is="getMenuIcon(item)" :size="18" class="menu-icon" />
          <span>{{ item }}</span>
        </a>
      </nav>

      <!-- Card Inferior de Credencial Operacional -->
      <div class="sidebar-credential-card">
        <span class="cred-tag">PERFIL {{ props.currentUser?.role?.toUpperCase() || 'OPERACIONAL' }}</span>
        <h4 class="cred-level">Nível — {{ props.currentUser?.role || 'Engenharia' }}</h4>
        <p class="cred-info">Credencial {{ props.currentUser?.matricula || 'AK-90822' }} verificada.</p>
      </div>
    </aside>

    <!-- Área Principal de Trabalho -->
    <main class="main-content">
      <!-- Header Superior -->
      <header class="top-header">
        <div class="header-titles">
          <h1 class="page-title">Painel — Perfil {{ props.currentUser?.role || 'Engenharia' }}</h1>
          <p class="page-subtitle">
            Bem-vindo de volta, {{ props.currentUser?.name || 'Carlos Eduardo' }} — {{ props.currentUser?.cargo || 'Engenheiro' }}
          </p>
        </div>

        <div class="user-profile-badge">
          <div class="user-info">
            <span class="user-name">{{ props.currentUser?.name || 'Carlos Eduardo' }}</span>
            <span class="user-matricula">Matrícula {{ props.currentUser?.matricula || 'AK-90822' }}</span>
          </div>
          <div class="user-avatar">
            <UserCheck :size="20" class="avatar-icon" />
          </div>
        </div>
      </header>

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
                  <div v-for="(doc, dIdx) in msg.documents" :key="dIdx" class="cited-doc-card">
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
          <button type="button" class="btn-clear" title="Limpar mensagens" @click="clearChat">
            <Trash2 :size="18" />
          </button>
          <input
            v-model="aiInputQuery"
            @keyup.enter="handleSendAiMessage"
            placeholder="Digite sua mensagem para o assistente de engenharia..."
            class="ai-input"
            @keyup.enter="handleSendAiMessage"
          />
          <button type="button" class="btn-send-ai" @click="handleSendAiMessage">
            <Send :size="16" />
          </button>
        </div>
      </section>

      <!-- Ações Rápidas de Operação (Adaptadas por Perfil) -->
      <section class="quick-actions-section">
        <h3 class="section-label">AÇÕES RÁPIDAS DE OPERAÇÃO — {{ props.currentUser?.role?.toUpperCase() || 'ENGENHARIA' }}</h3>
        
        <!-- Grid Administrador -->
        <div v-if="props.currentUser?.role === 'Administrador'" class="actions-grid">
          <button class="action-card primary-action" @click="showUserModal = true">
            <UserPlus :size="18" />
            <span>Gestão de Usuários</span>
          </button>

          <button class="action-card">
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
            <Sparkles :size="18" />
            <span>Consultar AI Assistant</span>
          </button>
        </div>
      </section>

      <!-- Documentos Técnicos Recentes -->
      <section class="recent-docs-section">
        <div class="section-header-row">
          <h3 class="section-title">Documentos Técnicos Recentes</h3>
          <a href="#" class="link-see-all" @click.prevent>
            <span>Ver todos os arquivos</span>
            <ArrowRight :size="16" />
          </a>
        </div>

        <div class="documents-grid">
          <div
            v-for="doc in recentDocuments"
            :key="doc.id"
            class="document-card"
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
            <form @submit.prevent="handleCreateUser" class="new-user-form">
              <h4>Cadastrar Novo Usuário</h4>
              <div class="form-row">
                <input v-model="newUserName" type="text" placeholder="Nome Completo" class="modal-input" required />
                <input v-model="newUserEmail" type="email" placeholder="E-mail (@akaer.com.br)" class="modal-input" required />
              </div>
              <div class="form-row">
                <select v-model="newUserRole" class="modal-select">
                  <option value="Engenharia">Engenharia</option>
                  <option value="Qualidade">Qualidade</option>
                  <option value="Administrador">Administrador</option>
                </select>
                <input v-model="newUserMatricula" type="text" placeholder="Matrícula (ex: AK-99882)" class="modal-input" />
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

/* Sidebar */
.sidebar {
  width: 270px;
  background-color: #0f172a;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
  border-right: 1px solid #1e293b;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 1.5rem;
}

.sidebar-logo {
  height: 36px;
  width: auto;
}

.sidebar-brand-text {
  display: flex;
  flex-direction: column;
}

.sidebar-title {
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: -0.01em;
}

.sidebar-subtitle {
  font-size: 0.65rem;
  color: #94a3b8;
  letter-spacing: 0.08em;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s;
}

.menu-item:hover {
  background-color: #1e293b;
  color: #ffffff;
}

.menu-item.active {
  background-color: #7e22ce;
  color: #ffffff;
}

.menu-icon {
  opacity: 0.85;
}

.sidebar-credential-card {
  background: #1e293b;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid #334155;
  margin-top: auto;
}

.cred-tag {
  font-size: 0.65rem;
  font-weight: 800;
  color: #c084fc;
  letter-spacing: 0.08em;
  display: block;
}

.cred-level {
  font-size: 0.85rem;
  margin: 0.25rem 0;
  color: #ffffff;
}

.cred-info {
  font-size: 0.72rem;
  color: #94a3b8;
  margin: 0;
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

.chat-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 260px;
  overflow-y: auto;
  margin-bottom: 1.25rem;
  padding-right: 0.5rem;
}

.user-bubble {
  align-self: flex-end;
  background: #7e22ce;
  color: #ffffff;
  padding: 0.75rem 1.25rem;
  border-radius: 14px 14px 2px 14px;
  font-size: 0.9rem;
  max-width: 80%;
}

.ai-response-box {
  display: flex;
  gap: 0.85rem;
  align-self: flex-start;
  max-width: 85%;
}

.ai-icon-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f3e8ff;
  color: #7e22ce;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-text {
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
}

.cited-docs-grid {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.cited-doc-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
}

.doc-cat-tag {
  font-size: 0.68rem;
  font-weight: 700;
  color: #7e22ce;
  display: block;
}

.cited-doc-title {
  font-size: 0.82rem;
  margin: 0.2rem 0;
  color: #0f172a;
}

.cited-doc-code {
  font-size: 0.72rem;
  color: #64748b;
}

.ai-input-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
}

.btn-clear {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;

  padding: 0.35rem;
}

.ai-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 0.9rem;
  color: #0f172a;
}

.btn-send-ai {
  background: #7e22ce;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
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

.new-user-form h4, .modal-body h4 {
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

.modal-input, .modal-select {
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
</style>
