<script setup>
  /**
   * Termos (administrador, AKA-109): cadastra um termo ou uma nova versão.
   * Termo com o mesmo título de um vigente vira a nova versão: a anterior sai
   * de vigor e todos respondem de novo no próximo acesso.
   */
  import { onMounted, reactive, ref } from 'vue';
  import { FilePlus2 } from 'lucide-vue-next';
  import { cadastrarTermo, listarTermos } from '../../services/api.js';

  const termos = ref([]);
  const form = reactive({ titulo: '', versao: '', texto: '', obrigatorio: true });
  const erro = ref('');
  const sucesso = ref('');
  const salvando = ref(false);

  const carregar = async () => {
    try {
      const data = await listarTermos();
      termos.value = data?.termos ?? [];
    } catch (e) {
      erro.value = e?.message || 'Não foi possível carregar os termos.';
    }
  };

  const salvar = async () => {
    erro.value = '';
    sucesso.value = '';
    salvando.value = true;
    try {
      const data = await cadastrarTermo({ ...form });
      sucesso.value = `Termo "${data.termo.titulo}" v${data.termo.versao} cadastrado.`;
      Object.assign(form, { titulo: '', versao: '', texto: '', obrigatorio: true });
      await carregar();
    } catch (e) {
      erro.value = e?.message || 'Não foi possível cadastrar o termo.';
    } finally {
      salvando.value = false;
    }
  };

  onMounted(carregar);
</script>

<template>
  <section class="termos-admin">
    <header>
      <h2>Termos</h2>
      <p>Cadastre termos e novas versões. Quem ainda não aceitou vê o termo no próximo acesso.</p>
    </header>

    <form class="cartao" novalidate @submit.prevent="salvar">
      <p v-if="sucesso" class="ok" role="status">{{ sucesso }}</p>
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
      <div class="linha">
        <label>
          Título
          <input v-model="form.titulo" type="text" maxlength="150" required />
        </label>
        <label class="versao">
          Versão
          <input v-model="form.versao" type="text" maxlength="20" placeholder="ex.: 2.2" required />
        </label>
      </div>
      <label>
        Texto
        <textarea v-model="form.texto" rows="6" required></textarea>
      </label>
      <label class="check">
        <input v-model="form.obrigatorio" type="checkbox" />
        Obrigatório (sem aceitar, o usuário não acessa o sistema)
      </label>
      <button type="submit" class="btn" :disabled="salvando">
        <FilePlus2 :size="15" aria-hidden="true" />
        {{ salvando ? 'Salvando…' : 'Cadastrar termo' }}
      </button>
    </form>

    <table class="tabela">
      <thead>
        <tr>
          <th>Título</th>
          <th>Versão</th>
          <th>Tipo</th>
          <th>Situação</th>
          <th>Cadastrado em</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in termos" :key="t.id">
          <td>{{ t.titulo }}</td>
          <td>{{ t.versao }}</td>
          <td>{{ t.obrigatorio ? 'Obrigatório' : 'Opcional' }}</td>
          <td>{{ t.ativo ? 'Em vigor' : 'Versão anterior' }}</td>
          <td>{{ new Date(t.criado_em).toLocaleDateString('pt-BR') }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
  .termos-admin header h2 {
    margin: 0;
    font-size: 1.3rem;
    color: #0f172a;
  }
  .termos-admin header p {
    margin: 0.25rem 0 1rem;
    color: #64748b;
    font-size: 0.85rem;
  }
  .cartao {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    max-width: 720px;
  }
  .linha {
    display: flex;
    gap: 0.75rem;
  }
  .linha label {
    flex: 1;
  }
  .linha .versao {
    flex: 0 0 140px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: #334155;
  }
  label.check {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }
  input[type='text'],
  textarea {
    padding: 0.5rem 0.65rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font: inherit;
  }
  .btn {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.9rem;
    border: none;
    border-radius: 8px;
    background: #7c3aed;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }
  .btn:disabled {
    opacity: 0.6;
  }
  .ok {
    margin: 0;
    color: #047857;
  }
  .erro {
    margin: 0;
    color: #b91c1c;
  }
  .tabela {
    margin-top: 1.25rem;
    width: 100%;
    max-width: 900px;
    border-collapse: collapse;
    background: #fff;
    font-size: 0.85rem;
  }
  .tabela th,
  .tabela td {
    padding: 0.55rem 0.75rem;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
  }
  .tabela th {
    color: #64748b;
    font-size: 0.75rem;
    text-transform: uppercase;
  }
</style>
