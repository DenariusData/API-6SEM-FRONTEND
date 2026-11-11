import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import ExportarDados from '@/components/dashboard/ExportarDados.vue';
import { nomeDoArquivo } from '@/services/api.js';
import { API, server } from './server';

const URL_EXPORTAR = `${API}/auth/me/exportar/`;

const clicar = async (wrapper, formato) => {
  await wrapper.find(`.btn-exportar-${formato}`).trigger('click');
  await vi.waitFor(() => expect(wrapper.find('.exportar-mensagem').exists()).toBe(true));
  await flushPromises();
};

describe('Exportar meus dados (AKA-75)', () => {
  let baixados;

  beforeEach(() => {
    localStorage.setItem('akaer_token', 'jwt-de-teste');
    baixados = [];
    URL.createObjectURL = vi.fn(() => 'blob:exportacao');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      baixados.push({ href: this.href, nome: this.download });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['json', 'pdf'])(
    'baixa %s autenticado com o nome enviado pelo servidor',
    async (formato) => {
      let autorizacao;
      let pedido;
      server.use(
        http.get(URL_EXPORTAR, ({ request }) => {
          autorizacao = request.headers.get('Authorization');
          pedido = new URL(request.url).searchParams.get('formato');
          return new HttpResponse('conteudo', {
            headers: {
              'Content-Type': formato === 'pdf' ? 'application/pdf' : 'application/json',
              'Content-Disposition': `attachment; filename="meus-dados-2026-11-10.${formato}"`,
            },
          });
        })
      );

      const wrapper = mount(ExportarDados);
      await clicar(wrapper, formato);

      expect(autorizacao).toBe('Bearer jwt-de-teste');
      expect(pedido).toBe(formato);
      expect(baixados).toEqual([
        { href: 'blob:exportacao', nome: `meus-dados-2026-11-10.${formato}` },
      ]);
      expect(wrapper.find('.exportar-mensagem').text()).toBe('Download iniciado.');
      expect(wrapper.find('.exportar-erro').exists()).toBe(false);
    }
  );

  it('usa um nome padrão quando o servidor não informa', async () => {
    server.use(http.get(URL_EXPORTAR, () => HttpResponse.json({ identificacao: {} })));

    const wrapper = mount(ExportarDados);
    await clicar(wrapper, 'json');

    expect(baixados[0].nome).toMatch(/^meus-dados-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it('mostra quanto tempo esperar quando passa do limite (429)', async () => {
    server.use(
      http.get(URL_EXPORTAR, () =>
        HttpResponse.json(
          { detail: 'Aguarde 42 segundos para exportar novamente.' },
          { status: 429, headers: { 'Retry-After': '42' } }
        )
      )
    );

    const wrapper = mount(ExportarDados);
    await clicar(wrapper, 'pdf');

    expect(baixados).toEqual([]);
    const aviso = wrapper.find('.exportar-erro');
    expect(aviso.text()).toBe('Aguarde 42 segundos para exportar novamente.');
    expect(aviso.attributes('role')).toBe('alert');
  });

  it('mostra o erro do servidor e libera os botões de novo', async () => {
    server.use(
      http.get(URL_EXPORTAR, () =>
        HttpResponse.json({ detail: 'Usuário não encontrado.' }, { status: 404 })
      )
    );

    const wrapper = mount(ExportarDados);
    await clicar(wrapper, 'json');

    expect(wrapper.find('.exportar-erro').text()).toBe('Usuário não encontrado.');
    expect(wrapper.find('.btn-exportar-json').attributes('disabled')).toBeUndefined();
    expect(wrapper.find('.btn-exportar-pdf').attributes('disabled')).toBeUndefined();
  });

  it('bloqueia os dois botões enquanto gera o arquivo', async () => {
    let liberar;
    server.use(
      http.get(URL_EXPORTAR, async () => {
        await new Promise((resolve) => (liberar = resolve));
        return new HttpResponse('x', { headers: { 'Content-Type': 'application/pdf' } });
      })
    );

    const wrapper = mount(ExportarDados);
    await wrapper.find('.btn-exportar-pdf').trigger('click');
    await vi.waitFor(() => expect(liberar).toBeTypeOf('function'));

    expect(wrapper.find('.btn-exportar-pdf').text()).toContain('Gerando...');
    expect(wrapper.find('.btn-exportar-json').attributes('disabled')).toBeDefined();

    liberar();
    await vi.waitFor(() => expect(wrapper.find('.exportar-mensagem').exists()).toBe(true));
  });
});

describe('nomeDoArquivo', () => {
  it.each([
    ['attachment; filename="meus-dados.pdf"', 'meus-dados.pdf'],
    ['attachment; filename=meus-dados.json', 'meus-dados.json'],
    ["attachment; filename*=UTF-8''meus%20dados.pdf", 'meus dados.pdf'],
    [null, null],
    ['inline', null],
  ])('%s → %s', (cabecalho, esperado) => {
    expect(nomeDoArquivo(cabecalho)).toBe(esperado);
  });
});
