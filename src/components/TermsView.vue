<script setup>
  /**
   * Termos e consentimento (AKA-109).
   * Mostra só os termos que o usuário ainda não respondeu. Obrigatórios
   * precisam ser marcados para continuar; opcionais podem ficar desmarcados
   * (e ser revogados depois em Meus dados). O aceite é gravado no servidor.
   */
  import { computed, onMounted, ref } from 'vue';
  import logoUrl from '@/assets/logo.png';
  import { termosPendentes, responderTermos } from '../services/api.js';

  const emit = defineEmits(['accept', 'decline']);

  const termos = ref([]);
  const marcados = ref({});
  const carregando = ref(true);
  const enviando = ref(false);
  const erro = ref('');

  const obrigatoriosMarcados = computed(() =>
    termos.value.filter((t) => t.obrigatorio).every((t) => marcados.value[t.id])
  );

  const carregar = async () => {
    carregando.value = true;
    erro.value = '';
    try {
      const data = await termosPendentes();
      termos.value = data?.termos ?? [];
      if (termos.value.length === 0) {
        emit('accept');
      }
    } catch (e) {
      erro.value = e?.message || 'Não foi possível carregar os termos.';
    } finally {
      carregando.value = false;
    }
  };

  const handleAccept = async () => {
    if (!obrigatoriosMarcados.value || enviando.value) return;
    enviando.value = true;
    erro.value = '';
    try {
      await responderTermos(
        termos.value.map((t) => ({ termo_id: t.id, aceito: !!marcados.value[t.id] }))
      );
      emit('accept');
    } catch (e) {
      erro.value = e?.message || 'Não foi possível gravar o aceite. Tente novamente.';
    } finally {
      enviando.value = false;
    }
  };

  const handleDecline = () => {
    emit('decline');
  };

  onMounted(carregar);
</script>

<template>
  <div class="terms-overlay fade-in">
    <div class="terms-modal-card">
      <div class="terms-header">
        <div class="terms-brand">
          <img :src="logoUrl" alt="AkaVision Logo" class="terms-logo-img" />
          <span class="terms-brand-name">AkaVision</span>
        </div>
      </div>

      <div class="terms-title-block">
        <h1 class="terms-title">Termos de Uso e Privacidade</h1>
        <p class="terms-subtitle">
          Leia e marque os termos para continuar. Os obrigatórios são necessários para usar o
          sistema.
        </p>
      </div>

      <div v-if="carregando" class="terms-content-box terms-estado">Carregando os termos…</div>

      <div v-else class="terms-content-box">
        <div v-for="termo in termos" :key="termo.id" class="clause-item">
          <h3 class="clause-title">
            {{ termo.titulo }}
            <span class="termo-versao">v{{ termo.versao }}</span>
            <span :class="['termo-tag', termo.obrigatorio ? 'termo-tag--obrig' : 'termo-tag--opc']">
              {{ termo.obrigatorio ? 'Obrigatório' : 'Opcional' }}
            </span>
          </h3>
          <p class="clause-text termo-texto">{{ termo.texto }}</p>
          <label class="termo-check">
            <input v-model="marcados[termo.id]" type="checkbox" />
            <span
              >Li e aceito {{ termo.obrigatorio ? '' : '(opcional) ' }}"{{ termo.titulo }}"</span
            >
          </label>
        </div>
      </div>

      <p v-if="erro" class="termo-erro" role="alert">{{ erro }}</p>

      <div class="terms-actions">
        <button type="button" class="btn-decline" @click="handleDecline">Recusar Termos</button>
        <button
          type="button"
          class="btn-accept"
          :disabled="carregando || enviando || !obrigatoriosMarcados"
          @click="handleAccept"
        >
          {{ enviando ? 'Salvando…' : 'Aceitar e Continuar' }}
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
    from {
      opacity: 0;
      transform: scale(0.96) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
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

  .termo-versao {
    margin-left: 0.4rem;
    font-size: 0.72rem;
    font-weight: 600;
    color: #64748b;
  }
  .termo-tag {
    margin-left: 0.4rem;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 700;
  }
  .termo-tag--obrig {
    background: #ede9fe;
    color: #6d28d9;
  }
  .termo-tag--opc {
    background: #f1f5f9;
    color: #475569;
  }
  .termo-texto {
    white-space: pre-line;
  }
  .termo-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.6rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #1e293b;
    cursor: pointer;
  }
  .termo-erro {
    margin: 0;
    color: #b91c1c;
    font-size: 0.85rem;
  }
  .terms-estado {
    color: #64748b;
  }
  .btn-accept:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
</style>
