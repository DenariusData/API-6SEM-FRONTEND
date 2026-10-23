<script setup>
  /*
   * Upload de documento técnico — S2-32
   * Campos e rotas seguem o serviço de upload do backend (core_api).
   * Categoria e subcategoria vêm aninhadas em GET /api/areas/, então a
   * cascata é montada aqui, sem chamadas extras.
   *
   * Modo edição — S2-36
   * Com a prop `documentoId`, o formulário abre preenchido com o documento
   * devolvido (GET /api/documents/<id>/), mostra o comentário do validador no
   * topo e reenvia por PUT /api/documents/<id>/reenviar/. O backend valida só
   * os campos enviados, então vão apenas os alterados (e o PDF, se trocado).
   */
  import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
  import {
    UploadCloud,
    FileText,
    CheckCircle2,
    AlertCircle,
    RotateCw,
    MessageSquare,
  } from 'lucide-vue-next';
  import { uploadDocument } from '../services/api.js';
  import { detalhe, reenviar } from '../services/documentos.js';
  import { useOpcoesUpload } from '../composables/useOpcoesUpload.js';

  const props = defineProps({
    // id do documento devolvido; quando informado, o formulário entra em modo edição
    documentoId: { type: String, default: null },
  });

  const emit = defineEmits(['enviado', 'reenviado', 'cancelar', 'enviando']);

  const modoEdicao = computed(() => Boolean(props.documentoId));

  /* ---------- Status: valores fixos aceitos pelo backend ---------- */
  const STATUS = [
    { value: 'VIGENTE', label: 'Vigente' },
    { value: 'SUBSTITUIDO', label: 'Substituído' },
    { value: 'CANCELADO', label: 'Cancelado' },
    { value: 'EM_REVISAO', label: 'Em revisão' },
  ];

  const TAMANHO_MAX = 10 * 1024 * 1024;

  /* ---------- Estado do formulário (chaves = nomes do backend) ---------- */
  const formVazio = () => ({
    titulo: '',
    identificador_codigo: '',
    tipo_documento: '',
    numero_revisao: '',
    data_emissao: '',
    data_vigencia: '',
    area_principal: '',
    areas_secundarias: [],
    categoria: '',
    subcategoria: '',
    status: 'VIGENTE',
    nivel_sigilo: '',
    origem_fonte: '',
    responsavel: '',
    idioma: '',
    referencia_normativa: '',
    data_validade: '',
    arquivo: null,
  });

  const form = reactive(formVazio());
  const erros = reactive({});
  const erroGeral = ref('');
  const sucesso = ref(false);
  const enviando = ref(false);
  const arrastando = ref(false);
  const topoRef = ref(null);

  watch(enviando, (v) => emit('enviando', v));

  /* ---------- Opções (cache e contrato em composables/useOpcoesUpload.js) ---------- */
  const { opcoes, carregando, falhou, carregar, carregarTodas, carregarResponsaveis } =
    useOpcoesUpload();

  const tentarDeNovo = (chave) =>
    chave === 'responsaveis'
      ? carregarResponsaveis(form.area_principal, true)
      : carregar(chave, true);

  onMounted(async () => {
    await carregarTodas();
    if (modoEdicao.value) await carregarDocumento();
  });

  /* ---------- Cascata área → categoria → subcategoria ---------- */
  const areaSelecionada = computed(() => opcoes.areas.find((a) => a.value === form.area_principal));
  const categorias = computed(() => areaSelecionada.value?.categorias ?? []);
  const subcategorias = computed(
    () => categorias.value.find((c) => c.value === form.categoria)?.subcategorias ?? []
  );
  const areasSecundariasDisponiveis = computed(() =>
    form.area_principal ? opcoes.areas.filter((a) => a.value !== form.area_principal) : []
  );

  // Enquanto o modo edição preenche o formulário, a cascata não pode limpar os filhos.
  let preenchendo = false;

  watch(
    () => form.area_principal,
    (area) => {
      if (preenchendo) return;
      form.categoria = '';
      form.subcategoria = '';
      form.areas_secundarias = form.areas_secundarias.filter((a) => a !== area);
      // Responsável depende da área principal (D13/D19): recarrega e limpa a escolha.
      form.responsavel = '';
      carregarResponsaveis(area);
    }
  );
  watch(
    () => form.categoria,
    () => {
      if (preenchendo) return;
      form.subcategoria = '';
    }
  );

  const semOpcoes = (chave) => !carregando[chave] && !falhou[chave] && !opcoes[chave].length;

  const placeholder = (estaCarregando, paiVazio, nomePai) => {
    if (estaCarregando) return 'Carregando…';
    if (paiVazio) return `Escolha ${nomePai} primeiro`;
    return 'Selecione';
  };

  /* ---------- Modo edição: carrega e preenche o documento devolvido ---------- */
  const documentoOriginal = ref(null);
  const carregandoDocumento = ref(false);
  const erroDocumento = ref('');
  const camposNaoPreenchidos = ref([]);
  let valoresIniciais = {};

  // Última devolução do histórico (quem devolveu e quando).
  const ultimaDevolucao = computed(() => {
    const devolucoes = (documentoOriginal.value?.historico ?? []).filter(
      (h) => h.acao === 'DEVOLVIDO'
    );
    return devolucoes.length ? devolucoes[devolucoes.length - 1] : null;
  });

  const comentarioValidador = computed(
    () => documentoOriginal.value?.comentario_devolucao || ultimaDevolucao.value?.comentario || ''
  );

  const normalizarTexto = (t) =>
    String(t ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  // O detalhe devolve nomes, não ids: acha a opção pelo nome exibido.
  const acharPorNome = (lista, nome) =>
    nome ? lista.find((o) => normalizarTexto(o.label) === normalizarTexto(nome)) : undefined;

  // O detalhe traz só a subcategoria e os nomes das áreas: área principal e
  // categoria saem da árvore de GET /api/areas/.
  function acharCaminhoSubcategoria(d) {
    const nomesAreas = (d.areas ?? []).map(normalizarTexto);
    const candidatos = [];
    for (const area of opcoes.areas) {
      for (const categoria of area.categorias) {
        const sub = acharPorNome(categoria.subcategorias, d.subcategoria);
        if (sub) candidatos.push({ area, categoria, sub });
      }
    }
    return (
      candidatos.find((c) => nomesAreas.includes(normalizarTexto(c.area.label))) ?? candidatos[0]
    );
  }

  const somenteData = (v) => (v ? String(v).slice(0, 10) : '');

  async function carregarDocumento() {
    carregandoDocumento.value = true;
    erroDocumento.value = '';
    try {
      const d = await detalhe(props.documentoId);
      documentoOriginal.value = d;
      if (d.status_validacao !== 'DEVOLVIDO') {
        erroDocumento.value = 'Só documentos devolvidos podem ser corrigidos e reenviados.';
        return;
      }
      await preencher(d);
    } catch (e) {
      erroDocumento.value =
        e?.status === 404
          ? 'Documento não encontrado ou você não tem acesso a ele.'
          : e?.detail || 'Não foi possível carregar os dados do documento.';
    } finally {
      carregandoDocumento.value = false;
    }
  }

  async function preencher(d) {
    preenchendo = true;
    const faltando = [];
    const valor = (opcaoAchada, rotulo) => {
      if (opcaoAchada) return opcaoAchada.value;
      faltando.push(rotulo);
      return '';
    };

    form.titulo = d.titulo ?? '';
    form.identificador_codigo = d.identificador_codigo ?? '';
    form.numero_revisao = d.numero_revisao ?? '';
    form.data_emissao = somenteData(d.data_emissao);
    form.data_vigencia = somenteData(d.data_vigencia);
    form.data_validade = somenteData(d.data_validade);
    form.status = d.status || 'VIGENTE';
    form.origem_fonte = d.origem_fonte ?? '';
    form.referencia_normativa = d.referencia_normativa ?? '';
    form.tipo_documento = valor(acharPorNome(opcoes.tipos, d.tipo_documento), 'Tipo de documento');
    form.nivel_sigilo = valor(
      acharPorNome(opcoes.niveis, d.nivel_sigilo_sugerido),
      'Nível sugerido'
    );
    form.idioma = valor(acharPorNome(opcoes.idiomas, d.idioma), 'Idioma');

    const caminho = acharCaminhoSubcategoria(d);
    if (caminho) {
      form.area_principal = caminho.area.value;
      form.categoria = caminho.categoria.value;
      form.subcategoria = caminho.sub.value;
    } else {
      faltando.push('Área, categoria e subcategoria');
    }
    form.areas_secundarias = (d.areas ?? [])
      .map((nome) => acharPorNome(opcoes.areas, nome)?.value)
      .filter((id) => id && id !== form.area_principal);

    // Responsável depende da área principal: carrega a lista dela antes de escolher.
    await carregarResponsaveis(form.area_principal);
    form.responsavel = valor(acharPorNome(opcoes.responsaveis, d.responsavel), 'Responsável');

    form.arquivo = null;
    camposNaoPreenchidos.value = faltando;
    valoresIniciais = JSON.parse(JSON.stringify({ ...form, arquivo: null }));
    await nextTick();
    preenchendo = false;
  }

  // Campos que o backend valida juntos e precisam ir sempre em par.
  const GRUPOS = [
    ['area_principal', 'areas_secundarias'],
    ['categoria', 'subcategoria'],
  ];

  const comparavel = (v) =>
    Array.isArray(v) ? JSON.stringify([...v].sort()) : String(v ?? '').trim();

  function camposAlterados() {
    const alterados = new Set(
      Object.keys(form).filter(
        (campo) =>
          campo !== 'arquivo' && comparavel(form[campo]) !== comparavel(valoresIniciais[campo])
      )
    );
    for (const grupo of GRUPOS) {
      if (grupo.some((c) => alterados.has(c))) grupo.forEach((c) => alterados.add(c));
    }
    return alterados;
  }

  /* ---------- Arquivo ---------- */
  const tamanhoMB = (b) => (b / 1024 / 1024).toFixed(1).replace('.', ',');

  function definirArquivo(arq) {
    delete erros.arquivo;
    if (!arq) return;
    const ehPdf = arq.type === 'application/pdf' || arq.name.toLowerCase().endsWith('.pdf');
    if (!ehPdf) {
      form.arquivo = null;
      erros.arquivo = 'Tipo de arquivo não permitido. Envie um PDF.';
    } else if (arq.size === 0) {
      form.arquivo = null;
      erros.arquivo = 'O arquivo selecionado está vazio.';
    } else if (arq.size > TAMANHO_MAX) {
      form.arquivo = null;
      erros.arquivo = `O arquivo tem ${tamanhoMB(arq.size)} MB. O limite é 10 MB.`;
    } else {
      form.arquivo = arq;
    }
  }

  const onArquivo = (e) => {
    definirArquivo(e.target.files?.[0]);
    e.target.value = '';
  };
  const onDrop = (e) => {
    arrastando.value = false;
    definirArquivo(e.dataTransfer.files?.[0]);
  };

  /* ---------- Validação (mesmas regras do backend) ---------- */
  const OBRIGATORIOS = {
    titulo: 'Informe o título.',
    identificador_codigo: 'Informe o identificador ou código.',
    tipo_documento: 'Selecione o tipo de documento.',
    numero_revisao: 'Informe o número da revisão.',
    data_emissao: 'Informe a data de emissão.',
    area_principal: 'Selecione a área principal.',
    categoria: 'Selecione a categoria.',
    subcategoria: 'Selecione a subcategoria.',
    status: 'Selecione o status.',
    nivel_sigilo: 'Selecione o nível sugerido.',
    origem_fonte: 'Informe a origem ou fonte.',
    responsavel: 'Selecione o responsável.',
    idioma: 'Selecione o idioma.',
    arquivo: 'Selecione o arquivo PDF.',
  };

  function limparErros() {
    Object.keys(erros).forEach((k) => delete erros[k]);
    erroGeral.value = '';
  }

  function validar() {
    const erroArquivo = !form.arquivo ? erros.arquivo : null;
    limparErros();
    if (erroArquivo) erros.arquivo = erroArquivo;

    for (const [campo, msg] of Object.entries(OBRIGATORIOS)) {
      // no reenvio o arquivo é opcional: só vai se o autor escolher um novo
      if (campo === 'arquivo' && modoEdicao.value) continue;
      const v = form[campo];
      if ((typeof v === 'string' ? !v.trim() : !v) && !erros[campo]) erros[campo] = msg;
    }
    if (form.data_emissao && form.data_vigencia && form.data_vigencia < form.data_emissao) {
      erros.data_vigencia = 'A vigência não pode ser anterior à emissão.';
    }
    if (form.data_emissao && form.data_validade && form.data_validade < form.data_emissao) {
      erros.data_validade = 'A validade não pode ser anterior à emissão.';
    }
    return Object.keys(erros).length === 0;
  }

  const rolarParaErro = () =>
    nextTick(() =>
      topoRef.value
        ?.querySelector('.invalido, .alerta--erro')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    );

  /* ---------- Envio ---------- */
  // `somente`: no reenvio, só os campos alterados. Ali um texto vazio vai como
  // "" para o backend limpar o campo opcional.
  function montarPayload(somente = null) {
    const fd = new FormData();
    for (const [campo, valor] of Object.entries(form)) {
      if (campo === 'arquivo') {
        if (valor) fd.append('arquivo', valor);
      } else if (somente && !somente.has(campo)) {
        continue;
      } else if (campo === 'areas_secundarias') {
        valor.forEach((a) => fd.append('areas_secundarias', a));
      } else if (typeof valor === 'string' && (valor.trim() || somente)) {
        fd.append(campo, valor.trim());
      }
    }
    return fd;
  }

  function aplicarErroBackend(e) {
    const msg =
      e?.detail ||
      e?.message ||
      (modoEdicao.value
        ? 'Não foi possível reenviar o documento. Tente novamente.'
        : 'Não foi possível enviar o documento. Tente novamente.');
    // O backend indica o campo em "field" (inclusive no 409 de identificador + revisão).
    const campo = e?.field;
    if (campo && campo in form) erros[campo] = msg;
    else erroGeral.value = msg;
  }

  async function enviar() {
    if (enviando.value || (modoEdicao.value && sucesso.value)) return;
    sucesso.value = false;
    if (!validar()) return rolarParaErro();

    const alterados = modoEdicao.value ? camposAlterados() : null;
    if (modoEdicao.value && !alterados.size && !form.arquivo) {
      erroGeral.value = 'Altere ao menos um campo ou selecione um novo PDF antes de reenviar.';
      return rolarParaErro();
    }

    enviando.value = true;
    try {
      if (modoEdicao.value) {
        const data = await reenviar(props.documentoId, montarPayload(alterados));
        sucesso.value = true;
        emit('reenviado', data);
      } else {
        const data = await uploadDocument(montarPayload());
        resetar();
        sucesso.value = true;
        emit('enviado', data);
      }
      nextTick(() => topoRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (e) {
      // 401 é tratado pelo apiFetch (evento global session-expired).
      aplicarErroBackend(e);
      rolarParaErro();
    } finally {
      enviando.value = false;
    }
  }

  function resetar() {
    Object.assign(form, formVazio());
    limparErros();
  }

  defineExpose({ resetar });
</script>

<template>
  <form ref="topoRef" class="upload" novalidate @submit.prevent="enviar">
    <div v-if="sucesso" class="alerta alerta--sucesso" role="status">
      <CheckCircle2 :size="18" />
      <span v-if="modoEdicao">Documento reenviado para validação.</span>
      <span v-else>Documento enviado para validação. Ele aparece na busca depois de aprovado.</span>
    </div>

    <!-- Modo edição: comentário do validador no topo -->
    <div
      v-if="modoEdicao && comentarioValidador && !sucesso"
      class="comentario-validador"
      role="note"
    >
      <div class="comentario-validador__cabecalho">
        <MessageSquare :size="16" />
        <strong>Comentário do validador</strong>
        <span v-if="ultimaDevolucao" class="comentario-validador__meta">
          {{ ultimaDevolucao.usuario || 'Validador' }}
          <template v-if="ultimaDevolucao.criado_em">
            · {{ new Date(ultimaDevolucao.criado_em).toLocaleDateString('pt-BR') }}
          </template>
        </span>
      </div>
      <p>{{ comentarioValidador }}</p>
    </div>

    <div v-if="carregandoDocumento" class="alerta alerta--info" role="status">
      <span class="spinner spinner--escuro" />
      <span>Carregando os dados do documento…</span>
    </div>

    <div v-if="erroDocumento" class="alerta alerta--erro" role="alert">
      <AlertCircle :size="18" />
      <span>{{ erroDocumento }}</span>
    </div>

    <div v-if="camposNaoPreenchidos.length && !sucesso" class="alerta alerta--aviso" role="status">
      <AlertCircle :size="18" />
      <span>
        Não foi possível preencher: {{ camposNaoPreenchidos.join(', ') }}. Selecione antes de
        reenviar.
      </span>
    </div>

    <div v-if="erroGeral" class="alerta alerta--erro" role="alert">
      <AlertCircle :size="18" />
      <span>{{ erroGeral }}</span>
    </div>

    <template v-if="!(modoEdicao && (sucesso || carregandoDocumento || erroDocumento))">
      <!-- Identificação -->
      <section class="secao">
        <h4 class="secao__titulo">Identificação</h4>

        <div class="campo">
          <label for="up-titulo">Título <span class="req">*</span></label>
          <input
            id="up-titulo"
            v-model="form.titulo"
            maxlength="300"
            :class="{ invalido: erros.titulo }"
            placeholder="Ex.: Manual de manutenção"
          />
          <small v-if="erros.titulo" class="erro">{{ erros.titulo }}</small>
        </div>

        <div class="grid">
          <div class="campo">
            <label for="up-codigo">Identificador / código <span class="req">*</span></label>
            <input
              id="up-codigo"
              v-model="form.identificador_codigo"
              maxlength="100"
              :class="{ invalido: erros.identificador_codigo }"
              placeholder="Ex.: MAN-001"
            />
            <small v-if="erros.identificador_codigo" class="erro">{{
              erros.identificador_codigo
            }}</small>
          </div>

          <div class="campo">
            <label for="up-revisao">Revisão <span class="req">*</span></label>
            <input
              id="up-revisao"
              v-model="form.numero_revisao"
              maxlength="30"
              :class="{ invalido: erros.numero_revisao }"
              placeholder="Ex.: 01"
            />
            <small v-if="erros.numero_revisao" class="erro">{{ erros.numero_revisao }}</small>
          </div>

          <div class="campo">
            <label for="up-tipo">Tipo de documento <span class="req">*</span></label>
            <select
              id="up-tipo"
              v-model="form.tipo_documento"
              :disabled="carregando.tipos"
              :class="{ invalido: erros.tipo_documento }"
            >
              <option value="">{{ placeholder(carregando.tipos) }}</option>
              <option v-for="o in opcoes.tipos" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <small v-if="falhou.tipos" class="falha">
              Lista indisponível.
              <button type="button" class="link" @click="tentarDeNovo('tipos')">
                <RotateCw :size="12" /> Tentar de novo
              </button>
            </small>
            <small v-if="semOpcoes('tipos')" class="falha"
              >Nenhuma opção cadastrada no sistema.</small
            >
            <small v-if="erros.tipo_documento" class="erro">{{ erros.tipo_documento }}</small>
          </div>

          <div class="campo">
            <label for="up-status">Status <span class="req">*</span></label>
            <select id="up-status" v-model="form.status" :class="{ invalido: erros.status }">
              <option v-for="o in STATUS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <small v-if="erros.status" class="erro">{{ erros.status }}</small>
          </div>
        </div>
      </section>

      <!-- Datas -->
      <section class="secao">
        <h4 class="secao__titulo">Datas</h4>
        <div class="grid grid--3">
          <div class="campo">
            <label for="up-emissao">Emissão <span class="req">*</span></label>
            <input
              id="up-emissao"
              v-model="form.data_emissao"
              type="date"
              :class="{ invalido: erros.data_emissao }"
            />
            <small v-if="erros.data_emissao" class="erro">{{ erros.data_emissao }}</small>
          </div>
          <div class="campo">
            <label for="up-vigencia">Vigência <span class="opc">opcional</span></label>
            <input
              id="up-vigencia"
              v-model="form.data_vigencia"
              type="date"
              :min="form.data_emissao || null"
              :class="{ invalido: erros.data_vigencia }"
            />
            <small v-if="erros.data_vigencia" class="erro">{{ erros.data_vigencia }}</small>
          </div>
          <div class="campo">
            <label for="up-validade">Validade <span class="opc">opcional</span></label>
            <input
              id="up-validade"
              v-model="form.data_validade"
              type="date"
              :min="form.data_emissao || null"
              :class="{ invalido: erros.data_validade }"
            />
            <small v-if="erros.data_validade" class="erro">{{ erros.data_validade }}</small>
          </div>
        </div>
      </section>

      <!-- Classificação -->
      <section class="secao">
        <h4 class="secao__titulo">Classificação</h4>

        <div class="grid grid--3">
          <div class="campo">
            <label for="up-area">Área principal <span class="req">*</span></label>
            <select
              id="up-area"
              v-model="form.area_principal"
              :disabled="carregando.areas"
              :class="{ invalido: erros.area_principal }"
            >
              <option value="">{{ placeholder(carregando.areas) }}</option>
              <option v-for="o in opcoes.areas" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <small v-if="falhou.areas" class="falha">
              Lista indisponível.
              <button type="button" class="link" @click="tentarDeNovo('areas')">
                <RotateCw :size="12" /> Tentar de novo
              </button>
            </small>
            <small v-if="semOpcoes('areas')" class="falha"
              >Nenhuma opção cadastrada no sistema.</small
            >
            <small v-if="erros.area_principal" class="erro">{{ erros.area_principal }}</small>
          </div>

          <div class="campo">
            <label for="up-categoria">Categoria <span class="req">*</span></label>
            <select
              id="up-categoria"
              v-model="form.categoria"
              :disabled="!form.area_principal"
              :class="{ invalido: erros.categoria }"
            >
              <option value="">{{ placeholder(false, !form.area_principal, 'a área') }}</option>
              <option v-for="o in categorias" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <small v-if="form.area_principal && !categorias.length" class="falha"
              >Esta área não tem categorias.</small
            >
            <small v-if="erros.categoria" class="erro">{{ erros.categoria }}</small>
          </div>

          <div class="campo">
            <label for="up-sub">Subcategoria <span class="req">*</span></label>
            <select
              id="up-sub"
              v-model="form.subcategoria"
              :disabled="!form.categoria"
              :class="{ invalido: erros.subcategoria }"
            >
              <option value="">{{ placeholder(false, !form.categoria, 'a categoria') }}</option>
              <option v-for="o in subcategorias" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <small v-if="erros.subcategoria" class="erro">{{ erros.subcategoria }}</small>
          </div>
        </div>

        <div v-if="areasSecundariasDisponiveis.length" class="campo">
          <label>Áreas secundárias <span class="opc">opcional</span></label>
          <div class="chips">
            <label
              v-for="o in areasSecundariasDisponiveis"
              :key="o.value"
              class="chip"
              :class="{ 'chip--ativo': form.areas_secundarias.includes(o.value) }"
            >
              <input v-model="form.areas_secundarias" type="checkbox" :value="o.value" />
              {{ o.label }}
            </label>
          </div>
          <small v-if="erros.areas_secundarias" class="erro">{{ erros.areas_secundarias }}</small>
        </div>

        <div class="campo">
          <label>Nível de classificação sugerido <span class="req">*</span></label>
          <div v-if="carregando.niveis" class="falha">Carregando…</div>
          <div
            v-else-if="opcoes.niveis.length"
            class="segmentado"
            :class="{ invalido: erros.nivel_sigilo }"
            :style="{ gridTemplateColumns: `repeat(${opcoes.niveis.length}, 1fr)` }"
          >
            <label
              v-for="n in opcoes.niveis"
              :key="n.value"
              :class="{ ativo: form.nivel_sigilo === n.value }"
            >
              <input
                v-model="form.nivel_sigilo"
                type="radio"
                name="nivel_sigilo"
                :value="n.value"
              />
              {{ n.label }}
            </label>
          </div>
          <small v-if="falhou.niveis" class="falha">
            Lista indisponível.
            <button type="button" class="link" @click="tentarDeNovo('niveis')">
              <RotateCw :size="12" /> Tentar de novo
            </button>
          </small>
          <small v-if="semOpcoes('niveis')" class="falha"
            >Nenhuma opção cadastrada no sistema.</small
          >
          <small class="ajuda"
            >O validador vai conferir antes de o documento ficar disponível.</small
          >
          <small v-if="erros.nivel_sigilo" class="erro">{{ erros.nivel_sigilo }}</small>
        </div>
      </section>

      <!-- Responsabilidade -->
      <section class="secao">
        <h4 class="secao__titulo">Responsabilidade e referência</h4>

        <div class="grid grid--3">
          <div class="campo">
            <label for="up-origem">Origem / fonte <span class="req">*</span></label>
            <input
              id="up-origem"
              v-model="form.origem_fonte"
              maxlength="200"
              :class="{ invalido: erros.origem_fonte }"
              placeholder="Ex.: Eng. de Produto"
            />
            <small v-if="erros.origem_fonte" class="erro">{{ erros.origem_fonte }}</small>
          </div>

          <div class="campo">
            <label for="up-resp">Responsável <span class="req">*</span></label>
            <select
              id="up-resp"
              v-model="form.responsavel"
              :disabled="!form.area_principal || carregando.responsaveis"
              :class="{ invalido: erros.responsavel }"
            >
              <option value="">
                {{ placeholder(carregando.responsaveis, !form.area_principal, 'a área principal') }}
              </option>
              <option v-for="o in opcoes.responsaveis" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <small v-if="falhou.responsaveis" class="falha">
              Lista indisponível.
              <button type="button" class="link" @click="tentarDeNovo('responsaveis')">
                <RotateCw :size="12" /> Tentar de novo
              </button>
            </small>
            <small v-if="form.area_principal && semOpcoes('responsaveis')" class="falha"
              >Nenhum responsável disponível para esta área.</small
            >
            <small v-if="erros.responsavel" class="erro">{{ erros.responsavel }}</small>
          </div>

          <div class="campo">
            <label for="up-idioma">Idioma <span class="req">*</span></label>
            <select
              id="up-idioma"
              v-model="form.idioma"
              :disabled="carregando.idiomas"
              :class="{ invalido: erros.idioma }"
            >
              <option value="">{{ placeholder(carregando.idiomas) }}</option>
              <option v-for="o in opcoes.idiomas" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <small v-if="falhou.idiomas" class="falha">
              Lista indisponível.
              <button type="button" class="link" @click="tentarDeNovo('idiomas')">
                <RotateCw :size="12" /> Tentar de novo
              </button>
            </small>
            <small v-if="semOpcoes('idiomas')" class="falha"
              >Nenhuma opção cadastrada no sistema.</small
            >
            <small v-if="erros.idioma" class="erro">{{ erros.idioma }}</small>
          </div>
        </div>

        <div class="campo">
          <label for="up-norma"
            >Norma ou documento relacionado <span class="opc">opcional</span></label
          >
          <input
            id="up-norma"
            v-model="form.referencia_normativa"
            maxlength="1000"
            :class="{ invalido: erros.referencia_normativa }"
            placeholder="Ex.: NBR 5410, MAN-002 rev. 03"
          />
          <small v-if="erros.referencia_normativa" class="erro">{{
            erros.referencia_normativa
          }}</small>
        </div>
      </section>

      <!-- Arquivo -->
      <section class="secao">
        <h4 class="secao__titulo">
          Arquivo original
          <span v-if="modoEdicao" class="opc">opcional, só se for trocar</span>
          <span v-else class="req">*</span>
        </h4>
        <label
          class="dropzone"
          :class="{
            invalido: erros.arquivo,
            'dropzone--arrastando': arrastando,
            'dropzone--ok': form.arquivo,
          }"
          @dragover.prevent="arrastando = true"
          @dragleave.prevent="arrastando = false"
          @drop.prevent="onDrop"
        >
          <input type="file" accept="application/pdf,.pdf" hidden @change="onArquivo" />
          <span class="dropzone__icone">
            <FileText v-if="form.arquivo" :size="20" />
            <UploadCloud v-else :size="20" />
          </span>
          <span class="dropzone__texto">
            <template v-if="form.arquivo">
              <strong>{{ form.arquivo.name }}</strong>
              <small>{{ tamanhoMB(form.arquivo.size) }} MB · clique para trocar</small>
            </template>
            <template v-else-if="modoEdicao">
              <strong>Manter o arquivo atual</strong>
              <small>Para enviar uma versão corrigida, arraste o PDF ou clique (até 10 MB)</small>
            </template>
            <template v-else>
              <strong>Arraste o PDF ou clique para selecionar</strong>
              <small>Somente PDF, até 10 MB</small>
            </template>
          </span>
        </label>
        <small v-if="erros.arquivo" class="erro">{{ erros.arquivo }}</small>
      </section>
    </template>

    <footer class="rodape">
      <template v-if="modoEdicao && (sucesso || erroDocumento)">
        <button type="button" class="btn btn--pri" @click="emit('cancelar')">Fechar</button>
      </template>
      <template v-else>
        <button type="button" class="btn btn--sec" :disabled="enviando" @click="emit('cancelar')">
          Cancelar
        </button>
        <button type="submit" class="btn btn--pri" :disabled="enviando || carregandoDocumento">
          <span v-if="enviando" class="spinner" />
          <template v-if="modoEdicao">{{
            enviando ? 'Reenviando…' : 'Reenviar para validação'
          }}</template>
          <template v-else>{{ enviando ? 'Enviando…' : 'Enviar para validação' }}</template>
        </button>
      </template>
    </footer>
  </form>
</template>

<style scoped>
  .upload {
    --roxo: #7e22ce;
    --roxo-claro: #f3e8ff;
    --borda: #cbd5e1;
    --texto: #0f172a;
    --suave: #64748b;
    --erro: #dc2626;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    color: var(--texto);
    font-size: 0.85rem;
  }

  .alerta {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.8rem 1rem;
    border-radius: 9px;
    font-size: 0.82rem;
  }
  .alerta--info {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #475569;
  }
  .alerta--aviso {
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #92400e;
  }
  .comentario-validador {
    padding: 0.9rem 1rem;
    border: 1px solid #fde68a;
    border-left: 4px solid #f59e0b;
    border-radius: 9px;
    background: #fffbeb;
    color: #78350f;
  }
  .comentario-validador__cabecalho {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.82rem;
  }
  .comentario-validador__meta {
    margin-left: auto;
    font-size: 0.74rem;
    color: #92400e;
  }
  .comentario-validador p {
    margin: 0.5rem 0 0;
    font-size: 0.85rem;
    line-height: 1.5;
    white-space: pre-line;
  }
  .spinner--escuro {
    border-color: rgba(100, 116, 139, 0.3);
    border-top-color: #64748b;
  }
  .alerta--sucesso {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }
  .alerta--erro {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
  }

  .secao {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }
  .secao__titulo {
    margin: 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--suave);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem 1rem;
  }
  .grid--3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @media (max-width: 680px) {
    .grid,
    .grid--3 {
      grid-template-columns: 1fr;
    }
  }

  .campo {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }
  .campo > label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
  }
  .req {
    color: var(--roxo);
  }
  .opc {
    margin-left: 0.25rem;
    font-size: 0.7rem;
    font-weight: 400;
    color: #94a3b8;
  }

  input:not([type='checkbox']):not([type='radio']):not([type='file']),
  select {
    box-sizing: border-box;
    width: 100%;
    height: 40px;
    padding: 0 0.75rem;
    border: 1px solid var(--borda);
    border-radius: 8px;
    background: #fff;
    color: var(--texto);
    font: inherit;
    outline: none;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }
  input:focus,
  select:focus {
    border-color: var(--roxo);
    box-shadow: 0 0 0 3px rgba(126, 34, 206, 0.1);
  }
  select:disabled {
    background: #f8fafc;
    color: #94a3b8;
    cursor: not-allowed;
  }
  .invalido {
    border-color: var(--erro) !important;
  }

  .erro {
    font-size: 0.74rem;
    color: var(--erro);
  }
  .ajuda,
  .falha {
    font-size: 0.74rem;
    color: var(--suave);
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0;
    border: 0;
    background: none;
    color: var(--roxo);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }
  .chip {
    padding: 0.35rem 0.75rem;
    border: 1px solid var(--borda);
    border-radius: 999px;
    font-size: 0.78rem;
    color: #334155;
    cursor: pointer;
    user-select: none;
    transition: all 0.15s;
  }
  .chip input {
    display: none;
  }
  .chip:hover {
    border-color: var(--roxo);
  }
  .chip--ativo {
    background: var(--roxo-claro);
    border-color: var(--roxo);
    color: var(--roxo);
    font-weight: 600;
  }

  .segmentado {
    display: grid;
    border: 1px solid var(--borda);
    border-radius: 8px;
    overflow: hidden;
  }
  .segmentado label {
    padding: 0.6rem 0.4rem;
    border-right: 1px solid var(--borda);
    text-align: center;
    font-size: 0.8rem;
    color: #334155;
    cursor: pointer;
    transition: background 0.15s;
  }
  .segmentado label:last-child {
    border-right: 0;
  }
  .segmentado label:hover {
    background: #faf5ff;
  }
  .segmentado input {
    display: none;
  }
  .segmentado label.ativo {
    background: var(--roxo);
    color: #fff;
    font-weight: 600;
  }

  .dropzone {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1.1rem 1.25rem;
    border: 1.5px dashed var(--borda);
    border-radius: 10px;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.15s;
  }
  .dropzone:hover,
  .dropzone--arrastando {
    border-color: var(--roxo);
    background: #faf5ff;
  }
  .dropzone--ok {
    border-style: solid;
    border-color: var(--roxo);
    background: #faf5ff;
  }
  .dropzone__icone {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 9px;
    background: var(--roxo-claro);
    color: var(--roxo);
  }
  .dropzone__texto {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }
  .dropzone__texto strong {
    font-size: 0.84rem;
    color: #334155;
    word-break: break-all;
  }
  .dropzone__texto small {
    font-size: 0.74rem;
    color: var(--suave);
  }

  .rodape {
    position: sticky;
    bottom: 0;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin: 0 -1.5rem -1.5rem;
    padding: 1rem 1.5rem;
    background: #fff;
    border-top: 1px solid #e2e8f0;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 40px;
    padding: 0 1.1rem;
    border-radius: 8px;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .btn--sec {
    background: #fff;
    border: 1px solid var(--borda);
    color: #475569;
  }
  .btn--sec:not(:disabled):hover {
    background: #f8fafc;
  }
  .btn--pri {
    background: var(--roxo);
    border: 1px solid var(--roxo);
    color: #fff;
    min-width: 180px;
  }
  .btn--pri:not(:disabled):hover {
    background: #6b21a8;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: girar 0.7s linear infinite;
  }
  @keyframes girar {
    to {
      transform: rotate(360deg);
    }
  }
</style>
