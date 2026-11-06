<script setup>
  const props = defineProps({
    modelValue: {
      type: String,
      default: 'pt-BR',
    },
    languageLabel: {
      type: String,
      default: 'Idioma da resposta:',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(['update:modelValue', 'change']);

  const selectLanguage = (language) => {
    if (props.disabled || props.modelValue === language) return;
    emit('update:modelValue', language);
    emit('change', language);
    try {
      localStorage.setItem('ai-language', language);
    } catch {
      // Tolera restrições de localStorage caso existam
    }
  };
</script>

<template>
  <div class="ai-language-selector">
    <span class="ai-language-label">
      {{ languageLabel }}
    </span>

    <div class="ai-language-options">
      <button
        type="button"
        class="ai-language-button"
        :class="{ selected: modelValue === 'pt-BR' }"
        :disabled="disabled"
        @click="selectLanguage('pt-BR')"
      >
        Português
      </button>

      <button
        type="button"
        class="ai-language-button"
        :class="{ selected: modelValue === 'en' }"
        :disabled="disabled"
        @click="selectLanguage('en')"
      >
        English
      </button>
    </div>
  </div>
</template>

<style scoped>
  .ai-language-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .ai-language-label {
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
  }

  .ai-language-options {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 3px;
    border: 1px solid #e2e8f0;
    border-radius: 9px;
    background: #f1f2f6;
  }

  .ai-language-button {
    appearance: none;
    -webkit-appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    outline: none;
    background: transparent;
    color: #64748b;
    padding: 8px 12px;
    margin: 0;
    border-radius: 7px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ai-language-button:hover:not(:disabled) {
    background: #faf5ff;
    color: #7e22ce;
  }

  .ai-language-button.selected {
    border-color: #7e22ce;
    background: #7e22ce;
    color: #ffffff;
    box-shadow: 0 2px 5px rgba(126, 34, 206, 0.2);
  }

  .ai-language-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
