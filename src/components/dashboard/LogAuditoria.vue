<script setup>
  /**
   * Consulta do log de auditoria (AKA-81, RF29). Só ADMINISTRADOR.
   *
   * Filtros por usuário, período (de/até) e ação, combináveis; lista paginada
   * do mais recente para o mais antigo, em horário de Brasília; exportação do
   * resultado filtrado em CSV. Só leitura: não há como editar ou apagar
   * registros (o log é só de inclusão, AKA-80).
   *
   * O log guarda só o uuid de quem fez a ação; o nome vem do backend, que
   * busca nas credenciais na hora ("Usuário removido" se não existe mais).
   */
  import { onMounted, reactive, ref, watch } from 'vue';
  import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Download,
    RefreshCw,
    ScrollText,
    Search,
  } from 'lucide-vue-next';
  import {
    exportarLogsAuditoriaCsv,
    listarLogsAuditoria,
    listarUsuariosParaFiltro,
  } from '@/services/auditoria.js';

  const FILTROS_VAZIOS = { usuario: '', de: '', ate: '', acao: '' };

  // `formulario` é o que está nos campos; `aplicados` é o que a lista mostra.
  // A paginação e a exportação usam sempre os aplicados.
  const formulario = reactive({ ...FILTROS_VAZIOS });
  const aplicados = ref({ ...FILTROS_VAZIOS });

  const registros = ref([]);
  const acoes = ref([]);
  const usuarios = ref([]);
  const pagina = ref(1);
  const totalPaginas = ref(1);
  const total = ref(0);
  const carregando = ref(false);
  const erro = ref('');
  const erroFiltro = ref('');
  const exportando = ref(false);
  const mensagemExportacao = ref('');

  const FORMATO_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const formatarDataHora = (iso) => (iso ? FORMATO_DATA_HORA.format(new Date(iso)) : '—');

  const textoDoErro = (e, padrao) => {
    if (e?.status === 403) return 'Apenas administradores podem consultar o log de auditoria.';
    return e?.detail || e?.message || padrao;
  };

  let ultimaCarga = 0;
  async function carregar() {
    const carga = ++ultimaCarga;
    carregando.value = true;
    erro.value = '';
    try {
      const resp = await listarLogsAuditoria(aplicados.value, pagina.value);
      if (carga !== ultimaCarga) return; // chegou uma resposta mais nova
      registros.value = resp?.results ?? [];
      acoes.value = resp?.acoes ?? acoes.value;
      total.value = resp?.count ?? registros.value.length;
      totalPaginas.value = Math.max(resp?.total_pages ?? 1, 1);
    } catch (e) {
      if (carga !== ultimaCarga) return;
      registros.value = [];
      if (e?.status === 400 && e.field) {
        erroFiltro.value = e.detail;
      } else {
        erro.value = textoDoErro(e, 'Não foi possível carregar o log de auditoria.');
      }
    } finally {
      if (carga === ultimaCarga) carregando.value = false;
    }
  }

  async function aplicar() {
    erroFiltro.value = '';
    if (formulario.de && formulario.ate && formulario.ate < formulario.de) {
      erroFiltro.value = 'A data final não pode ser anterior à inicial.';
      return;
    }
    aplicados.value = { ...formulario };
    if (pagina.value !== 1) {
      pagina.value = 1; // o watch recarrega
      return;
    }
    await carregar();
  }

  function limpar() {
    Object.assign(formulario, FILTROS_VAZIOS);
    return aplicar();
  }

  watch(pagina, carregar);

  const salvar = (blob, nome) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  async function exportar() {
    if (exportando.value) return;
    exportando.value = true;
    mensagemExportacao.value = '';
    try {
      const { blob, nome } = await exportarLogsAuditoriaCsv(aplicados.value);
      const hoje = new Date().toISOString().slice(0, 10);
      salvar(blob, nome || `log-auditoria-${hoje}.csv`);
      mensagemExportacao.value = 'Download iniciado.';
    } catch (e) {
      mensagemExportacao.value = textoDoErro(e, 'Não foi possível exportar o log.');
    } finally {
      exportando.value = false;
    }
  }

  async function carregarUsuarios() {
    try {
      usuarios.value = await listarUsuariosParaFiltro();
    } catch {
      usuarios.value = []; // o filtro de usuário fica só com "Todos"
    }
  }

  onMounted(async () => {
    await Promise.all([carregar(), carregarUsuarios()]);
  });
