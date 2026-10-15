import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import DashboardView from '@/components/DashboardView.vue';
import { API, server } from './server';

const USUARIO = {
  name: 'Carlos Eduardo',
  role: 'Engenharia',
  allowed_menus: ['Início', 'AI Command Assistant'],
};

const perguntar = async (texto) => {
  const wrapper = mount(DashboardView, { props: { currentUser: USUARIO } });
  await wrapper.find('.ai-input').setValue(texto);
  await wrapper.find('.btn-send-ai').trigger('click');
  await vi.waitFor(() => expect(wrapper.find('.btn-send-ai').text()).not.toContain('Processando'));
  await flushPromises();
  return wrapper;
};

describe('Pergunta à IA', () => {
  beforeEach(() => {
    localStorage.setItem('akaer_token', 'jwt-de-teste');
  });

  it('envia a pergunta autenticada e mostra a resposta com as fontes', async () => {
    let autorizacao;
    let corpo;
    server.use(
      http.post(`${API}/perguntas/`, async ({ request }) => {
        autorizacao = request.headers.get('Authorization');
        corpo = await request.json();
        return HttpResponse.json({
          resposta: 'A marcação segue a FED-STD-123H [1].',
          encontrou: true,
          idioma: 'pt-BR',
          fontes: [
            {
              numero: 1,
              documento: 'FED-STD-123H',
              revisao: 'H',
              pagina: '7',
              titulo: 'FED-STD-123H, FEDERAL STANDARD: MARKING FOR SHIPMENT',
              url_pdf: null,
              similaridade: 0.62,
            },
          ],
        });
      })
    );

    const wrapper = await perguntar('Como marcar a carga?');

    expect(autorizacao).toBe('Bearer jwt-de-teste');
    expect(corpo).toEqual({ pergunta: 'Como marcar a carga?', idioma: 'pt-BR' });
    expect(wrapper.text()).toContain('A marcação segue a FED-STD-123H [1].');
    expect(wrapper.find('.source-code-tag').text()).toContain('FED-STD-123H');
    expect(wrapper.find('.source-details-row').text()).toContain('62%');
  });

  it('avisa quando o serviço de IA está fora do ar', async () => {
    server.use(http.post(`${API}/perguntas/`, () => HttpResponse.json({}, { status: 503 })));

    const wrapper = await perguntar('Como marcar a carga?');

    expect(wrapper.text()).toContain('O serviço de IA está indisponível no momento');
  });

  it('encerra a sessão quando a API devolve 401', async () => {
    server.use(
      http.post(`${API}/perguntas/`, () =>
        HttpResponse.json({ detail: 'Token expirado.' }, { status: 401 })
      )
    );

    const wrapper = await perguntar('Como marcar a carga?');

    expect(wrapper.emitted('sessionExpired')).toHaveLength(1);
  });
});
