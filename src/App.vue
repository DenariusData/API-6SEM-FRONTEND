<script setup>
  import { ref } from 'vue';
  import LoginView from './components/LoginView.vue';
  import TermsView from './components/TermsView.vue';
  import DashboardView from './components/DashboardView.vue';
  import { LogIn, FileCheck, LayoutDashboard, UserCheck, Shield, Wrench } from 'lucide-vue-next';

  // Perfis mock pré-definidos para chaveamento rápido de demonstração
  const MOCK_PROFILES = {
    Engenharia: {
      id: 1,
      email: 'engenharia@akaer.com.br',
      name: 'Carlos Eduardo',
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
    },
    Qualidade: {
      id: 2,
      email: 'qualidade@akaer.com.br',
      name: 'Ana Souza',
      role: 'Qualidade',
      matricula: 'AK-77401',
      cargo: 'Inspectora de Qualidade e Conformidade',
      allowed_menus: [
        'Início',
        'Pesquisa Avançada',
        'Documentos',
        'Relatórios de Qualidade',
        'Auditoria & Conformidade',
      ],
    },
    Administrador: {
      id: 3,
      email: 'admin@akaer.com.br',
      name: 'Ricardo Mendes',
      role: 'Administrador',
      matricula: 'AK-10001',
      cargo: 'Administrador do Sistema',
      allowed_menus: [
        'Início',
        'Pesquisa Avançada',
        'Documentos',
        'Projetos',
        'Despachos',
        'Malotes Digitais',
        'Gestão de Usuários',
        'Importar Arquivos',
        'Classificar Categorias',
        'AI Command Assistant',
      ],
    },
  };

  // Estado da visão atual: 'login' | 'terms' | 'dashboard'
  const currentScreen = ref('login');
  const currentUser = ref(MOCK_PROFILES.Engenharia);

  const onLoginSuccess = (user) => {
    if (user) {
      currentUser.value = user;
    }
    currentScreen.value = 'terms';
  };

  const onTermsAccepted = () => {
    currentScreen.value = 'dashboard';
  };

  const onTermsDeclined = () => {
    currentScreen.value = 'login';
  };

  const switchProfile = (roleName) => {
    if (MOCK_PROFILES[roleName]) {
      currentUser.value = MOCK_PROFILES[roleName];
    }
  };
</script>

<template>
  <div class="app-root">
    <!-- Floating Quick Navigation Switcher (Para troca fácil de visão e perfil em ambiente de Dev/Demo) -->
    <div class="screen-switcher-bar">
      <span class="switcher-label">AkaVision Preview:</span>

      <button
        :class="['switcher-btn', { active: currentScreen === 'login' }]"
        @click="currentScreen = 'login'"
      >
        <LogIn :size="14" />
        <span>Login</span>
      </button>

      <button
        :class="['switcher-btn', { active: currentScreen === 'terms' }]"
        @click="currentScreen = 'terms'"
      >
        <FileCheck :size="14" />
        <span>Termos</span>
      </button>

      <button
        :class="['switcher-btn', { active: currentScreen === 'dashboard' }]"
        @click="currentScreen = 'dashboard'"
      >
        <LayoutDashboard :size="14" />
        <span>Dashboard</span>
      </button>

      <div class="profile-divider"></div>
      <span class="switcher-label">Perfil Demo:</span>

      <button
        :class="['switcher-btn profile-btn', { active: currentUser?.role === 'Engenharia' }]"
        title="Simular perfil Engenharia"
        @click="switchProfile('Engenharia')"
      >
        <Wrench :size="13" />
        <span>Engenharia</span>
      </button>

      <button
        :class="['switcher-btn profile-btn', { active: currentUser?.role === 'Qualidade' }]"
        title="Simular perfil Qualidade"
        @click="switchProfile('Qualidade')"
      >
        <Shield :size="13" />
        <span>Qualidade</span>
      </button>

      <button
        :class="['switcher-btn profile-btn', { active: currentUser?.role === 'Administrador' }]"
        title="Simular perfil Administrador"
        @click="switchProfile('Administrador')"
      >
        <UserCheck :size="13" />
        <span>Admin</span>
      </button>
    </div>

    <!-- Renderização Condicional da Tela -->
    <main class="main-screen-container">
      <LoginView v-if="currentScreen === 'login'" @login-success="onLoginSuccess" />

      <TermsView
        v-else-if="currentScreen === 'terms'"
        @accept="onTermsAccepted"
        @decline="onTermsDeclined"
      />

      <DashboardView v-else-if="currentScreen === 'dashboard'" :current-user="currentUser" />
    </main>
  </div>
</template>

<style>
  .app-root {
    width: 100vw;
    min-height: 100vh;
    position: relative;
  }

  .main-screen-container {
    width: 100vw;
    min-height: 100vh;
  }

  /* Floating Switcher */
  .screen-switcher-bar {
    position: fixed;
    top: 1rem;
    right: 1.5rem;
    z-index: 1000;
    background: rgba(15, 23, 42, 0.88);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.4rem 0.85rem;
    border-radius: 30px;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
  }

  .profile-divider {
    width: 1px;
    height: 16px;
    background: rgba(255, 255, 255, 0.2);
    margin: 0 0.3rem;
  }

  .switcher-label {
    font-size: 0.68rem;
    font-weight: 700;
    color: #94a3b8;
    margin-right: 0.15rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .switcher-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: none;
    border: none;
    color: #cbd5e1;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.35rem 0.7rem;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .switcher-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }

  .switcher-btn.active {
    background: #7e22ce;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(126, 34, 206, 0.4);
  }

  .profile-btn.active {
    background: #0284c7;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
  }

  @media (max-width: 960px) {
    .screen-switcher-bar {
      top: auto;
      bottom: 1rem;
      right: 50%;
      transform: translateX(50%);
      width: max-content;
      flex-wrap: wrap;
      justify-content: center;
    }
  }
</style>
