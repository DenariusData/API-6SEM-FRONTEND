<script setup>
import { ref } from 'vue'
import AkaLogo from './AkaLogo.vue'
import { User, Lock, Eye, EyeOff, ShieldCheck, Loader2, AlertCircle } from 'lucide-vue-next'

const engineerId = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const emit = defineEmits(['loginSuccess'])

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!engineerId.value.trim()) {
    errorMessage.value = 'Por favor, informe o e-mail.'
    return
  }

  if (!password.value) {
    errorMessage.value = 'Por favor, informe a senha.'
    return
  }

  isLoading.value = true

  // Simulação de autenticação com feedback para demonstração
  setTimeout(() => {
    isLoading.value = false
    successMessage.value = `Autenticação efetuada com sucesso!`
    emit('loginSuccess')
  }, 1000)
}
</script>

<template>
  <div class="login-page-wrapper">
    <!-- Painel Esquerdo: Identidade Institucional AkaVision -->
    <div class="brand-panel">
      <!-- Fundo de Arcos e Linhas Concêntricas (Radar / Engenharia Aeroespacial) -->
      <div class="radar-background">
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
        <div class="ring ring-3"></div>
        <div class="ring ring-4"></div>
        <div class="ring ring-5"></div>
      </div>

      <div class="brand-content-card fade-in">
        <!-- Logo AkaVision -->
        <AkaLogo />

        <!-- Divisor decorativo -->
        <div class="brand-divider"></div>

        <!-- Descrição Institucional -->
        <p class="brand-description">
          Sistemas críticos de gestão documental desenvolvidos para a engenharia aeroespacial e de defesa de alta precisão.
        </p>
      </div>

      <!-- Rodapé do Painel Esquerdo -->
      <div class="brand-footer">
        <span>Akaer Engenharia S.A. © 2026</span>
        <span class="footer-separator">——</span>
        <span>São José dos Campos - SJC</span>
      </div>
    </div>

    <!-- Painel Direito: Formulário de Autenticação -->
    <div class="form-panel">
      <div class="form-container fade-in">
        <!-- Cabeçalho do Formulário -->
        <div class="form-header">
          <span class="portal-badge">PORTAL DE ACESSO</span>
          <h2 class="form-title">Autenticação de Usuário</h2>
        </div>

        <!-- Mensagens de Feedback -->
        <div v-if="errorMessage" class="alert-box alert-error">
          <AlertCircle :size="18" class="alert-icon" />
          <span>{{ errorMessage }}</span>
        </div>

        <div v-if="successMessage" class="alert-box alert-success">
          <ShieldCheck :size="18" class="alert-icon" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- Formulário de Login -->
        <form @submit.prevent="handleLogin" class="login-form">
          <!-- Campo 1: E-mail de acesso -->
          <div class="input-group">
            <label for="engineerId" class="input-label">E-mail de acesso</label>
            <div class="input-wrapper">
              <User :size="18" class="input-icon" />
              <input
                id="engineerId"
                type="text"
                v-model="engineerId"
                placeholder="Ex: [EMAIL_ADDRESS]"
                class="form-input"
                autocomplete="username"
              />
            </div>
          </div>

          <!-- Campo 2: Senha de Segurança -->
          <div class="input-group">
            <label for="password" class="input-label">Senha de Segurança</label>
            <div class="input-wrapper">
              <Lock :size="18" class="input-icon" />
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                placeholder="••••••••••••"
                class="form-input"
                autocomplete="current-password"
              />
              <button
                type="button"
                @click="togglePasswordVisibility"
                class="toggle-password-btn"
                title="Alternar visibilidade da senha"
              >
                <Eye v-if="!showPassword" :size="18" />
                <EyeOff v-else :size="18" />
              </button>
            </div>
          </div>

          <!-- Botão Principal -->
          <button
            type="submit"
            class="submit-button"
            :disabled="isLoading"
          >
            <Loader2 v-if="isLoading" :size="20" class="spinner" />
            <span v-else>Entrar no Sistema</span>
          </button>
        </form>

        <!-- Links de Apoio -->
        <div class="form-links">
          <a href="#" @click.prevent class="link-forgot">Esqueceu a conta?</a>
          <a href="#" @click.prevent class="link-support">Suporte de TI SJC</a>
        </div>

        <!-- Seal / Badge de Segurança -->
        <div class="security-badge-wrapper">
          <div class="security-badge">
            <span class="security-dot"></span>
            <span>Conexão Criptografada SSL Militar</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page-wrapper {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #ffffff;
}

/* ==========================================
   PAINEL ESQUERDO (BRANDING & INSTITUCIONAL)
   ========================================== */
