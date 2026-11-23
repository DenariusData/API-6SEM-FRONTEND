import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import ConfirmarEmailView from '@/components/ConfirmarEmailView.vue';

const resposta = (status, corpo) => new Response(JSON.stringify(corpo), { status });

const abrir = async (url, status, corpo = {}) => {
  window.history.replaceState(null, '', url);
  const fetchMock = vi.fn().mockResolvedValue(resposta(status, corpo));
  vi.stubGlobal('fetch', fetchMock);
  const wrapper = mount(ConfirmarEmailView);
  await flushPromises();
  return { wrapper, fetchMock };
};

describe('ConfirmarEmailView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  it('confirma com o token do link e tira o token da barra de endereço', async () => {
    const { wrapper, fetchMock } = await abrir('/confirmar-email?token=abc123', 200, {
      message: 'E-mail confirmado.',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/auth/confirmar-email/');
    expect(JSON.parse(init.body)).toEqual({ token: 'abc123' });
    expect(wrapper.find('h2').text()).toBe('E-mail confirmado');
    expect(window.location.search).toBe('');
  });

  it('mostra "Link expirado" quando o backend recusa o token', async () => {
    const { wrapper } = await abrir('/confirmar-email?token=velho', 400, {
      detail: 'Token de confirmação inválido ou expirado.',
    });

    expect(wrapper.find('h2').text()).toBe('Link expirado');
  });

  it('mostra "Link expirado" sem chamar a API quando o link não tem token', async () => {
    const { wrapper, fetchMock } = await abrir('/confirmar-email', 200);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(wrapper.find('h2').text()).toBe('Link expirado');
  });

  it('avisa quando o e-mail passou a ser usado por outra conta', async () => {
    const { wrapper } = await abrir('/confirmar-email?token=abc', 409, { field: 'email' });

    expect(wrapper.find('h2').text()).toBe('Este e-mail já está em uso');
  });

  it('volta para o login', async () => {
    const { wrapper } = await abrir('/confirmar-email?token=abc', 200);

    await wrapper.find('.btn--pri').trigger('click');

    expect(wrapper.emitted('irParaLogin')).toHaveLength(1);
    expect(window.location.pathname).toBe('/');
  });
});