</script>

<template>
  <section class="log-auditoria">
    <header class="cabecalho">
      <div>
        <h2>Log de auditoria</h2>
        <p>
          Quem fez o quê e quando no sistema. Somente leitura: os registros não podem ser alterados
          nem apagados.
        </p>
      </div>
      <div class="cabecalho__acoes">
        <button
          type="button"
          class="btn btn--sec"
          :disabled="carregando"
          title="Atualizar"
          @click="carregar"
        >
          <RefreshCw :size="16" :class="{ girando: carregando }" />
          <span>Atualizar</span>
        </button>
        <button
          type="button"
          class="btn btn--pri btn-exportar"
          :disabled="exportando || carregando || !registros.length"
          title="Baixar o resultado filtrado em CSV"
          @click="exportar"
        >
          <Download :size="16" />
          <span>{{ exportando ? 'Exportando…' : 'Exportar CSV' }}</span>
        </button>
      </div>
    </header>

    <form class="filtros" aria-label="Filtros do log" @submit.prevent="aplicar">
      <label class="campo">
        <span>Usuário</span>
        <select id="filtro-usuario" v-model="formulario.usuario">
          <option value="">Todos</option>
          <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nome }}</option>
        </select>
      </label>
      <label class="campo">
        <span>De</span>
        <input id="filtro-de" v-model="formulario.de" type="date" />
      </label>
      <label class="campo">
        <span>Até</span>
        <input id="filtro-ate" v-model="formulario.ate" type="date" :min="formulario.de || null" />
      </label>
      <label class="campo">
        <span>Ação</span>
        <select id="filtro-acao" v-model="formulario.acao">
          <option value="">Todas</option>
          <option v-for="a in acoes" :key="a.valor" :value="a.valor">{{ a.rotulo }}</option>
        </select>
      </label>
      <div class="filtros__botoes">
        <button type="submit" class="btn btn--pri" :disabled="carregando">
          <Search :size="16" />
          <span>Filtrar</span>
        </button>
        <button type="button" class="btn btn--sec" :disabled="carregando" @click="limpar">
          Limpar
        </button>
      </div>
    </form>

    <p v-if="erroFiltro" class="aviso aviso--erro" role="alert">{{ erroFiltro }}</p>
    <output v-if="mensagemExportacao" class="aviso">{{ mensagemExportacao }}</output>

    <div v-if="carregando && !registros.length" class="estado-lista">Carregando log…</div>

    <div v-else-if="erro" class="estado-lista estado-lista--erro" role="alert">
      <AlertCircle :size="18" />
      <span>{{ erro }}</span>
      <button type="button" class="link" @click="carregar">Tentar de novo</button>
    </div>

    <div v-else-if="!registros.length" class="estado-lista">
      <ScrollText :size="22" />
      <span>Nenhum registro encontrado com esses filtros.</span>
    </div>

    <div v-else class="tabela-wrap">
      <table class="tabela">
        <thead>
          <tr>
            <th>Data/hora (Brasília)</th>
            <th>Usuário</th>
            <th>Ação</th>
            <th>Entidade</th>
            <th>Registro</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in registros" :key="r.id">
            <td class="mono">{{ formatarDataHora(r.criado_em) }}</td>
            <td :class="{ 'sem-usuario': !r.usuario_id || r.usuario_nome === 'Usuário removido' }">
              {{ r.usuario_nome }}
            </td>
            <td>
              <span class="etiqueta">{{ r.acao_rotulo }}</span>
            </td>
            <td>{{ r.entidade_rotulo }}</td>
            <td class="mono registro" :title="r.registro_id || ''">{{ r.registro_id || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer v-if="totalPaginas > 1" class="paginacao">
      <span>{{ total }} registro(s) · página {{ pagina }} de {{ totalPaginas }}</span>
      <div>
        <button
          type="button"
          class="btn btn--sec"
          :disabled="pagina <= 1 || carregando"
          @click="pagina--"
        >
          <ChevronLeft :size="16" />
          <span>Anterior</span>
        </button>
        <button
          type="button"
          class="btn btn--sec"
          :disabled="pagina >= totalPaginas || carregando"
          @click="pagina++"
        >
          <span>Próxima</span>
          <ChevronRight :size="16" />
        </button>
      </div>
    </footer>
  </section>
</template>

<style scoped>
  .log-auditoria {
    /* variáveis globais de assets/styles.css, com o valor atual como reserva */
    --roxo: var(--purple-pill-text, #7e22ce);
    --roxo-escuro: #6b21a8;
    --roxo-claro: var(--purple-pill-bg, #f3e8ff);
    --borda: var(--border-light, #e2e8f0);
    --texto: #0f172a;
    --suave: var(--text-muted, #64748b);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    color: var(--texto);
  }

  .cabecalho {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
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
  .cabecalho__acoes {
    display: flex;
    gap: 0.6rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    height: 38px;
    padding: 0 1rem;
    border-radius: 8px;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition:
      background-color 0.15s,
      border-color 0.15s,
      color 0.15s;
  }
  .btn:disabled {
    opacity: 0.6;
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
  .girando {
    animation: girar 0.8s linear infinite;
  }
  @keyframes girar {
    to {
      transform: rotate(360deg);
    }
  }

  /* Filtros */
  .filtros {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid var(--borda);
    border-radius: 12px;
    background: #fff;
  }
  .campo {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 150px;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--suave);
  }
  .campo select,
  .campo input {
    height: 38px;
    padding: 0 0.6rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: var(--texto);
    font: inherit;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: normal;
    text-transform: none;
  }
  .campo select:focus,
  .campo input:focus {
    outline: 2px solid var(--roxo-claro);
    border-color: var(--roxo);
  }
  .filtros__botoes {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
  }

  .aviso {
    display: block;
    margin: 0;
    font-size: 0.85rem;
    color: var(--suave);
  }
  .aviso--erro {
    color: #b91c1c;
  }

  /* Estados da lista */
  .estado-lista {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 2.5rem 1rem;
    border: 1px dashed var(--borda);
    border-radius: 12px;
    background: #fff;
    color: var(--suave);
    font-size: 0.9rem;
  }
  .estado-lista--erro {
    color: #b91c1c;
  }
  .link {
    border: 0;
    background: none;
    color: var(--roxo);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
  }

  /* Tabela */
  .tabela-wrap {
    overflow-x: auto;
    border: 1px solid var(--borda);
    border-radius: 12px;
    background: #fff;
  }
  .tabela {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
  .tabela th {
    padding: 0.8rem 0.75rem;
    border-bottom: 1px solid var(--borda);
    background: #f8fafc;
    color: var(--suave);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-align: left;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .tabela td {
    padding: 0.75rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }
  .tabela tbody tr:last-child td {
    border-bottom: 0;
  }
  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.8rem;
    white-space: nowrap;
  }
  .registro {
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sem-usuario {
    color: var(--suave);
    font-style: italic;
  }
  .etiqueta {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: var(--roxo-claro);
    color: var(--roxo);
    font-size: 0.75rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .paginacao {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.82rem;
    color: var(--suave);
  }
  .paginacao div {
    display: flex;
    gap: 0.5rem;
  }
</style>
