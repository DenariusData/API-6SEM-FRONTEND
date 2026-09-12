<script setup>
import { ref } from 'vue'
import logoUrl from '@/assets/logo.png'

const emit = defineEmits(['accept', 'decline'])

const handleAccept = () => {
  emit('accept')
}

const handleDecline = () => {
  emit('decline')
}
</script>

<template>
  <div class="terms-overlay fade-in">
    <div class="terms-modal-card">
      <!-- Top Header Row -->
      <div class="terms-header">
        <div class="terms-brand">
          <img :src="logoUrl" alt="AkaVision Logo" class="terms-logo-img" />
          <span class="terms-brand-name">AkaVision</span>
        </div>
        <div class="terms-version-badge">
          VERSÃO 2.1 — SETEMBRO 2026
        </div>
      </div>

      <!-- Main Title Block -->
      <div class="terms-title-block">
        <h1 class="terms-title">Termos de Uso e Política de Privacidade</h1>
        <p class="terms-subtitle">
          AkaVision DocFlow — Sistema Crítico de Gestão Documental Aeroespacial
        </p>
      </div>

      <!-- Scrollable Clauses Content Box -->
      <div class="terms-content-box">
        <div class="clause-item">
          <h3 class="clause-title">1. CLÁUSULA DE CONFIDENCIALIDADE E SEGURANÇA NACIONAL (ITAR/EAR)</h3>
          <p class="clause-text">
            O operador declara-se ciente de que todos os arquivos, projetos de aeronaves, diagramas de empuxo estrutural e planos de voo gerenciados pela Akaer Engenharia S.A. estão protegidos por rígidos protocolos de segurança nacional e controle de exportação de tecnologia aeroespacial (regulamentos ITAR e EAR). Qualquer vazamento resultará em sanções penais graves.
          </p>
        </div>

        <div class="clause-item">
          <h3 class="clause-title">2. LGPD E DADOS SENSÍVEIS DE ENGENHARIA</h3>
          <p class="clause-text">
            Todos os logs de acesso, modificação de ordens de serviço (OIs), despachos de cargas críticas e assinaturas digitais são rastreados de forma inviolável. Os dados pessoais dos colaboradores serão tratados em total conformidade com a Lei Geral de Proteção de Dados (LGPD).
          </p>
        </div>

        <div class="clause-item">
          <h3 class="clause-title">3. AUDITORIA E RASTREABILIDADE TOTAL</h3>
          <p class="clause-text">
            Nenhuma modificação estrutural em documentos técnicos poderá ser excluída. O histórico de versionamento do AkaVision constitui prova jurídica de conformidade com os regulamentos da ANAC e do Comando da Aeronáutica.
          </p>
        </div>
      </div>

      <!-- Bottom Action Buttons -->
      <div class="terms-actions">
        <button type="button" @click="handleDecline" class="btn-decline">
          Recusar Termos
        </button>
        <button type="button" @click="handleAccept" class="btn-accept">
          Aceitar e Continuar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.terms-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(45, 55, 72, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1.5rem;
}

.terms-modal-card {
  background-color: #ffffff;
  width: 100%;
  max-width: 680px;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 2.25rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Header */
.terms-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.terms-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.terms-logo-img {
  height: 32px;
  width: auto;
}

.terms-brand-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--purple-pill-text);
  letter-spacing: -0.01em;
}

.terms-version-badge {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--purple-pill-text);
  background-color: var(--purple-pill-bg);
  border: 1px solid var(--purple-pill-border);
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  letter-spacing: 0.05em;
}

/* Title */
.terms-title-block {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.terms-title {
  font-family: var(--font-serif);
  font-size: 2.2rem;
  font-weight: 600;
  color: var(--purple-pill-text);
  line-height: 1.2;
}

.terms-subtitle {
  font-size: 0.88rem;
  color: #64748b;
  font-weight: 500;
}

/* Content Box */
.terms-content-box {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
}

.terms-content-box::-webkit-scrollbar {
  width: 6px;
}
.terms-content-box::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}

.clause-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.clause-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.clause-text {
  font-size: 0.85rem;
  line-height: 1.55;
  color: #475569;
}

/* Actions */
.terms-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.5rem;
}

.btn-decline {
  padding: 0.8rem 1.5rem;
  background-color: #ffffff;
  border: 1.5px solid var(--purple-pill-text);
  color: var(--purple-pill-text);
  font-weight: 700;
  font-size: 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-decline:hover {
  background-color: var(--purple-light-bg);
}

.btn-accept {
  padding: 0.8rem 1.75rem;
  background: linear-gradient(135deg, #6b21a8 0%, #7e22ce 50%, #8b5cf6 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.9rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(126, 34, 206, 0.35);
  transition: all 0.2s;
}

.btn-accept:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(126, 34, 206, 0.45);
}
</style>
