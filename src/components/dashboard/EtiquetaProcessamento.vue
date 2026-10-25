<script setup>
  /*
   * Etiqueta do status de processamento para a busca — S2-39 (AKA-65)
   *
   * O processamento (services/processamento.py no backend) só começa quando o
   * documento é aprovado: PENDENTE -> PROCESSANDO -> CONCLUIDO | ERRO.
   * Antes disso todo documento fica PENDENTE, então a etiqueta só aparece para
   * documentos DISPONÍVEIS (senão "Preparando para a busca" seria enganoso).
   *
   * O ícone só gira enquanto a tela está consultando o status sozinha
   * (`atualizando`). Fora disso ele fica parado e a dica pede o "Atualizar".
   * O motivo de um erro não fica aqui (tooltip não funciona no celular nem no
   * leitor de tela): cada tela mostra o texto em `mensagemErroProcessamento`.
   */
  import { computed } from 'vue';
  import { Loader2, Clock, Search, AlertTriangle } from 'lucide-vue-next';

  const props = defineProps({
    statusValidacao: { type: String, default: '' },
    statusProcessamento: { type: String, default: '' },
    // a tela está consultando o status de novo sozinha
    atualizando: { type: Boolean, default: false },
  });

  const ETIQUETAS = {
    PENDENTE: { rotulo: 'Preparando para a busca', classe: 'proc--preparando' },
    PROCESSANDO: { rotulo: 'Preparando para a busca', classe: 'proc--preparando' },
    CONCLUIDO: { rotulo: 'Pronto para a busca', classe: 'proc--pronto', icone: Search },
    ERRO: { rotulo: 'Erro no processamento', classe: 'proc--erro', icone: AlertTriangle },
  };

  const etiqueta = computed(() => {
    if (props.statusValidacao !== 'DISPONIVEL') return null;
    const e = ETIQUETAS[props.statusProcessamento];
    if (!e || e.classe !== 'proc--preparando') return e ?? null;
    return props.atualizando
      ? { ...e, icone: Loader2, girando: true, dica: 'O status é atualizado automaticamente.' }
      : { ...e, icone: Clock, dica: 'Clique em "Atualizar" para ver o status mais recente.' };
  });
</script>

<template>
  <span
    v-if="etiqueta"
    :class="['proc', etiqueta.classe]"
    :title="etiqueta.dica || etiqueta.rotulo"
  >
    <component
      :is="etiqueta.icone"
      :size="12"
      aria-hidden="true"
      :class="{ proc__girando: etiqueta.girando }"
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
