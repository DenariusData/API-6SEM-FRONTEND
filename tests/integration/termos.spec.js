import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import TermsView from '@/components/TermsView.vue';
import TermosConsentimento from '@/components/dashboard/TermosConsentimento.vue';
import { API, server } from './server';

const PENDENTES = [
  { id: 1, titulo: 'Termo de Uso', texto: 'Texto 1', versao: '2.1', obrigatorio: true },
  { id: 2, titulo: 'Aviso de Privacidade', texto: 'Texto 2', versao: '1.0', obrigatorio: true },
  { id: 3, titulo: 'Comunicações por e-mail', texto: 'Texto 3', versao: '1.0', obrigatorio: false },
];

describe('Tela de termos (AKA-109)', () => {
  beforeEach(() => {
    localStorage.setItem('akaer_token', 'jwt-de-teste');
  });

  it('só libera o aceite com todos os obrigatórios marcados e grava as respostas', async () => {
    let enviado;
    server.use(
      http.get(`${API}/auth/termos-pendentes/`, () => HttpResponse.json({ termos: PENDENTES })),
      http.post(`${API}/auth/termos/aceite/`, async ({ request }) => {
        enviado = await request.json();
        return HttpResponse.json({ pendentes: [], termos_pendentes: false });
      })
    );

    const wrapper = mount(TermsView);
    await flushPromises();
    const caixas = wrapper.findAll('input[type="checkbox"]');
    expect(caixas).toHaveLength(3);
    expect(wrapper.find('.btn-accept').attributes('disabled')).toBeDefined();

    await caixas[0].setValue(true);
    await caixas[1].setValue(true);
    expect(wrapper.find('.btn-accept').attributes('disabled')).toBeUndefined();

    await wrapper.find('.btn-accept').trigger('click');
    await flushPromises();

    expect(enviado.respostas).toEqual([
      { termo_id: 1, aceito: true },
      { termo_id: 2, aceito: true },
      { termo_id: 3, aceito: false },
    ]);
    expect(wrapper.emitted('accept')).toHaveLength(1);
  });

  it('sem termo pendente, segue direto', async () => {
    server.use(http.get(`${API}/auth/termos-pendentes/`, () => HttpResponse.json({ termos: [] })));

    const wrapper = mount(TermsView);
    await flushPromises();

    expect(wrapper.emitted('accept')).toHaveLength(1);
  });

  it('recusar volta para o login', async () => {
    server.use(
      http.get(`${API}/auth/termos-pendentes/`, () => HttpResponse.json({ termos: PENDENTES }))
    );

    const wrapper = mount(TermsView);
    await flushPromises();
    await wrapper.find('.btn-decline').trigger('click');

    expect(wrapper.emitted('decline')).toHaveLength(1);
  });
});

describe('Termos em Meus dados (AKA-109)', () => {
  it('revoga um termo opcional aceito', async () => {
    let aceito = true;
    let enviado;
    server.use(
      http.get(`${API}/auth/termos/`, () =>
        HttpResponse.json({
          termos: [
            { ...PENDENTES[0], aceito: true, respondido_em: '2026-11-23T12:00:00Z' },
            { ...PENDENTES[2], aceito, respondido_em: '2026-11-23T12:00:00Z' },
          ],
        })
      ),
      http.post(`${API}/auth/termos/aceite/`, async ({ request }) => {
        enviado = await request.json();
        aceito = false;
        return HttpResponse.json({ pendentes: [], termos_pendentes: false });
      })
    );

    const wrapper = mount(TermosConsentimento);
    await flushPromises();
    const botoes = wrapper.findAll('button');
    expect(botoes).toHaveLength(1); // só o opcional tem botão
    expect(botoes[0].text()).toBe('Revogar');

    await botoes[0].trigger('click');
    await flushPromises();

    expect(enviado.respostas).toEqual([{ termo_id: 3, aceito: false }]);
    await vi.waitFor(() => expect(wrapper.find('button').text()).toBe('Aceitar'));
  });
});
