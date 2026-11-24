import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import UploadDocumento from '@/components/UploadDocumento.vue';

const resposta = (status, corpo) => new Response(JSON.stringify(corpo), { status });

const TIPOS = [
  { id: 1, nome: 'Jurídica' },
  { id: 2, nome: 'Normativa' },
  { id: 3, nome: 'Quantitativa' },
  { id: 4, nome: 'Técnica' },
];

const sugestao = (id, confianca) => ({
  sugestao: {
    tipo_documento: TIPOS.find((t) => t.id === id),
    confianca,
    probabilidades: {},
  },
});

// `sugerir` é o que POST /api/documents/sugerir-tipo/ responde.
const montar = async (sugerir) => {
  const fetchMock = vi.fn((url) => {
    if (url.endsWith('/api/documents/sugerir-tipo/')) {
      return Promise.resolve(resposta(200, sugerir));
    }
    if (url.endsWith('/api/tipos-documento/')) {
      return Promise.resolve(resposta(200, { results: TIPOS }));
    }
    return Promise.resolve(resposta(200, { results: [] }));
  });
  vi.stubGlobal('fetch', fetchMock);
  const wrapper = mount(UploadDocumento);
  await flushPromises();
  return { wrapper, fetchMock };
};

const escolherPdf = async (wrapper) => {
  const input = wrapper.find('input[type="file"]');
  const pdf = new File(['%PDF-1.7'], 'manual.pdf', { type: 'application/pdf' });
  Object.defineProperty(input.element, 'files', { value: [pdf], configurable: true });
  await input.trigger('change');
  await flushPromises();
};

const tipo = (wrapper) => wrapper.find('#up-tipo').element.value;

describe('UploadDocumento: tipo sugerido pela IA', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('preenche o tipo com a sugestão e mostra a confiança', async () => {
    const { wrapper, fetchMock } = await montar(sugestao(4, 0.87));

    await escolherPdf(wrapper);

    const chamada = fetchMock.mock.calls.find(([url]) => url.endsWith('/sugerir-tipo/'));
    expect(chamada[1].method).toBe('POST');
    expect(chamada[1].body.get('arquivo').name).toBe('manual.pdf');
    expect(tipo(wrapper)).toBe('4');
    expect(wrapper.find('.sugestao-tipo').text()).toContain('Sugerido pela IA (87% de confiança)');
  });

  it('não troca o tipo que o usuário já escolheu', async () => {
    const { wrapper } = await montar(sugestao(4, 0.9));
    await wrapper.find('#up-tipo').setValue('1');

    await escolherPdf(wrapper);

    expect(tipo(wrapper)).toBe('1');
    expect(wrapper.find('.sugestao-tipo').text()).toContain('A IA sugeriu Técnica (90%)');
  });

  it('sem sugestão, o formulário segue como antes', async () => {
    const { wrapper } = await montar({ sugestao: null, motivo: 'A IA está indisponível agora.' });

    await escolherPdf(wrapper);

    expect(tipo(wrapper)).toBe('');
    expect(wrapper.find('.sugestao-tipo').exists()).toBe(false);
  });
});
