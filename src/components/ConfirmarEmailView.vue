<script setup>
  /*
   * Página /confirmar-email?token=... — AKA-56
   * Aberta pelo link enviado ao e-mail novo. Não exige login: o token (uso
   * único, 24 h) é a credencial (POST /api/auth/confirmar-email/).
   * Depois de ler o token, ele sai da barra de endereço e do histórico.
   */
  import { onMounted, ref } from 'vue';
  import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-vue-next';
  import AkaLogo from './AkaLogo.vue';
  import { confirmarEmail } from '../services/api.js';

  const emit = defineEmits(['irParaLogin']);

  // 'confirmando' | 'sucesso' | 'expirado' | 'em-uso' | 'erro'
  const estado = ref('confirmando');
  let token = '';

  async function confirmar() {
    estado.value = 'confirmando';
    if (!token) {
      estado.value = 'expirado';
      return;
    }
    try {
      await confirmarEmail(token);
      estado.value = 'sucesso';
    } catch (e) {
      if (e?.status === 400) estado.value = 'expirado';
      else if (e?.status === 409) estado.value = 'em-uso';
      else estado.value = 'erro';
    }
  }

  onMounted(() => {
    token = new URLSearchParams(window.location.search).get('token')?.trim() || '';
    window.history.replaceState(null, '', window.location.pathname);
    confirmar();
  });

  function irParaLogin() {
    window.history.replaceState(null, '', '/');
    emit('irParaLogin');
  }
</script>

<template>
  <div class="pagina">
    <AkaLogo />
    <div class="cartao" aria-live="polite">
      <template v-if="estado === 'confirmando'">
        <Loader2 :size="40" class="icone icone--girando" aria-hidden="true" />
        <h2>Confirmando o seu e-mail…</h2>
      </template>

      <template v-else-if="estado === 'sucesso'">
        <CheckCircle2 :size="44" class="icone icone--ok" aria-hidden="true" />
        <h2>E-mail confirmado</h2>
        <p>A partir de agora, use o novo e-mail para entrar no AkaVision.</p>
      </template>

      <template v-else-if="estado === 'expirado'">
        <Clock :size="44" class="icone icone--aviso" aria-hidden="true" />
        <h2>Link expirado</h2>
        <p>
          Este link não vale mais: ele expira em 24 horas e só pode ser usado uma vez. Entre com o
          seu e-mail atual e peça um novo link em <strong>Meus dados</strong>.
        </p>
      </template>

      <template v-else-if="estado === 'em-uso'">
        <AlertCircle :size="44" class="icone icone--erro" aria-hidden="true" />
        <h2>Este e-mail já está em uso</h2>
        <p>
          Outra conta passou a usar este e-mail. Entre com o seu e-mail atual e escolha outro em
          <strong>Meus dados</strong>.
        </p>
      </template>

      <template v-else>
        <AlertCircle :size="44" class="icone icone--erro" aria-hidden="true" />
        <h2>Não foi possível confirmar agora</h2>
        <p>Verifique a sua conexão e tente de novo.</p>
        <button type="button" class="btn btn--sec" @click="confirmar">Tentar de novo</button>
      </template>

      <button
        v-if="estado !== 'confirmando'"
        type="button"
        class="btn btn--pri"
        @click="irParaLogin"
      >
        Ir para o login
      </button>
    </div>
  </div>
</template>

<style scoped>
  .pagina {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 1.5rem;
    background: linear-gradient(
      135deg,
      var(--bg-gradient-start, #1c0533),
      var(--bg-gradient-mid, #140326) 50%,
      var(--bg-gradient-end, #090114)
    );
  }
  .cartao {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.9rem;
    width: 100%;
    max-width: 440px;
    padding: 2.25rem 2rem;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
    text-align: center;
    color: #0f172a;
  }
  h2 {
    margin: 0;
    font-size: 1.3rem;
  }
  p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.55;
    color: #475569;
  }
  .icone--ok {
    color: #059669;
  }
  .icone--aviso {
    color: #d97706;
  }
  .icone--erro {
    color: #dc2626;
  }
  .icone--girando {
    color: var(--purple-pill-text, #7e22ce);
    animation: girar 1s linear infinite;
  }
  @keyframes girar {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .icone--girando {
      animation: none;
    }
  }
  .btn {
    width: 100%;
    height: 42px;
    border-radius: 8px;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
  }
  .btn--pri {
    margin-top: 0.4rem;
    border: 1px solid var(--purple-pill-text, #7e22ce);
    background: var(--purple-pill-text, #7e22ce);
    color: #fff;
  }
  .btn--sec {
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #475569;
  }
</style>
