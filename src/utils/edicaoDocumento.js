/**
 * utils/edicaoDocumento.js
 *
 * Funções puras do modo edição do upload (AKA-60), sem dependência de Vue,
 * para poderem ser cobertas por testes unitários.
 *
 * O detalhe do documento (GET /api/documents/<id>/) devolve nomes, não ids.
 * Quando o backend passar a mandar os ids (tipo_documento_id, subcategoria_id,
 * area_principal_id...), eles têm prioridade sobre o nome.
 */

export const normalizarTexto = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

/** Acha a opção ({ value, label }) pelo id, se vier, ou pelo nome exibido. */
export function acharOpcao(lista, id, nome) {
  if (id !== undefined && id !== null && id !== '') {
    const porId = lista.find((o) => o.value === String(id));
    if (porId) return porId;
  }
  if (!nome) return undefined;
  return lista.find((o) => normalizarTexto(o.label) === normalizarTexto(nome));
}

/**
 * Área principal + categoria + subcategoria a partir do detalhe.
 * Devolve undefined quando não dá para saber com certeza: subcategoria
 * inexistente, ou com o mesmo nome em mais de um lugar sem uma única área do
 * documento que desempate. Nunca adivinha.
 */
export function acharCaminhoSubcategoria(areas, d) {
  if (d.area_principal_id != null && d.subcategoria_id != null) {
    const area = areas.find((a) => a.value === String(d.area_principal_id));
    for (const categoria of area?.categorias ?? []) {
      const sub = categoria.subcategorias.find((s) => s.value === String(d.subcategoria_id));
      if (sub) return { area, categoria, sub };
    }
  }

  const candidatos = [];
  for (const area of areas) {
    for (const categoria of area.categorias) {
      const sub = acharOpcao(categoria.subcategorias, d.subcategoria_id, d.subcategoria);
      if (sub) candidatos.push({ area, categoria, sub });
    }
  }
  if (candidatos.length <= 1) return candidatos[0];

  const nomesAreas = (d.areas ?? []).map(normalizarTexto);
  const naArea = candidatos.filter((c) => nomesAreas.includes(normalizarTexto(c.area.label)));
  return naArea.length === 1 ? naArea[0] : undefined;
}

// Campos que o backend valida juntos e precisam ir sempre em par no reenvio.
export const GRUPOS = [
  ['area_principal', 'areas_secundarias'],
  ['categoria', 'subcategoria'],
];

export const comparavel = (v) =>
  Array.isArray(v) ? JSON.stringify([...v].map(String).sort()) : String(v ?? '').trim();

/** Campos de `form` diferentes de `iniciais` (o arquivo fica de fora). */
export function camposAlterados(form, iniciais) {
  const alterados = new Set(
    Object.keys(form).filter(
      (campo) => campo !== 'arquivo' && comparavel(form[campo]) !== comparavel(iniciais[campo])
    )
  );
  for (const grupo of GRUPOS) {
    if (grupo.some((c) => alterados.has(c))) grupo.forEach((c) => alterados.add(c));
  }
  return alterados;
}

/**
 * FormData do envio. `somente` (Set): no reenvio, só os campos alterados; ali
 * um texto vazio vai como "" para o backend limpar o campo opcional.
 */
export function montarPayload(form, somente = null) {
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
