<script setup>
  /*
   * Etiqueta do status de processamento para a busca — S2-39 (AKA-65)
   *
   * O processamento (services/processamento.py no backend) só começa quando o
   * documento é aprovado: PENDENTE -> PROCESSANDO -> CONCLUIDO | ERRO.
   * Antes disso todo documento fica PENDENTE, então a etiqueta só aparece para
   * documentos DISPONÍVEIS (senão "Preparando para a busca" seria enganoso).
   */
  import { computed } from 'vue';
  import { Loader2, Search, AlertTriangle } from 'lucide-vue-next';

  const props = defineProps({
    statusValidacao: { type: String, default: '' },
    statusProcessamento: { type: String, default: '' },
    // mensagem técnica do backend (erro_processamento), mostrada como dica
    erro: { type: String, default: '' },
  });

  const ETIQUETAS = {
    PENDENTE: { rotulo: 'Preparando para a busca', classe: 'proc--preparando', icone: Loader2 },
    PROCESSANDO: { rotulo: 'Preparando para a busca', classe: 'proc--preparando', icone: Loader2 },
    CONCLUIDO: { rotulo: 'Pronto para a busca', classe: 'proc--pronto', icone: Search },
    ERRO: { rotulo: 'Erro no processamento', classe: 'proc--erro', icone: AlertTriangle },
  };

  const etiqueta = computed(() =>
    props.statusValidacao === 'DISPONIVEL' ? (ETIQUETAS[props.statusProcessamento] ?? null) : null
  );
</script>

<template>
  <span
    v-if="etiqueta"
    :class="['proc', etiqueta.classe]"
    :title="etiqueta.classe === 'proc--erro' && erro ? erro : etiqueta.rotulo"
  >
    <component
      :is="etiqueta.icone"
      :size="12"
      :class="{ proc__girando: etiqueta.classe === 'proc--preparando' }"
    />
    {{ etiqueta.rotulo }}
  </span>
</template>

<style scoped>
  .proc {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 700;
    white-space: nowrap;
  }
  .proc--preparando {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
  }
  .proc--pronto {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #047857;
  }
  .proc--erro {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
  }
  .proc__girando {
    animation: proc-girar 1s linear infinite;
  }
  @keyframes proc-girar {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .proc__girando {
      animation: none;
    }
  }
</style>
