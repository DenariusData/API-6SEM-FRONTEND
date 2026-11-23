import { describe, expect, it, vi } from 'vitest';

import {
  PERFIS_CADASTRO,
  SENHA_INICIAL,
  cadastrarUsuario,
} from '../../src/utils/cadastroUsuario.js';

const dados = {
  nome: 'Teste Review',
  email: 'teste.review@akaer.com.br',
  perfil: 'ENGENHARIA',
  matricula: 'AK-55555',
};

describe('cadastrarUsuario', () => {
  it('envia o código do papel que o back espera', async () => {
    const criar = vi.fn().mockResolvedValue({ user: { name: 'Teste Review' } });

    await cadastrarUsuario(criar, dados);

    expect(criar).toHaveBeenCalledWith({
      name: 'Teste Review',
      email: 'teste.review@akaer.com.br',
      role: 'ENGENHARIA',
      matricula: 'AK-55555',
    });
  });

  it('as opções do formulário usam os códigos dos papéis', () => {
    expect(PERFIS_CADASTRO.map((p) => p.codigo)).toEqual([
      'ENGENHARIA',
      'QUALIDADE',
      'ADMINISTRADOR',
    ]);
  });

  it('no sucesso, devolve o usuário e informa a senha inicial', async () => {
    const criar = vi.fn().mockResolvedValue({ user: { name: 'Teste Review' } });

    const resultado = await cadastrarUsuario(criar, dados);

    expect(resultado.ok).toBe(true);
    expect(resultado.usuario).toEqual({ name: 'Teste Review' });
    expect(resultado.mensagem).toContain(SENHA_INICIAL);
  });

  it('erro do servidor aparece como erro, nunca como cadastrado', async () => {
    const criar = vi.fn().mockRejectedValue(new Error('Já existe um usuário com esse e-mail.'));

    const resultado = await cadastrarUsuario(criar, dados);

    expect(resultado.ok).toBe(false);
    expect(resultado.usuario).toBeUndefined();
    expect(resultado.mensagem).toBe('Já existe um usuário com esse e-mail.');
  });

  it('sem nome ou e-mail, nem chama a API', async () => {
    const criar = vi.fn();

    const resultado = await cadastrarUsuario(criar, { ...dados, email: '  ' });

    expect(resultado.ok).toBe(false);
    expect(criar).not.toHaveBeenCalled();
  });
});