.brand-panel {
  flex: 1.15;
  background: radial-gradient(
    circle at 50% 40%,
    var(--bg-gradient-start) 0%,
    var(--bg-gradient-mid) 55%,
    var(--bg-gradient-end) 100%
  );
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  overflow: hidden;
  color: #ffffff;
}

/* Radar / Anéis Concêntricos */
.radar-background {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1000px;
  height: 1000px;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(192, 132, 252, 0.07);
}

.ring-1 { width: 320px; height: 320px; border-color: rgba(192, 132, 252, 0.12); }
.ring-2 { width: 480px; height: 480px; border-color: rgba(192, 132, 252, 0.08); }
.ring-3 { width: 640px; height: 640px; border-color: rgba(192, 132, 252, 0.06); }
.ring-4 { width: 820px; height: 820px; border-color: rgba(192, 132, 252, 0.04); }
.ring-5 { width: 1000px; height: 1000px; border-color: rgba(192, 132, 252, 0.02); }

.brand-content-card {
  position: relative;
  z-index: 2;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.brand-divider {
  width: 50px;
  height: 2px;
  background: rgba(216, 180, 254, 0.3);
  margin: 1.75rem 0 1.5rem 0;
  border-radius: 2px;
}

.brand-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #cbd5e1;
  font-weight: 400;
  max-width: 420px;
  opacity: 0.95;
}

.brand-footer {
  position: absolute;
  bottom: 2rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.25rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.02em;
  z-index: 2;
}

.footer-separator {
  opacity: 0.3;
}

/* ==========================================
   PAINEL DIREITO (FORMULÁRIO DE LOGIN)
   ========================================== */
.form-panel {
  flex: 0.85;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem 2.5rem;
  position: relative;
}

.form-container {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
}

.form-header {
  margin-bottom: 2rem;
}

.portal-badge {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--purple-pill-text);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  display: block;
  margin-bottom: 0.5rem;
}

.form-title {
  font-family: var(--font-serif);
  font-size: 2.6rem;
  font-weight: 500;
  color: var(--text-dark);
  line-height: 1.15;
  letter-spacing: -0.01em;
}

/* Form Inputs */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #94a3b8;
  pointer-events: none;
  transition: color 0.2s;
}

.form-input {
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 2.75rem;
  font-size: 0.95rem;
  font-family: var(--font-sans);
  color: #0f172a;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.form-input::placeholder {
  color: #94a3b8;
  font-size: 0.9rem;
}

.form-input:focus {
  border-color: var(--purple-primary);
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
}

.input-wrapper:focus-within .input-icon {
  color: var(--purple-primary);
}

.toggle-password-btn {
  position: absolute;
  right: 0.85rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: color 0.2s, background-color 0.2s;
}

.toggle-password-btn:hover {
  color: var(--purple-primary);
  background-color: #f1f5f9;
}

/* Submit Button */
.submit-button {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.95rem;
  background: linear-gradient(135deg, #6b21a8 0%, #7e22ce 50%, #8b5cf6 100%);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: var(--font-sans);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(126, 34, 206, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(126, 34, 206, 0.45);
  background: linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #7c3aed 100%);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(126, 34, 206, 0.3);
}

.submit-button:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.spinner {
  animation: rotateRadar 1s linear infinite;
}

/* Links abaixo do botão */
.form-links {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.25rem;
  font-size: 0.85rem;
}

.link-forgot {
  color: #7e22ce;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
}

.link-forgot:hover {
  color: #581c87;
  text-decoration: underline;
}

.link-support {
  color: #64748b;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.link-support:hover {
  color: #334155;
  text-decoration: underline;
}

/* Security Badge */
.security-badge-wrapper {
  margin-top: 5rem;
  display: flex;
  justify-content: flex-start;
}

.security-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--purple-pill-bg);
  border: 1px solid var(--purple-pill-border);
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--purple-pill-text);
  letter-spacing: 0.01em;
}

.security-dot {
  width: 7px;
  height: 7px;
  background-color: var(--purple-primary);
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 8px var(--purple-primary);
}

/* Alert Boxes */
.alert-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 1.25rem;
}

.alert-error {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert-success {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

/* ==========================================
   RESPONSIVIDADE (MEDIA QUERIES)
   ========================================== */
@media (max-width: 960px) {
  .login-page-wrapper {
    flex-direction: column;
    min-height: 100vh;
    overflow-y: auto;
  }

  .brand-panel {
    flex: none;
    padding: 4rem 1.5rem 3rem 1.5rem;
  }

  .brand-footer {
    position: relative;
    bottom: auto;
    margin-top: 2.5rem;
  }

  .form-panel {
    flex: none;
    padding: 3rem 1.5rem 4rem 1.5rem;
    width: 100%;
  }

  .security-badge-wrapper {
    margin-top: 3rem;
    justify-content: center;
  }
}
</style>
