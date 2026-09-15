<script setup>
import { ref } from 'vue'
import LoginView from './components/LoginView.vue'
import TermsView from './components/TermsView.vue'
import DashboardView from './components/DashboardView.vue'
import { LogIn, FileCheck, LayoutDashboard } from 'lucide-vue-next'

// Estado da visão atual: 'login' | 'terms' | 'dashboard'
const currentScreen = ref('login')

const onLoginSuccess = () => {
  currentScreen.value = 'terms'
}

const onTermsAccepted = () => {
  currentScreen.value = 'dashboard'
}

const onTermsDeclined = () => {
  currentScreen.value = 'login'
}
</script>

<template>
  <div class="app-root">
    <!-- Floating Quick Navigation Switcher (Para troca fácil em ambiente de Dev/Demo) -->
    <div class="screen-switcher-bar">
      <span class="switcher-label">AkaVision Preview:</span>
      
      <button
        @click="currentScreen = 'login'"
        :class="['switcher-btn', { active: currentScreen === 'login' }]"
      >
        <LogIn :size="14" />
        <span>Login</span>
      </button>

      <button
        @click="currentScreen = 'terms'"
        :class="['switcher-btn', { active: currentScreen === 'terms' }]"
      >
        <FileCheck :size="14" />
        <span>Termos de Aceite</span>
      </button>

      <button
        @click="currentScreen = 'dashboard'"
        :class="['switcher-btn', { active: currentScreen === 'dashboard' }]"
      >
        <LayoutDashboard :size="14" />
        <span>Dashboard</span>
      </button>
    </div>

    <!-- Renderização Condicional da Tela -->
    <main class="main-screen-container">
      <LoginView
        v-if="currentScreen === 'login'"
        @loginSuccess="onLoginSuccess"
      />

      <TermsView
        v-else-if="currentScreen === 'terms'"
        @accept="onTermsAccepted"
        @decline="onTermsDeclined"
      />

      <DashboardView
        v-else-if="currentScreen === 'dashboard'"
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

/* Floating Switcher */
.screen-switcher-bar {
  position: fixed;
  top: 1rem;
  right: 1.5rem;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.4rem 0.75rem;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.switcher-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  margin-right: 0.25rem;
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
  padding: 0.35rem 0.75rem;
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

@media (max-width: 768px) {
  .screen-switcher-bar {
    top: auto;
    bottom: 1rem;
    right: 50%;
    transform: translateX(50%);
    width: max-content;
  }
}
</style>
