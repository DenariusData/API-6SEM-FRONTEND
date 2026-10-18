<script setup>
  import { computed } from 'vue';
  import logoUrl from '@/assets/logo.png';
  import {
    Home,
    Search,
    FileText,
    Package,
    Mail,
    FolderGit2,
    Sparkles,
    ShieldCheck,
    UserCheck,
    Upload,
    Tag,
    Plus,
  } from 'lucide-vue-next';

  const props = defineProps({
    currentUser: {
      type: Object,
      default: () => ({
        role: 'Engenharia',
        matricula: 'AK-90822',
        allowed_menus: [],
      }),
    },
    activeMenu: {
      type: String,
      default: 'Início',
    },
  });

  const emit = defineEmits(['selectMenu', 'openUserModal']);

  const activeUserMenus = computed(() => {
    if (props.currentUser?.allowed_menus && props.currentUser.allowed_menus.length) {
      return props.currentUser.allowed_menus;
    }
    if (props.currentUser?.role === 'Administrador') {
      return [
        'Início',
        'Pesquisa Avançada',
        'Documentos',
        'Projetos',
        'Despachos',
        'Malotes Digitais',
        'Gestão de Usuários',
        'Importar Arquivos',
        'Classificar Categorias',
        'AI Command Assistant',
      ];
    } else if (props.currentUser?.role === 'Qualidade') {
      return [
        'Início',
        'Pesquisa Avançada',
        'Documentos',
        'Relatórios de Qualidade',
        'Auditoria & Conformidade',
      ];
    } else {
      return [
        'Início',
        'Pesquisa Avançada',
        'Documentos',
        'Projetos',
        'AI Command Assistant',
        'Solicitar OI',
      ];
    }
  });

  const getMenuIcon = (menuTitle) => {
    switch (menuTitle) {
      case 'Início':
        return Home;
      case 'Pesquisa Avançada':
        return Search;
      case 'Documentos':
        return FileText;
      case 'Gestão de Usuários':
        return UserCheck;
      case 'Importar Arquivos':
        return Upload;
      case 'Classificar Categorias':
        return Tag;
      case 'Projetos':
        return FolderGit2;
      case 'Despachos':
        return Package;
      case 'Malotes Digitais':
        return Mail;
      case 'AI Command Assistant':
        return Sparkles;
      case 'Relatórios de Qualidade':
        return FileText;
      case 'Auditoria & Conformidade':
        return ShieldCheck;
      case 'Solicitar OI':
        return Plus;
      default:
        return FileText;
    }
  };
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <img :src="logoUrl" alt="AkaVision Logo" class="sidebar-logo" />
      <div class="sidebar-brand-text">
        <span class="sidebar-title">AkaVision</span>
        <span class="sidebar-subtitle">AKAER ENGENHARIA S.A.</span>
      </div>
    </div>

    <!-- Menu Principal Dinâmico por Perfil -->
    <nav class="sidebar-menu">
      <a
        v-for="item in activeUserMenus"
        :key="item"
        href="#"
        :class="['menu-item', { active: activeMenu === item }]"
        @click.prevent="
          item === 'Gestão de Usuários' ? emit('openUserModal') : emit('selectMenu', item)
        "
      >
        <component :is="getMenuIcon(item)" :size="18" class="menu-icon" />
        <span>{{ item }}</span>
      </a>
    </nav>

    <!-- Card Inferior de Credencial Operacional -->
    <div class="sidebar-credential-card">
      <span class="cred-tag"> PERFIL {{ currentUser?.role?.toUpperCase() || 'OPERACIONAL' }} </span>
      <h4 class="cred-level">Nível — {{ currentUser?.role || 'Engenharia' }}</h4>
      <p class="cred-info">Credencial {{ currentUser?.matricula || 'AK-90822' }} verificada.</p>
    </div>
  </aside>
</template>

<style scoped>
  .sidebar {
    width: 270px;
    background-color: #0f172a;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    padding: 1.5rem 1rem;
    border-right: 1px solid #1e293b;
    flex-shrink: 0;
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #1e293b;
    margin-bottom: 1.5rem;
  }

  .sidebar-logo {
    height: 36px;
    width: auto;
    object-fit: contain;
  }

  .sidebar-brand-text {
    display: flex;
    flex-direction: column;
  }

  .sidebar-title {
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #ffffff;
  }

  .sidebar-subtitle {
    font-size: 0.65rem;
    font-weight: 600;
    color: #94a3b8;
    letter-spacing: 0.05em;
  }

  .sidebar-menu {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.85rem;
    border-radius: 8px;
    color: #94a3b8;
    text-decoration: none;
    font-size: 0.88rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .menu-item:hover {
    color: #ffffff;
    background-color: #1e293b;
  }

  .menu-item.active {
    color: #ffffff;
    background-color: #7e22ce;
    font-weight: 600;
  }

  .menu-icon {
    flex-shrink: 0;
  }

  .sidebar-credential-card {
    background-color: #1e293b;
    border-radius: 8px;
    padding: 1rem;
    margin-top: auto;
    border: 1px solid #334155;
  }

  .cred-tag {
    font-size: 0.65rem;
    font-weight: 800;
    color: #a855f7;
    letter-spacing: 0.05em;
    display: block;
    margin-bottom: 0.25rem;
  }

  .cred-level {
    font-size: 0.85rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 0.25rem 0;
  }

  .cred-info {
    font-size: 0.75rem;
    color: #94a3b8;
    margin: 0;
  }
</style>
