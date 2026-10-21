/**
 * services/api.js
 *
 * Configuração centralizada do cliente HTTP e catálogo de chamadas de API.
 * - Ponto único de configuração (VITE_API_BASE_URL, cabeçalhos e token Bearer).
 * - Tratamento centralizado de erros e redirecionamento de 401 para a tela de login.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(
  /\/+$/,
  ''
);
const TOKEN_STORAGE_KEY = 'akaer_token';

/**
 * Classe customizada de erro de API para facilitar a inspeção de status e detalhe.
 * `field` vem do backend quando o erro é de um campo específico
 * (ex.: DadosInvalidos do upload devolve { detail, field }).
 */
export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.detail = data?.detail || message;
    this.field = data?.field || data?.campo || null;
  }
}

/**
 * Utilitários para gestão do token de autenticação
 */
export const getToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_STORAGE_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_STORAGE_KEY);

/**
 * Dispara evento global de sessão expirada para redirecionamento ao login em ponto único.
 */
export const notifySessionExpired = () => {
  removeToken();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('session-expired'));
  }
};

/**
 * Cliente HTTP central com URL base, injeção de token e tratamento padrão de erros.
 *
 * @param {string} endpoint - Caminho da rota (ex: '/api/auth/login/')
 * @param {object} options - Opções do fetch (method, headers, body, skipAuthRedirect, etc.)
 */
export async function apiFetch(endpoint, options = {}) {
  const { method = 'GET', headers = {}, body, skipAuthRedirect = false, ...restOptions } = options;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const requestHeaders = { ...headers };

  // Injeta o token se presente no localStorage
  const token = getToken();
  if (token && !requestHeaders.Authorization && !requestHeaders.authorization) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let finalBody = body;

  // Se o body for um objeto comum (não FormData nem string), serializa em JSON
  if (body !== undefined && body !== null) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      // Deixa o navegador definir o Content-Type multipart/form-data com o boundary correto
      delete requestHeaders['Content-Type'];
    } else if (typeof body === 'object' && !(body instanceof Blob)) {
      requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
      finalBody = JSON.stringify(body);
    }
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: finalBody,
      ...restOptions,
    });
  } catch {
    // Falha de conexão/rede (servidor offline, timeout, etc.)
    throw new ApiError(
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      0,
      null
    );
  }

  // Interceptação central de 401 (Sessão Expirada ou Não Autorizado)
  if (response.status === 401 && !skipAuthRedirect) {
    notifySessionExpired();
  }

  // Parsing do corpo da resposta
  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => null);
    try {
      data = JSON.parse(text);
    } catch {
      data = text ? { detail: text } : null;
    }
  }

  if (!response.ok) {
    const message = data?.detail || `Erro HTTP ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

/**
 * Atalho para GET.
 */
export function apiGet(endpoint, options = {}) {
  return apiFetch(endpoint, { ...options, method: 'GET' });
}

/**
 * =========================================================
 * Funções de Serviço Específicas
 * =========================================================
 */

// Autenticação e Usuários
export async function login(email, password) {
  // skipAuthRedirect: true evita que credenciais incorretas (401) disparem loop de sessão expirada
  return apiFetch('/api/auth/login/', {
    method: 'POST',
    body: { email, password },
    skipAuthRedirect: true,
  });
}

export async function createUser(userData) {
  return apiFetch('/api/auth/users/', {
    method: 'POST',
    body: userData,
  });
}

// Documentos (Validação e Gestão AKA-94 / AKA-34)
export async function uploadDocument(formData) {
  return apiFetch('/api/documents/upload/', {
    method: 'POST',
    body: formData,
  });
}

// Opções do formulário de upload (S2-32)
export const listarTiposDocumento = () => apiGet('/api/tipos-documento/');
export const listarAreas = () => apiGet('/api/areas/'); // traz categorias e subcategorias aninhadas
export const listarNiveisSigilo = () => apiGet('/api/niveis-sigilo/');
export const listarResponsaveis = () => apiGet('/api/responsaveis/');
export const listarIdiomas = () => apiGet('/api/idiomas/');

export { listarPendentes, listarMeus, detalhe, aprovar, devolver, reenviar } from './documentos.js';
import * as documentosService from './documentos.js';

// Perguntas e Assistente de IA RAG (AKA-96)
export async function askQuestion(pergunta, idioma) {
  return apiFetch('/api/perguntas/', {
    method: 'POST',
    body: {
      pergunta,
      idioma,
    },
  });
}

export default {
  apiFetch,
  apiGet,
  getToken,
  setToken,
  removeToken,
  notifySessionExpired,
  login,
  createUser,
  uploadDocument,
  listarTiposDocumento,
  listarAreas,
  listarNiveisSigilo,
  listarResponsaveis,
  listarIdiomas,
  askQuestion,
  ...documentosService,
};
