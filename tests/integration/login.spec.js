import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import App from '@/App.vue';
import { API, server } from './server';

const USUARIO = {
  id: 'b7c1',
  email: 'engenharia@akaer.com.br',
  name: 'Carlos Eduardo',
  role: 'Engenharia',
  matricula: 'AK-00001',
  allowed_menus: ['Início', 'AI Command Assistant'],
};

const entrar = async (wrapper, email, senha) => {
  await wrapper.find('#engineerId').setValue(email);
  await wrapper.find('#password').setValue(senha);
  await wrapper.find('form').trigger('submit');
  await vi.waitFor(() => expect(wrapper.find('.alert-box').exists()).toBe(true));
};

describe('Fluxo de login', () => {
  it('faz login, aceita os termos e chega ao painel do usuário', async () => {
    let corpoRecebido;
    server.use(
      http.post(`${API}/auth/login/`, async ({ request }) => {
        corpoRecebido = await request.json();
        return HttpResponse.json({ token: 'jwt-de-teste', user: USUARIO });
      })
    );
    const wrapper = mount(App);

    await entrar(wrapper, 'Engenharia@Akaer.com.br', 'eng123');

    expect(corpoRecebido).toEqual({ email: 'engenharia@akaer.com.br', password: 'eng123' });
    expect(localStorage.getItem('akaer_token')).toBe('jwt-de-teste');
    await vi.waitFor(() => expect(wrapper.find('.btn-accept').exists()).toBe(true));

    await wrapper.find('.btn-accept').trigger('click');

    expect(wrapper.text()).toContain('Bem-vindo de volta, Carlos Eduardo');
  });

  it('mantém o usuário na tela de login quando a API recusa as credenciais', async () => {
    server.use(
      http.post(`${API}/auth/login/`, () =>
        HttpResponse.json({ detail: 'Usuário e/ou senha inválidos.' }, { status: 401 })
      )
    );
    const wrapper = mount(App);

    await entrar(wrapper, 'engenharia@akaer.com.br', 'errada');

    expect(wrapper.find('.alert-error').text()).toBe('Usuário e/ou senha inválidos.');
    expect(wrapper.find('#engineerId').exists()).toBe(true);
    expect(localStorage.getItem('akaer_token')).toBeNull();
  });
});
