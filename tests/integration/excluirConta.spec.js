import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import ExcluirConta from '@/components/dashboard/ExcluirConta.vue';
import { API, server } from './server';

const URL_ME = `${API}/auth/me/`;

const abrirEConfirmar = async (wrapper, senha) => {
  await wrapper.find('.btn--perigo').trigger('click');
  if (senha !== undefined) await wrapper.find('input[type="password"]').setValue(senha);
  await wrapper.find('form').trigger('submit');
  await flushPromises();
};

describe('Excluir minha conta (AKA-110)', () => {
  let sessaoEncerrada;
  const ouvir = () => {
    sessaoEncerrada = true;
  };

  beforeEach(() => {
    localStorage.setItem('akaer_token', 'jwt-de-teste');
    sessaoEncerrada = false;
    window.addEventListener('session-expired', ouvir);
  });

  afterEach(() => {
    window.removeEventListener('session-expired', ouvir);
    vi.restoreAllMocks();
  });

  it('com a senha certa, exclui e encerra a sessão', async () => {
    let corpo;
    server.use(
      http.delete(URL_ME, async ({ request }) => {
        corpo = await request.json();
        return new HttpResponse(null, { status: 204 });
      })
    );

    const wrapper = mount(ExcluirConta);
    await abrirEConfirmar(wrapper, 'eng123');

    expect(corpo).toEqual({ senha: 'eng123' });
    expect(sessaoEncerrada).toBe(true);
    expect(localStorage.getItem('akaer_token')).toBeNull();
  });

  it('com a senha errada, mostra o erro e mantém a sessão', async () => {
    server.use(
      http.delete(URL_ME, () =>
        HttpResponse.json({ detail: 'Senha incorreta.', field: 'senha' }, { status: 403 })
      )
    );

    const wrapper = mount(ExcluirConta);
    await abrirEConfirmar(wrapper, 'errada');

    expect(wrapper.text()).toContain('Senha incorreta.');
    expect(sessaoEncerrada).toBe(false);
    expect(localStorage.getItem('akaer_token')).toBe('jwt-de-teste');
  });

  it('sem senha, nem chama o servidor', async () => {
    const chamada = vi.fn();
    server.use(
      http.delete(URL_ME, () => {
        chamada();
        return new HttpResponse(null, { status: 204 });
      })
    );

    const wrapper = mount(ExcluirConta);
    await abrirEConfirmar(wrapper);

    expect(chamada).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Informe a sua senha');
  });
});
