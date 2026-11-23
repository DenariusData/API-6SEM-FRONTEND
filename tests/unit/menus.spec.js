import { describe, expect, it } from 'vitest';
import { ehAdministrador, menusDoUsuario } from '@/utils/menus.js';

const admin = {
  role: 'Administrador',
  role_code: 'ADMINISTRADOR',
  allowed_menus: ['Início', 'Documentos', 'Gestão de Usuários'],
};

describe('menu Auditoria (AKA-81)', () => {
  it('aparece só para ADMINISTRADOR', () => {
    expect(menusDoUsuario(admin)).toContain('Auditoria');
    for (const papel of [
      { role: 'Engenharia', role_code: 'ENGENHARIA' },
      { role: 'Qualidade', role_code: 'QUALIDADE' },
    ]) {
      expect(menusDoUsuario({ ...papel, allowed_menus: ['Início', 'Auditoria'] })).not.toContain(
        'Auditoria'
      );
    }
  });

  it('não repete e fica no fim', () => {
    const menus = menusDoUsuario({ ...admin, allowed_menus: ['Auditoria', 'Início'] });
    expect(menus.filter((m) => m === 'Auditoria')).toHaveLength(1);
    expect(menus.at(-1)).toBe('Auditoria');
  });

  it('reconhece o papel pelo código ou pelo nome', () => {
    expect(ehAdministrador({ role_code: 'ADMINISTRADOR' })).toBe(true);
    expect(ehAdministrador({ role: 'Administrador' })).toBe(true);
    expect(ehAdministrador({ role: 'Engenharia', role_code: 'ENGENHARIA' })).toBe(false);
    expect(ehAdministrador(null)).toBe(false);
  });
});
