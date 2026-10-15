import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import LoginView from '@/components/LoginView.vue';

const preencher = async (wrapper, email, senha) => {
  await wrapper.find('#engineerId').setValue(email);
  await wrapper.find('#password').setValue(senha);
  await wrapper.find('form').trigger('submit');
  await flushPromises();
};

const respostaFetch = (ok, corpo) => ({ ok, json: () => Promise.resolve(corpo) });

describe('LoginView', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pede o e-mail quando o campo está vazio', async () => {
    const wrapper = mount(LoginView);

    await preencher(wrapper, '   ', 'senha');

    expect(wrapper.find('.alert-error').text()).toContain('informe o e-mail');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pede a senha quando o campo está vazio', async () => {
    const wrapper = mount(LoginView);

    await preencher(wrapper, 'eng@akaer.com.br', '');

    expect(wrapper.find('.alert-error').text()).toContain('informe a senha');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('alterna a visibilidade da senha', async () => {
    const wrapper = mount(LoginView);
    const senha = wrapper.find('#password');

    expect(senha.attributes('type')).toBe('password');
    await wrapper.find('.toggle-password-btn').trigger('click');
    expect(senha.attributes('type')).toBe('text');
  });

  it('envia o e-mail normalizado para a API', async () => {
    fetchMock.mockResolvedValue(respostaFetch(false, {}));
    const wrapper = mount(LoginView);

    await preencher(wrapper, '  ENG@Akaer.com.br ', 'eng123');

    const corpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(corpo).toEqual({ email: 'eng@akaer.com.br', password: 'eng123' });
  });

  it('mostra a mensagem do servidor quando o login falha', async () => {
    fetchMock.mockResolvedValue(respostaFetch(false, { detail: 'Usuário bloqueado.' }));
    const wrapper = mount(LoginView);

    await preencher(wrapper, 'eng@akaer.com.br', 'errada');

    expect(wrapper.find('.alert-error').text()).toBe('Usuário bloqueado.');
    expect(localStorage.getItem('akaer_token')).toBeNull();
  });

  it('avisa quando não consegue falar com o servidor', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const wrapper = mount(LoginView);

    await preencher(wrapper, 'eng@akaer.com.br', 'eng123');

    expect(wrapper.find('.alert-error').text()).toContain('Não foi possível conectar');
  });
});
