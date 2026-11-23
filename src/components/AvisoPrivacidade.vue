<script setup>
  /*
   * Aviso de Privacidade — AKA-56
   * Resumo de quais dados pessoais o AkaVision usa e dos direitos do titular
   * (LGPD, Lei 13.709/2018, art. 18). Aberto pelo link da tela Meus dados.
   * Esc ou o botão Fechar fecham; o foco volta para quem abriu.
   */
  import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
  import { ShieldCheck, X } from 'lucide-vue-next';

  const emit = defineEmits(['fechar']);
  const caixa = ref(null);
  let focoAnterior = null;

  function fechar() {
    emit('fechar');
  }

  function tecla(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      fechar();
      return;
    }
    if (e.key !== 'Tab' || !caixa.value) return;
    const focaveis = [
      ...caixa.value.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])'),
    ];
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (
      e.shiftKey &&
      (document.activeElement === primeiro || document.activeElement === caixa.value)
    ) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  }

  onMounted(() => {
    focoAnterior = document.activeElement;
    nextTick(() => caixa.value?.focus());
  });
  onBeforeUnmount(() => focoAnterior?.focus?.());
</script>

<template>
  <div class="fundo" @click.self="fechar">
    <div
      ref="caixa"
      class="caixa"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aviso-privacidade-titulo"
      tabindex="-1"
      @keydown="tecla"
    >
      <header class="topo">
        <ShieldCheck :size="20" aria-hidden="true" />
        <h3 id="aviso-privacidade-titulo">Aviso de Privacidade</h3>
        <button type="button" class="fechar" aria-label="Fechar" @click="fechar">
          <X :size="18" />
        </button>
      </header>

      <div class="corpo">
        <section>
          <h4>Quais dados pessoais usamos</h4>
          <p>
            Para dar acesso ao AkaVision, usamos o seu nome, e-mail, papel, matrícula e o registro
            das ações feitas no sistema (acessos, envios e validações de documentos).
          </p>
        </section>

        <section>
          <h4>Para que usamos</h4>
          <p>
            Para identificar você no login, controlar o que cada papel pode acessar e manter a
            rastreabilidade exigida para documentos técnicos.
          </p>
        </section>

        <section>
          <h4>Seus direitos como titular (LGPD, art. 18)</h4>
          <ul>
            <li>confirmar se tratamos os seus dados e ter acesso a eles;</li>
            <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>
              pedir informações sobre com quem os dados são compartilhados e sobre a eliminação dos
              dados, nos limites da lei.
            </li>
          </ul>
        </section>

        <section>
          <h4>Como exercer</h4>
          <p>
            Nome e e-mail você corrige na tela <strong>Meus dados</strong>. Para o papel ou outros
            pedidos, fale com o administrador do sistema.
          </p>
        </section>
      </div>

      <footer class="rodape">
        <button type="button" class="btn" @click="fechar">Fechar</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
  .fundo {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.55);
  }
  .caixa {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 560px;
    max-height: calc(100vh - 2rem);
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
    color: #0f172a;
  }
  .caixa:focus {
    outline: none;
  }
  .topo {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 1.1rem 1.4rem;
    border-bottom: 1px solid #e2e8f0;
    color: var(--purple-pill-text, #7e22ce);
  }
  .topo h3 {
    flex: 1;
    margin: 0;
    font-size: 1.05rem;
    color: #0f172a;
  }
  .fechar {
    display: inline-flex;
    padding: 0.3rem;
    border: 0;
    border-radius: 6px;
    background: none;
    color: #64748b;
    cursor: pointer;
  }
  .fechar:hover {
    background: #f1f5f9;
  }
  .corpo {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.2rem 1.4rem;
    overflow-y: auto;
    font-size: 0.86rem;
    line-height: 1.55;
    color: #334155;
  }
  .corpo h4 {
    margin: 0 0 0.3rem;
    font-size: 0.85rem;
    color: #0f172a;
  }
  .corpo p,
  .corpo ul {
    margin: 0;
  }
  .corpo ul {
    padding-left: 1.2rem;
  }
  .rodape {
    display: flex;
    justify-content: flex-end;
    padding: 0.9rem 1.4rem;
    border-top: 1px solid #e2e8f0;
  }
  .btn {
    height: 38px;
    padding: 0 1.1rem;
    border: 1px solid var(--purple-pill-text, #7e22ce);
    border-radius: 8px;
    background: var(--purple-pill-text, #7e22ce);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
  }
</style>
