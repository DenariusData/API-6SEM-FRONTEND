<script setup>
  /*
   * Meus dados — AKA-56
   * O usuário corrige o próprio nome e e-mail (direito do titular, LGPD art. 18, III).
   * Backend (AKA-57):
   *   GET   /api/auth/me/                    dados atuais, inclui `email_pendente`
   *   PATCH /api/auth/me/                    { nome?, email? }, só o que mudou
   *   POST  /api/auth/reenviar-confirmacao/  novo link para o e-mail pendente
   * Trocar o e-mail não troca o login na hora: o backend guarda o e-mail novo
   * como pendente e manda um link para ele (página /confirmar-email).
   * O papel só aparece para leitura; quem muda é o administrador.
   */
  import { computed, onMounted, reactive, ref } from 'vue';
  import { CheckCircle2, AlertCircle, Mail, Lock, ShieldCheck, Send } from 'lucide-vue-next';
  import { meusDados, atualizarMeusDados, reenviarConfirmacaoEmail } from '../../services/api.js';
  import {
    NOME_MAXIMO,
    EMAIL_MAXIMO,
    camposAlterados,
    erroEmail,
    erroNome,
  } from '../../utils/dadosPessoais.js';
  import AvisoPrivacidade from '../AvisoPrivacidade.vue';

  const props = defineProps({
    currentUser: { type: Object, required: true },
  });

  // Avisa o Dashboard para atualizar o usuário logado (nome no topo na hora).
  const emit = defineEmits(['atualizado']);

  const usuario = ref({ ...props.currentUser });
  const form = reactive({ nome: '', email: '' });
  const erros = reactive({ nome: '', email: '' });
  const salvando = ref(false);
  const sucesso = ref('');
  const erroGeral = ref('');
  const reenvio = reactive({ enviando: false, mensagem: '', erro: '' });

  function preencher(u) {
    usuario.value = { ...usuario.value, ...u };
    form.nome = usuario.value.name ?? '';
    form.email = usuario.value.email ?? '';
    erros.nome = '';
    erros.email = '';
  }

  const alterados = computed(() => camposAlterados(form, usuario.value));
  const mudou = computed(() => Object.keys(alterados.value).length > 0);
  const emailPendente = computed(() => usuario.value.email_pendente || '');

  // Dados frescos do servidor: o e-mail pode ter sido confirmado em outra aba.
  onMounted(async () => {
    preencher(props.currentUser);
    try {
      const resp = await meusDados();
      if (resp?.user && !mudou.value) {
        preencher(resp.user);
        emit('atualizado', resp.user);
      }
    } catch {
      // segue com os dados do login; o salvar mostra o erro se o servidor não responder
    }
  });

  /* ---------- Salvar ---------- */
  function validar() {
    erros.nome = 'nome' in alterados.value ? erroNome(form.nome) : '';
    erros.email = 'email' in alterados.value ? erroEmail(form.email) : '';
    return !erros.nome && !erros.email;
  }

  function mostrarErro(e) {
    const campo = e?.field === 'nome' || e?.field === 'email' ? e.field : null;
    if (e?.status === 409) {
      erros.email = 'Este e-mail já está em uso.';
    } else if (campo && (e.status === 400 || e.status === 429)) {
      erros[campo] = e.detail;
    } else {
      erroGeral.value = e?.detail || 'Não foi possível salvar. Tente novamente.';
    }
  }

  async function salvar() {
    sucesso.value = '';
    erroGeral.value = '';
    reenvio.mensagem = '';
    reenvio.erro = '';
    if (!mudou.value || !validar()) return;

    const campos = alterados.value;
    salvando.value = true;
    try {
      const resp = await atualizarMeusDados(campos);
      const novo = resp?.user ?? {};
      preencher(novo);
      emit('atualizado', novo);

      const partes = [];
      if (campos.nome) partes.push('Dados atualizados.');
      if (campos.email) {
        partes.push(
          `Enviamos um link de confirmação para ${campos.email}. Até confirmar, continue usando o e-mail atual para entrar.`
        );
      }
      sucesso.value = partes.join(' ');
    } catch (e) {
      mostrarErro(e);
    } finally {
      salvando.value = false;
    }
  }

  function limparErro(campo) {
    erros[campo] = '';
    sucesso.value = '';
  }

  /* ---------- Reenviar link ---------- */
  async function reenviarLink() {
    reenvio.enviando = true;
    reenvio.mensagem = '';
    reenvio.erro = '';
    try {
      await reenviarConfirmacaoEmail();
      reenvio.mensagem = `Link reenviado para ${emailPendente.value}.`;
    } catch (e) {
      reenvio.erro = e?.detail || 'Não foi possível reenviar o link. Tente novamente.';
      // 400: não há mais troca pendente (confirmada em outra aba, por exemplo)
      if (e?.status === 400) {
        try {
          const resp = await meusDados();
          if (resp?.user) {
            preencher(resp.user);
            emit('atualizado', resp.user);
          }
        } catch {
          // mantém a mensagem de erro
        }
      }
    } finally {
      reenvio.enviando = false;
    }
  }

  /* ---------- Aviso de Privacidade ---------- */
  const avisoAberto = ref(false);
