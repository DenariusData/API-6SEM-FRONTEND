<script setup>
  import { Trash2, Send, Loader2 } from 'lucide-vue-next';
  import LanguageSelector from './LanguageSelector.vue';

  const props = defineProps({
    modelValue: {
      type: String,
      default: '',
    },
    isProcessing: {
      type: Boolean,
      default: false,
    },
    selectedLanguage: {
      type: String,
      default: 'pt-BR',
    },
    currentAiTexts: {
      type: Object,
      default: () => ({
        clearChat: 'Limpar conversa',
        language: 'Idioma da resposta:',
        placeholder: 'Faça uma pergunta sobre os documentos técnicos...',
        send: 'Enviar',
        processing: 'Processando...',
      }),
    },
  });

  const emit = defineEmits(['update:modelValue', 'update:selectedLanguage', 'send', 'clear']);

  const handleSend = () => {
    if (!props.modelValue.trim() || props.isProcessing) return;
    emit('send');
  };
</script>

<template>
  <div class="ai-input-bar">
    <button
      type="button"
      class="btn-clear"
      :title="currentAiTexts.clearChat"
      :disabled="isProcessing"
      @click="emit('clear')"
    >
      <Trash2 :size="18" />
    </button>

    <LanguageSelector
      :model-value="selectedLanguage"
      :language-label="currentAiTexts.language"
      :disabled="isProcessing"
      @update:model-value="(val) => emit('update:selectedLanguage', val)"
    />

    <input
      :value="modelValue"
      type="text"
      :placeholder="currentAiTexts.placeholder"
      class="ai-input"
      :disabled="isProcessing"
      @input="emit('update:modelValue', $event.target.value)"
      @keyup.enter="handleSend"
    />

    <button
      type="button"
      class="btn-send-ai"
      :disabled="!modelValue.trim() || isProcessing"
      @click="handleSend"
    >
      <Loader2 v-if="isProcessing" :size="16" class="spin-icon" />
      <Send v-else :size="16" />
      <span class="btn-send-label">
        {{ isProcessing ? currentAiTexts.processing : currentAiTexts.send }}
      </span>
    </button>
  </div>
</template>

<style scoped>
  .ai-input-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    box-sizing: border-box;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 10px 12px;
    border-radius: 12px;
  }

  .btn-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 8px;
    transition: color 0.2s;
  }

  .btn-clear:hover:not(:disabled) {
    color: #ef4444;
  }

  .btn-clear:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ai-input {
    display: block;
    flex: 1 1 0;
    min-width: 0;
    width: 0;
    box-sizing: border-box;
    border: none;
    outline: none;
    background: transparent;
    color: #0f172a;
    padding: 10px 4px;
    font-family: inherit;
    font-size: 0.9rem;
  }

  .ai-input::placeholder {
    color: #94a3b8;
    opacity: 1;
  }

  .ai-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-send-ai {
    background: #7e22ce;
    color: #ffffff;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    font-weight: 600;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .btn-send-ai:hover:not(:disabled) {
    background: #6b21a8;
  }

  .btn-send-ai:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spin-icon {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 760px) {
    .ai-input-bar {
      flex-wrap: wrap;
    }

    .ai-input {
      order: 3;
      flex: 1 1 100%;
      width: 100%;
    }

    .btn-send-ai {
      order: 4;
    }
  }
</style>
