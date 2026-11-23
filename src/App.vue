<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import LoginView from './components/LoginView.vue';
  import TermsView from './components/TermsView.vue';
  import DashboardView from './components/DashboardView.vue';
  import ConfirmarEmailView from './components/ConfirmarEmailView.vue';

  // Estado da visão atual: 'login' | 'terms' | 'dashboard' | 'confirmar-email'
  // O link de confirmação do e-mail (AKA-56) abre /confirmar-email?token=...
  // direto, sem login; o resto do app começa pelo login.
  const currentScreen = ref(
    window.location.pathname.replace(/\/+$/, '') === '/confirmar-email'
      ? 'confirmar-email'
      : 'login'
  );
  // Usuário autenticado, preenchido pelo login (perfil e menus vêm do backend)
  const currentUser = ref(null);

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

  // Meus dados (AKA-56): nome/e-mail alterados aparecem na hora no topo e na sidebar.
  const onUserUpdated = (user) => {
    if (user) currentUser.value = { ...currentUser.value, ...user };
  };

  const onSessionExpired = () => {
    localStorage.removeItem('akaer_token');
    currentScreen.value = 'login';
  };

  onMounted(() => {
    window.addEventListener('session-expired', onSessionExpired);
  });

  onUnmounted(() => {
    window.removeEventListener('session-expired', onSessionExpired);
  });
</script>

<template>
  <div class="app-root">
    <!-- Renderização Condicional da Tela -->
    <main class="main-screen-container">
      <ConfirmarEmailView
        v-if="currentScreen === 'confirmar-email'"
        @ir-para-login="currentScreen = 'login'"
      />

      <LoginView v-else-if="currentScreen === 'login'" @login-success="onLoginSuccess" />

      <TermsView
        v-else-if="currentScreen === 'terms'"
        @accept="onTermsAccepted"
        @decline="onTermsDeclined"
      />

      <DashboardView
        v-else-if="currentScreen === 'dashboard' && currentUser"
        :current-user="currentUser"
        @user-updated="onUserUpdated"
      />
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
</style>