</script>

<template>
  <section class="meus-dados">
    <header class="cabecalho">
      <h2>Meus dados</h2>
      <p>Confira e corrija os seus dados pessoais de acesso.</p>
    </header>

    <!-- Troca de e-mail aguardando confirmação -->
    <div v-if="emailPendente" class="faixa-pendente" role="status">
      <Mail :size="18" aria-hidden="true" />
      <div class="faixa-pendente__texto">
        <strong>Confirmação pendente</strong>
        <span>
          Enviamos um link para <strong>{{ emailPendente }}</strong
          >. Até confirmar, continue usando <strong>{{ usuario.email }}</strong> para entrar.
        </span>
        <span v-if="reenvio.mensagem" class="faixa-pendente__ok">{{ reenvio.mensagem }}</span>
        <span v-if="reenvio.erro" class="faixa-pendente__erro">{{ reenvio.erro }}</span>
      </div>
      <button type="button" class="btn btn--sec" :disabled="reenvio.enviando" @click="reenviarLink">
        <Send :size="15" aria-hidden="true" />
        {{ reenvio.enviando ? 'Reenviando…' : 'Reenviar link' }}
      </button>
    </div>

    <form class="cartao" novalidate @submit.prevent="salvar">
      <div v-if="sucesso" class="alerta alerta--ok" role="status">
        <CheckCircle2 :size="18" aria-hidden="true" />
        <span>{{ sucesso }}</span>
      </div>
      <div v-if="erroGeral" class="alerta alerta--erro" role="alert">
        <AlertCircle :size="18" aria-hidden="true" />
        <span>{{ erroGeral }}</span>
      </div>

      <div class="campo">
        <label for="meus-dados-nome">Nome</label>
        <input
          id="meus-dados-nome"
          v-model="form.nome"
          type="text"
          autocomplete="name"
          :maxlength="NOME_MAXIMO"
          :aria-invalid="!!erros.nome"
          :aria-describedby="erros.nome ? 'meus-dados-nome-erro' : undefined"
          :class="{ 'campo--erro': erros.nome }"
          @input="limparErro('nome')"
        />
        <p v-if="erros.nome" id="meus-dados-nome-erro" class="campo__erro">{{ erros.nome }}</p>
      </div>

      <div class="campo">
        <label for="meus-dados-email">E-mail</label>
        <input
          id="meus-dados-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          :maxlength="EMAIL_MAXIMO"
          :aria-invalid="!!erros.email"
          :aria-describedby="erros.email ? 'meus-dados-email-erro' : 'meus-dados-email-ajuda'"
          :class="{ 'campo--erro': erros.email }"
          @input="limparErro('email')"
        />
        <p v-if="erros.email" id="meus-dados-email-erro" class="campo__erro">{{ erros.email }}</p>
        <p v-else id="meus-dados-email-ajuda" class="campo__ajuda">
          Ao trocar, enviamos um link de confirmação para o novo e-mail.
        </p>
      </div>

      <div class="campo">
        <span id="meus-dados-papel-rotulo" class="campo__rotulo">Papel</span>
        <p class="somente-leitura" aria-labelledby="meus-dados-papel-rotulo">
          <Lock :size="14" aria-hidden="true" />
          <span>{{ usuario.role || '—' }}</span>
        </p>
        <p class="campo__ajuda">Alterado apenas pelo administrador.</p>
      </div>

      <div class="acoes">
        <button type="submit" class="btn btn--pri" :disabled="!mudou || salvando">
          {{ salvando ? 'Salvando…' : 'Salvar' }}
        </button>
      </div>
    </form>

    <aside class="lgpd">
      <ShieldCheck :size="18" aria-hidden="true" />
      <p>
        Pela Lei Geral de Proteção de Dados (LGPD), você tem direito de corrigir dados pessoais
        incompletos, inexatos ou desatualizados. Saiba mais no
        <button type="button" class="link" @click="avisoAberto = true">Aviso de Privacidade</button
        >.
      </p>
    </aside>

    <AvisoPrivacidade v-if="avisoAberto" @fechar="avisoAberto = false" />
  </section>
