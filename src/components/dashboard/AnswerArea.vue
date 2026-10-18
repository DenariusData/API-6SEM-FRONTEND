<script setup>
  import { ref, nextTick } from 'vue';
  import { Sparkles, BookOpen, Loader2 } from 'lucide-vue-next';

  defineProps({
    messages: {
      type: Array,
      default: () => [],
    },
    isProcessing: {
      type: Boolean,
      default: false,
    },
    currentAiTexts: {
      type: Object,
      default: () => ({
        english: 'Resposta em inglês',
        portuguese: 'Resposta em português',
        sources: 'Fontes consultadas',
        defaultCategory: 'Documento Técnico',
        revision: 'Revisão',
        page: 'Página',
        defaultPage: '—',
        similarity: 'Similaridade',
        processingMessage: 'Consultando documentos técnicos...',
      }),
    },
  });

  const containerRef = ref(null);

  const scrollToBottom = () => {
    nextTick(() => {
      if (containerRef.value) {
        containerRef.value.scrollTop = containerRef.value.scrollHeight;
      }
    });
  };

  defineExpose({
    scrollToBottom,
  });
</script>

<template>
  <div ref="containerRef" class="chat-container">
    <div v-for="(msg, index) in messages" :key="index" :class="['chat-bubble-wrapper', msg.type]">
      <!-- Pergunta do Usuário -->
      <div v-if="msg.type === 'user'" class="user-bubble">
        <span>{{ msg.text }}</span>
        <span v-if="msg.timestamp" class="bubble-timestamp">{{ msg.timestamp }}</span>
      </div>

      <!-- Resposta da IA -->
      <div v-else class="ai-response-box">
        <div class="ai-icon-circle">
          <Sparkles :size="16" />
        </div>
        <div class="ai-response-content">
          <div v-if="msg.language" class="ai-language-tag">
            {{ msg.language === 'en' ? currentAiTexts.english : currentAiTexts.portuguese }}
          </div>

          <p class="ai-text">
            {{ msg.text }}
          </p>

          <!-- Fontes Consultadas (AKA-96) -->
          <div v-if="msg.sources && msg.sources.length" class="sources-container">
            <div class="sources-title-row">
              <BookOpen :size="14" class="sources-icon" />
              <span>
                {{ currentAiTexts.sources }}
                ({{ msg.sources.length }})
              </span>
            </div>

            <div class="sources-grid">
              <div v-for="(src, sIdx) in msg.sources" :key="sIdx" class="source-card">
                <div class="source-card-header">
                  <span class="source-category-tag">
                    {{ src.category || currentAiTexts.defaultCategory }}
                  </span>
                  <span v-if="src.code" class="source-code-tag">
                    {{ src.code }}
                  </span>
                </div>
                <h5 class="source-doc-name">
                  <a v-if="src.url" :href="src.url" target="_blank" rel="noopener">
                    {{ src.documentName || src.title }}
                  </a>
                  <template v-else>{{ src.documentName || src.title }}</template>
                </h5>
                <div class="source-details-row">
                  <span class="source-meta-item">
                    <strong>{{ currentAiTexts.revision }}:</strong>
                    {{ src.revision || 'Rev. 01' }}
                  </span>
                  <span class="source-meta-dot">•</span>
                  <span class="source-meta-item">
                    <strong>{{ currentAiTexts.page }}:</strong>
                    {{ src.page || currentAiTexts.defaultPage }}
                  </span>
                  <template v-if="src.similarity">
                    <span class="source-meta-dot">•</span>
                    <span class="source-meta-item">
                      <strong>{{ currentAiTexts.similarity }}:</strong>
                      {{ src.similarity }}
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Documentos simplificados legados se houver -->
          <div v-else-if="msg.documents && msg.documents.length" class="cited-docs-grid">
            <div v-for="(doc, dIdx) in msg.documents" :key="dIdx" class="cited-doc-card">
              <span class="doc-cat-tag">{{ doc.category }}</span>
              <h5 class="cited-doc-title">{{ doc.title }}</h5>
              <span class="cited-doc-code">{{ doc.code }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicador Visual: Processando enquanto aguarda a resposta -->
    <div v-if="isProcessing" class="chat-bubble-wrapper ai processing-wrapper">
      <div class="ai-response-box processing-box">
        <div class="ai-icon-circle pulsing-icon">
          <Sparkles :size="16" />
        </div>
        <div class="ai-response-content">
          <div class="processing-status-card">
            <Loader2 :size="18" class="spin-icon" />
            <span>{{ currentAiTexts.processingMessage }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .chat-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 260px;
    overflow-y: auto;
    margin-bottom: 1.25rem;
    padding-right: 0.5rem;
  }

  .chat-bubble-wrapper {
    display: flex;
    width: 100%;
  }

  .chat-bubble-wrapper.user {
    justify-content: flex-end;
  }

  .chat-bubble-wrapper.ai {
    justify-content: flex-start;
  }

  .user-bubble {
    align-self: flex-end;
    background: #7e22ce;
    color: #ffffff;
    padding: 0.75rem 1.25rem;
    border-radius: 14px 14px 2px 14px;
    font-size: 0.9rem;
    max-width: 80%;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .bubble-timestamp {
    font-size: 0.68rem;
    color: rgba(255, 255, 255, 0.75);
    align-self: flex-end;
  }

  .ai-response-box {
    display: flex;
    gap: 0.85rem;
    align-self: flex-start;
    max-width: 85%;
  }

  .ai-icon-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #f3e8ff;
    color: #7e22ce;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ai-response-content {
    flex: 1;
  }

  .ai-language-tag {
    font-size: 0.72rem;
    font-weight: 600;
    color: #7e22ce;
    margin-bottom: 0.35rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .ai-text {
    font-size: 0.9rem;
    color: #334155;
    line-height: 1.5;
    margin: 0 0 0.75rem 0;
    white-space: pre-line;
  }

  /* Fontes e Referências (AKA-96) */
  .sources-container {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px dashed #e2e8f0;
  }

  .sources-title-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.6rem;
  }

  .sources-icon {
    color: #7e22ce;
  }

  .sources-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.75rem;
  }

  .source-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3px solid #7e22ce;
    padding: 0.65rem 0.85rem;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .source-card:hover {
    background: #ffffff;
    border-color: #cbd5e1;
    border-left-color: #6b21a8;
    box-shadow: 0 2px 8px rgba(126, 34, 206, 0.08);
  }

  .source-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.35rem;
  }

  .source-category-tag {
    font-size: 0.65rem;
    font-weight: 700;
    color: #7e22ce;
    background: #f3e8ff;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .source-code-tag {
    font-size: 0.7rem;
    font-weight: 600;
    color: #64748b;
  }

  .source-doc-name {
    font-size: 0.83rem;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 0.45rem 0;
    line-height: 1.35;
  }

  .source-doc-name a {
    color: #7e22ce;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .source-doc-name a:hover {
    color: #581c87;
    text-decoration: underline;
  }

  .source-details-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    color: #475569;
    background: #ffffff;
    padding: 0.3rem 0.55rem;
    border-radius: 6px;
    border: 1px solid #f1f5f9;
  }

  .source-meta-item strong {
    color: #1e293b;
    font-weight: 600;
  }

  .source-meta-dot {
    color: #cbd5e1;
  }

  /* Status de Carregamento / Processamento */
  .processing-wrapper {
    opacity: 0.95;
  }

  .processing-box {
    display: flex;
    gap: 0.85rem;
    align-items: center;
  }

  .processing-status-card {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    background: #f3e8ff;
    color: #7e22ce;
    padding: 0.65rem 1rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    border: 1px solid #e9d5ff;
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

  .pulsing-icon {
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.85;
    }
  }

  .cited-docs-grid {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .cited-doc-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 0.6rem 0.85rem;
    border-radius: 8px;
    font-size: 0.8rem;
  }

  .doc-cat-tag {
    font-size: 0.68rem;
    font-weight: 700;
    color: #7e22ce;
  }

  .cited-doc-title {
    font-size: 0.82rem;
    font-weight: 600;
    color: #0f172a;
    margin: 0.2rem 0;
  }

  .cited-doc-code {
    font-size: 0.72rem;
    color: #64748b;
  }
</style>
