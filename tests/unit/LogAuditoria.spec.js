import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import LogAuditoria from '@/components/dashboard/LogAuditoria.vue';

const ACOES = [
  { valor: 'LOGIN', rotulo: 'Login' },
  { valor: 'VISUALIZACAO', rotulo: 'Visualização' },
];

const registro = (n, extra = {}) => ({
  id: `auditoria-${n}`,
  criado_em: '2026-11-10T15:24:00+00:00',
  usuario_id: 'u-edu',
  usuario_nome: 'Edu Engenharia',
  acao: 'LOGIN',
  acao_rotulo: 'Login',
  entidade: 'USUARIO',
  entidade_rotulo: 'Usuário',
  registro_id: null,
  ...extra,
});

const pagina = (results, { page = 1, total_pages = 1, count = results.length } = {}) => ({
  count,
  page,
  page_size: 20,
  total_pages,
  results,
  acoes: ACOES,
});

const json = (status, corpo) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// `logs(url)` diz o que o GET da lista responde; usuários do filtro são fixos.
const montar = async ({ logs = () => json(200, pagina([registro(1)])), csv } = {}) => {
  const fetchMock = vi.fn((url) => {
    if (url.includes('/api/auditoria/logs/exportar/')) return Promise.resolve(csv(url));
    if (url.includes('/api/auditoria/logs/')) return Promise.resolve(logs(url));
    if (url.endsWith('/api/auth/users/')) {
      return Promise.resolve(
        json(200, {
          users: [
            { id: 'u-edu', name: 'Edu Engenharia', email: 'edu@akaer.com.br' },
            { id: 'u-ana', name: 'Ana Admin', email: 'ana@akaer.com.br' },
          ],
        })
      );
    }
    return Promise.resolve(json(404, {}));
  });
  vi.stubGlobal('fetch', fetchMock);
  const wrapper = mount(LogAuditoria);
  await flushPromises();
  return { wrapper, fetchMock };
};

const urlsDaLista = (fetchMock) =>
  fetchMock.mock.calls
    .map(([url]) => url)
    .filter((u) => u.includes('/api/auditoria/logs/') && !u.includes('exportar'));

describe('LogAuditoria', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('mostra data/hora em Brasília, usuário, ação, entidade e registro', async () => {
    const { wrapper } = await montar({
      logs: () =>
        json(
          200,
          pagina([
            registro(1),
            registro(2, {
              id: 'acesso-7',
              usuario_id: 'u-x',
              usuario_nome: 'Usuário removido',
              acao: 'VISUALIZACAO',
              acao_rotulo: 'Visualização',
              entidade: 'DOCUMENTO',
              entidade_rotulo: 'Documento',
              registro_id: 'doc-123',
            }),
          ])
        ),
    });

    const linhas = wrapper.findAll('tbody tr');
    expect(linhas).toHaveLength(2);
    // 15:24 UTC = 12:24 em Brasília
    expect(linhas[0].text()).toContain('10/11/2026');
    expect(linhas[0].text()).toContain('12:24:00');
    expect(linhas[0].text()).toContain('Edu Engenharia');
    expect(linhas[0].text()).toContain('Login');
    expect(linhas[1].text()).toContain('Usuário removido');
    expect(linhas[1].text()).toContain('Visualização');
    expect(linhas[1].text()).toContain('Documento');
    expect(linhas[1].text()).toContain('doc-123');
  });

  it('é só leitura: não há botão de editar ou apagar', async () => {
    const { wrapper } = await montar();
    const textos = wrapper.findAll('button').map((b) => b.text().toLowerCase());
    expect(textos.some((t) => /editar|apagar|excluir|remover/.test(t))).toBe(false);
  });

  it('preenche os filtros de usuário e ação', async () => {
    const { wrapper } = await montar();
    const usuarios = wrapper.findAll('#filtro-usuario option').map((o) => o.text());
    const acoes = wrapper.findAll('#filtro-acao option').map((o) => o.text());
    expect(usuarios).toEqual(['Todos', 'Ana Admin', 'Edu Engenharia']);
    expect(acoes).toEqual(['Todas', 'Login', 'Visualização']);
  });

  it('envia os filtros combinados e volta para a página 1', async () => {
    const { wrapper, fetchMock } = await montar({
      logs: () => json(200, pagina([registro(1)], { total_pages: 3, count: 45 })),
    });
    await wrapper.find('.paginacao button:last-child').trigger('click');
    await flushPromises();
    expect(urlsDaLista(fetchMock).at(-1)).toContain('page=2');

    await wrapper.find('#filtro-usuario').setValue('u-edu');
    await wrapper.find('#filtro-de').setValue('2026-11-01');
    await wrapper.find('#filtro-ate').setValue('2026-11-10');
    await wrapper.find('#filtro-acao').setValue('LOGIN');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    const url = new URL(urlsDaLista(fetchMock).at(-1));
    expect(Object.fromEntries(url.searchParams)).toEqual({
      usuario: 'u-edu',
      de: '2026-11-01',
      ate: '2026-11-10',
      acao: 'LOGIN',
      page: '1',
    });
  });

  it('não consulta quando a data final é anterior à inicial', async () => {
    const { wrapper, fetchMock } = await montar();
    const antes = urlsDaLista(fetchMock).length;

    await wrapper.find('#filtro-de').setValue('2026-11-10');
    await wrapper.find('#filtro-ate').setValue('2026-11-01');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(urlsDaLista(fetchMock)).toHaveLength(antes);
    expect(wrapper.find('[role="alert"]').text()).toContain('data final');
  });

  it('Limpar tira todos os filtros', async () => {
    const { wrapper, fetchMock } = await montar();
    await wrapper.find('#filtro-acao').setValue('LOGIN');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    await wrapper.findAll('.filtros button').at(-1).trigger('click');
    await flushPromises();

    const url = new URL(urlsDaLista(fetchMock).at(-1));
    expect(Object.fromEntries(url.searchParams)).toEqual({ page: '1' });
  });

  it('exporta o CSV com os filtros aplicados', async () => {
    const criar = vi.fn(() => 'blob:csv');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: criar, revokeObjectURL: vi.fn() }));
    const csv = vi.fn(
      () =>
        new Response('﻿Data/hora (Brasília);Usuário\r\n', {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="log-auditoria-2026-11-16.csv"',
          },
        })
    );
    const { wrapper } = await montar({ csv });
    await wrapper.find('#filtro-acao').setValue('LOGIN');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    await wrapper.find('.btn-exportar').trigger('click');
    await flushPromises();

    expect(csv).toHaveBeenCalledTimes(1);
    expect(csv.mock.calls[0][0]).toContain('/api/auditoria/logs/exportar/?acao=LOGIN');
    expect(criar).toHaveBeenCalled();
    expect(wrapper.text()).toContain('Download iniciado.');
  });

  it('mostra aviso de permissão quando o backend responde 403', async () => {
    const { wrapper } = await montar({
      logs: () => json(403, { detail: 'Você não tem permissão para acessar este recurso.' }),
    });
    expect(wrapper.text()).toContain('Apenas administradores podem consultar o log de auditoria.');
  });

  it('mostra estado vazio sem registros e desabilita a exportação', async () => {
    const { wrapper } = await montar({ logs: () => json(200, pagina([])) });
    expect(wrapper.text()).toContain('Nenhum registro encontrado');
    expect(wrapper.find('.btn-exportar').attributes('disabled')).toBeDefined();
  });
});