</template>

<style scoped>
  .meus-dados {
    --roxo: var(--purple-pill-text, #7e22ce);
    --roxo-escuro: #6b21a8;
    --borda: var(--border-light, #e2e8f0);
    --texto: #0f172a;
    --suave: var(--text-muted, #64748b);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: 640px;
    color: var(--texto);
  }

  .cabecalho h2 {
    margin: 0 0 0.25rem;
    font-size: 1.35rem;
    font-weight: 700;
  }
  .cabecalho p {
    margin: 0;
    font-size: 0.88rem;
    color: var(--suave);
  }

  .cartao {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    padding: 1.5rem;
    border: 1px solid var(--borda);
    border-radius: 12px;
    background: #fff;
  }

  .campo {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .campo label,
  .campo__rotulo {
    font-size: 0.8rem;
    font-weight: 700;
    color: #334155;
  }
  .campo input {
    height: 42px;
    padding: 0 0.85rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font: inherit;
    font-size: 0.9rem;
    color: var(--texto);
    background: #fff;
  }
  .campo input:focus-visible {
    outline: 2px solid var(--roxo);
    outline-offset: 1px;
    border-color: var(--roxo);
  }
  .campo input.campo--erro {
    border-color: #dc2626;
  }
  .campo__erro {
    margin: 0;
    font-size: 0.78rem;
    color: #b91c1c;
  }
  .campo__ajuda {
    margin: 0;
    font-size: 0.78rem;
    color: var(--suave);
  }

  .somente-leitura {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    height: 42px;
    margin: 0;
    padding: 0 0.85rem;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    background: #f8fafc;
    font-size: 0.9rem;
    color: #475569;
  }

  .acoes {
    display: flex;
    justify-content: flex-end;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    height: 38px;
    padding: 0 1.1rem;
    border-radius: 8px;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }
  .btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .btn--pri {
    background: var(--roxo);
    border: 1px solid var(--roxo);
    color: #fff;
  }
  .btn--pri:not(:disabled):hover {
    background: var(--roxo-escuro);
  }
  .btn--sec {
    background: #fff;
    border: 1px solid #cbd5e1;
    color: #475569;
  }
  .btn--sec:not(:disabled):hover {
    background: #f8fafc;
  }

  .alerta {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    padding: 0.7rem 0.9rem;
    border-radius: 8px;
    font-size: 0.85rem;
    line-height: 1.45;
  }
  .alerta svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
  .alerta--ok {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #065f46;
  }
  .alerta--erro {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
  }

  .faixa-pendente {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.9rem 1rem;
    border: 1px solid #fde68a;
    border-radius: 10px;
    background: #fffbeb;
    color: #78350f;
    font-size: 0.85rem;
  }
  .faixa-pendente > svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
  .faixa-pendente__texto {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.25rem;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
  .faixa-pendente__ok {
    color: #065f46;
  }
  .faixa-pendente__erro {
    color: #b91c1c;
  }

  .lgpd {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.9rem 1rem;
    border-radius: 10px;
    background: #f8fafc;
    color: #475569;
    font-size: 0.82rem;
    line-height: 1.5;
  }
  .lgpd > svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--roxo);
  }
  .lgpd p {
    margin: 0;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-weight: 700;
    color: var(--roxo);
    text-decoration: underline;
    cursor: pointer;
  }

  @media (max-width: 560px) {
    .faixa-pendente {
      flex-wrap: wrap;
    }
  }
</style>
