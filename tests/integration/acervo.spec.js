import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import DocumentsManager from '@/components/dashboard/DocumentsManager.vue';
import { API, server } from './server';

const URL_ACERVO = `${API}/documents/disponiveis/`;

const documento = (codigo, titulo) => ({
  id: `id-${codigo}`,
  titulo,
  identificador_codigo: codigo,
  tipo_documento: 'Norma ou regulamento',
  numero_revisao: 'A',
  nivel_sigilo: 'INTERNO',
  status_validacao: 'DISPONIVEL',
  status_processamento: 'CONCLUIDO',
  autor: 'Carlos Eduardo',
  criado_em: '2026-11-22T12:00:00Z',
});

const usuarioEngenharia = { role: 'Engenharia', pode_validar: false };

describe('Acervo de documentos disponíveis (AKA-108)', () => {
  beforeEach(() => {
    localStorage.setItem('akaer_token', 'jwt-de-teste');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('abre no acervo e lista os documentos que o usuário pode consultar', async () => {
    server.use(
      http.get(URL_ACERVO, () =>
        HttpResponse.json({
          count: 1,
          page: 1,
          page_size: 20,
          total_pages: 1,
          results: [documento('MIL-STD-889C', 'Dissimilar Metals')],
        })
      )
    );

    const wrapper = mount(DocumentsManager, { props: { currentUser: usuarioEngenharia } });
    await vi.waitFor(() => expect(wrapper.text()).toContain('MIL-STD-889C'));

    expect(wrapper.find('.manager-tab-btn.active').text()).toContain('Acervo');
    expect(wrapper.text()).toContain('Dissimilar Metals');
  });

  it('envia a busca digitada para o servidor', async () => {
    const buscas = [];
    server.use(
      http.get(URL_ACERVO, ({ request }) => {
        buscas.push(new URL(request.url).searchParams.get('busca'));
        return HttpResponse.json({ count: 0, results: [] });
      })
    );

    const wrapper = mount(DocumentsManager, { props: { currentUser: usuarioEngenharia } });
    await flushPromises();
    await wrapper.find('input[type="search"]').setValue('trem');
    await vi.waitFor(() => expect(buscas).toContain('trem'), { timeout: 2000 });
  });

  it('sem documento disponível, explica que nada foi encontrado para o acesso', async () => {
    server.use(http.get(URL_ACERVO, () => HttpResponse.json({ count: 0, results: [] })));

    const wrapper = mount(DocumentsManager, { props: { currentUser: usuarioEngenharia } });
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain('Nenhum documento disponível para o seu acesso')
    );
  });
});
