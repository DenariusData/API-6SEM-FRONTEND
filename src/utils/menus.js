/**
 * utils/menus.js
 *
 * Menus da sidebar e permissões derivadas do perfil, num lugar só, para o
 * Dashboard e a SidebarMenu não divergirem (AKA-101).
 */

/**
 * Menus com tela implementada. Qualquer outro item que venha em
 * `allowed_menus` do backend é ignorado, para não exibir links que levam
 * a telas inexistentes.
 */
export const MENUS_IMPLEMENTADOS = [
  'Início',
  'Documentos',
  'Meus documentos',
  'Validação',
  'Gestão de Usuários',
];

/** Fallback quando o perfil não traz `allowed_menus`. */
const menusPadraoPorPerfil = (role) =>
  role === 'Administrador'
    ? ['Início', 'Documentos', 'Gestão de Usuários']
    : ['Início', 'Documentos'];

export const podeValidar = (user) =>
  user?.pode_validar === true ||
  (!('pode_validar' in (user || {})) && user?.role === 'Administrador');

/**
 * O chat de IA não é mais um item de menu (fica na tela Início), mas a
 * permissão continua vindo de "AI Command Assistant" em `allowed_menus`.
 */
export const temAssistenteIA = (user) =>
  user?.allowed_menus?.length
    ? user.allowed_menus.includes('AI Command Assistant')
    : user?.role !== 'Qualidade';

export const menusDoUsuario = (user) => {
  let list = user?.allowed_menus?.length
    ? [...user.allowed_menus]
    : menusPadraoPorPerfil(user?.role);

  // "Meus documentos" (AKA-63) vale para todo usuário logado: fica logo depois
  // de "Documentos", mesmo que o perfil vindo do backend ainda não traga o item.
  if (!list.includes('Meus documentos')) {
    const docIndex = list.indexOf('Documentos');
    list.splice(docIndex === -1 ? Math.min(1, list.length) : docIndex + 1, 0, 'Meus documentos');
  }

  if (podeValidar(user)) {
    if (!list.includes('Validação')) {
      const docIndex = list.indexOf('Documentos');
      if (docIndex !== -1) {
        list.splice(docIndex + 1, 0, 'Validação');
      } else {
        list.push('Validação');
      }
    }
  } else {
    list = list.filter((m) => m !== 'Validação');
  }

  return list.filter((m) => MENUS_IMPLEMENTADOS.includes(m));
};
