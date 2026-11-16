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

  it('separa o trecho extraído da interpretação da IA, com aviso e link para o trecho (AKA-25)', async () => {
    // Espaços e quebras de linha propositais: o trecho deve aparecer literal
    const TRECHO = '4.1 General.  The marking shall be\n  legible and durable.';
    server.use(
      http.post(`${API}/perguntas/`, () =>
        HttpResponse.json({
          resposta: 'A marcação deve ser legível e durável [1].',
          interpretacao_ia: 'A marcação deve ser legível e durável [1].',
          encontrou: true,
          idioma: 'pt-BR',
          fontes: [
            {
              numero: 1,
              documento_id: null,
              documento: 'FED-STD-123H',
              revisao: 'H',
              pagina: '7',
              pagina_inicio: 7,
              pagina_fim: 7,
              secao: '4.1 General',
              titulo: 'FED-STD-123H, FEDERAL STANDARD: MARKING FOR SHIPMENT',
              url_pdf: 'https://everyspec.com/FED-STD-123H.pdf',
              similaridade: 0.71,
              citada: true,
            },
          ],
          trechos_extraidos: [
            {
              numero: 1,
              citado: true,
              documento_id: null,
              documento: 'FED-STD-123H',
              revisao: 'H',
              pagina: '7',
              secao: '4.1 General',
              texto: TRECHO,
            },
          ],
        })
      )
    );

    const wrapper = await perguntar('Como marcar a carga?');

    const extraido = wrapper.find('[data-test="bloco-extraido"]');
    const interpretacao = wrapper.find('[data-test="bloco-interpretacao"]');
    expect(extraido.text()).toContain('Extraído do documento');
    expect(interpretacao.text()).toContain('Interpretação da IA');
    expect(interpretacao.text()).toContain('A marcação deve ser legível e durável [1].');

    // Aviso fica dentro do bloco da IA
    expect(interpretacao.find('[data-test="aviso-ia"]').text()).toContain(
      'não é uma determinação oficial da empresa'
    );
    expect(extraido.find('[data-test="aviso-ia"]').exists()).toBe(false);

    // Trecho literal, byte a byte
    expect(wrapper.find('[data-test="trecho-literal"]').element.textContent).toBe(TRECHO);
    expect(extraido.text()).toContain('Revisão: H');
    expect(extraido.text()).toContain('Página: 7');

    // Fonte com documento, revisão, página e link para a página do trecho
    const fonte = wrapper.find('.source-card');
    expect(fonte.text()).toContain('FED-STD-123H');
    expect(fonte.find('.source-details-row').text()).toContain('H');
    expect(fonte.find('.source-details-row').text()).toContain('7');
    expect(fonte.find('a.btn-view-source').attributes('href')).toBe(
      'https://everyspec.com/FED-STD-123H.pdf#page=7'
    );
  });

  it('não mostra os blocos quando a IA não encontrou base nos documentos', async () => {
    server.use(
      http.post(`${API}/perguntas/`, () =>
        HttpResponse.json({
          resposta: 'Não encontrei essa informação nos documentos.',
          interpretacao_ia: 'Não encontrei essa informação nos documentos.',
          encontrou: false,
          idioma: 'pt-BR',
          fontes: [],
          trechos_extraidos: [],
        })
      )
    );

    const wrapper = await perguntar('Qual a cor do céu?');

    expect(wrapper.text()).toContain('Não encontrei essa informação nos documentos.');
    expect(wrapper.find('[data-test="bloco-extraido"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="bloco-interpretacao"]').exists()).toBe(false);
  });

  it('avisa quando o serviço de IA está fora do ar', async () => {
    server.use(http.post(`${API}/perguntas/`, () => HttpResponse.json({}, { status: 503 })));

    const wrapper = await perguntar('Como marcar a carga?');

    expect(wrapper.text()).toContain('O serviço de IA está indisponível no momento');
  });

  it('encerra a sessão quando a API devolve 401', async () => {
    // o services/api.js trata o 401 em um ponto só: apaga o token e
    // dispara o evento global "session-expired" no window
    const onSessionExpired = vi.fn();
    window.addEventListener('session-expired', onSessionExpired);
    server.use(
      http.post(`${API}/perguntas/`, () =>
        HttpResponse.json({ detail: 'Token expirado.' }, { status: 401 })
      )
    );

    await perguntar('Como marcar a carga?');
    window.removeEventListener('session-expired', onSessionExpired);

    expect(onSessionExpired).toHaveBeenCalledOnce();
    expect(localStorage.getItem('akaer_token')).toBeNull();
  });
});
