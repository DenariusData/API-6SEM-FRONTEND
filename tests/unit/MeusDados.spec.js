import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MeusDados from '@/components/dashboard/MeusDados.vue';

const USUARIO = {
  id: 'u1',
  name: 'Carlos Eduardo',
  email: 'engenharia@akaer.com.br',
  role: 'Engenharia',
  email_pendente: null,
};

const resposta = (status, corpo) => new Response(JSON.stringify(corpo), { status });

// Cada teste diz o que o PATCH responde; o GET /me/ da montagem devolve `me`.
const montar = async ({ me = USUARIO, patch } = {}) => {
  const fetchMock = vi.fn((url, init = {}) => {
    if (url.endsWith('/api/auth/me/') && (init.method ?? 'GET') === 'GET') {
      return Promise.resolve(resposta(200, { user: me }));
    }
    if (url.endsWith('/api/auth/me/') && init.method === 'PATCH') {
      return Promise.resolve(patch(JSON.parse(init.body)));
    }
    if (url.endsWith('/api/auth/reenviar-confirmacao/')) {
      return Promise.resolve(resposta(200, { message: 'ok' }));
    }
    return Promise.resolve(resposta(404, {}));
  });
  vi.stubGlobal('fetch', fetchMock);
  const wrapper = mount(MeusDados, { props: { currentUser: USUARIO } });
  await flushPromises();
  return { wrapper, fetchMock };
};

const chamadasPatch = (fetchMock) =>
  fetchMock.mock.calls.filter(([, init]) => init?.method === 'PATCH');

describe('MeusDados', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('preenche nome e e-mail e mostra o papel só para leitura', async () => {
    const { wrapper } = await montar();

    expect(wrapper.find('#meus-dados-nome').element.value).toBe('Carlos Eduardo');
    expect(wrapper.find('#meus-dados-email').element.value).toBe('engenharia@akaer.com.br');
    expect(wrapper.find('.somente-leitura').text()).toContain('Engenharia');
    expect(wrapper.text()).toContain('Alterado apenas pelo administrador');
    expect(wrapper.find('input[id*="papel"]').exists()).toBe(false);
  });

  it('só habilita o Salvar quando algo mudou', async () => {
    const { wrapper } = await montar();
    const salvar = () => wrapper.find('button[type="submit"]');

    expect(salvar().attributes('disabled')).toBeDefined();
    await wrapper.find('#meus-dados-nome').setValue('Carlos E. Silva');
    expect(salvar().attributes('disabled')).toBeUndefined();
    await wrapper.find('#meus-dados-nome').setValue('  Carlos Eduardo ');
    expect(salvar().attributes('disabled')).toBeDefined();
  });

  it('valida o formato antes de enviar', async () => {
    const { wrapper, fetchMock } = await montar();

    await wrapper.find('#meus-dados-email').setValue('email-sem-arroba');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('#meus-dados-email-erro').text()).toBe('Informe um e-mail válido.');
    expect(chamadasPatch(fetchMock)).toHaveLength(0);
  });

  it('salva o nome, mostra "Dados atualizados" e avisa o painel', async () => {
    const { wrapper, fetchMock } = await montar({
      patch: (corpo) => resposta(200, { user: { ...USUARIO, name: corpo.nome } }),
    });

    await wrapper.find('#meus-dados-nome').setValue('Carlos E. Silva');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(JSON.parse(chamadasPatch(fetchMock)[0][1].body)).toEqual({ nome: 'Carlos E. Silva' });
    expect(wrapper.find('.alerta--ok').text()).toBe('Dados atualizados.');
    expect(wrapper.emitted('atualizado').at(-1)[0].name).toBe('Carlos E. Silva');
  });

  it('ao trocar o e-mail avisa sobre o link e mostra a faixa com Reenviar link', async () => {
    const novo = 'carlos.novo@akaer.com.br';
    const { wrapper, fetchMock } = await montar({
      patch: () => resposta(200, { user: { ...USUARIO, email_pendente: novo } }),
    });

    await wrapper.find('#meus-dados-email').setValue('Carlos.Novo@Akaer.com.br');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(JSON.parse(chamadasPatch(fetchMock)[0][1].body)).toEqual({ email: novo });
    expect(wrapper.find('.alerta--ok').text()).toBe(
      `Enviamos um link de confirmação para ${novo}. Até confirmar, continue usando o e-mail atual para entrar.`
    );
    // o campo volta para o e-mail atual: o novo só vale depois de confirmado
    expect(wrapper.find('#meus-dados-email').element.value).toBe(USUARIO.email);
    expect(wrapper.find('.faixa-pendente').text()).toContain(novo);

    await wrapper.find('.faixa-pendente button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.faixa-pendente').text()).toContain(`Link reenviado para ${novo}.`);
  });

  it('mostra o 409 no campo de e-mail', async () => {
    const { wrapper } = await montar({
      patch: () => resposta(409, { detail: 'Este e-mail já está em uso.', field: 'email' }),
    });

    await wrapper.find('#meus-dados-email').setValue('qualidade@akaer.com.br');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('#meus-dados-email-erro').text()).toBe('Este e-mail já está em uso.');
    expect(wrapper.emitted('atualizado')).toHaveLength(1); // só o da montagem
  });

  it('mostra a faixa quando já existe e-mail pendente', async () => {
    const { wrapper } = await montar({ me: { ...USUARIO, email_pendente: 'outro@akaer.com.br' } });

    expect(wrapper.find('.faixa-pendente').text()).toContain('outro@akaer.com.br');
    expect(wrapper.find('.faixa-pendente button').text()).toContain('Reenviar link');
  });

  it('abre o Aviso de Privacidade', async () => {
    const { wrapper } = await montar();

    await wrapper.find('.lgpd .link').trigger('click');

    expect(wrapper.find('[role="dialog"]').text()).toContain('Aviso de Privacidade');
  });
});
