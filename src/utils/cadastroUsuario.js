/**
 * Cadastro de usuário pela Gestão de Usuários (fix AKA-104).
 *
 * O back espera o código do papel (ENGENHARIA, QUALIDADE, ADMINISTRADOR).
 * Erro do servidor aparece como erro, nunca como "cadastrado": antes, uma
 * falha virava um usuário só na lista da tela, sem nada no banco.
 */

export const PERFIS_CADASTRO = [
  { codigo: 'ENGENHARIA', nome: 'Engenharia' },
  { codigo: 'QUALIDADE', nome: 'Qualidade' },
  { codigo: 'ADMINISTRADOR', nome: 'Administrador' },
];

export const SENHA_INICIAL = 'akaer123';

/**
 * @param {(payload: object) => Promise<{user: object}>} criar chamada à API
 * @param {{nome: string, email: string, perfil: string, matricula?: string}} dados
 * @returns {Promise<{ok: boolean, mensagem: string, usuario?: object}>}
 */
export async function cadastrarUsuario(criar, { nome, email, perfil, matricula }) {
  if (!nome?.trim() || !email?.trim()) {
    return { ok: false, mensagem: 'Preencha o nome e o e-mail do novo usuário.' };
  }
  const payload = { name: nome.trim(), email: email.trim(), role: perfil };
  if (matricula?.trim()) payload.matricula = matricula.trim();

  try {
    const data = await criar(payload);
    return {
      ok: true,
      usuario: data.user,
      mensagem: `Usuário ${data.user.name} cadastrado com sucesso! Senha inicial: ${SENHA_INICIAL}`,
    };
  } catch (erro) {
    return {
      ok: false,
      mensagem: erro?.message || 'Não foi possível cadastrar o usuário. Tente novamente.',
    };
  }
}
