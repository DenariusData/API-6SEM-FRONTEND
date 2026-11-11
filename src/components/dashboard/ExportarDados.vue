<script setup>
  /**
   * Exportação dos dados pessoais do próprio usuário (AKA-75, LGPD art. 18).
   * JSON para levar a outro sistema (portabilidade); PDF para ler.
   * O backend identifica o usuário pelo token, então não há id aqui.
   */
  import { ref } from 'vue';
  import { Download } from 'lucide-vue-next';
  import { exportarMeusDados } from '@/services/api.js';

  const FORMATOS = [
    { valor: 'json', rotulo: 'JSON', titulo: 'Formato para importar em outro sistema' },
    { valor: 'pdf', rotulo: 'PDF', titulo: 'Documento para leitura' },
  ];

  const baixando = ref(null);
  const mensagem = ref('');
  const erro = ref(false);

  const nomePadrao = (formato) => {
    const hoje = new Date().toISOString().slice(0, 10);
    return `meus-dados-${hoje}.${formato}`;
  };

  const salvar = (blob, nome) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // O download já começou; libera a memória do blob logo depois.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const textoDoErro = (e) => {
    if (e?.status === 429) {
      return e.retryAfter
        ? `Aguarde ${e.retryAfter} segundos para exportar novamente.`
        : e.detail || 'Aguarde um minuto para exportar novamente.';
    }
    if (e?.status === 401) return 'Sua sessão expirou. Entre novamente.';
    return e?.detail || 'Não foi possível exportar seus dados. Tente novamente.';
  };

  const exportar = async (formato) => {
    if (baixando.value) return;
    baixando.value = formato;
    mensagem.value = '';
    erro.value = false;
    try {
      const { blob, nome } = await exportarMeusDados(formato);
      salvar(blob, nome || nomePadrao(formato));
      mensagem.value = 'Download iniciado.';
    } catch (e) {
      erro.value = true;
      mensagem.value = textoDoErro(e);
    } finally {
      baixando.value = null;
    }
  };
</script>

<template>
  <section class="exportar-dados" aria-labelledby="exportar-dados-titulo">
    <h5 id="exportar-dados-titulo" class="exportar-titulo">Meus dados (LGPD)</h5>
    <p class="exportar-texto">Baixe uma cópia dos seus dados pessoais.</p>
    <div class="exportar-botoes">
      <button
        v-for="formato in FORMATOS"
        :key="formato.valor"
        type="button"
        :class="['btn-exportar', `btn-exportar-${formato.valor}`]"
        :title="formato.titulo"
        :disabled="baixando !== null"
        :aria-busy="baixando === formato.valor"
        @click="exportar(formato.valor)"
      >
        <Download :size="14" aria-hidden="true" />
        {{ baixando === formato.valor ? 'Gerando...' : formato.rotulo }}
      </button>
    </div>
    <p
      v-if="mensagem"
      :class="['exportar-mensagem', { 'exportar-erro': erro }]"
      :role="erro ? 'alert' : 'status'"
    >
      {{ mensagem }}
    </p>
  </section>
</template>

<style scoped>
  .exportar-dados {
    margin-top: 0.85rem;
    padding-top: 0.85rem;
    border-top: 1px solid #334155;
  }

  .exportar-titulo {
    font-size: 0.78rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 0.2rem 0;
  }

  .exportar-texto {
    font-size: 0.72rem;
    color: #94a3b8;
    margin: 0 0 0.5rem 0;
  }

  .exportar-botoes {
    display: flex;
    gap: 0.5rem;
  }

  .btn-exportar {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.4rem 0.5rem;
    border-radius: 6px;
    border: 1px solid #475569;
    background-color: #0f172a;
    color: #e2e8f0;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-exportar:hover:not(:disabled) {
    border-color: #a855f7;
    color: #ffffff;
  }

  .btn-exportar:focus-visible {
    outline: 2px solid #a855f7;
    outline-offset: 2px;
  }

  .btn-exportar:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .exportar-mensagem {
    font-size: 0.72rem;
    color: #86efac;
    margin: 0.5rem 0 0 0;
  }

  .exportar-mensagem.exportar-erro {
    color: #fca5a5;
  }
</style>
