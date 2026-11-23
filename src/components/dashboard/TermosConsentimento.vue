<script setup>
  /**
   * Meus termos (AKA-109): os termos em vigor e a resposta do usuário.
   * Opcionais podem ser aceitos ou revogados a qualquer momento; cada mudança
   * grava uma nova resposta no servidor.
   */
  import { onMounted, ref } from 'vue';
  import { FileCheck2 } from 'lucide-vue-next';
  import { meusTermos, responderTermos } from '../../services/api.js';

  const termos = ref([]);
  const erro = ref('');
  const salvando = ref(null);

  const formatarData = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '');

  const carregar = async () => {
    erro.value = '';
    try {
      const data = await meusTermos();
      termos.value = data?.termos ?? [];
    } catch (e) {
      erro.value = e?.message || 'Não foi possível carregar os termos.';
    }
  };

  const alterar = async (termo, aceito) => {
    salvando.value = termo.id;
    erro.value = '';
    try {
      await responderTermos([{ termo_id: termo.id, aceito }]);
      await carregar();
    } catch (e) {
      erro.value = e?.message || 'Não foi possível salvar a sua escolha.';
    } finally {
      salvando.value = null;
    }
  };

  onMounted(carregar);
</script>

<template>
  <section class="termos">
    <h3><FileCheck2 :size="16" aria-hidden="true" /> Termos e consentimentos</h3>
    <p v-if="erro" class="termos__erro" role="alert">{{ erro }}</p>
    <ul class="termos__lista">
      <li v-for="termo in termos" :key="termo.id" class="termos__item">
        <div>
          <strong>{{ termo.titulo }}</strong>
          <span class="termos__versao">v{{ termo.versao }}</span>
          <span class="termos__situacao">
            <template v-if="termo.aceito === true">
              Aceito em {{ formatarData(termo.respondido_em) }}
            </template>
            <template v-else-if="termo.aceito === false">Não aceito</template>
            <template v-else>Sem resposta</template>
            · {{ termo.obrigatorio ? 'Obrigatório' : 'Opcional' }}
          </span>
        </div>
        <button
          v-if="!termo.obrigatorio"
          type="button"
          :class="['btn', termo.aceito ? 'btn--sec' : 'btn--pri']"
          :disabled="salvando === termo.id"
          @click="alterar(termo, !termo.aceito)"
        >
          {{ termo.aceito ? 'Revogar' : 'Aceitar' }}
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
  .termos {
    margin-top: 1.5rem;
    padding: 1.25rem;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #fff;
    max-width: 480px;
  }
  .termos h3 {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0 0 0.75rem;
    font-size: 1rem;
    color: #1e293b;
  }
  .termos__lista {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .termos__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
  }
  .termos__versao {
    margin-left: 0.35rem;
    color: #64748b;
    font-size: 0.75rem;
  }
  .termos__situacao {
    display: block;
    color: #64748b;
    font-size: 0.78rem;
  }
  .termos__erro {
    color: #b91c1c;
    font-size: 0.85rem;
  }
  .btn {
    padding: 0.35rem 0.75rem;
    border-radius: 8px;
    border: 1px solid transparent;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
  }
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .btn--pri {
    background: #7c3aed;
    color: #fff;
  }
  .btn--sec {
    background: #fff;
    border-color: #cbd5e1;
    color: #334155;
  }
</style>
