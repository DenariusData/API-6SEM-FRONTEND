<script setup>
  /**
   * Excluir minha conta (AKA-110, LGPD art. 18, VI).
   * Exclusão física e irreversível: a senha confirma a intenção. Depois de
   * excluir, a sessão é encerrada e o usuário volta para o login.
   */
  import { ref } from 'vue';
  import { AlertTriangle, Trash2 } from 'lucide-vue-next';
  import { excluirMinhaConta, notifySessionExpired } from '../../services/api.js';

  const aberto = ref(false);
  const senha = ref('');
  const erro = ref('');
  const excluindo = ref(false);

  const abrir = () => {
    aberto.value = true;
    senha.value = '';
    erro.value = '';
  };

  const cancelar = () => {
    aberto.value = false;
    senha.value = '';
    erro.value = '';
  };

  const confirmar = async () => {
    if (!senha.value) {
      erro.value = 'Informe a sua senha para confirmar.';
      return;
    }
    excluindo.value = true;
    erro.value = '';
    try {
      await excluirMinhaConta(senha.value);
      notifySessionExpired();
    } catch (e) {
      erro.value = e?.message || 'Não foi possível excluir a conta. Tente novamente.';
    } finally {
      excluindo.value = false;
    }
  };
</script>

<template>
  <section class="excluir-conta">
    <div class="excluir-conta__texto">
      <h3>Excluir minha conta</h3>
      <p>
        Apaga os seus dados de acesso e as perguntas feitas à IA. Os registros de auditoria e os
        documentos ficam, mas sem identificar você. Não dá para desfazer.
      </p>
    </div>

    <button v-if="!aberto" type="button" class="btn btn--perigo" @click="abrir">
      <Trash2 :size="15" aria-hidden="true" />
      Excluir minha conta
    </button>

    <form v-else class="excluir-conta__confirmar" novalidate @submit.prevent="confirmar">
      <p class="excluir-conta__aviso" role="alert">
        <AlertTriangle :size="16" aria-hidden="true" />
        Esta ação é permanente.
      </p>
      <label for="excluir-conta-senha">Digite a sua senha para confirmar</label>
      <input
        id="excluir-conta-senha"
        v-model="senha"
        type="password"
        autocomplete="current-password"
        :aria-invalid="!!erro"
      />
      <p v-if="erro" class="excluir-conta__erro">{{ erro }}</p>
      <div class="excluir-conta__acoes">
        <button type="button" class="btn btn--sec" :disabled="excluindo" @click="cancelar">
          Cancelar
        </button>
        <button type="submit" class="btn btn--perigo" :disabled="excluindo">
          {{ excluindo ? 'Excluindo…' : 'Excluir definitivamente' }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
  .excluir-conta {
    margin-top: 1.5rem;
    padding: 1.25rem;
    border: 1px solid #fecaca;
    border-radius: 12px;
    background: #fff;
    max-width: 480px;
  }
  .excluir-conta h3 {
    margin: 0 0 0.35rem;
    font-size: 1rem;
    color: #991b1b;
  }
  .excluir-conta p {
    margin: 0 0 0.9rem;
    font-size: 0.85rem;
    color: #475569;
  }
  .excluir-conta__confirmar {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .excluir-conta__confirmar label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #1e293b;
  }
  .excluir-conta__confirmar input {
    padding: 0.55rem 0.7rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
  }
  .excluir-conta__aviso {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #b91c1c !important;
    font-weight: 600;
  }
  .excluir-conta__erro {
    color: #b91c1c !important;
  }
  .excluir-conta__acoes {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.9rem;
    border-radius: 8px;
    border: 1px solid transparent;
    font-weight: 600;
    cursor: pointer;
  }
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .btn--perigo {
    background: #dc2626;
    color: #fff;
  }
  .btn--sec {
    background: #fff;
    border-color: #cbd5e1;
    color: #334155;
  }
</style>
